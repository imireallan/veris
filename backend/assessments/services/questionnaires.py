"""Questionnaire helpers for assessment-owned question snapshots and submission gates."""

from __future__ import annotations

from typing import Any

from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from rest_framework.exceptions import PermissionDenied

from assessments.models import (
    Assessment,
    AssessmentActionInstance,
    AssessmentQuestion,
    AssessmentResponse,
    AssessmentTemplate,
)

QUESTIONNAIRE_WORKFLOW_ACTION_CODES = (
    "supplier_questionnaire_submitted",
    "questionnaire_submitted",
    "self_assessment_submitted",
)


def _framework_template_slug(framework) -> str:
    base_slug = slugify(framework.slug or framework.name or str(framework.id))
    return f"{base_slug}-default-template"


def _get_or_create_framework_default_template(
    assessment: Assessment,
) -> AssessmentTemplate | None:
    """Resolve a questionnaire template for framework-only assessments.

    Legacy/demo assessments can be created with `framework` but no `template`. The
    questionnaire engine works from frozen assessment snapshots, so create a small
    deterministic default template from framework categories when no imported template
    exists yet.
    """
    if not assessment.framework_id:
        return None

    template_qs = AssessmentTemplate.objects.filter(
        framework_id=assessment.framework_id,
        status=AssessmentTemplate.Status.PUBLISHED,
    ).order_by("-is_public", "organization_id", "created_at")
    template = template_qs.filter(organization=assessment.organization).first()
    if not template:
        template = template_qs.filter(is_public=True).first() or template_qs.first()
    if template:
        return template

    framework = assessment.framework
    categories = framework.categories or {}
    if not categories:
        return None

    template, created = AssessmentTemplate.objects.get_or_create(
        slug=_framework_template_slug(framework),
        defaults={
            "name": f"{framework.name} Template",
            "description": framework.description,
            "framework": framework,
            "version": framework.version or "1.0.0",
            "is_public": True,
            "status": AssessmentTemplate.Status.PUBLISHED,
            "published_at": timezone.now(),
        },
    )
    if not created and template.status != AssessmentTemplate.Status.PUBLISHED:
        template.status = AssessmentTemplate.Status.PUBLISHED
        template.published_at = template.published_at or timezone.now()
        template.save(update_fields=["status", "published_at", "updated_at"])

    if template.assessment_questions.exists():
        return template

    for order, (category_key, category_label) in enumerate(categories.items(), start=1):
        code = str(category_key).replace("principle_", "P").replace("_", "-").upper()
        label = str(category_label)
        AssessmentQuestion.objects.create(
            template=template,
            text=f"Does the site meet the framework requirements for {label}?",
            category=label,
            hierarchy=[
                {
                    "level": "principle",
                    "code": code,
                    "label": label,
                }
            ],
            order=order,
            scoring_criteria={
                "type": "select_one",
                "choices": ["Yes", "No", "N/A"],
            },
            is_required=True,
            external_question_id=code,
        )

    return template


@transaction.atomic
def ensure_assessment_questionnaire_snapshots(
    assessment: Assessment,
    *,
    created_by=None,
) -> list[AssessmentQuestion]:
    """Ensure a template-backed assessment has frozen questions and blank responses.

    Assessments must use assessment-owned question snapshots so later template edits do
    not change the questionnaire that was actually assessed. This helper is idempotent:
    it creates missing snapshots from the selected template and ensures one blank
    response exists for each assessment-owned question.
    """
    if not assessment.template_id:
        fallback_template = _get_or_create_framework_default_template(assessment)
        if fallback_template:
            assessment.template = fallback_template
            assessment.template_version = fallback_template.version
            assessment.save(
                update_fields=["template", "template_version", "updated_at"]
            )
        else:
            return list(assessment.assessment_questions.all().order_by("order"))

    existing_snapshots = list(assessment.assessment_questions.all().order_by("order"))
    if existing_snapshots:
        snapshots = existing_snapshots
    else:
        snapshots = []
        template_questions = assessment.template.assessment_questions.all().order_by(
            "order"
        )
        for template_question in template_questions:
            snapshots.append(
                AssessmentQuestion.objects.create(
                    template=None,
                    assessment=assessment,
                    source_template_question=template_question,
                    organization=assessment.organization,
                    text=template_question.text,
                    order=template_question.order,
                    category=template_question.category,
                    hierarchy=template_question.hierarchy,
                    scoring_criteria=template_question.scoring_criteria,
                    is_required=template_question.is_required,
                    performance_target_level=template_question.performance_target_level,
                    external_question_id=template_question.external_question_id,
                    framework_mappings=template_question.framework_mappings,
                )
            )

    for snapshot_question in snapshots:
        AssessmentResponse.objects.get_or_create(
            assessment=assessment,
            question=snapshot_question,
            defaults={
                "organization": assessment.organization,
                "created_by": created_by,
            },
        )

    return snapshots


