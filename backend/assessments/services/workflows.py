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


EO100_WORKFLOW: list[dict[str, Any]] = [
    {
        "code": "due_diligence",
        "title": "Due Diligence",
        "description": "Initial operator due diligence and eligibility checks.",
        "actions": [
            {
                "code": "due_diligence_document_uploaded",
                "title": "Due diligence document uploaded",
                "description": "Operator uploads due diligence evidence for review.",
                "assigned_roles": ["SUPPLIER_COORDINATOR"],
                "required_evidence": ["Due Diligence Evidence"],
            },
            {
                "code": "due_diligence_approved",
                "title": "Due diligence approved",
                "description": "Secretariat reviews and approves the due diligence submission.",
                "assigned_roles": ["SECRETARIAT", "CONSULTANCY_ADMIN"],
                "prerequisite_codes": ["due_diligence_document_uploaded"],
            },
        ],
    },
    {
        "code": "self_assessment",
        "title": "Self-assessment",
        "description": "Operator completes the EO100 self-assessment questionnaire.",
        "actions": [
            {
                "code": "self_assessment_started",
                "title": "Self-assessment started",
                "description": "Operator starts the selected EO100 SAQ supplement.",
                "assigned_roles": ["SUPPLIER_COORDINATOR"],
                "prerequisite_codes": ["due_diligence_approved"],
            },
            {
                "code": "self_assessment_submitted",
                "title": "Self-assessment submitted",
                "description": "Operator submits SAQ responses and supporting evidence.",
                "assigned_roles": ["SUPPLIER_COORDINATOR"],
                "prerequisite_codes": ["self_assessment_started"],
            },
        ],
    },
    {
        "code": "assessment",
        "title": "Assessment",
        "description": "Assessment body selection, assessor assignment, agenda, and site-level assessment.",
        "actions": [
            {
                "code": "assessment_body_selected",
                "title": "Assessment body selected",
                "description": "Operator or program team selects the assessment body.",
                "assigned_roles": [
                    "SUPPLIER_COORDINATOR",
                    "SECRETARIAT",
                    "CONSULTANCY_ADMIN",
                ],
                "prerequisite_codes": ["self_assessment_submitted"],
            },
            {
                "code": "lead_assessor_assigned",
                "title": "Lead assessor assigned",
                "description": "Assessment body assigns the lead assessor.",
                "assigned_roles": ["SECRETARIAT", "CONSULTANCY_ADMIN"],
                "prerequisite_codes": ["assessment_body_selected"],
            },
            {
                "code": "assessment_agenda_uploaded",
                "title": "Assessment agenda uploaded",
                "description": "Lead assessor uploads the assessment agenda.",
                "assigned_roles": ["LEAD_ASSESSOR"],
                "required_evidence": ["Assessment Agenda"],
                "prerequisite_codes": ["lead_assessor_assigned"],
            },
            {
                "code": "assessment_agenda_approved",
                "title": "Assessment agenda approved",
                "description": "Program team approves the assessment agenda.",
                "assigned_roles": ["SECRETARIAT", "CONSULTANCY_ADMIN"],
                "prerequisite_codes": ["assessment_agenda_uploaded"],
            },
            {
                "code": "assessment_report_drafted",
                "title": "Assessment report drafted",
                "description": "Assessment team drafts review findings and the assessment report.",
                "assigned_roles": ["LEAD_ASSESSOR", "TEAM_ASSESSOR"],
                "prerequisite_codes": ["assessment_agenda_approved"],
            },
            {
                "code": "assessment_report_final_submitted",
                "title": "Assessment report final submission",
                "description": "Lead assessor submits the final assessment report.",
                "assigned_roles": ["LEAD_ASSESSOR"],
                "required_evidence": ["Final Assessment Report"],
                "prerequisite_codes": ["assessment_report_drafted"],
            },
        ],
    },
    {
        "code": "peer_review",
        "title": "Peer Review",
        "description": "Independent peer review before certification decision.",
        "actions": [
            {
                "code": "peer_reviewer_assigned",
                "title": "Peer reviewer assigned",
                "description": "Program team assigns an independent peer reviewer.",
                "assigned_roles": ["SECRETARIAT", "CONSULTANCY_ADMIN"],
                "prerequisite_codes": ["assessment_report_final_submitted"],
            },
            {
                "code": "peer_review_completed",
                "title": "Peer review completed",
                "description": "Peer reviewer submits the peer review report.",
                "assigned_roles": ["SECRETARIAT", "CONSULTANCY_ADMIN"],
                "required_evidence": ["Peer Review Report"],
                "prerequisite_codes": ["peer_reviewer_assigned"],
            },
        ],
    },
    {
        "code": "continuous_improvement_plan",
        "title": "Continuous Improvement Plan",
        "description": "Corrective action planning and performance target tracking.",
        "actions": [
            {
                "code": "cip_created",
                "title": "CIP created",
                "description": "Required improvement targets are created from assessment findings.",
                "assigned_roles": ["LEAD_ASSESSOR"],
                "prerequisite_codes": ["peer_review_completed"],
            },
            {
                "code": "cip_approved",
                "title": "CIP approved",
                "description": "Program team approves the continuous improvement plan.",
                "assigned_roles": ["SECRETARIAT", "CONSULTANCY_ADMIN"],
                "prerequisite_codes": ["cip_created"],
            },
        ],
    },
    {
        "code": "certification",
        "title": "Certification",
        "description": "Certification report, certificate issuance, and closeout.",
        "actions": [
            {
                "code": "certification_report_uploaded",
                "title": "Certification report uploaded",
                "description": "Program team uploads or generates the certification report.",
                "assigned_roles": ["SECRETARIAT", "CONSULTANCY_ADMIN"],
                "required_evidence": ["Certification Report"],
                "prerequisite_codes": ["cip_approved"],
            },
            {
                "code": "certificate_issued",
                "title": "Certificate issued",
                "description": "Final certificate is issued and the assessment workflow is closed.",
                "assigned_roles": ["SECRETARIAT", "CONSULTANCY_ADMIN"],
                "required_evidence": ["Certificate"],
                "prerequisite_codes": ["certification_report_uploaded"],
            },
        ],
    },
]

