from __future__ import annotations

from typing import Any

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from assessments.models import (
    Assessment,
    AssessmentActionInstance,
    AssessmentWorkflowInstance,
    WorkflowAction,
    WorkflowStep,
    WorkflowTemplate,
)
from organizations.models import OrganizationMembership
from users.roles import UserRole

BETTERCOAL_WORKFLOW: list[dict[str, Any]] = [
    {
        "code": "producer_commitment",
        "title": "Producer Commitment",
        "description": "Supplier onboarding and formal commitment documents.",
        "actions": [
            {
                "code": "supplier_invited",
                "title": "Supplier invited",
                "description": "Invite the supplier organization and primary users into Veris.",
                "assigned_roles": ["SECRETARIAT", "CONSULTANCY_ADMIN"],
            },
            {
                "code": "supplier_accepts_invitation",
                "title": "Supplier accepts invitation",
                "description": "Supplier coordinator accepts the invitation and activates their account.",
                "assigned_roles": ["SUPPLIER_COORDINATOR"],
                "prerequisite_codes": ["supplier_invited"],
            },
            {
                "code": "letter_of_commitment_uploaded",
                "title": "Letter of Commitment uploaded",
                "description": "Supplier uploads the signed Letter of Commitment.",
                "assigned_roles": ["SUPPLIER_COORDINATOR"],
                "required_evidence": ["Letter of Commitment"],
                "prerequisite_codes": ["supplier_accepts_invitation"],
            },
            {
                "code": "commitment_agreement_uploaded",
                "title": "Commitment Agreement uploaded",
                "description": "Supplier uploads the signed Commitment Agreement.",
                "assigned_roles": ["SUPPLIER_COORDINATOR"],
                "required_evidence": ["Commitment Agreement"],
                "prerequisite_codes": ["supplier_accepts_invitation"],
            },
        ],
    },
    {
        "code": "desktop_review",
        "title": "Desktop Review",
        "description": "Scope, questionnaire, assessor assignment, and assessment planning.",
        "actions": [
            {
                "code": "operations_information_submitted",
                "title": "Operations information submitted",
                "description": "Supplier submits site and operations information for the desktop review.",
                "assigned_roles": ["SUPPLIER_COORDINATOR"],
                "prerequisite_codes": [
                    "letter_of_commitment_uploaded",
                    "commitment_agreement_uploaded",
                ],
            },
            {
                "code": "lead_assessor_assigned",
                "title": "Lead assessor assigned",
                "description": "Secretariat assigns the lead assessor for the assessment.",
                "assigned_roles": ["SECRETARIAT", "CONSULTANCY_ADMIN"],
                "prerequisite_codes": ["operations_information_submitted"],
            },
            {
                "code": "assessment_team_assigned",
                "title": "Assessment team assigned",
                "description": "Lead assessor confirms the assessment team.",
                "assigned_roles": ["LEAD_ASSESSOR"],
                "prerequisite_codes": ["lead_assessor_assigned"],
            },
            {
                "code": "site_scope_submitted",
                "title": "Site assessment scope submitted",
                "description": "Lead assessor submits site assessment scope.",
                "assigned_roles": ["LEAD_ASSESSOR"],
                "prerequisite_codes": ["assessment_team_assigned"],
            },
            {
                "code": "supplier_questionnaire_submitted",
                "title": "Supplier questionnaire submitted",
                "description": "Supplier completes and submits the questionnaire.",
                "assigned_roles": ["SUPPLIER_COORDINATOR"],
                "prerequisite_codes": ["site_scope_submitted"],
            },
            {
                "code": "assessment_plan_uploaded",
                "title": "Assessment plan uploaded",
                "description": "Lead assessor uploads the assessment plan.",
                "assigned_roles": ["LEAD_ASSESSOR"],
                "required_evidence": ["Assessment Plan"],
                "prerequisite_codes": ["supplier_questionnaire_submitted"],
            },
        ],
    },
    {
        "code": "site_assessment",
        "title": "Site Assessment",
        "description": "Site assessment execution, draft report review, and final approval.",
        "actions": [
            {
                "code": "site_assessment_report_drafted",
                "title": "Site assessment report drafted",
                "description": "Assessment team drafts the site assessment report.",
                "assigned_roles": ["LEAD_ASSESSOR", "TEAM_ASSESSOR"],
                "prerequisite_codes": ["assessment_plan_uploaded"],
            },
            {
                "code": "supplier_reviews_draft_report",
                "title": "Supplier reviews draft report",
                "description": "Supplier reviews and comments on the draft report.",
                "assigned_roles": ["SUPPLIER_COORDINATOR"],
                "prerequisite_codes": ["site_assessment_report_drafted"],
            },
            {
                "code": "assessor_incorporates_feedback",
                "title": "Assessor incorporates feedback",
                "description": "Lead assessor incorporates supplier feedback where appropriate.",
                "assigned_roles": ["LEAD_ASSESSOR"],
                "prerequisite_codes": ["supplier_reviews_draft_report"],
            },
            {
                "code": "secretariat_approves_draft_report",
                "title": "Secretariat approves draft report",
                "description": "Secretariat reviews and approves the draft report.",
                "assigned_roles": ["SECRETARIAT", "CONSULTANCY_ADMIN"],
                "prerequisite_codes": ["assessor_incorporates_feedback"],
            },
            {
                "code": "final_report_uploaded",
                "title": "Final report uploaded",
                "description": "Final assessment report is uploaded or generated and locked.",
                "assigned_roles": ["LEAD_ASSESSOR"],
                "required_evidence": ["Final Assessment Report"],
                "prerequisite_codes": ["secretariat_approves_draft_report"],
            },
        ],
    },
    {
        "code": "continuous_improvement_plan",
        "title": "Continuous Improvement Plan",
        "description": "Findings, CIP ownership, evidence collection, and review cycles.",
        "actions": [
            {
                "code": "findings_created",
                "title": "Findings created",
                "description": "Lead assessor creates findings from the assessment report.",
                "assigned_roles": ["LEAD_ASSESSOR"],
                "prerequisite_codes": ["final_report_uploaded"],
            },
            {
                "code": "cip_deadlines_added",
                "title": "CIP deadlines added",
                "description": "Lead assessor adds deadlines for each finding/CIP item.",
                "assigned_roles": ["LEAD_ASSESSOR"],
                "prerequisite_codes": ["findings_created"],
            },
            {
                "code": "responsible_parties_added",
                "title": "Responsible parties added",
                "description": "Supplier assigns responsible parties to CIP items.",
                "assigned_roles": ["SUPPLIER_COORDINATOR"],
                "prerequisite_codes": ["cip_deadlines_added"],
            },
            {
                "code": "cip_finalized",
                "title": "CIP finalized",
                "description": "Lead assessor finalizes the Continuous Improvement Plan.",
                "assigned_roles": ["LEAD_ASSESSOR"],
                "prerequisite_codes": ["responsible_parties_added"],
            },
            {
                "code": "cip_evidence_uploaded",
                "title": "CIP evidence uploaded",
                "description": "Supplier uploads evidence against CIP actions.",
                "assigned_roles": ["SUPPLIER_COORDINATOR"],
                "required_evidence": ["CIP Evidence"],
                "prerequisite_codes": ["cip_finalized"],
            },
            {
                "code": "cip_evidence_reviewed",
                "title": "CIP evidence reviewed",
                "description": "Lead assessor reviews submitted CIP evidence.",
                "assigned_roles": ["LEAD_ASSESSOR"],
                "prerequisite_codes": ["cip_evidence_uploaded"],
            },
            {
                "code": "review_cycle_submitted",
                "title": "Review cycle submitted",
                "description": "Assessor or Secretariat submits the review cycle outcome.",
                "assigned_roles": ["LEAD_ASSESSOR", "SECRETARIAT"],
                "prerequisite_codes": ["cip_evidence_reviewed"],
            },
        ],
    },
]


