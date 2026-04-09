"""
Flat API routes for assessment resources — used by assessment detail page.
These are org-scoped via permission checks and query params, not URL kwargs.
"""
from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from assessments.models import (
    Assessment,
    AssessmentResponse,
    AssessmentQuestion,
    AssessmentReport,
    Finding,
    CIPCycle,
    AssessmentPlan,
    Site,
    Task,
)
from assessments.serializers import (
    AssessmentSerializer,
    AssessmentResponseSerializer,
    AssessmentQuestionSerializer,
    AssessmentReportSerializer,
    FindingSerializer,
    CIPCycleSerializer,
    AssessmentPlanSerializer,
    SiteSerializer,
    TaskSerializer,
)
from users.permissions import IsAssessmentOwner, IsOrganizationMember


class FlatAssessmentViewSet(viewsets.ModelViewSet):
    """Flat assessment routes — /api/assessments/ (org-scoped via query param)."""
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org_id = self.request.query_params.get("organization")
        if org_id:
            return Assessment.objects.filter(organization_id=org_id)
        # No org specified — return all (admin/global view)
        return Assessment.objects.all()

    def perform_create(self, serializer):
        org_id = self.request.query_params.get("organization")
        serializer.save(organization_id=org_id, created_by=self.request.user)


class FlatFindingViewSet(viewsets.ModelViewSet):
    """Flat finding routes — /api/findings/ (filtered by assessment query param)."""
    serializer_class = FindingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Finding.objects.select_related("assessment", "site", "provision")
        assessment_id = self.request.query_params.get("assessment")
        if assessment_id:
            qs = qs.filter(assessment_id=assessment_id).filter(
                assessment__organization=self.request.user.organization
            )
        return qs


class FlatCIPCycleViewSet(viewsets.ModelViewSet):
    """Flat CIP cycle routes — /api/cip-cycles/ (filtered by assessment query param)."""
    serializer_class = CIPCycleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = CIPCycle.objects.select_related("assessment")
        assessment_id = self.request.query_params.get("assessment")
        if assessment_id:
            qs = qs.filter(assessment_id=assessment_id).filter(
                assessment__organization=self.request.user.organization
            )
        return qs


class FlatAssessmentPlanViewSet(viewsets.ModelViewSet):
    """Flat assessment plan routes — /api/plans/ (filtered by assessment query param)."""
    serializer_class = AssessmentPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AssessmentPlan.objects.select_related("assessment")
        assessment_id = self.request.query_params.get("assessment")
        if assessment_id:
            qs = qs.filter(assessment_id=assessment_id).filter(
                assessment__organization=self.request.user.organization
            )
        return qs


class FlatTaskViewSet(viewsets.ModelViewSet):
    """Flat task routes — /api/tasks/ (filtered by assessment query param)."""
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Task.objects.select_related("assessment", "organization")
        assessment_id = self.request.query_params.get("assessment")
        if assessment_id:
            qs = qs.filter(assessment_id=assessment_id).filter(
                assessment__organization=self.request.user.organization
            )
        return qs


class FlatAssessmentReportViewSet(viewsets.ModelViewSet):
    """Flat report routes — /api/reports/ (filtered by assessment query param)."""
    serializer_class = AssessmentReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AssessmentReport.objects.select_related("assessment", "organization")
        assessment_id = self.request.query_params.get("assessment")
        if assessment_id:
            qs = qs.filter(assessment_id=assessment_id).filter(
                assessment__organization=self.request.user.organization
            )
        return qs


class FlatAssessmentResponseViewSet(viewsets.ModelViewSet):
    """Flat response routes — /api/responses/ (filtered by assessment query param)."""
    serializer_class = AssessmentResponseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        assessment_id = self.request.query_params.get("assessment")
        if assessment_id:
            return AssessmentResponse.objects.filter(
                assessment_id=assessment_id
            ).filter(
                assessment__organization=self.request.user.organization
            )
        return AssessmentResponse.objects.none()


class FlatAssessmentQuestionViewSet(viewsets.ReadOnlyModelViewSet):
    """Flat question routes — /api/questions/ (filtered by template query param)."""
    serializer_class = AssessmentQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        template_id = self.request.query_params.get("template")
        organization_id = self.request.query_params.get("organization")
        queryset = AssessmentQuestion.objects.select_related("assessment_template")
        if template_id:
            queryset = queryset.filter(assessment_template_id=template_id)
        if organization_id:
            queryset = queryset.filter(
                assessment_template__organization_id=organization_id
            )
        return queryset


class FlatSiteViewSet(viewsets.ModelViewSet):
    """Flat site routes — /api/sites/ (filtered by org query param)."""
    serializer_class = SiteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org_id = self.request.query_params.get("organization")
        qs = Site.objects.all()
        if org_id:
            qs = qs.filter(organization_id=org_id)
        return qs