CGWG_WORKFLOW: list[dict[str, Any]] = [
    {
        "code": "supplier_intake",
        "title": "Supplier Intake",
        "description": "Invite supplier and confirm basic profile readiness.",
        "actions": [
            {
                "code": "supplier_invited",
                "title": "Supplier invited",
                "description": "Invite the supplier to complete the assessment questionnaire.",
                "assigned_roles": ["SECRETARIAT", "CONSULTANCY_ADMIN"],
            },
            {
                "code": "supplier_profile_confirmed",
                "title": "Supplier profile confirmed",
                "description": "Supplier confirms company, commodity, and country profile details.",
                "assigned_roles": ["SUPPLIER_COORDINATOR"],
                "prerequisite_codes": ["supplier_invited"],
            },
        ],
    },
    {
        "code": "self_assessment",
        "title": "Self-assessment",
        "description": "Supplier completes the questionnaire and uploads required supporting evidence.",
        "actions": [
            {
                "code": "questionnaire_submitted",
                "title": "Questionnaire submitted",
                "description": "Supplier submits the completed questionnaire.",
                "assigned_roles": ["SUPPLIER_COORDINATOR"],
                "prerequisite_codes": ["supplier_profile_confirmed"],
            },
            {
                "code": "evidence_uploaded",
                "title": "Evidence uploaded",
                "description": "Supplier uploads policy, due diligence, and traceability evidence where requested.",
                "assigned_roles": ["SUPPLIER_COORDINATOR"],
                "required_evidence": ["Questionnaire Evidence"],
                "prerequisite_codes": ["questionnaire_submitted"],
            },
        ],
    },
    {
        "code": "review",
        "title": "Review",
        "description": "Program team reviews questionnaire responses and flags follow-up actions.",
        "actions": [
            {
                "code": "responses_reviewed",
                "title": "Responses reviewed",
                "description": "Reviewer checks submitted responses and evidence.",
                "assigned_roles": ["LEAD_ASSESSOR", "SECRETARIAT", "CONSULTANCY_ADMIN"],
                "prerequisite_codes": ["evidence_uploaded"],
            },
            {
                "code": "follow_ups_created",
                "title": "Follow-ups created",
                "description": "Reviewer creates follow-up findings or requests clarification where needed.",
                "assigned_roles": ["LEAD_ASSESSOR", "SECRETARIAT", "CONSULTANCY_ADMIN"],
                "prerequisite_codes": ["responses_reviewed"],
            },
        ],
    },
    {
        "code": "closeout",
        "title": "Closeout",
        "description": "Finalize the assessment outcome and improvement actions.",
        "actions": [
            {
                "code": "outcome_finalized",
                "title": "Outcome finalized",
                "description": "Program team finalizes assessment outcome and next steps.",
                "assigned_roles": ["SECRETARIAT", "CONSULTANCY_ADMIN"],
                "prerequisite_codes": ["follow_ups_created"],
            },
        ],
    },
]

