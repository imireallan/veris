from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse

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
from organizations.models import OrganizationMembership
from users.permissions import (
    CanManageAssessments,
    CanManageFindings,
    CanManageSites,
    CanManageTasks,
    CanManageTemplates,
    IsAssessmentOwner,
    IsOrganizationMember,
)


class FrameworkViewSet(viewsets.ReadOnlyModelViewSet):
    """Global framework reference data - not org-scoped."""

    queryset = Framework.objects.all()
    serializer_class = FrameworkSerializer
    permission_classes = [IsAuthenticated]


class ESGFocusAreaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ESGFocusAreaSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        return ESGFocusArea.objects.filter(organization_id=self.kwargs.get("org_pk"))


class ExternalRatingViewSet(viewsets.ModelViewSet):
    serializer_class = ExternalRatingSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        return ExternalRating.objects.filter(organization_id=self.kwargs.get("org_pk"))

    def perform_create(self, serializer):
        org_id = self.kwargs.get("org_pk")
        serializer.save(organization_id=org_id)


class AssessmentViewSet(viewsets.ModelViewSet):
    """Full CRUD for assessments."""

    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated, CanManageAssessments]

    def get_queryset(self):
        user = self.request.user

        # Superusers can see all assessments
        if user.is_superuser:
            qs = Assessment.objects.all()
        else:
            # Get all organizations the user belongs to
            memberships = OrganizationMembership.objects.filter(user=user).values_list(
                "organization_id", flat=True
            )

            if not memberships:
                return Assessment.objects.none()

            # Filter assessments by user's organizations
            qs = Assessment.objects.filter(organization_id__in=memberships)

        # Additional org filter from URL if provided
        org_id = (
            self.kwargs.get("org_pk")
            or self.request.query_params.get("org")
            or self.request.query_params.get("organization")
        )
        if org_id:
            qs = qs.filter(organization_id=org_id)

        return qs.select_related(
            "site", "focus_area", "framework", "created_by", "assigned_to"
        )

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(created_by=user)


class AssessmentDetailViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only detail endpoint that bundles assessment + report + findings + plan + cip cycles.
    No org_pk needed — looks up by assessment pk directly, but validates org membership.
    """

    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated, IsAssessmentOwner]

    def get_queryset(self):
        user = self.request.user

        # Superusers can see all assessments
        if user.is_superuser:
            return Assessment.objects.select_related(
                "site", "focus_area", "framework", "created_by", "assigned_to"
            )

        # Get all organizations the user belongs to
        memberships = OrganizationMembership.objects.filter(user=user).values_list(
            "organization_id", flat=True
        )

        if not memberships:
            return Assessment.objects.none()

        # Filter assessments by user's organizations
        return Assessment.objects.filter(
            organization_id__in=memberships
        ).select_related("site", "focus_area", "framework", "created_by", "assigned_to")

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
            return AssessmentQuestion.objects.filter(template__organization_id=org_pk)
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
        return AIInsight.objects.filter(organization_id=self.kwargs.get("org_pk"))


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, CanManageTasks]

    def get_queryset(self):
        return Task.objects.filter(organization_id=self.kwargs.get("org_pk"))


class SiteViewSet(viewsets.ModelViewSet):
    serializer_class = SiteSerializer
    permission_classes = [IsAuthenticated, CanManageSites]

    def get_queryset(self):
        org_id = (
            self.kwargs.get("org_pk")
            or self.request.query_params.get("org")
            or self.request.query_params.get("organization")
        )
        qs = Site.objects.all()
        if org_id:
            qs = qs.filter(organization_id=org_id)
        return qs


class AssessmentReportViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentReportSerializer
    permission_classes = [IsAuthenticated, CanManageTemplates]

    def get_queryset(self):
        org_pk = self.kwargs.get("org_pk") or self.request.query_params.get(
            "organization"
        )
        qs = AssessmentReport.objects.select_related("assessment", "organization")
        if org_pk:
            qs = qs.filter(organization_id=org_pk)
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
        from django.http import HttpResponse
        
        report = self.get_object()
        
        # Check permissions - user must have access to the organization
        org_id = str(report.organization_id)
        if not request.user.is_superuser:
            from organizations.models import OrganizationMembership
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
        except Exception as e:
            return Response(
                {"error": f"Report generation failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FindingViewSet(viewsets.ModelViewSet):
    serializer_class = FindingSerializer
    permission_classes = [IsAuthenticated, CanManageFindings]

    def get_queryset(self):
        org_pk = self.kwargs.get("org_pk") or self.request.query_params.get(
            "organization"
        )
        qs = Finding.objects.select_related("assessment", "site", "provision")
        if org_pk:
            qs = qs.filter(assessment__organization_id=org_pk)
        return qs


class CIPCycleViewSet(viewsets.ModelViewSet):
    serializer_class = CIPCycleSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        org_pk = self.kwargs.get("org_pk") or self.request.query_params.get(
            "organization"
        )
        qs = CIPCycle.objects.select_related("assessment")
        if org_pk:
            qs = qs.filter(assessment__organization_id=org_pk)
        return qs


class AssessmentPlanViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentPlanSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        org_pk = self.kwargs.get("org_pk") or self.request.query_params.get(
            "organization"
        )
        qs = AssessmentPlan.objects.select_related("assessment")
        if org_pk:
            qs = qs.filter(assessment__organization_id=org_pk)
        return qs
