"""
File upload endpoint for evidence documents.
Supports any file type — not just images.

Uses configured storage backend:
- Local (development): ./media/ directory
- S3 (production): AWS S3 bucket
"""

import os
import uuid

from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from knowledge.services import process_document

ALLOWED_EXTENSIONS = {
    # Documents
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".rtf",
    ".odt",
    # Images
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".tiff",
    ".svg",
    # Data files
    ".csv",
    ".json",
    ".xml",
}

MAX_SIZE = 25 * 1024 * 1024  # 25MB


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_evidence_document(request):
    """
    Upload evidence document to configured storage (local or S3).

    Returns:
        - url: Full URL to access the file
        - file_name: Original filename
        - file_size: Size in bytes
        - content_type: MIME type
    """
    uploaded_file = request.FILES.get("file")
    if not uploaded_file:
        return Response(
            {"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Size validation
    if uploaded_file.size > MAX_SIZE:
        return Response(
            {
                "error": f"File too large. Maximum size is {MAX_SIZE // (1024 * 1024)}MB."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Extension validation
    _, ext = os.path.splitext(uploaded_file.name)
    if ext.lower() not in ALLOWED_EXTENSIONS:
        return Response(
            {
                "error": f"File type '{ext}' not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Resolve tenant context for traceable evidence storage.
    organization = getattr(request, "organization", None)
    org_id = (
        str(organization.id)
        if organization
        else request.META.get("HTTP_X_ORGANIZATION_ID")
        or request.data.get("organization_id")
    )
    assessment_id = request.data.get("assessment_id")
    response_id = request.data.get("response_id")
    question_id = request.data.get("question_id")
    evidence_path_segment = response_id or question_id or "pending"

    if not org_id:
        return Response(
            {"error": "Organization context is required for evidence upload"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if assessment_id:
        from assessments.models import Assessment

        if not Assessment.objects.filter(
            id=assessment_id, organization_id=org_id
        ).exists():
            return Response(
                {"error": "Assessment does not belong to the selected organization"},
                status=status.HTTP_403_FORBIDDEN,
            )

    # Generate unique filename under tenant/assessment scoped path
    safe_name = os.path.basename(uploaded_file.name)
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    upload_path = f"evidence/{org_id}/{assessment_id or 'unassigned'}/{evidence_path_segment}/{unique_name}"

    # Save file using configured storage (local or S3)
    file_path = default_storage.save(upload_path, uploaded_file)
    file_url = default_storage.url(file_path)

    knowledge_document_id = None
    processing_status = "queued"
    processing_error = None
    try:
        from knowledge.models import KnowledgeDocument

        document = KnowledgeDocument._default_manager.create(
            organization_id=org_id,
            title=uploaded_file.name,
            description="Questionnaire response evidence awaiting processing/indexing.",
            file_url=file_url,
            file_type=ext.lstrip(".").upper() or "FILE",
            file_size=uploaded_file.size,
            category="assessment_evidence",
            embeddings_indexed=False,
            framework_tags=[],
            created_by=request.user,
        )
        knowledge_document_id = str(document.id)
        processing_result = process_document(
            file_path=_resolve_processing_path(file_path, file_url),
            file_type=document.file_type,
            document_id=str(document.id),
            organization_id=str(org_id),
            index_name=settings.PINECONE_INDEX_NAME,
            framework_tags=document.framework_tags,
            assessment_id=str(assessment_id) if assessment_id else None,
            response_id=str(response_id) if response_id else None,
            question_id=str(question_id) if question_id else None,
            source_type="assessment_evidence",
        )
        if processing_result.success:
            processing_status = "processed"
            document.embeddings_indexed = True
            document.chunk_count = processing_result.chunk_count
            document.vector_ids = processing_result.vector_ids
            document.save(
                update_fields=["embeddings_indexed", "chunk_count", "vector_ids"]
            )
        else:
            processing_status = "failed"
            processing_error = processing_result.error
            document.embeddings_indexed = False
            document.description = f"Processing failed: {processing_result.error}"
            document.save(update_fields=["embeddings_indexed", "description"])
    except Exception as exc:
        # Upload should still succeed even if the knowledge-library record cannot be
        # created or processed. The response evidence metadata will make the
        # processing gap clear to the questionnaire UI.
        processing_status = "failed"
        processing_error = str(exc)

    return Response(
        {
            "url": file_url,
            "file_name": uploaded_file.name,
            "file_size": uploaded_file.size,
            "content_type": uploaded_file.content_type,
            "knowledge_document_id": knowledge_document_id,
            "processing_status": processing_status,
            "error": processing_error,
        }
    )


def _resolve_processing_path(stored_path: str, file_url: str) -> str:
    """Return a path/URL that the evidence processing pipeline can read."""
    try:
        return default_storage.path(stored_path)
    except (NotImplementedError, AttributeError, ValueError):
        return file_url
