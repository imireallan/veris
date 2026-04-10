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
    """Flat assessment routes — /api/assessments/ (org-scoped by default).

    - Regular users: always scoped to their own organization.
    - SUPERADMIN / Django superuser: can see all orgs (platform admin).
    - Any user requesting ?organization=<id>: scoped to that org.
    """
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        org_id = self.request.query_params.get("organization")

        # Explicit org filter requested — scope to that org
        if org_id:
            # Ensure user has membership in the requested org
            from organizations.models import OrganizationMembership
            if not OrganizationMembership.objects.filter(user=user, organization_id=org_id).exists():
                if not (user.is_superuser or getattr(user, "role", None) == "SUPERADMIN"):
                    return Assessment.objects.none()
            return Assessment.objects.filter(organization_id=org_id)

        # Platform-level admins: can see all orgs when no filter specified
        if user.is_superuser or getattr(user, "role", None) == "SUPERADMIN":
            return Assessment.objects.all()

        # All other users: scoped to their memberships
        from organizations.models import OrganizationMembership
        memberships = OrganizationMembership.objects.filter(user=user).values_list("organization_id", flat=True)
        if memberships:
            return Assessment.objects.filter(organization_id__in=memberships)

        return Assessment.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        org_id = self.request.query_params.get("organization")
        if not org_id:
            # Non-platform-admins default to their first membership
            from organizations.models import OrganizationMembership
            if not (user.is_superuser or getattr(user, "role", None) == "SUPERADMIN"):
                membership = OrganizationMembership.objects.filter(user=user).first()
                org_id = membership.organization_id if membership else None
        serializer.save(organization_id=org_id, created_by=user)


class FlatFindingViewSet(viewsets.ModelViewSet):
    """Flat finding routes — /api/findings/ (filtered by assessment query param)."""
    serializer_class = FindingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Finding.objects.select_related("assessment", "site", "provision")
        assessment_id = self.request.query_params.get("assessment")
        if assessment_id:
            # Scope to assessment and ensure user has membership in the assessment's organization
            from organizations.models import OrganizationMembership
            assessment = Assessment.objects.filter(id=assessment_id).first()
            if assessment:
                if OrganizationMembership.objects.filter(user=self.request.user, organization_id=assessment.organization_id).exists() or self.request.user.is_superuser:
                    return qs.filter(assessment_id=assessment_id)
            return qs.none()
        return qs


class FlatCIPCycleViewSet(viewsets.ModelViewSet):
    """Flat CIP cycle routes — /api/cip-cycles/ (filtered by assessment query param)."""
    serializer_class = CIPCycleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = CIPCycle.objects.select_related("assessment")
        assessment_id = self.request.query_params.get("assessment")
        if assessment_id:
            from organizations.models import OrganizationMembership
            assessment = Assessment.objects.filter(id=assessment_id).first()
            if assessment:
                if OrganizationMembership.objects.filter(user=self.request.user, organization_id=assessment.organization_id).exists() or self.request.user.is_superuser:
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
            from organizations.models import OrganizationMembership
            assessment = Assessment.objects.filter(id=assessment_id).first()
            if assessment:
                if OrganizationMembership.objects.filter(user=self.request.user, organization_id=assessment.organization_id).exists() or self.request.user.is_superuser:
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
            from organizations.models import OrganizationMembership
            assessment = Assessment.objects.filter(id=assessment_id).first()
            if assessment:
                if OrganizationMembership.objects.filter(user=self.request.user, organization_id=assessment.organization_id).exists() or self.request.user.is_superuser:
                    return qs.filter(assessment_id=assessment_id)
            return qs.none()
        return qs


class FlatAssessmentReportViewSet(viewsets.ModelViewSet):
    """Flat report routes — /api/reports/ (filtered by assessment query param)."""
    serializer_class = AssessmentReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AssessmentReport.objects.select_related("assessment", "organization")
        assessment_id = self.request.query_params.get("assessment")
        if assessment_id:
            from organizations.models import OrganizationMembership
            assessment = Assessment.objects.filter(id=assessment_id).first()
            if assessment:
                if OrganizationMembership.objects.filter(user=self.request.user, organization_id=assessment.organization_id).exists() or self.request.user.is_superuser:
                    return qs.filter(assessment_id=assessment_id)
            return qs.none()
        return qs


class FlatAssessmentResponseViewSet(viewsets.ModelViewSet):
    """Flat response routes — /api/responses/ (filtered by assessment query param)."""
    serializer_class = AssessmentResponseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        assessment_id = self.request.query_params.get(\"assessment\")
        if assessment_id:
            from organizations.models import OrganizationMembership
            assessment = Assessment.objects.filter(id=assessment_id).first()
            if assessment:
                if OrganizationMembership.objects.filter(user=self.request.user, organization_id=assessment.organization_id).exists() or self.request.user.is_superuser:
                    return AssessmentResponse.objects.filter(assessment_id=assessment_id)
            return AssessmentResponse.objects.none()
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
    """Flat site routes — /api/sites/ (org-scoped by default)."""
    serializer_class = SiteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        org_id = self.request.query_params.get(\"organization\")

        if org_id:
            from organizations.models import OrganizationMembership
            if OrganizationMembership.objects.filter(user=user, organization_id=org_id).exists() or user.is_superuser:
                return Site.objects.filter(organization_id=org_id)
            return Site.objects.none()

        # Platform-level admins: can see all orgs
        if user.is_superuser or getattr(user, \"role\", None) == \"SUPERADMIN\":
            return Site.objects.all()

        # All other users: scoped to their memberships
        from organizations.models import OrganizationMembership
        memberships = OrganizationMembership.objects.filter(user=user).values_list(\"organization_id\", flat=True)
        if memberships:
            return Site.objects.filter(organization_id__in=memberships)

        return Site.objects.none()
