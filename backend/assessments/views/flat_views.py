"""
Flat API routes for assessment resources — used by assessment detail page.
These are org-scoped via permission checks and query params, not URL kwargs.
"""

from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from assessments.models import (
    Assessment,
    AssessmentActionInstance,
    AssessmentPlan,
    AssessmentQuestion,
    AssessmentReport,
    AssessmentResponse,
    AssessmentWorkflowInstance,
    CIPCycle,
    Finding,
    Site,
    Task,
    WorkflowTemplate,
)
from assessments.serializers import (
    AssessmentActionInstanceSerializer,
    AssessmentPlanSerializer,
    AssessmentQuestionSerializer,
    AssessmentReportSerializer,
    AssessmentResponseSerializer,
    AssessmentSerializer,
    AssessmentWorkflowInstanceSerializer,
    CIPCycleSerializer,
    FindingSerializer,
    SiteSerializer,
    TaskSerializer,
    WorkflowTemplateSerializer,
)
from assessments.services.access import AssessmentAccessService
from assessments.services.questionnaires import (
    ensure_assessment_questionnaire_snapshots,
    get_questionnaire_readiness,
    submit_questionnaire_for_assessment,
)
from assessments.services.workflows import (
    complete_action_instance,
    ensure_assessment_workflow,
)
from assessments.views.base import BaseAssessmentScopedViewSet
from assessments.views.mixins import ReportExportMixin, ResponseValidationMixin
from organizations.models import OrganizationMembership
from users.permissions import CanManageTemplates, CanViewReports


def get_request_organization_id(request):
    organization = getattr(request, "organization", None)
    if organization:
        return str(organization.id)
    meta_org_id = getattr(request, "META", {}).get("HTTP_X_ORGANIZATION_ID")
    if meta_org_id:
        return str(meta_org_id)
    if hasattr(request, "query_params"):
        return request.query_params.get("organization") or request.query_params.get(
            "org"
        )
    return None


class FlatAssessmentViewSet(viewsets.ModelViewSet):
    """Flat assessment routes — /api/assessments/ (org-scoped by default).

    - Regular users: always scoped to their own organization.
    - SUPERADMIN / Django superuser: can see all orgs (platform admin).
    - Any user requesting ?organization=<id>: scoped to that org.
    """

    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AssessmentAccessService.get_accessible_assessments(self.request.user)
        org_id = get_request_organization_id(self.request)

        if org_id:
            return qs.filter(organization_id=org_id)

        if self.request.user.is_superuser:
            return qs

        return qs

    @action(detail=False, methods=["GET"])
    def aggregate(self, request):
        """Return assessments scoped to the active organization, unless platform superuser."""
        user = request.user
        requested_org_ids = request.query_params.get("org_ids")
        active_org_id = get_request_organization_id(request)

        if active_org_id:
            qs = Assessment.objects.filter(organization_id=active_org_id)
        elif user.is_superuser:
            qs = Assessment.objects.all()
            if requested_org_ids:
                org_ids = [
                    oid.strip() for oid in requested_org_ids.split(",") if oid.strip()
                ]
                qs = qs.filter(organization_id__in=org_ids)
        else:
            qs = AssessmentAccessService.get_accessible_assessments(user)
            if requested_org_ids:
                org_ids = [
                    oid.strip() for oid in requested_org_ids.split(",") if oid.strip()
                ]
                qs = qs.filter(organization_id__in=org_ids)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        user = self.request.user
        organization = getattr(self.request, "organization", None)

        if not organization and not user.is_superuser:
            raise PermissionDenied("Organization context is required.")

        assessment = serializer.save(organization=organization, created_by=user)
        ensure_assessment_questionnaire_snapshots(assessment, created_by=user)

    @action(detail=True, methods=["GET"], url_path="questionnaire-readiness")
    def questionnaire_readiness(self, request, pk=None):
        assessment = self.get_object()
        org_id = get_request_organization_id(request)
        if org_id and str(assessment.organization_id) != str(org_id):
            raise PermissionDenied(
                "Assessment does not belong to the selected organization."
            )
        return Response(get_questionnaire_readiness(assessment, request.user))

    @action(detail=True, methods=["POST"], url_path="submit-questionnaire")
    def submit_questionnaire(self, request, pk=None):
        assessment = self.get_object()
        org_id = get_request_organization_id(request)
        if org_id and str(assessment.organization_id) != str(org_id):
            raise PermissionDenied(
                "Assessment does not belong to the selected organization."
            )

        raw_force = request.data.get("force", False)
        force = (
            raw_force
            if isinstance(raw_force, bool)
            else str(raw_force).lower() in {"1", "true", "yes", "on"}
        )
        notes = request.data.get("notes", "")
        try:
            action_instance = submit_questionnaire_for_assessment(
                assessment,
                request.user,
                force=force,
                notes=notes,
            )
        except ValueError as exc:
            readiness = get_questionnaire_readiness(assessment, request.user)
            return Response(
                {"error": str(exc), "readiness": readiness},
                status=status.HTTP_400_BAD_REQUEST,
            )

        readiness = get_questionnaire_readiness(assessment, request.user)
        return Response(
            {
                "success": True,
                "action": (
                    AssessmentActionInstanceSerializer(
                        action_instance, context={"request": request}
                    ).data
                    if action_instance
                    else None
                ),
                "readiness": readiness,
            }
        )


