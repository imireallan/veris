from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response


class ResponseValidationMixin:
    @action(detail=True, methods=["post"])
    def validate(self, request, pk=None, **kwargs):
        from assessments.models import EvidenceCheckRun
        from assessments.services.validation import validate_response

        response_obj = self.get_object()

        if not response_obj.answer_text:
            return Response(
                {"error": "Save an answer before running an evidence check."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = validate_response(
                response_text=response_obj.answer_text,
                organization_id=str(response_obj.assessment.organization_id),
                assessment_id=str(response_obj.assessment_id),
                existing_evidence_ids=response_obj.evidence_files,
            )
        except Exception as exc:
            return Response(
                {"error": f"Evidence check failed: {exc}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        result_json = getattr(result, "result_json", {}) or {
            "status": result.validation_status,
            "confidence": result.confidence_score,
            "summary": result.feedback,
            "citations": result.citations,
            "gaps": [],
            "supported_claims": [],
            "recommended_action": "Review the evidence check result.",
        }
        evidence_snapshot = getattr(result, "evidence_snapshot", {}) or {
            "files": response_obj.evidence_files,
        }

        EvidenceCheckRun._default_manager.create(
            response=response_obj,
            assessment=response_obj.assessment,
            organization=response_obj.organization
            or response_obj.assessment.organization,
            site=response_obj.assessment.site,
            framework=response_obj.assessment.framework,
            triggered_by=request.user if request.user.is_authenticated else None,
            status=result.validation_status,
            confidence_score=result.confidence_score,
            result_json=result_json,
            model_provider=getattr(result, "model_provider", ""),
            model_name=getattr(result, "model_name", ""),
            prompt_version=getattr(result, "prompt_version", ""),
            retrieved_evidence_snapshot=evidence_snapshot,
        )

        response_obj.validation_status = result.validation_status
        response_obj.confidence_score = result.confidence_score
        response_obj.citations = result.citations
        response_obj.ai_feedback = result.feedback
        response_obj.ai_validated = result.validation_status in {
            "supported",
            "partially_supported",
            "unsupported",
            "contradictory",
            "needs_evidence",
            "evidence_processing",
            "validated",
            "flagged",
            "insufficient_evidence",
        }
        response_obj.save(
            update_fields=[
                "validation_status",
                "confidence_score",
                "citations",
                "ai_feedback",
                "ai_validated",
                "updated_at",
            ]
        )

        return Response(
            {
                "validation_status": result.validation_status,
                "confidence_score": result.confidence_score,
                "citations": result.citations,
                "feedback": result.feedback,
                "result": result_json,
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
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
