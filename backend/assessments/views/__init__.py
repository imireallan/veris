from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from assessments.models import (
    AIInsight,
    Assessment,
    AssessmentPlan,
    AssessmentQuestion,
    AssessmentReport,
    AssessmentResponse,
    AssessmentTemplate,
    CIPCycle,
    ESGFocusArea,
    ExternalRating,
    Finding,
    Framework,
    Site,
    Task,
)
from assessments.serializers import (
    AIInsightSerializer,
    AssessmentPlanSerializer,
    AssessmentQuestionSerializer,
    AssessmentReportSerializer,
    AssessmentResponseSerializer,
    AssessmentSerializer,
    AssessmentTemplateSerializer,
    CIPCycleSerializer,
    ESGFocusAreaSerializer,
    ExternalRatingSerializer,
    FindingSerializer,
    FrameworkSerializer,
    SiteSerializer,
    TaskSerializer,
)
from assessments.services.access import AssessmentAccessService
from assessments.services.questionnaires import (
    ensure_assessment_questionnaire_snapshots,
)
from assessments.views.mixins import ReportExportMixin, ResponseValidationMixin
from users.permissions import (
    CanManageAssessments,
    CanManageFindings,
    CanManageSites,
    CanManageTasks,
    CanManageTemplates,
    CanViewReports,
    IsAssessmentOwner,
    IsOrganizationMember,
)


def get_request_organization_id(request, kwargs=None):
    organization = getattr(request, "organization", None)
    if organization:
        return str(organization.id)

    if kwargs and kwargs.get("org_pk"):
        return str(kwargs.get("org_pk"))

    meta_org_id = getattr(request, "META", {}).get("HTTP_X_ORGANIZATION_ID")
    if meta_org_id:
        return str(meta_org_id)

    if hasattr(request, "query_params"):
        return request.query_params.get("organization") or request.query_params.get(
            "org"
        )

    return None


class FrameworkViewSet(viewsets.ReadOnlyModelViewSet):
    """Global framework reference data - not org-scoped."""

    queryset = Framework.objects.all()
    serializer_class = FrameworkSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "slug"  # Use slug instead of ID in URLs


class ESGFocusAreaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ESGFocusAreaSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        org_id = get_request_organization_id(self.request, self.kwargs)
        if not org_id:
            return ESGFocusArea.objects.none()
        return ESGFocusArea.objects.filter(organization_id=org_id)


class ExternalRatingViewSet(viewsets.ModelViewSet):
    serializer_class = ExternalRatingSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        org_id = get_request_organization_id(self.request, self.kwargs)
        if not org_id:
            return ExternalRating.objects.none()
        return ExternalRating.objects.filter(organization_id=org_id)

    def perform_create(self, serializer):
        org_id = get_request_organization_id(self.request, self.kwargs)
        if not org_id:
            raise PermissionDenied("Organization context is required.")
        serializer.save(organization_id=org_id)


class AssessmentViewSet(viewsets.ModelViewSet):
    """Full CRUD for assessments."""

    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated, CanManageAssessments]

    def get_queryset(self):
        qs = AssessmentAccessService.get_accessible_assessments(self.request.user)

        org_id = get_request_organization_id(self.request, self.kwargs)
        if org_id:
            qs = qs.filter(organization_id=org_id)
        elif not self.request.user.is_superuser:
            qs = qs.none()

        return qs.select_related(
            "site", "focus_area", "framework", "created_by", "assigned_to"
        )

    def perform_create(self, serializer):
        organization = getattr(self.request, "organization", None)
        if not organization and not self.request.user.is_superuser:
            raise PermissionDenied(
                "You must select an active organization to create assessments"
            )

        assessment = serializer.save(
            created_by=self.request.user, organization=organization
        )
        ensure_assessment_questionnaire_snapshots(
            assessment,
            created_by=self.request.user,
        )


class AssessmentDetailViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only detail endpoint that bundles assessment + report + findings + plan + cip cycles.
    No org_pk needed — looks up by assessment pk directly, but validates org membership.
    """

    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated, IsAssessmentOwner]

    def get_queryset(self):
        user = self.request.user
        org_id = get_request_organization_id(self.request, self.kwargs)

        queryset = Assessment.objects.select_related(
            "site", "focus_area", "framework", "created_by", "assigned_to"
        )

        if user.is_superuser and not org_id:
            return queryset

        if not org_id:
            return Assessment.objects.none()

        return queryset.filter(organization_id=org_id)

    @action(detail=True, methods=["get"])
    def full_detail(self, request, pk=None):
        """Return assessment with all related data in one request."""
        assessment = self.get_object()

        report_qs = AssessmentReport.objects.filter(assessment=assessment)
        report = AssessmentReportSerializer(
            report_qs.first() if report_qs.exists() else None
        )

        findings = Finding.objects.filter(assessment=assessment)
        findings_data = FindingSerializer(findings, many=True).data

        plan_qs = AssessmentPlan.objects.filter(assessment=assessment)
        plan = AssessmentPlanSerializer(plan_qs.first() if plan_qs.exists() else None)

        cip_cycles = CIPCycle.objects.filter(assessment=assessment)
        cip_data = CIPCycleSerializer(cip_cycles, many=True).data

        tasks = Task.objects.filter(assessment=assessment)
        tasks_data = TaskSerializer(tasks, many=True).data

        return Response(
            {
                "assessment": AssessmentSerializer(assessment).data,
                "report": report.data,
                "findings": findings_data,
                "plan": plan.data,
                "cip_cycles": cip_data,
                "tasks": tasks_data,
            }
        )


class AssessmentTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentTemplateSerializer
    permission_classes = [IsAuthenticated, CanManageTemplates]

    def get_queryset(self):
        organization = getattr(self.request, "organization", None)
        if not organization:
            if self.request.user.is_superuser:
                return AssessmentTemplate.objects.all()
            return AssessmentTemplate.objects.none()

        return AssessmentTemplate.objects.filter(owner_org=organization)


class AssessmentQuestionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AssessmentQuestionSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        assessment_pk = self.kwargs.get("assessment_pk")
        org_pk = self.kwargs.get("org_pk")

        if assessment_pk:
            from assessments.models import Assessment

            try:
                assessment = Assessment.objects.get(id=assessment_pk)
            except Assessment.DoesNotExist:
                return AssessmentQuestion.objects.none()

            # Durable path: render frozen assessment-owned snapshots.
            snapshot_qs = AssessmentQuestion.objects.filter(
                assessment=assessment
            ).order_by("order")
            if snapshot_qs.exists():
                return snapshot_qs

            # Backward-compatible fallback for assessments created before snapshotting.
            if assessment.template_id:
                return AssessmentQuestion.objects.filter(
                    template=assessment.template
                ).order_by("order")

            return AssessmentQuestion.objects.none()

        # Fallback: Filter questions by organization if assessment_pk is missing
        if org_pk:
            organization = getattr(self.request, "organization", None)
            if organization and str(organization.id) == str(org_pk):
                return AssessmentQuestion.objects.filter(
                    template__owner_org=organization
                ).order_by("order")
        return AssessmentQuestion.objects.none()


class AssessmentResponseViewSet(ResponseValidationMixin, viewsets.ModelViewSet):
    serializer_class = AssessmentResponseSerializer
    permission_classes = [IsAuthenticated, IsAssessmentOwner]

    def get_queryset(self):
        assessment_pk = self.kwargs.get("assessment_pk")
        if not assessment_pk:
            return AssessmentResponse.objects.none()

        org_id = get_request_organization_id(self.request, self.kwargs)
        qs = AssessmentResponse.objects.select_related("assessment", "organization")

        if self.request.user.is_superuser:
            qs = qs.filter(assessment_id=assessment_pk)
            if org_id:
                qs = qs.filter(assessment__organization_id=org_id)
            return qs

        if not org_id:
            return AssessmentResponse.objects.none()

        has_access = (
            AssessmentAccessService.get_accessible_assessments(self.request.user)
            .filter(id=assessment_pk, organization_id=org_id)
            .exists()
        )
        if not has_access:
            return AssessmentResponse.objects.none()

        return qs.filter(
            assessment_id=assessment_pk, assessment__organization_id=org_id
        )

    def perform_create(self, serializer):
        assessment = serializer.validated_data.get("assessment")
        assessment_pk = self.kwargs.get("assessment_pk")

        if not assessment and assessment_pk:
            assessment = Assessment.objects.filter(id=assessment_pk).first()

        if not assessment:
            raise PermissionDenied("Assessment is required.")

        question = serializer.validated_data.get("question")
        org_id = get_request_organization_id(self.request, self.kwargs)
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

        if question:
            writable_fields = {
                field.name
                for field in AssessmentResponse._meta.fields
                if field.name
                not in {
                    "id",
                    "assessment",
                    "organization",
                    "question",
                    "created_at",
                    "updated_at",
                }
            }
            defaults = {
                field: value
                for field, value in serializer.validated_data.items()
                if field in writable_fields
            }
            defaults.update(
                {
                    "organization_id": assessment.organization_id,
                    "created_by": self.request.user,
                }
            )
            response_obj, _created = AssessmentResponse.objects.update_or_create(
                assessment=assessment,
                question=question,
                defaults=defaults,
            )
            serializer.instance = response_obj
            return

        serializer.save(
            assessment=assessment,
            organization_id=assessment.organization_id,
            created_by=self.request.user,
        )


class AIInsightViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AIInsightSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        org_id = get_request_organization_id(self.request, self.kwargs)
        if not org_id:
            return AIInsight.objects.none()
        return AIInsight.objects.filter(organization_id=org_id)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, CanManageTasks]

    def get_queryset(self):
        org_id = get_request_organization_id(self.request, self.kwargs)
        if not org_id:
            return Task.objects.none()
        return Task.objects.filter(organization_id=org_id)


class SiteViewSet(viewsets.ModelViewSet):
    serializer_class = SiteSerializer
    permission_classes = [IsAuthenticated, CanManageSites]

    def get_queryset(self):
        org_id = get_request_organization_id(self.request, self.kwargs)
        qs = Site.objects.all()
        if org_id:
            return qs.filter(organization_id=org_id)
        if self.request.user.is_superuser:
            return qs
        return qs.none()


class AssessmentReportViewSet(ReportExportMixin, viewsets.ModelViewSet):
    serializer_class = AssessmentReportSerializer
    permission_classes = [IsAuthenticated, CanViewReports]

    def get_queryset(self):
        qs = AssessmentReport.objects.select_related("assessment", "organization")

        org_id = get_request_organization_id(self.request, self.kwargs)
        if org_id:
            qs = qs.filter(organization_id=org_id)
        elif not self.request.user.is_superuser:
            qs = qs.none()

        return qs


class FindingViewSet(viewsets.ModelViewSet):
    serializer_class = FindingSerializer
    permission_classes = [IsAuthenticated, CanManageFindings]

    def get_queryset(self):
        org_pk = get_request_organization_id(self.request, self.kwargs)
        qs = Finding.objects.select_related("assessment", "site", "provision")
        if org_pk:
            qs = qs.filter(assessment__organization_id=org_pk)
        elif not self.request.user.is_superuser:
            qs = qs.none()
        return qs


class CIPCycleViewSet(viewsets.ModelViewSet):
    serializer_class = CIPCycleSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        org_pk = get_request_organization_id(self.request, self.kwargs)
        qs = CIPCycle.objects.select_related("assessment")
        if org_pk:
            qs = qs.filter(assessment__organization_id=org_pk)
        elif not self.request.user.is_superuser:
            qs = qs.none()
        return qs


class AssessmentPlanViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentPlanSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        org_pk = get_request_organization_id(self.request, self.kwargs)
        qs = AssessmentPlan.objects.select_related("assessment")
        if org_pk:
            qs = qs.filter(assessment__organization_id=org_pk)
        elif not self.request.user.is_superuser:
            qs = qs.none()
        return qs