class FlatFindingViewSet(BaseAssessmentScopedViewSet):
    serializer_class = FindingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Finding.objects.select_related("assessment", "site", "provision")
        return self.filter_by_assessment(qs)


class FlatCIPCycleViewSet(viewsets.ModelViewSet):
    """Flat CIP cycle routes — /api/cip-cycles/ (filtered by assessment query param)."""

    serializer_class = CIPCycleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = CIPCycle.objects.select_related("assessment")
        assessment_id = self.request.query_params.get("assessment")
        if assessment_id:
            assessment = Assessment.objects.filter(id=assessment_id).first()
            if assessment:
                if (
                    OrganizationMembership.objects.filter(
                        user=self.request.user,
                        organization_id=assessment.organization_id,
                    ).exists()
                    or self.request.user.is_superuser
                ):
                    return qs.filter(assessment_id=assessment_id)
            return qs.none()
        return qs


class FlatAssessmentPlanViewSet(viewsets.ModelViewSet):
    """Flat assessment plan routes — /api/plans/ (filtered by assessment query param)."""

    serializer_class = AssessmentPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AssessmentPlan.objects.select_related("assessment")
        assessment_id = self.request.query_params.get("assessment")
        if assessment_id:
            assessment = Assessment.objects.filter(id=assessment_id).first()
            if assessment:
                if (
                    OrganizationMembership.objects.filter(
                        user=self.request.user,
                        organization_id=assessment.organization_id,
                    ).exists()
                    or self.request.user.is_superuser
                ):
                    return qs.filter(assessment_id=assessment_id)
            return qs.none()
        return qs


class FlatTaskViewSet(viewsets.ModelViewSet):
    """Flat task routes — /api/tasks/ (filtered by assessment query param)."""

    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Task.objects.select_related("assessment", "organization")
        assessment_id = self.request.query_params.get("assessment")
        if assessment_id:
            assessment = Assessment.objects.filter(id=assessment_id).first()
            if assessment:
                if (
                    OrganizationMembership.objects.filter(
                        user=self.request.user,
                        organization_id=assessment.organization_id,
                    ).exists()
                    or self.request.user.is_superuser
                ):
                    return qs.filter(assessment_id=assessment_id)
            return qs.none()
        return qs


class FlatWorkflowTemplateViewSet(viewsets.ModelViewSet):
    """Configurable workflow template routes — /api/workflow-templates/."""

    serializer_class = WorkflowTemplateSerializer
    permission_classes = [CanManageTemplates]

    def get_queryset(self):
        qs = WorkflowTemplate.objects.filter(is_active=True).prefetch_related(
            "steps", "steps__actions"
        )
        framework_slug = self.request.query_params.get("framework_slug")
        if framework_slug:
            qs = qs.filter(framework_slug=framework_slug)
        return qs


class FlatAssessmentWorkflowViewSet(viewsets.ReadOnlyModelViewSet):
    """Assessment workflow routes — /api/assessment-workflows/?assessment=<id>."""

    serializer_class = AssessmentWorkflowInstanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AssessmentWorkflowInstance.objects.select_related(
            "assessment", "organization", "template"
        ).prefetch_related("action_instances", "action_instances__action")
        assessment_id = self.request.query_params.get("assessment")
        if not assessment_id:
            return qs.none()

        assessment = Assessment.objects.filter(id=assessment_id).first()
        if not assessment:
            return qs.none()
        if not self.request.user.is_superuser:
            has_access = (
                AssessmentAccessService.get_accessible_assessments(self.request.user)
                .filter(id=assessment_id)
                .exists()
            )
            if not has_access:
                return qs.none()

        org_id = get_request_organization_id(self.request)
        if org_id and str(assessment.organization_id) != str(org_id):
            return qs.none()

        workflow = ensure_assessment_workflow(assessment)
        return qs.filter(id=workflow.id)