@transaction.atomic
def ensure_bettercoal_workflow_template() -> WorkflowTemplate:
    template, _ = WorkflowTemplate.objects.get_or_create(
        slug="bettercoal-assurance",
        defaults={
            "name": "Bettercoal Assurance Workflow",
            "framework_slug": "bettercoal",
            "description": "Bettercoal-style Development Steps and task state-machine.",
        },
    )

    for step_order, step_data in enumerate(BETTERCOAL_WORKFLOW, start=1):
        step, _ = WorkflowStep.objects.update_or_create(
            template=template,
            code=step_data["code"],
            defaults={
                "title": step_data["title"],
                "description": step_data["description"],
                "order": step_order,
            },
        )
        for action_order, action_data in enumerate(step_data["actions"], start=1):
            WorkflowAction.objects.update_or_create(
                step=step,
                code=action_data["code"],
                defaults={
                    "title": action_data["title"],
                    "description": action_data.get("description", ""),
                    "order": action_order,
                    "assigned_roles": action_data.get("assigned_roles", []),
                    "submit_roles": action_data.get(
                        "submit_roles", action_data.get("assigned_roles", [])
                    ),
                    "required_evidence": action_data.get("required_evidence", []),
                    "prerequisite_codes": action_data.get("prerequisite_codes", []),
                },
            )
    return template


