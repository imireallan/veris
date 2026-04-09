from users.permissions import IsAssessmentOwner, IsOrganizationMember, IsOrganizationOwnerOrAdmin
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from assessments.models import (
    ESGFocusArea,
    ExternalRating,
    Assessment,
    AssessmentTemplate,
    AssessmentQuestion,
    AssessmentResponse,
    AIInsight,
    Task,
    Site,
    Framework,
    AssessmentReport,
    Finding,
    CIPCycle,
    AssessmentPlan,
)
from assessments.serializers import (
    ESGFocusAreaSerializer,
    ExternalRatingSerializer,
    AssessmentSerializer,
    AssessmentTemplateSerializer,
    AssessmentQuestionSerializer,
    AssessmentResponseSerializer,
    AIInsightSerializer,
    TaskSerializer,
    SiteSerializer,
    FrameworkSerializer,
    AssessmentReportSerializer,
    FindingSerializer,
    CIPCycleSerializer,
    AssessmentPlanSerializer,
)


class FrameworkViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Framework.objects.all()
    serializer_class = FrameworkSerializer
    permission_classes = [IsAuthenticated]


class ESGFocusAreaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ESGFocusAreaSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        return ESGFocusArea.objects.filter(
            organization_id=self.kwargs.get("org_pk")
        )


class ExternalRatingViewSet(viewsets.ModelViewSet):
    serializer_class = ExternalRatingSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        return ExternalRating.objects.filter(
            organization_id=self.kwargs.get("org_pk")
        )

    def perform_create(self, serializer):
        org_id = self.kwargs.get("org_pk")
        serializer.save(organization_id=org_id)


class AssessmentViewSet(viewsets.ModelViewSet):
    """Full CRUD for assessments."""
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated, IsOrganizationOwnerOrAdmin]

    def get_queryset(self):
        qs = Assessment.objects.all()
        org_id = self.kwargs.get("org_pk") or self.request.query_params.get("organization")
        if org_id:
            qs = qs.filter(organization_id=org_id)
        return qs.select_related("site", "focus_area", "framework", "created_by", "assigned_to")

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(created_by=user)


class AssessmentDetailViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only detail endpoint that bundles assessment + report + findings + plan + cip cycles.
    No org_pk needed — looks up by assessment pk directly.
    """
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated, IsAssessmentOwner]

    def get_queryset(self):
        return Assessment.objects.select_related(
            "site", "focus_area", "framework", "created_by", "assigned_to"
        )

    @action(detail=True, methods=["get"])
    def full_detail(self, request, pk=None):
        """Return assessment with all related data in one request."""
        assessment = self.get_object()
        
        report_qs = AssessmentReport.objects.filter(assessment=assessment)
        report = AssessmentReportSerializer(report_qs.first() if report_qs.exists() else None)
        
        findings = Finding.objects.filter(assessment=assessment)
        findings_data = FindingSerializer(findings, many=True).data
        
        plan_qs = AssessmentPlan.objects.filter(assessment=assessment)
        plan = AssessmentPlanSerializer(plan_qs.first() if plan_qs.exists() else None)
        
        cip_cycles = CIPCycle.objects.filter(assessment=assessment)
        cip_data = CIPCycleSerializer(cip_cycles, many=True).data
        
        tasks = Task.objects.filter(assessment=assessment)
        tasks_data = TaskSerializer(tasks, many=True).data
        
        return Response({
            "assessment": AssessmentSerializer(assessment).data,
            "report": report.data,
            "findings": findings_data,
            "plan": plan.data,
            "cip_cycles": cip_data,
            "tasks": tasks_data,
        })


class AssessmentTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentTemplateSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        return AssessmentTemplate.objects.filter(
            organization_id=self.kwargs.get("org_pk")
        )


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
            return AssessmentQuestion.objects.filter(
                template__organization_id=org_pk
            )
        return AssessmentQuestion.objects.none()


class AssessmentResponseViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentResponseSerializer
    permission_classes = [IsAuthenticated, IsAssessmentOwner]

    def get_queryset(self):
        assessment_pk = self.kwargs.get("assessment_pk")
        org_pk = self.kwargs.get("org_pk")
        if assessment_pk:
            queryset = AssessmentResponse.objects.filter(assessment_id=assessment_pk)
            # Additional org scoping if org_pk is provided
            if org_pk:
                queryset = queryset.filter(assessment__organization_id=org_pk)
            return queryset
        return AssessmentResponse.objects.none()


class AIInsightViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AIInsightSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        return AIInsight.objects.filter(
            organization_id=self.kwargs.get("org_pk")
        )


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        return Task.objects.filter(
            organization_id=self.kwargs.get("org_pk")
        )


class SiteViewSet(viewsets.ModelViewSet):
    serializer_class = SiteSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        org_id = self.kwargs.get("org_pk") or self.request.query_params.get("organization")
        qs = Site.objects.all()
        if org_id:
            qs = qs.filter(organization_id=org_id)
        return qs


class AssessmentReportViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AssessmentReport.objects.select_related("assessment", "organization")


class FindingViewSet(viewsets.ModelViewSet):
    serializer_class = FindingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Finding.objects.select_related("assessment", "site", "provision")


class CIPCycleViewSet(viewsets.ModelViewSet):
    serializer_class = CIPCycleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CIPCycle.objects.select_related("assessment")


class AssessmentPlanViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AssessmentPlan.objects.select_related("assessment")