def _get_questionnaire_questions(assessment: Assessment) -> list[AssessmentQuestion]:
    snapshot_questions = list(assessment.assessment_questions.all().order_by("order"))
    if snapshot_questions:
        return snapshot_questions
    if assessment.template_id:
        return list(assessment.template.assessment_questions.all().order_by("order"))
    fallback_template = _get_or_create_framework_default_template(assessment)
    if fallback_template:
        return list(fallback_template.assessment_questions.all().order_by("order"))
    return []


def _get_questionnaire_action(
    assessment: Assessment,
) -> AssessmentActionInstance | None:
    from assessments.services.workflows import ensure_assessment_workflow

    workflow = ensure_assessment_workflow(assessment)
    return (
        AssessmentActionInstance.objects.select_related(
            "action", "action__step", "workflow"
        )
        .filter(
            workflow=workflow,
            action__code__in=QUESTIONNAIRE_WORKFLOW_ACTION_CODES,
        )
        .order_by("action__step__order", "action__order")
        .first()
    )


def _completed_action_codes(workflow) -> set[str]:
    return set(
        AssessmentActionInstance.objects.filter(
            workflow=workflow,
            status=AssessmentActionInstance.Status.COMPLETED,
        ).values_list("action__code", flat=True)
    )


def _blocking_prerequisites(
    action_instance: AssessmentActionInstance | None,
) -> list[dict[str, str]]:
    if not action_instance:
        return []
    completed_codes = _completed_action_codes(action_instance.workflow)
    missing_codes = [
        code
        for code in action_instance.action.prerequisite_codes or []
        if code not in completed_codes
    ]
    if not missing_codes:
        return []
    prerequisites = AssessmentActionInstance.objects.select_related("action").filter(
        workflow=action_instance.workflow,
        action__code__in=missing_codes,
    )
    by_code = {item.action.code: item for item in prerequisites}
    return [
        {
            "code": code,
            "title": by_code[code].action.title if code in by_code else code,
        }
        for code in missing_codes
    ]


def _required_answer_counts(assessment: Assessment) -> tuple[int, int, int]:
    questions = _get_questionnaire_questions(assessment)
    required_questions = [
        question for question in questions if question.is_required is not False
    ]
    required_question_ids = {question.id for question in required_questions}
    answered_question_ids = set(
        AssessmentResponse.objects.filter(
            assessment=assessment,
            question_id__in=required_question_ids,
        )
        .exclude(answer_text="", operator_answer="")
        .values_list("question_id", flat=True)
    )
    required_total = len(required_questions)
    required_answered = len(answered_question_ids)
    return required_total, required_answered, required_total - required_answered


def _can_save_draft_for_workflow(
    action_instance: AssessmentActionInstance | None,
) -> bool:
    if not action_instance:
        return True
    if action_instance.status == AssessmentActionInstance.Status.COMPLETED:
        return False

    workflow_key = action_instance.workflow.template.framework_slug
    if workflow_key != "eo100":
        return True

    self_assessment_started = AssessmentActionInstance.objects.filter(
        workflow=action_instance.workflow,
        action__code="self_assessment_started",
        status__in=[
            AssessmentActionInstance.Status.AVAILABLE,
            AssessmentActionInstance.Status.IN_PROGRESS,
            AssessmentActionInstance.Status.COMPLETED,
        ],
    ).exists()
    return self_assessment_started