@transaction.atomic
def ensure_assessment_workflow(assessment: Assessment) -> AssessmentWorkflowInstance:
    template = ensure_bettercoal_workflow_template()
    workflow, _ = AssessmentWorkflowInstance.objects.get_or_create(
        assessment=assessment,
        defaults={
            "organization_id": assessment.organization_id,
            "template": template,
            "current_step_code": BETTERCOAL_WORKFLOW[0]["code"],
        },
    )

    actions = WorkflowAction.objects.filter(step__template=template).select_related(
        "step"
    )
    existing_action_ids = set(
        AssessmentActionInstance.objects.filter(workflow=workflow).values_list(
            "action_id", flat=True
        )
    )
    instances = []
    for action in actions:
        if action.id in existing_action_ids:
            continue
        instances.append(
            AssessmentActionInstance(
                workflow=workflow,
                assessment=assessment,
                organization_id=assessment.organization_id,
                action=action,
                status=AssessmentActionInstance.Status.BLOCKED,
            )
        )
    if instances:
        AssessmentActionInstance.objects.bulk_create(instances)

    refresh_workflow_state(workflow)
    return workflow


ADMIN_WORKFLOW_ROLES = {"SECRETARIAT", "CONSULTANCY_ADMIN"}


ROLE_ALIASES = {
    "SECRETARIAT": {UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.COORDINATOR},
    "CONSULTANCY_ADMIN": {UserRole.ADMIN, UserRole.COORDINATOR},
    "SUPPLIER_COORDINATOR": {UserRole.ADMIN, UserRole.COORDINATOR, UserRole.OPERATOR},
    "SUPPLIER_TEAM_MEMBER": {UserRole.OPERATOR},
    "LEAD_ASSESSOR": {UserRole.ASSESSOR},
    "TEAM_ASSESSOR": {UserRole.ASSESSOR, UserRole.CONSULTANT},
}


def _active_membership_for_action(user, action_instance: AssessmentActionInstance):
    return OrganizationMembership.objects.filter(
        user=user,
        organization_id=action_instance.organization_id,
        status=OrganizationMembership.Status.ACTIVE,
    ).first()


def _membership_role_code(membership: OrganizationMembership | None) -> str:
    if not membership:
        return ""
    return str(membership.fallback_role or "")


