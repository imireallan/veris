from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response


class ResponseValidationMixin:
    @action(detail=True, methods=["post"])
    def validate(self, request, pk=None):
        from assessments.services.validation import validate_response

        response_obj = self.get_object()

        if not response_obj.answer_text:
            return Response(
                {"error": "No answer text to validate"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = validate_response(
            response_text=response_obj.answer_text,
            organization_id=str(response_obj.assessment.organization_id),
            existing_evidence_ids=response_obj.evidence_files,
        )

        response_obj.validation_status = result.validation_status
        response_obj.confidence_score = result.confidence_score
        response_obj.citations = result.citations
        response_obj.ai_feedback = result.feedback
        response_obj.ai_validated = True
        response_obj.save()

        return Response(
            {
                "validation_status": result.validation_status,
                "confidence_score": result.confidence_score,
                "citations": result.citations,
                "feedback": result.feedback,
                "matching_chunks": len(result.similar_chunks),
            }
        )


class ReportExportMixin:
    @action(detail=True, methods=["get"], url_path="export/pdf")
    def export_pdf(self, request, pk=None):
        report = self.get_object()

        if not request.user.is_superuser:
            organization = getattr(request, "organization", None)
            membership = getattr(request, "membership", None)

            if not organization or not membership:
                return Response(
                    {"error": "Organization context required"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if str(report.organization_id) != str(organization.id):
                return Response(
                    {"error": "Access denied"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if not membership.has_permission("report:export"):
                return Response(
                    {"error": "Access denied"},
                    status=status.HTTP_403_FORBIDDEN,
                )

        try:
            from reports.services import ReportGenerationError, ReportGenerator

            generator = ReportGenerator(report)
            pdf_bytes = generator.generate_pdf()

            response = HttpResponse(pdf_bytes, content_type="application/pdf")
            response["Content-Disposition"] = (
                f'attachment; filename="{generator.generate_filename()}"'
            )
            return response

        except ReportGenerationError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
