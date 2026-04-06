from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
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


class FrameworkViewSet(viewsets.ModelViewSet):
    queryset = Framework.objects.all()
    serializer_class = FrameworkSerializer


class ESGFocusAreaViewSet(viewsets.ModelViewSet):
    serializer_class = ESGFocusAreaSerializer

    def get_queryset(self):
        return ESGFocusArea.objects.filter(
            organization_id=self.kwargs.get("org_pk")
        )

    def perform_create(self, serializer):
        org_id = self.kwargs.get("org_pk")
        serializer.save(organization_id=org_id)


class ExternalRatingViewSet(viewsets.ModelViewSet):
    serializer_class = ExternalRatingSerializer

    def get_queryset(self):
        return ExternalRating.objects.filter(
            organization_id=self.kwargs.get("org_pk")
        )

    def perform_create(self, serializer):
        org_id = self.kwargs.get("org_pk")
        serializer.save(organization_id=org_id)


class AssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentSerializer

    def get_queryset(self):
        return Assessment.objects.filter(
            organization_id=self.kwargs.get("org_pk")
        )


class AssessmentTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentTemplateSerializer

    def get_queryset(self):
        return AssessmentTemplate.objects.filter(
            organization_id=self.kwargs.get("org_pk")
        )


class AssessmentQuestionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AssessmentQuestionSerializer

    def get_queryset(self):
        return AssessmentQuestion.objects.all()


class AssessmentResponseViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentResponseSerializer

    def get_queryset(self):
        return AssessmentResponse.objects.filter(
            assessment_id=self.kwargs.get("assessment_pk")
        )


class AIInsightViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AIInsightSerializer

    def get_queryset(self):
        return AIInsight.objects.filter(
            organization_id=self.kwargs.get("org_pk")
        )


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_queryset(self):
        return Task.objects.filter(
            organization_id=self.kwargs.get("org_pk")
        )


class SiteViewSet(viewsets.ModelViewSet):
    serializer_class = SiteSerializer

    def get_queryset(self):
        return Site.objects.filter(
            organization_id=self.kwargs.get("org_pk")
        )


class AssessmentReportViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentReportSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return AssessmentReport.objects.all()


class FindingViewSet(viewsets.ModelViewSet):
    serializer_class = FindingSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Finding.objects.all()


class CIPCycleViewSet(viewsets.ModelViewSet):
    serializer_class = CIPCycleSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return CIPCycle.objects.all()


class AssessmentPlanViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentPlanSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return AssessmentPlan.objects.all()
