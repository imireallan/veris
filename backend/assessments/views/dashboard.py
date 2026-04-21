from __future__ import annotations

from typing import Any

from django.utils import timezone
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from assessments.models import Assessment, AssessmentResponse, Finding, Task
from assessments.services.access import AssessmentAccessService
from assessments.views.flat_views import get_request_organization_id
from knowledge.models import KnowledgeDocument
from organizations.models import OrganizationMembership


class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        org_ids = self._resolve_organization_ids(request)
        viewer = self._build_viewer_context(request, org_ids)

        assessments = self._get_assessments(request, org_ids)
        assessment_ids = list(assessments.values_list("id", flat=True))

        tasks = (
            Task.objects.filter(
                organization_id__in=org_ids, assessment_id__in=assessment_ids
            )
            if org_ids
            else Task.objects.none()
        ).select_related("assessment", "organization", "assigned_to")

        findings = (
            Finding.objects.filter(
                organization_id__in=org_ids,
                assessment_id__in=assessment_ids,
            )
            if org_ids
            else Finding.objects.none()
        ).select_related("assessment", "organization", "site")

        responses = (
            AssessmentResponse.objects.filter(
                organization_id__in=org_ids,
                assessment_id__in=assessment_ids,
                validation_status="pending",
            )
            if org_ids
            else AssessmentResponse.objects.none()
        )

        documents = (
            KnowledgeDocument.objects.filter(organization_id__in=org_ids)
            if org_ids
            else KnowledgeDocument.objects.none()
        ).select_related("organization", "created_by")

        assessments, tasks, findings, responses, documents = self._apply_viewer_scope(
            request=request,
            viewer=viewer,
            assessments=assessments,
            tasks=tasks,
            findings=findings,
            responses=responses,
            documents=documents,
        )

        now = timezone.now()
        active_assessments = assessments.exclude(
            status__in=[Assessment.Status.COMPLETED, Assessment.Status.ARCHIVED]
        )
        open_tasks = tasks.exclude(
            status__in=[Task.Status.COMPLETED, Task.Status.CANCELLED]
        )
        open_findings = findings.filter(
            status__in=[Finding.Status.OPEN, Finding.Status.IN_PROGRESS]
        )
        pending_review_count = sum(
            1 for response in responses if response.evidence_files
        )

        payload = {
            "viewer": viewer,
            "kpis": {
                "active_assessments": active_assessments.count(),
                "overdue_actions": open_tasks.filter(due_date__lt=now).count(),
                "open_findings": open_findings.count(),
                "pending_evidence_reviews": pending_review_count,
            },
            "attention_items": self._build_attention_items(
                now=now,
                open_tasks=open_tasks,
                active_assessments=active_assessments,
                scope=viewer["scope"],
            ),
            "upcoming_deadlines": self._build_upcoming_deadlines(
                now=now,
                open_tasks=open_tasks,
                active_assessments=active_assessments,
            ),
            "recent_activity": self._build_recent_activity(
                assessments=assessments,
                tasks=tasks,
                findings=findings,
                documents=documents,
            ),
        }
        return Response(payload)

    def _resolve_organization_ids(self, request) -> list[str]:
        requested_org_id = get_request_organization_id(request)
        user = request.user

        if user.is_superuser:
            if requested_org_id:
                return [str(requested_org_id)]
            return list(
                Assessment.objects.values_list("organization_id", flat=True).distinct()
            )

        accessible_org_ids = [
            str(org_id)
            for org_id in AssessmentAccessService.get_user_organization_ids(user) or []
        ]

        if requested_org_id:
            requested_org_id = str(requested_org_id)
            if requested_org_id not in accessible_org_ids:
                raise PermissionDenied(
                    "You do not have access to the requested organization dashboard."
                )
            return [requested_org_id]

        return accessible_org_ids

    def _build_viewer_context(self, request, org_ids: list[str]) -> dict[str, Any]:
        membership = self._get_request_membership(request, org_ids)
        organization = getattr(request, "organization", None)
        if not organization and membership:
            organization = membership.organization

        if request.user.is_superuser:
            return {
                "role": "SUPERADMIN",
                "scope": "organization",
                "organization_id": (
                    str(organization.id)
                    if organization
                    else (org_ids[0] if org_ids else None)
                ),
                "organization_name": (
                    organization.name if organization else "All organizations"
                ),
            }

        role = (
            getattr(membership.role, "name", None)
            if membership and membership.role
            else (
                membership.fallback_role
                if membership and membership.fallback_role
                else "UNKNOWN"
            )
        )
        scope = self._resolve_scope(membership)

        return {
            "role": role,
            "scope": scope,
            "organization_id": (
                str(organization.id)
                if organization
                else (org_ids[0] if org_ids else None)
            ),
            "organization_name": organization.name if organization else None,
        }

    def _get_request_membership(self, request, org_ids: list[str]):
        membership = getattr(request, "membership", None)
        if membership:
            return membership

        if request.user.is_superuser or not org_ids:
            return None

        return (
            OrganizationMembership.objects.select_related("organization", "role")
            .filter(
                user=request.user,
                organization_id=org_ids[0],
                status=OrganizationMembership.Status.ACTIVE,
            )
            .first()
        )

    def _resolve_scope(self, membership) -> str:
        if not membership:
            return "organization"

        # Prefer custom role name, fall back to system fallback_role
        role_name = (
            getattr(membership.role, "name", None)
            if membership.role
            else membership.fallback_role
        )

        # Org-wide operators: can see everything in the active org
        if role_name in {
            "ADMIN",
            "COORDINATOR",
            "CONSULTANT",
            "EXECUTIVE",
            "SUPERADMIN",
        }:
            return "organization"

        # Individual contributors: only assigned work
        if role_name in {"ASSESSOR", "OPERATOR"}:
            return "assigned"

        # Default fallback for unknown/custom roles
        if membership.has_permission("org:settings") or membership.has_permission(
            "user:invite"
        ):
            return "organization"

        return "organization"

    def _get_assessments(self, request, org_ids: list[str]):
        queryset = AssessmentAccessService.get_accessible_assessments(request.user)
        if not org_ids:
            return queryset.none()
        return queryset.filter(organization_id__in=org_ids).select_related(
            "organization", "site", "framework", "assigned_to", "created_by"
        )

    def _apply_viewer_scope(
        self,
        request,
        viewer,
        assessments,
        tasks,
        findings,
        responses,
        documents,
    ):
        if viewer["scope"] != "assigned":
            return assessments, tasks, findings, responses, documents

        user = request.user
        assessments = assessments.filter(assigned_to=user)
        scoped_assessment_ids = list(assessments.values_list("id", flat=True))
        tasks = tasks.filter(assigned_to=user, assessment_id__in=scoped_assessment_ids)
        findings = findings.filter(assessment_id__in=scoped_assessment_ids)
        responses = responses.filter(assessment_id__in=scoped_assessment_ids)
        documents = documents.filter(created_by=user)
        return assessments, tasks, findings, responses, documents

    def _build_attention_items(
        self,
        now,
        open_tasks,
        active_assessments,
        scope,
    ) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []

        for task in open_tasks.filter(
            due_date__isnull=False, due_date__lte=now
        ).order_by("due_date")[:6]:
            items.append(
                {
                    "id": str(task.id),
                    "type": "task",
                    "title": task.title,
                    "organization_name": task.organization.name,
                    "assessment_id": str(task.assessment_id),
                    "assessment_name": self._assessment_label(task.assessment),
                    "site_name": getattr(task.assessment.site, "name", None),
                    "status": "overdue",
                    "priority": task.priority,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "url": f"/assessments/{task.assessment_id}",
                }
            )

        if scope != "assigned":
            for assessment in active_assessments.filter(
                due_date__lte=now + timezone.timedelta(days=14)
            ).order_by("due_date")[:4]:
                items.append(
                    {
                        "id": str(assessment.id),
                        "type": "assessment",
                        "title": self._assessment_label(assessment),
                        "organization_name": assessment.organization.name,
                        "assessment_id": str(assessment.id),
                        "assessment_name": self._assessment_label(assessment),
                        "site_name": getattr(assessment.site, "name", None),
                        "status": (
                            "overdue" if assessment.due_date < now else "due_soon"
                        ),
                        "priority": assessment.risk_level,
                        "due_date": assessment.due_date.isoformat(),
                        "url": f"/assessments/{assessment.id}",
                    }
                )

        items.sort(
            key=lambda item: (item["status"] != "overdue", item["due_date"] or "")
        )
        return items[:6]

    def _build_upcoming_deadlines(
        self,
        now,
        open_tasks,
        active_assessments,
    ) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []

        for task in open_tasks.filter(due_date__isnull=False).order_by("due_date")[:6]:
            items.append(
                {
                    "id": str(task.id),
                    "type": "task_due",
                    "title": task.title,
                    "organization_name": task.organization.name,
                    "assessment_id": str(task.assessment_id),
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "status": (
                        "overdue"
                        if task.due_date and task.due_date < now
                        else "upcoming"
                    ),
                    "url": f"/assessments/{task.assessment_id}",
                }
            )

        for assessment in active_assessments.order_by("due_date")[:6]:
            items.append(
                {
                    "id": str(assessment.id),
                    "type": "assessment_due",
                    "title": self._assessment_label(assessment),
                    "organization_name": assessment.organization.name,
                    "assessment_id": str(assessment.id),
                    "due_date": assessment.due_date.isoformat(),
                    "status": "overdue" if assessment.due_date < now else "upcoming",
                    "url": f"/assessments/{assessment.id}",
                }
            )

        items.sort(key=lambda item: item["due_date"] or "")
        return items[:8]

    def _build_recent_activity(
        self, assessments, tasks, findings, documents
    ) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []

        for assessment in assessments.order_by("-created_at")[:4]:
            items.append(
                {
                    "id": f"assessment:{assessment.id}",
                    "type": "assessment_created",
                    "title": self._assessment_label(assessment),
                    "description": f"Assessment created for {assessment.organization.name}",
                    "timestamp": assessment.created_at.isoformat(),
                    "url": f"/assessments/{assessment.id}",
                }
            )

        for task in tasks.order_by("-created_at")[:4]:
            items.append(
                {
                    "id": f"task:{task.id}",
                    "type": "task_created",
                    "title": task.title,
                    "description": f"Action added to {self._assessment_label(task.assessment)}",
                    "timestamp": task.created_at.isoformat(),
                    "url": f"/assessments/{task.assessment_id}",
                }
            )

        for finding in findings.order_by("-created_at")[:4]:
            items.append(
                {
                    "id": f"finding:{finding.id}",
                    "type": "finding_created",
                    "title": finding.topic or "Finding created",
                    "description": f"Finding logged on {self._assessment_label(finding.assessment)}",
                    "timestamp": finding.created_at.isoformat(),
                    "url": f"/assessments/{finding.assessment_id}",
                }
            )

        for document in documents.order_by("-created_at")[:4]:
            items.append(
                {
                    "id": f"document:{document.id}",
                    "type": "document_uploaded",
                    "title": document.title,
                    "description": f"Evidence uploaded to {document.organization.name}",
                    "timestamp": document.created_at.isoformat(),
                    "url": "/knowledge",
                }
            )

        items.sort(key=lambda item: item["timestamp"], reverse=True)
        return items[:8]

    def _assessment_label(self, assessment: Assessment) -> str:
        if assessment.site_id and assessment.site:
            return assessment.site.name
        if assessment.framework_id and assessment.framework:
            return assessment.framework.name
        return f"Assessment {str(assessment.id)[:8]}"
