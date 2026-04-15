"""
Flat API routes for assessment resources — used by assessment detail page.
These are org-scoped via permission checks and query params, not URL kwargs.
"""

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse

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
from organizations.models import OrganizationMembership


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
        org_id = self.request.query_params.get("org") or self.request.query_params.get(
            "organization"
        )
        # Strip trailing slashes from org_id if present
        if org_id:
            org_id = org_id.rstrip("/")

        # Explicit org filter requested — scope to that org
        if org_id:
            if not OrganizationMembership.objects.filter(
                user=user, organization_id=org_id
            ).exists():
                if not (
                    user.is_superuser or getattr(user, "role", None) == "SUPERADMIN"
                ):
                    return Assessment.objects.none()
            return Assessment.objects.filter(organization_id=org_id)

        # Platform-level admins: can see all orgs when no filter specified
        if user.is_superuser or getattr(user, "role", None) == "SUPERADMIN":
            return Assessment.objects.all()

        # All other users: scoped to their memberships
        memberships = OrganizationMembership.objects.filter(user=user).values_list(
            "organization_id", flat=True
        )
        if memberships:
            return Assessment.objects.filter(organization_id__in=memberships)

        return Assessment.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        org_id = self.request.query_params.get("org") or self.request.query_params.get(
            "organization"
        )
        if not org_id:
            # Non-platform-admins default to their first membership
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


class FlatAssessmentReportViewSet(viewsets.ModelViewSet):
    """Flat report routes — /api/reports/ (filtered by assessment query param)."""

    serializer_class = AssessmentReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = AssessmentReport.objects.select_related("assessment", "organization")
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

    @action(detail=True, methods=["get"], url_path="export/pdf")
    def export_pdf(self, request, pk=None):
        """
        Generate and download PDF report for an assessment.
        
        GET /api/reports/<id>/export/pdf/
        
        Returns:
            PDF file download
        """
        from reports.services import ReportGenerator, ReportGenerationError
        
        report = self.get_object()
        
        # Check permissions - user must have access to the organization
        org_id = str(report.organization_id)
        if not request.user.is_superuser:
            has_access = OrganizationMembership.objects.filter(
                user=request.user, organization_id=org_id
            ).exists()
            if not has_access:
                return Response(
                    {"error": "Access denied"},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        try:
            generator = ReportGenerator(report)
            pdf_bytes = generator.generate_pdf()
            filename = generator.generate_filename()
            
            # Use HttpResponse for binary content, not DRF Response
            response = HttpResponse(pdf_bytes, content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            return response
            
        except ReportGenerationError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FlatAssessmentResponseViewSet(viewsets.ModelViewSet):
    """Flat response routes — /api/responses/ (filtered by assessment query param)."""

    serializer_class = AssessmentResponseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
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
                    return AssessmentResponse.objects.filter(
                        assessment_id=assessment_id
                    )
            return AssessmentResponse.objects.none()
        return AssessmentResponse.objects.none()

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
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
        if user.is_superuser or getattr(user, "role", None) == "SUPERADMIN":
            return Site.objects.all()

        # All other users: scoped to their memberships
        memberships = OrganizationMembership.objects.filter(user=user).values_list(
            "organization_id", flat=True
        )
        if memberships:
            return Site.objects.filter(organization_id__in=memberships)

        return Site.objects.none()