class FlatAssessmentActionViewSet(viewsets.ModelViewSet):
    """Assessment workflow action routes with controlled state transitions."""

    serializer_class = AssessmentActionInstanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AssessmentActionInstance.objects.select_related(
            "assessment",
            "organization",
            "workflow",
            "action",
            "action__step",
            "completed_by",
        )
        if self.action in [
            "retrieve",
            "update",
            "partial_update",
            "destroy",
            "complete",
        ]:
            if self.request.user.is_superuser:
                return qs
            accessible_assessments = AssessmentAccessService.get_accessible_assessments(
                self.request.user
            )
            return qs.filter(assessment_id__in=accessible_assessments.values("id"))

        assessment_id = self.request.query_params.get("assessment")
        if assessment_id:
            assessment = Assessment.objects.filter(id=assessment_id).first()
            if not assessment:
                return qs.none()
            if not self.request.user.is_superuser:
                has_access = (
                    AssessmentAccessService.get_accessible_assessments(
                        self.request.user
                    )
                    .filter(id=assessment.id)
                    .exists()
                )
                if not has_access:
                    return qs.none()
            org_id = get_request_organization_id(self.request)
            if org_id and str(assessment.organization_id) != str(org_id):
                return qs.none()
            ensure_assessment_workflow(assessment)
            return qs.filter(assessment_id=assessment_id)
        if self.request.user.is_superuser:
            return qs
        return qs.none()

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        action_instance = self.get_object()
        notes = request.data.get("notes", "") if hasattr(request, "data") else ""
        try:
            updated = complete_action_instance(
                action_instance,
                request.user,
                notes=notes,
                force=request.data.get("force", False),
            )
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(updated).data)


class FlatAssessmentReportViewSet(ReportExportMixin, BaseAssessmentScopedViewSet):
    """Flat report routes — /api/reports/ (filtered by assessment query param)."""

    serializer_class = AssessmentReportSerializer
    permission_classes = [permissions.IsAuthenticated, CanViewReports]

    def get_queryset(self):
        qs = AssessmentReport.objects.select_related("assessment", "organization")
        # For detail routes (e.g., /api/reports/{id}/export/pdf/), allow direct lookup
        # by not filtering to none when assessment param is missing
        assessment_id = self.request.query_params.get("assessment")
        if assessment_id:
            return self.filter_by_assessment(qs)
        # No assessment filter = return all reports user has access to
        org_id = get_request_organization_id(self.request)
        if org_id and not self.request.user.is_superuser:
            return qs.filter(organization_id=org_id)
        elif not self.request.user.is_superuser:
            return qs.none()
        return qs


class FlatAssessmentResponseViewSet(
    ResponseValidationMixin, BaseAssessmentScopedViewSet
):
    """Flat response routes — /api/responses/ (filtered by assessment query param)."""

    serializer_class = AssessmentResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        qs = AssessmentResponse.objects.select_related("assessment", "organization")

        if self.action in [
            "retrieve",
            "update",
            "partial_update",
            "destroy",
            "validate",
        ]:
            return self.filter_detail_queryset(qs)

        return self.filter_by_assessment(qs)

    def filter_detail_queryset(self, queryset):
        """Keep ID-based response detail routes tenant-scoped."""
        org_id = get_request_organization_id(self.request)

        if self.request.user.is_superuser:
            if org_id:
                return queryset.filter(assessment__organization_id=org_id)
            return queryset

        accessible_assessments = AssessmentAccessService.get_accessible_assessments(
            self.request.user
        )
        queryset = queryset.filter(
            assessment_id__in=accessible_assessments.values("id")
        )

        if org_id:
            queryset = queryset.filter(assessment__organization_id=org_id)

        return queryset

    def perform_create(self, serializer):
        assessment = serializer.validated_data.get("assessment")
        assessment_id = self.request.query_params.get("assessment")

        if not assessment and assessment_id:
            assessment = Assessment.objects.filter(id=assessment_id).first()

        if not assessment:
            raise PermissionDenied("Assessment is required.")

        org_id = get_request_organization_id(self.request)
        if org_id and str(assessment.organization_id) != str(org_id):
            raise PermissionDenied(
                "Assessment does not belong to the selected organization."
            )

        if not self.request.user.is_superuser:
            has_access = (
                AssessmentAccessService.get_accessible_assessments(self.request.user)
                .filter(id=assessment.id)
                .exists()
            )
            if not has_access:
                raise PermissionDenied("You do not have access to this assessment.")

        serializer.save(
            assessment=assessment,
            organization_id=assessment.organization_id,
            created_by=self.request.user,
        )


