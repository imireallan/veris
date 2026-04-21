from rest_framework import status, viewsets
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

        serializer.save(created_by=self.request.user, organization=organization)


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
        # Filter questions by the template associated with the specific assessment
        assessment_pk = self.kwargs.get("assessment_pk")
        org_pk = self.kwargs.get("org_pk")

        if assessment_pk:
            # Get the template associated with this assessment
            from assessments.models import Assessment

            try:
                assessment = Assessment.objects.get(id=assessment_pk)
                template = assessment.template
                if template:
                    return AssessmentQuestion.objects.filter(template=template)
            except Assessment.DoesNotExist:
                return AssessmentQuestion.objects.none()

        # Fallback: Filter questions by organization if assessment_pk is missing
        if org_pk:
            organization = getattr(self.request, "organization", None)
            if organization and str(organization.id) == str(org_pk):
                return AssessmentQuestion.objects.filter(
                    template__owner_org=organization
                )
        return AssessmentQuestion.objects.none()


class AssessmentResponseViewSet(ResponseValidationMixin, viewsets.ModelViewSet):
    serializer_class = AssessmentResponseSerializer
    permission_classes = [IsAuthenticated, IsAssessmentOwner]

    def get_queryset(self):
        assessment_pk = self.kwargs.get("assessment_pk")
        if not assessment_pk:
            return AssessmentResponse.objects.none()

        return AssessmentResponse.objects.filter(assessment_id=assessment_pk)

    def perform_create(self, serializer):
        assessment = serializer.validated_data.get("assessment")
        if not assessment:
            raise PermissionDenied("Assessment is required.")
        serializer.save(
            organization_id=assessment.organization_id,
            created_by=self.request.user,
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def validate(self, request, pk=None):
        """
        Trigger AI validation for a response.
        Compares response text against evidence documents in Pinecone.
        Updates validation_status, confidence_score, and citations.
        """
        from assessments.services.validation import validate_response

        response_obj = self.get_object()

        if not response_obj.answer_text:
            return Response(
                {"error": "No answer text to validate"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get organization from assessment
        org_id = str(response_obj.assessment.organization_id)

        # Run validation pipeline
        result = validate_response(
            response_text=response_obj.answer_text,
            organization_id=org_id,
            existing_evidence_ids=response_obj.evidence_files,
        )

        # Update response with validation results
        response_obj.validation_status = result.validation_status
        response_obj.confidence_score = result.confidence_score
        response_obj.citations = result.citations
        response_obj.ai_feedback = result.feedback
        response_obj.ai_validated = True
        response_obj.save(
            update_fields=[
                "validation_status",
                "confidence_score",
                "citations",
                "ai_feedback",
                "ai_validated",
            ]
        )

        return Response(
            {
                "validation_status": result.validation_status,
                "confidence_score": result.confidence_score,
                "citations": result.citations,
                "feedback": result.feedback,
                "matching_chunks": len(result.similar_chunks),
            }
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