GENERIC_ASSESSMENT_WORKFLOW: list[dict[str, Any]] = [
    {
        "code": "setup",
        "title": "Setup",
        "description": "Confirm assessment scope, roles, and required information.",
        "actions": [
            {
                "code": "scope_confirmed",
                "title": "Scope confirmed",
                "description": "Confirm framework, site, and assessment scope.",
                "assigned_roles": ["SECRETARIAT", "CONSULTANCY_ADMIN", "LEAD_ASSESSOR"],
            },
            {
                "code": "participants_confirmed",
                "title": "Participants confirmed",
                "description": "Confirm supplier/contact and reviewer participants.",
                "assigned_roles": ["SECRETARIAT", "CONSULTANCY_ADMIN"],
                "prerequisite_codes": ["scope_confirmed"],
            },
        ],
    },
    {
        "code": "questionnaire",
        "title": "Questionnaire",
        "description": "Collect responses and evidence against the selected framework.",
        "actions": [
            {
                "code": "questionnaire_submitted",
                "title": "Questionnaire submitted",
                "description": "Supplier submits questionnaire responses.",
                "assigned_roles": ["SUPPLIER_COORDINATOR"],
                "prerequisite_codes": ["participants_confirmed"],
            },
            {
                "code": "evidence_submitted",
                "title": "Evidence submitted",
                "description": "Supplier uploads requested evidence.",
                "assigned_roles": ["SUPPLIER_COORDINATOR"],
                "required_evidence": ["Assessment Evidence"],
                "prerequisite_codes": ["questionnaire_submitted"],
            },
        ],
    },
    {
        "code": "review",
        "title": "Review",
        "description": "Review responses, score evidence, and create findings.",
        "actions": [
            {
                "code": "responses_reviewed",
                "title": "Responses reviewed",
                "description": "Reviewer validates questionnaire responses and evidence.",
                "assigned_roles": ["LEAD_ASSESSOR", "TEAM_ASSESSOR", "SECRETARIAT"],
                "prerequisite_codes": ["evidence_submitted"],
            },
            {
                "code": "findings_created",
                "title": "Findings created",
                "description": "Reviewer creates findings and recommended actions.",
                "assigned_roles": ["LEAD_ASSESSOR", "SECRETARIAT"],
                "prerequisite_codes": ["responses_reviewed"],
            },
        ],
    },
    {
        "code": "reporting",
        "title": "Reporting",
        "description": "Generate and approve final assessment outputs.",
        "actions": [
            {
                "code": "report_generated",
                "title": "Report generated",
                "description": "Generate or upload the assessment report.",
                "assigned_roles": ["LEAD_ASSESSOR", "SECRETARIAT"],
                "required_evidence": ["Assessment Report"],
                "prerequisite_codes": ["findings_created"],
            },
            {
                "code": "improvement_actions_confirmed",
                "title": "Improvement actions confirmed",
                "description": "Confirm follow-up actions, owners, and deadlines.",
                "assigned_roles": ["LEAD_ASSESSOR", "SUPPLIER_COORDINATOR"],
                "prerequisite_codes": ["report_generated"],
            },
        ],
    },
]

WORKFLOW_DEFINITIONS: dict[str, dict[str, Any]] = {
    "bettercoal": {
        "name": "Bettercoal Assurance Workflow",
        "slug": "bettercoal-assurance",
        "description": "Bettercoal-style Development Steps and task state-machine.",
        "steps": BETTERCOAL_WORKFLOW,
    },
    "eo100": {
        "name": "EO100 Certification Workflow",
        "slug": "eo100-certification",
        "description": "EO100 certification process workflow from due diligence through certificate issuance.",
        "steps": EO100_WORKFLOW,
    },
    "cgwg": {
        "name": "CGWG SAQ Workflow",
        "slug": "cgwg-saq",
        "description": "CGWG supplier questionnaire workflow from intake through closeout.",
        "steps": CGWG_WORKFLOW,
    },
    "generic": {
        "name": "Generic Assessment Workflow",
        "slug": "generic-assessment",
        "description": "Framework-neutral assessment workflow for templates without a dedicated workflow.",
        "steps": GENERIC_ASSESSMENT_WORKFLOW,
    },
}


@transaction.atomic
def ensure_workflow_template(workflow_key: str) -> WorkflowTemplate:
    definition = WORKFLOW_DEFINITIONS.get(workflow_key, WORKFLOW_DEFINITIONS["generic"])
    template, _ = WorkflowTemplate.objects.update_or_create(
        slug=definition["slug"],
        defaults={
            "name": definition["name"],
            "framework_slug": workflow_key if workflow_key != "generic" else "",
            "description": definition["description"],
            "is_active": True,
        },
    )

    for step_order, step_data in enumerate(definition["steps"], start=1):
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
def ensure_bettercoal_workflow_template() -> WorkflowTemplate:
    return ensure_workflow_template("bettercoal")