def _workflow_role_matches_user(
    *, workflow_role: str, user, action_instance: AssessmentActionInstance
) -> bool:
    if user.is_superuser:
        return workflow_role in ADMIN_WORKFLOW_ROLES

    membership = _active_membership_for_action(user, action_instance)
    membership_role = _membership_role_code(membership)
    if not membership_role:
        return False

    if workflow_role == "LEAD_ASSESSOR":
        return (
            membership_role == UserRole.ASSESSOR
            and action_instance.assessment.assigned_assessor_id == user.id
        )
    if workflow_role == "TEAM_ASSESSOR":
        return (
            membership_role in {UserRole.ASSESSOR, UserRole.CONSULTANT}
            and action_instance.assessment.assigned_assessor_id != user.id
        )

    return membership_role in ROLE_ALIASES.get(workflow_role, {workflow_role})


def user_can_complete_action_instance(
    user, action_instance: AssessmentActionInstance
) -> bool:
    if action_instance.status not in {
        AssessmentActionInstance.Status.AVAILABLE,
        AssessmentActionInstance.Status.IN_PROGRESS,
    }:
        return False

    submit_roles = (
        action_instance.action.submit_roles
        or action_instance.action.assigned_roles
        or []
    )
    return any(
        _workflow_role_matches_user(
            workflow_role=role,
            user=user,
            action_instance=action_instance,
        )
        for role in submit_roles
    )


@transaction.atomic
def complete_action_instance(
    action_instance: AssessmentActionInstance,
    user,
    notes: str = "",
) -> AssessmentActionInstance:
    if action_instance.status == AssessmentActionInstance.Status.BLOCKED:
        refresh_workflow_state(action_instance.workflow)
        action_instance.refresh_from_db()
    if action_instance.status == AssessmentActionInstance.Status.BLOCKED:
        raise ValueError("Action is blocked until its prerequisites are completed.")

    if not user_can_complete_action_instance(user, action_instance):
        raise PermissionDenied("You cannot complete this workflow action.")

    action_instance.status = AssessmentActionInstance.Status.COMPLETED
    action_instance.completed_at = timezone.now()
    action_instance.completed_by = user
    if notes:
        action_instance.notes = notes
    action_instance.save(
        update_fields=["status", "completed_at", "completed_by", "notes", "updated_at"]
    )
    refresh_workflow_state(action_instance.workflow)
    return action_instance


@transaction.atomic
def refresh_workflow_state(workflow: AssessmentWorkflowInstance) -> None:
    action_instances = list(
        AssessmentActionInstance.objects.filter(workflow=workflow)
        .select_related("action", "action__step")
        .order_by("action__step__order", "action__order")
    )
    completed_codes = {
        instance.action.code
        for instance in action_instances
        if instance.status == AssessmentActionInstance.Status.COMPLETED
    }

    first_open_step_code = ""
    changed = []
    for instance in action_instances:
        if instance.status in [
            AssessmentActionInstance.Status.COMPLETED,
            AssessmentActionInstance.Status.SKIPPED,
            AssessmentActionInstance.Status.IN_PROGRESS,
        ]:
            if (
                instance.status != AssessmentActionInstance.Status.COMPLETED
                and not first_open_step_code
            ):
                first_open_step_code = instance.action.step.code
            continue

        prerequisites = set(instance.action.prerequisite_codes or [])
        next_status = (
            AssessmentActionInstance.Status.AVAILABLE
            if prerequisites.issubset(completed_codes)
            else AssessmentActionInstance.Status.BLOCKED
        )
        if instance.status != next_status:
            instance.status = next_status
            changed.append(instance)
        if (
            next_status != AssessmentActionInstance.Status.COMPLETED
            and not first_open_step_code
        ):
            first_open_step_code = instance.action.step.code

    for instance in changed:
        instance.save(update_fields=["status", "updated_at"])

    total = len(action_instances)
    completed = len(completed_codes)
    workflow.current_step_code = first_open_step_code or "completed"
    workflow.status = (
        AssessmentWorkflowInstance.Status.COMPLETED
        if total and completed == total
        else AssessmentWorkflowInstance.Status.ACTIVE
    )
    workflow.save(update_fields=["current_step_code", "status", "updated_at"])
