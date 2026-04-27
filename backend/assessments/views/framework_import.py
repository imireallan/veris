"""
ViewSet for framework import functionality.
Handles file upload, preview, and async import job processing.
"""

import uuid
from pathlib import Path

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from assessments.models import FrameworkImportJob
from assessments.serializers import (
    FrameworkImportJobSerializer,
    FrameworkImportPreviewSerializer,
)
from assessments.services.framework_import import FrameworkImportService
from users.permissions import IsOrganizationMember


class FrameworkImportViewSet(viewsets.ViewSet):
    """
    ViewSet for framework import operations.

    Flow:
    1. POST /api/frameworks/import/preview/    — Upload file, get preview
    2. POST /api/frameworks/import/             — Submit import job
    3. GET  /api/frameworks/import/<job_id>/status/ — Poll job status
    """

    permission_classes = [IsAuthenticated, IsOrganizationMember]

    @action(
        detail=False,
        methods=["post"],
        url_path="preview",
        parser_classes=[MultiPartParser],
    )
    def preview(self, request):
        """
        Step 1: Upload file and get preview of framework structure.

        Request:
            - file: Excel/CSV file
            - organization: org UUID (from context)

        Response:
            - framework_name: detected/inferred name
            - total_principles: count
            - total_categories: count
            - total_provisions: count
            - is_valid: boolean
            - validation_errors: list
            - temp_file_path: str (server path, for submit step)
        """
        org = getattr(request, "organization", None)
        if not org:
            # Debug: log what we received
            return Response(
                {
                    "error": "Organization context required",
                    "debug": {
                        "user": str(getattr(request, "user", None)),
                        "user_is_authenticated": getattr(
                            request.user, "is_authenticated", "N/A"
                        ),
                        "meta_org": request.META.get("HTTP_X_ORGANIZATION_ID"),
                        "request_organization": str(
                            getattr(request, "organization", "NOTSET")
                        ),
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get uploaded file
        file: UploadedFile = request.FILES.get("file")
        if not file:
            # Don't access request.body here - it may have been consumed by middleware
            return Response(
                {
                    "error": "No file provided",
                    "debug": {
                        "request_method": request.method,
                        "request_content_type": request.content_type,
                        "request_files": list(request.FILES.keys()),
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file size (max 10MB)
        if file.size > 10 * 1024 * 1024:
            return Response(
                {"error": "File size exceeds 10MB limit"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file extension
        ext = Path(file.name).suffix.lower()
        if ext not in [".xlsx", ".xls", ".csv"]:
            return Response(
                {"error": f"Unsupported file format: {ext}. Use .xlsx, .xls, or .csv"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        temp_path = None
        try:
            # Save file temporarily
            temp_path = (
                settings.MEDIA_ROOT / "framework_imports" / f"{uuid.uuid4()}{ext}"
            )
            temp_path.parent.mkdir(parents=True, exist_ok=True)

            with open(temp_path, "wb+") as f:
                for chunk in file.chunks():
                    f.write(chunk)

            # Parse file - pass original filename for human-readable framework name
            service = FrameworkImportService(
                str(temp_path), original_filename=file.name
            )
            metadata, provisions = service.parse_file()

            # Build preview response — include temp_file_path so the
            # frontend can pass it back in the submit step
            preview_data = {
                "framework_name": metadata["framework_name"],
                "framework_version": "1.0.0",
                "framework_description": f"Imported from {file.name}",
                "create_template": True,
                "detected_structure": {
                    "principles": metadata.get("total_principles", 0),
                    "categories": metadata.get("total_categories", 0),
                    "provisions": metadata.get("total_provisions", 0),
                },
                "total_principles": metadata.get("total_principles", 0),
                "total_categories": metadata.get("total_categories", 0),
                "total_provisions": metadata.get("total_provisions", 0),
                "is_valid": True,
                "validation_errors": [],
                "temp_file_path": str(temp_path),
            }

            serializer = FrameworkImportPreviewSerializer(preview_data)

            # Also store in session as fallback
            request.session["framework_import_temp_path"] = str(temp_path)
            request.session["framework_import_metadata"] = metadata

            return Response(serializer.data)

        except Exception as e:
            # Clean up temp file on failure
            if temp_path and temp_path.exists():
                temp_path.unlink(missing_ok=True)
            return Response(
                {"error": f"Failed to parse file: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(
        detail=False, methods=["post"], url_path="create", parser_classes=[JSONParser]
    )
    def create_import_job(self, request):
        """
        Step 2: Create import job from a previously-uploaded file.

        Request (JSON):
            - framework_name: string
            - framework_version: string (optional, default "1.0.0")
            - framework_description: string (optional)
            - create_template: boolean (default True)
            - temp_file_path: string (from preview response)

        Response:
            - Full FrameworkImportJob data
        """
        org = getattr(request, "organization", None)
        if not org:
            # Debug: log what we received
            return Response(
                {
                    "error": "Organization context required",
                    "debug": {
                        "user": str(getattr(request, "user", None)),
                        "user_is_authenticated": getattr(
                            request.user, "is_authenticated", "N/A"
                        ),
                        "meta_org": request.META.get("HTTP_X_ORGANIZATION_ID"),
                        "request_organization": str(
                            getattr(request, "organization", "NOTSET")
                        ),
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        # request.organization is an Organization instance, extract the UUID
        org_id = org.id

        # Get file path from request body or session
        temp_path = request.data.get("temp_file_path") or request.session.get(
            "framework_import_temp_path"
        )
        if not temp_path or not Path(temp_path).exists():
            return Response(
                {"error": "No file found. Please upload file in preview step first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Extract metadata
        framework_name = request.data.get("framework_name")
        framework_version = request.data.get("framework_version", "1.0.0")
        framework_description = request.data.get("framework_description", "")
        create_template = request.data.get("create_template", True)

        # Create import job
        job = FrameworkImportJob.objects.create(
            created_by=request.user,
            organization_id=org_id,
            original_filename=Path(temp_path).name,
            file_path=temp_path,
            framework_name=framework_name,
            framework_version=framework_version,
            framework_description=framework_description,
            create_template=create_template,
            status=FrameworkImportJob.Status.PENDING,
        )

        # TODO: Trigger async task here (Celery/Dramatiq)
        # For now, process synchronously for MVP
        try:
            self._process_import_job(job, org_id)
        except Exception as e:
            job.mark_failed(str(e))
            return Response(
                {"error": f"Import failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = FrameworkImportJobSerializer(job)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="status")
    def job_status(self, request, pk=None):
        """
        Step 3: Poll job status.

        GET /api/frameworks/import/<job_id>/status/

        Response:
            - Full FrameworkImportJob data
        """
        try:
            job = FrameworkImportJob.objects.get(id=pk)
        except FrameworkImportJob.DoesNotExist:
            return Response(
                {"error": "Job not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check permission (user must be creator or org member)
        if job.created_by != request.user:
            org = getattr(request, "organization", None)
            org_id = org.id if org else None
            if not org_id or job.organization_id != org_id:
                return Response(
                    {"error": "Permission denied"},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = FrameworkImportJobSerializer(job)
        return Response(serializer.data)

    def _process_import_job(self, job: FrameworkImportJob, org_id: uuid.UUID):
        """
        Process the import job synchronously.
        In production, this should be a Celery/Dramatiq task.
        """
        from django.utils import timezone

        from assessments.services.framework_import import FrameworkImportService

        job.status = FrameworkImportJob.Status.PROCESSING
        job.started_at = timezone.now()
        job.save(update_fields=["status", "started_at"])

        try:
            # Parse file - pass original filename for human-readable framework name
            job.update_progress(0, 100, "Parsing file...")
            service = FrameworkImportService(
                job.file_path, original_filename=job.original_filename
            )
            metadata, provisions = service.parse_file()

            # Create framework + template + questions
            job.update_progress(30, 100, "Creating framework...")
            framework, template, questions_count = service.create_framework(
                name=job.framework_name,
                version=job.framework_version,
                description=job.framework_description,
                provisions=provisions,
                create_template=job.create_template,
                organization_id=org_id,
            )

            # Mark completed
            job.mark_completed(
                framework_id=framework.id,
                template_id=template.id if template else None,
                questions_created=questions_count,
            )

        except Exception as e:
            job.mark_failed(str(e))
            raise
