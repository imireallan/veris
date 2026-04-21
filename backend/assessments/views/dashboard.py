from __future__ import annotations

from typing import Any

from django.db import models
from django.utils import timezone
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from assessments.models import Assessment, AssessmentResponse, Finding, Task
from assessments.services.access import AssessmentAccessService
from assessments.views.flat_views import get_request_organization_id
from knowledge.models import KnowledgeDocument
from organizations.models import Invitation, OrganizationMembership


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

        # P1: invitations only matter for org-wide scope
        invitations_qs = (
            Invitation.objects.filter(
                organization_id__in=org_ids,
                status=Invitation.Status.PENDING,
            )
            if org_ids and viewer["scope"] == "organization"
            else Invitation.objects.none()
        )

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
            # --- P1 Analytics ---
            "assessment_status_breakdown": self._build_assessment_status_breakdown(
                assessments=assessments
            ),
            "findings_by_severity": self._build_findings_by_severity(findings=findings),
            "pending_invitations": self._build_pending_invitations(
                invitations=invitations_qs
            ),
            "evidence_pipeline": self._build_evidence_pipeline(
                documents=documents,
                responses=responses,
            ),
            "site_progress": self._build_site_progress(assessments=assessments),
            # --- P2 AI & Risk Insights ---
            "cross_framework_reuse": self._build_cross_framework_reuse(
                responses=responses,
                assessments=assessments,
            ),
            "risk_trend": self._build_risk_trend(
                findings=findings,
                now=now,
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

    # ─────────── P2 AI & Risk Insights ───────────

    def _build_cross_framework_reuse(
        self,
        responses,
        assessments,
    ) -> dict[str, Any]:
        """Cross-framework reuse: how much evidence answers map to multiple frameworks."""
        # Count responses with framework mappings (AI or manual)
        reusable_count = 0
        total_responses_with_mappings = 0
        framework_hit_counts: dict[str, int] = {}

        for resp in responses:
            mapped = resp.frameworks_mapped_to or []
            if mapped:
                total_responses_with_mappings += 1
                if len(mapped) > 1:
                    reusable_count += 1
                for m in mapped:
                    fw_id = m.get("framework_id") if isinstance(m, dict) else str(m)
                    if fw_id:
                        framework_hit_counts[fw_id] = framework_hit_counts.get(fw_id, 0) + 1

        # Map framework IDs to names for display
        assessment_fw_ids = set(
            assessments.exclude(framework_id=None)
            .values_list("framework_id", flat=True)
            .distinct()
        )
        framework_names: dict[str, str] = {}
        if assessment_fw_ids:
            from assessments.models import Framework
            for fw in Framework.objects.filter(id__in=list(assessment_fw_ids)):
                framework_names[str(fw.id)] = fw.name

        top_frameworks = sorted(
            [
                {"framework_id": fw_id, "framework_name": framework_names.get(fw_id, "Unknown"), "mapped_answers": count}
                for fw_id, count in framework_hit_counts.items()
            ],
            key=lambda x: x["mapped_answers"],
            reverse=True,
        )[:5]

        # Suggest reuse opportunities: unmapped responses in frameworks that share provisions
        unmapped_responses = responses.filter(frameworks_mapped_to=[]).count()

        return {
            "reusable_answers": reusable_count,
            "mapped_answers": total_responses_with_mappings,
            "unmapped_answers": unmapped_responses,
            "reuse_opportunity_pct": (
                round((reusable_count / total_responses_with_mappings) * 100, 1)
                if total_responses_with_mappings else 0.0
            ),
            "top_frameworks_by_coverage": top_frameworks,
        }

    def _build_risk_trend(
        self,
        findings,
        now,
    ) -> dict[str, Any]:
        """Risk trend over the last 90 days — new vs resolved findings by severity."""
        from django.db.models import Count
        from datetime import timedelta

        cutoff = now - timedelta(days=90)

        # Bucket by 30-day windows
        windows = [
            (now - timedelta(days=90), now - timedelta(days=60), "day_61_90"),
            (now - timedelta(days=60), now - timedelta(days=30), "day_31_60"),
            (now - timedelta(days=30), now, "day_0_30"),
        ]
        trend = []

        for start, end, label in windows:
            created = findings.filter(created_at__gte=start, created_at__lt=end)
            resolved = findings.filter(
                updated_at__gte=start,
                updated_at__lt=end,
                status__in=[Finding.Status.RESOLVED, Finding.Status.CLOSED],
            )
            created_severity = {
                "critical": created.filter(severity=Finding.Severity.CRITICAL).count(),
                "high": created.filter(severity=Finding.Severity.HIGH).count(),
                "medium": created.filter(severity=Finding.Severity.MEDIUM).count(),
                "low": created.filter(severity=Finding.Severity.LOW).count(),
            }
            resolved_by_severity = {
                "critical": resolved.filter(severity=Finding.Severity.CRITICAL).count(),
                "high": resolved.filter(severity=Finding.Severity.HIGH).count(),
                "medium": resolved.filter(severity=Finding.Severity.MEDIUM).count(),
                "low": resolved.filter(severity=Finding.Severity.LOW).count(),
            }
            trend.append({
                "label": label,
                "period_start": start.isoformat(),
                "period_end": end.isoformat(),
                "created_total": created.count(),
                "created_by_severity": created_severity,
                "resolved_total": resolved.count(),
                "resolved_by_severity": resolved_by_severity,
                "net_change": created.count() - resolved.count(),
            })

        # Current open findings risk score (weighted by severity)
        open_findings = findings.filter(
            status__in=[Finding.Status.OPEN, Finding.Status.IN_PROGRESS]
        )
        severity_weights = {
            Finding.Severity.CRITICAL: 4,
            Finding.Severity.HIGH: 3,
            Finding.Severity.MEDIUM: 2,
            Finding.Severity.LOW: 1,
        }
        risk_score = sum(
            severity_weights.get(f.severity, 0) for f in open_findings
        )
        # Normalize to 0-100 scale (approximate max)
        max_possible = max(open_findings.count() * 4, 1)
        risk_index = round((risk_score / max_possible) * 100, 1)

        return {
            "trend": trend,
            "current_risk_index": risk_index,
            "risk_level": (
                "critical" if risk_index >= 75 else
                "high" if risk_index >= 50 else
                "medium" if risk_index >= 25 else
                "low"
            ),
            "open_critical": open_findings.filter(severity=Finding.Severity.CRITICAL).count(),
            "open_high": open_findings.filter(severity=Finding.Severity.HIGH).count(),
        }

    # ─────────── P1 Analytics Builders ───────────

    def _build_assessment_status_breakdown(self, assessments) -> dict[str, int]:
        """Count assessments per status — useful for portfolio health snapshots."""
        breakdown = {
            "draft": 0,
            "in_progress": 0,
            "under_review": 0,
            "completed": 0,
            "archived": 0,
        }
        mapping = {
            Assessment.Status.DRAFT: "draft",
            Assessment.Status.IN_PROGRESS: "in_progress",
            Assessment.Status.UNDER_REVIEW: "under_review",
            Assessment.Status.COMPLETED: "completed",
            Assessment.Status.ARCHIVED: "archived",
        }
        for status_val, count in (
            assessments.values("status")
            .annotate(count=models.Count("id"))
            .values_list("status", "count")
        ):
            key = mapping.get(status_val)
            if key:
                breakdown[key] = count
        return breakdown

    def _build_findings_by_severity(self, findings) -> dict[str, int]:
        """Severity distribution of all findings for risk visibility."""
        breakdown = {
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
        }
        mapping = {
            Finding.Severity.CRITICAL: "critical",
            Finding.Severity.HIGH: "high",
            Finding.Severity.MEDIUM: "medium",
            Finding.Severity.LOW: "low",
        }
        for severity_val, count in (
            findings.values("severity")
            .annotate(count=models.Count("id"))
            .values_list("severity", "count")
        ):
            key = mapping.get(severity_val)
            if key:
                breakdown[key] = count
        return breakdown

    def _build_pending_invitations(self, invitations) -> dict[str, Any]:
        """Pending invitation count + list of upcoming/onboarding blockers."""
        now = timezone.now()
        pending_list = []
        expired_count = 0

        for inv in invitations.order_by("-created_at")[:10]:
            is_expired = inv.expires_at < now
            if is_expired:
                expired_count += 1
            pending_list.append(
                {
                    "id": str(inv.id),
                    "email": inv.email,
                    "invited_name": inv.invited_name,
                    "fallback_role": inv.fallback_role,
                    "organization_name": inv.organization.name,
                    "expires_at": inv.expires_at.isoformat(),
                    "is_expired": is_expired,
                    "url": f"/organizations/{inv.organization_id}/members",
                }
            )

        return {
            "pending_count": invitations.count(),
            "expired_count": expired_count,
            "invitations": pending_list[:6],
        }

    def _build_evidence_pipeline(self, documents, responses) -> dict[str, Any]:
        """Evidence mapping health: uploaded, mapped, unmapped, awaiting review, AI suggestions."""
        # Documents uploaded this calendar month
        now = timezone.now()
        uploaded_this_month = documents.filter(
            created_at__year=now.year,
            created_at__month=now.month,
        ).count()

        # Mapped = responses with framework mappings or citations
        mapped = 0
        unmapped = 0
        awaiting_review = 0
        ai_suggested = 0
        ai_validated = 0

        for resp in responses:
            if resp.frameworks_mapped_to or resp.citations:
                mapped += 1
            else:
                unmapped += 1
            if resp.evidence_files:
                awaiting_review += 1
            if resp.ai_validated:
                ai_validated += 1
            if resp.ai_score_suggestion is not None and not resp.ai_validated:
                ai_suggested += 1

        # Also count ALL unreviewed knowledge documents as unreviewed evidence
        total_docs = documents.count()

        return {
            "uploaded_this_month": uploaded_this_month,
            "mapped": mapped,
            "unmapped": unmapped,
            "awaiting_review": awaiting_review,
            "ai_suggested": ai_suggested,
            "ai_validated": ai_validated,
            "total_uploaded": total_docs,
        }

    def _build_site_progress(self, assessments) -> list[dict[str, Any]]:
        """Per-site assessment progress: completion pct and status counts."""
        # Group by site (null site = organization-level)
        sites: dict[str, dict[str, Any]] = {}
        for a in assessments.select_related("site"):
            site_name = a.site.name if a.site else "Organization-level"
            site_id = str(a.site_id) if a.site else None
            if site_name not in sites:
                sites[site_name] = {
                    "site_id": site_id,
                    "site_name": site_name,
                    "total": 0,
                    "completed": 0,
                    "in_progress": 0,
                    "draft": 0,
                    "under_review": 0,
                }
            sites[site_name]["total"] += 1
            if a.status == Assessment.Status.COMPLETED:
                sites[site_name]["completed"] += 1
            elif a.status == Assessment.Status.IN_PROGRESS:
                sites[site_name]["in_progress"] += 1
            elif a.status == Assessment.Status.DRAFT:
                sites[site_name]["draft"] += 1
            elif a.status == Assessment.Status.UNDER_REVIEW:
                sites[site_name]["under_review"] += 1

        result = []
        for data in sites.values():
            total = data["total"]
            data["completion_pct"] = (
                round((data["completed"] / total) * 100, 1) if total else 0
            )
            result.append(data)

        # Sort by highest total first, cap at 8
        result.sort(key=lambda x: x["total"], reverse=True)
        return result[:8]

    # ─────────── P0 Builders (attention, deadlines, activity) ───────────

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