def get_assessment_workflow_key(assessment: Assessment) -> str:
    """Resolve a workflow definition from the assessment framework.

    Workflow templates are framework-specific when the framework has a known process
    (Bettercoal, EO100, CGWG). Unknown/imported frameworks get a neutral workflow
    instead of leaking Bettercoal vocabulary into every assessment.
    """
    framework = getattr(assessment, "framework", None)
    raw_slug = str(getattr(framework, "slug", "") or "").lower()
    raw_name = str(getattr(framework, "name", "") or "").lower()
    identifier = f"{raw_slug} {raw_name}"

    if "bettercoal" in identifier:
        return "bettercoal"
    if (
        "eo100" in identifier
        or "eo-100" in identifier
        or "energy operations" in identifier
    ):
        return "eo100"
    if (
        "cgwg" in identifier
        or "coloured gemstone" in identifier
        or "colored gemstone" in identifier
    ):
        return "cgwg"
    return "generic"


@transaction.atomic
def ensure_assessment_workflow(assessment: Assessment) -> AssessmentWorkflowInstance:
    workflow_key = get_assessment_workflow_key(assessment)
    template = ensure_workflow_template(workflow_key)
    first_step_code = WORKFLOW_DEFINITIONS[workflow_key]["steps"][0]["code"]

    workflow, created = AssessmentWorkflowInstance.objects.get_or_create(
        assessment=assessment,
        defaults={
            "organization_id": assessment.organization_id,
            "template": template,
            "current_step_code": first_step_code,
        },
    )

    if not created and workflow.template_id != template.id:
        has_progress = AssessmentActionInstance.objects.filter(
            workflow=workflow,
            status__in=[
                AssessmentActionInstance.Status.COMPLETED,
                AssessmentActionInstance.Status.IN_PROGRESS,
                AssessmentActionInstance.Status.SKIPPED,
            ],
        ).exists()
        if not has_progress:
            AssessmentActionInstance.objects.filter(workflow=workflow).delete()
            workflow.template = template
            workflow.current_step_code = first_step_code
            workflow.status = AssessmentWorkflowInstance.Status.ACTIVE
            workflow.completed_at = None
            workflow.save(
                update_fields=[
                    "template",
                    "current_step_code",
                    "status",
                    "completed_at",
                    "updated_at",
                ]
            )

    actions = WorkflowAction.objects.filter(
        step__template=workflow.template
    ).select_related("step")
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

    if user.is_superuser:
        return True

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


def _truthy(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in {"1", "true", "yes", "on"}
    return bool(value)


def _force_complete_prerequisites(
    action_instance: AssessmentActionInstance,
    user,
    notes: str,
    visited: set[str] | None = None,
) -> None:
    """Recursively complete prerequisite actions for platform-admin QA overrides."""
    visited = visited or set()
    for prerequisite_code in action_instance.action.prerequisite_codes or []:
        if prerequisite_code in visited:
            continue
        visited.add(prerequisite_code)
        prerequisite = AssessmentActionInstance.objects.select_related(
            "action", "action__step", "workflow", "assessment"
        ).get(workflow=action_instance.workflow, action__code=prerequisite_code)
        _force_complete_prerequisites(prerequisite, user, notes, visited)
        if prerequisite.status != AssessmentActionInstance.Status.COMPLETED:
            prerequisite.status = AssessmentActionInstance.Status.COMPLETED
            prerequisite.completed_at = timezone.now()
            prerequisite.completed_by = user
            prerequisite.notes = notes or prerequisite.notes
            prerequisite.save(
                update_fields=[
                    "status",
                    "completed_at",
                    "completed_by",
                    "notes",
                    "updated_at",
                ]
            )


@transaction.atomic
def complete_action_instance(
    action_instance: AssessmentActionInstance,
    user,
    notes: str = "",
    force: bool = False,
) -> AssessmentActionInstance:
    force = _truthy(force)
    if action_instance.status == AssessmentActionInstance.Status.BLOCKED and force:
        if not user.is_superuser:
            raise PermissionDenied(
                "Only platform admins can force-complete blocked workflow actions."
            )
        _force_complete_prerequisites(action_instance, user, notes)
        refresh_workflow_state(action_instance.workflow)
        action_instance.refresh_from_db()

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