def get_questionnaire_readiness(assessment: Assessment, user) -> dict[str, Any]:
    """Return the authoritative readiness state for questionnaire UX and submit."""
    from assessments.services.workflows import user_can_complete_action_instance

    action_instance = _get_questionnaire_action(assessment)
    required_total, required_answered, missing_required_count = _required_answer_counts(
        assessment
    )
    is_submitted = (
        action_instance is not None
        and action_instance.status == AssessmentActionInstance.Status.COMPLETED
    )
    blocking_prerequisites = _blocking_prerequisites(action_instance)
    action_can_complete = bool(
        action_instance and user_can_complete_action_instance(user, action_instance)
    )

    if is_submitted:
        readiness_status = "SUBMITTED"
    elif blocking_prerequisites:
        readiness_status = "BLOCKED"
    elif missing_required_count > 0:
        readiness_status = "INCOMPLETE"
    else:
        readiness_status = "READY"

    can_force_submit = bool(
        user.is_superuser
        and action_instance
        and action_instance.status == AssessmentActionInstance.Status.BLOCKED
        and missing_required_count == 0
    )

    return {
        "status": readiness_status,
        "can_view": True,
        "can_save_draft": _can_save_draft_for_workflow(action_instance),
        "can_submit": bool(
            action_instance
            and missing_required_count == 0
            and action_can_complete
            and not is_submitted
        ),
        "can_force_submit": can_force_submit,
        "required_total": required_total,
        "required_answered": required_answered,
        "missing_required_count": missing_required_count,
        "workflow_action_id": str(action_instance.id) if action_instance else None,
        "workflow_action_code": (
            action_instance.action.code if action_instance else None
        ),
        "workflow_action_title": (
            action_instance.action.title if action_instance else None
        ),
        "workflow_action_status": action_instance.status if action_instance else None,
        "workflow_action_can_complete": action_can_complete,
        "completed_at": action_instance.completed_at if action_instance else None,
        "completed_by_name": (
            getattr(action_instance.completed_by, "full_name", "")
            or getattr(action_instance.completed_by, "name", "")
            or getattr(action_instance.completed_by, "email", "")
            if action_instance and action_instance.completed_by_id
            else ""
        ),
        "blocking_prerequisites": blocking_prerequisites,
    }


@transaction.atomic
def submit_questionnaire_for_assessment(
    assessment: Assessment,
    user,
    *,
    force: bool = False,
    notes: str = "",
) -> AssessmentActionInstance | None:
    """Submit questionnaire by completing the matching workflow action.

    This enforces required answers and workflow prerequisites server-side. `force` is
    platform-superuser-only and still requires all required answers to be complete.
    """
    from assessments.services.workflows import complete_action_instance

    readiness = get_questionnaire_readiness(assessment, user)
    if readiness["missing_required_count"]:
        raise ValueError(
            "Answer all required questions before submitting. "
            f"{readiness['missing_required_count']} required question"
            f"{'s' if readiness['missing_required_count'] != 1 else ''} remaining."
        )

    action_instance = _get_questionnaire_action(assessment)
    if not action_instance:
        return None

    if readiness["status"] == "SUBMITTED":
        return action_instance

    if force:
        if not readiness["can_force_submit"]:
            raise PermissionDenied(
                "Only platform admins can force-submit a blocked questionnaire."
            )
        notes = (
            notes
            or "Force-completed by platform admin during questionnaire submission override."
        )
    elif not readiness["can_submit"]:
        if readiness["blocking_prerequisites"]:
            blocked_by = ", ".join(
                item["title"] for item in readiness["blocking_prerequisites"]
            )
            raise ValueError(
                "Questionnaire is blocked until prerequisites are completed: "
                f"{blocked_by}."
            )
        raise PermissionDenied("You cannot submit this questionnaire workflow action.")

    return complete_action_instance(
        action_instance,
        user,
        notes=notes or "Questionnaire submitted from assessment questionnaire page.",
        force=force,
    )
