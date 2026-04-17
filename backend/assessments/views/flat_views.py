"""
Flat API routes for assessment resources — used by assessment detail page.
These are org-scoped via permission checks and query params, not URL kwargs.
"""

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from assessments.models import (
    Assessment,
    AssessmentPlan,
    AssessmentQuestion,
    AssessmentReport,
    AssessmentResponse,
    CIPCycle,
    Finding,
    Site,
    Task,
)
from assessments.serializers import (
    AssessmentPlanSerializer,
    AssessmentQuestionSerializer,
    AssessmentReportSerializer,
    AssessmentResponseSerializer,
    AssessmentSerializer,
    CIPCycleSerializer,
    FindingSerializer,
    SiteSerializer,
    TaskSerializer,
)
from assessments.services.access import AssessmentAccessService
from assessments.views.base import BaseAssessmentScopedViewSet
from assessments.views.mixins import ReportExportMixin, ResponseValidationMixin
from organizations.models import Organization, OrganizationMembership
from users.roles import UserRole


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

        # Support single or comma‑separated list of org IDs
        org_param = self.request.query_params.get(
            "org"
        ) or self.request.query_params.get("organization")
        if org_param:
            org_ids = [oid.strip() for oid in org_param.split(",") if oid.strip()]
            if len(org_ids) == 1:
                qs = qs.filter(organization_id=org_ids[0])
            else:
                # For superadmins we allow filtering across multiple orgs
                qs = qs.filter(organization_id__in=org_ids)

        return qs

    @action(detail=False, methods=["GET"])
    def aggregate(self, request):
        """
        Return assessments from *all* organizations the user belongs to.
        Optional query param: ?org_ids=uuid1,uuid2
        """
        user = request.user
        requested_org_ids = request.query_params.get("org_ids")

        # For superusers, return all assessments by default.
        if user.is_superuser:
            qs = Assessment.objects.all()
            if requested_org_ids:
                org_ids = [
                    oid.strip() for oid in requested_org_ids.split(",") if oid.strip()
                ]
                qs = qs.filter(organization_id__in=org_ids)
        else:
            # Regular users are always restricted to assessments in organizations
            # they already belong to. Query params may further narrow that set, but
            # can never expand it.
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

        # 1. Determine the organization object
        # If it's already in validated_data, the serializer keeps it.
        # We only need to provide it if it's missing.
        org = serializer.validated_data.get("organization")

        if not org:
            # Check query params for an override
            org_id = self.request.query_params.get(
                "org"
            ) or self.request.query_params.get("organization")

            if org_id:
                # You can assign the ID directly to organization_id
                # OR fetch the object to be safe:
                org = Organization.objects.filter(id=org_id).first()
            else:
                # Default to membership
                membership = OrganizationMembership.objects.filter(user=user).first()
                if membership:
                    org = membership.organization

        # 2. Save with the organization object (or ID)
        # The serializer's create() method expects an object for the 'organization' field
        serializer.save(organization=org, created_by=user)


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


class FlatAssessmentReportViewSet(ReportExportMixin, BaseAssessmentScopedViewSet):
    """Flat report routes — /api/reports/ (filtered by assessment query param)."""

    serializer_class = AssessmentReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AssessmentReport.objects.select_related("assessment", "organization")
        return self.filter_by_assessment(qs)


class FlatAssessmentResponseViewSet(
    ResponseValidationMixin, BaseAssessmentScopedViewSet
):
    """Flat response routes — /api/responses/ (filtered by assessment query param)."""

    serializer_class = AssessmentResponseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AssessmentResponse.objects.all()
        return self.filter_by_assessment(qs)


class FlatAssessmentQuestionViewSet(viewsets.ReadOnlyModelViewSet):
    """Flat question routes — /api/questions/ (filtered by template query param)."""

    serializer_class = AssessmentQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        template_id = self.request.query_params.get("template")
        organization_id = self.request.query_params.get(
            "org"
        ) or self.request.query_params.get("organization")
        queryset = AssessmentQuestion.objects.select_related("assessment_template")
        if template_id:
            queryset = queryset.filter(assessment_template_id=template_id)
        if organization_id:
            queryset = queryset.filter(
                assessment_template__organization_id=organization_id
            )
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
        org_id = self.request.query_params.get("org") or self.request.query_params.get(
            "organization"
        )

        if org_id:
            if (
                OrganizationMembership.objects.filter(
                    user=user, organization_id=org_id
                ).exists()
                or user.is_superuser
            ):
                return Site.objects.filter(organization_id=org_id)
            return Site.objects.none()

        # Platform-level admins: can see all orgs
        if user.is_superuser or getattr(user, "role", None) == UserRole.SUPERADMIN:
            return Site.objects.all()

        # All other users: scoped to their memberships
        memberships = OrganizationMembership.objects.filter(user=user).values_list(
            "organization_id", flat=True
        )
        if memberships:
            return Site.objects.filter(organization_id__in=memberships)

        return Site.objects.none()