class FlatAssessmentQuestionViewSet(viewsets.ReadOnlyModelViewSet):
    """Flat question routes — /api/questions/ filtered by assessment or template query param."""

    serializer_class = AssessmentQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        assessment_id = self.request.query_params.get("assessment")
        template_id = self.request.query_params.get("template")
        organization_id = get_request_organization_id(self.request)

        queryset = AssessmentQuestion.objects.select_related(
            "assessment", "template", "source_template_question"
        ).order_by("order")

        if assessment_id:
            assessment = Assessment.objects.filter(id=assessment_id).first()
            if not assessment:
                return AssessmentQuestion.objects.none()

            if organization_id and str(assessment.organization_id) != str(
                organization_id
            ):
                return AssessmentQuestion.objects.none()

            if not self.request.user.is_superuser:
                has_access = (
                    AssessmentAccessService.get_accessible_assessments(
                        self.request.user
                    )
                    .filter(id=assessment.id)
                    .exists()
                )
                if not has_access:
                    return AssessmentQuestion.objects.none()

            snapshot_qs = queryset.filter(assessment_id=assessment_id)
            if snapshot_qs.exists():
                return snapshot_qs

            if assessment.template_id:
                return queryset.filter(
                    template_id=assessment.template_id, assessment__isnull=True
                )
            return AssessmentQuestion.objects.none()

        if template_id:
            queryset = queryset.filter(template_id=template_id, assessment__isnull=True)
        if organization_id:
            queryset = queryset.filter(
                Q(organization_id=organization_id)
                | Q(template__owner_org_id=organization_id)
            )
        elif not self.request.user.is_superuser:
            return AssessmentQuestion.objects.none()
        return queryset

    @action(detail=True, methods=["get"], url_path="mappings")
    def get_mappings(self, request, pk=None):
        """
        Get framework mappings for a question.
        GET /api/questions/:id/mappings/
        """
        question = self.get_object()
        return Response({"mappings": question.framework_mappings})

    @action(detail=True, methods=["post"], url_path="mappings")
    def add_mapping(self, request, pk=None):
        """
        Add a framework mapping to a question.
        POST /api/questions/:id/mappings/
        Body: {"framework_id": "uuid", "provision_code": "P1.2.3", "provision_name": "..."}
        """
        question = self.get_object()
        data = request.data

        if not data.get("framework_id"):
            return Response(
                {"error": "framework_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate framework exists
        from assessments.models import Framework

        try:
            framework = Framework.objects.get(id=data["framework_id"])
        except Framework.DoesNotExist:
            return Response(
                {"error": "Framework not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Create mapping entry
        mapping = {
            "framework_id": str(framework.id),
            "framework_name": framework.name,
            "provision_code": data.get("provision_code", ""),
            "provision_name": data.get("provision_name", ""),
        }

        # Check for duplicates
        existing = next(
            (
                m
                for m in question.framework_mappings
                if m["framework_id"] == mapping["framework_id"]
                and m["provision_code"] == mapping["provision_code"]
            ),
            None,
        )
        if existing:
            return Response(
                {"error": "Mapping already exists"}, status=status.HTTP_409_CONFLICT
            )

        question.framework_mappings.append(mapping)
        question.save()

        return Response(
            {"mappings": question.framework_mappings}, status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["delete"], url_path="mappings/(?P<index>[^/.]+)")
    def delete_mapping(self, request, pk=None, index=None):
        """
        Remove a framework mapping from a question.
        DELETE /api/questions/:id/mappings/:index/
        """
        question = self.get_object()

        try:
            idx = int(index)
            if idx < 0 or idx >= len(question.framework_mappings):
                raise ValueError("Index out of range")
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid mapping index"}, status=status.HTTP_400_BAD_REQUEST
            )

        removed = question.framework_mappings.pop(idx)
        question.save()

        return Response(
            {
                "message": "Mapping removed",
                "removed": removed,
                "mappings": question.framework_mappings,
            }
        )


class FlatSiteViewSet(viewsets.ModelViewSet):
    """Flat site routes — /api/sites/ (org-scoped by default)."""

    serializer_class = SiteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        org_id = get_request_organization_id(self.request)

        if org_id:
            return Site.objects.filter(organization_id=org_id)

        if user.is_superuser:
            return Site.objects.all()

        return Site.objects.none()

    def perform_create(self, serializer):
        organization = getattr(self.request, "organization", None)

        if not organization:
            raise PermissionDenied("Organization context is required.")

        serializer.save(organization=organization)
