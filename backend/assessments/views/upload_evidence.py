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

    # Generate unique filename
    unique_name = f"{uuid.uuid4().hex}_{uploaded_file.name}"
    upload_path = f"evidence_documents/{unique_name}"

    # Save file using configured storage (local or S3)
    file_path = default_storage.save(upload_path, uploaded_file)
    file_url = default_storage.url(file_path)

    return Response(
        {
            "url": file_url,
            "file_name": uploaded_file.name,
            "file_size": uploaded_file.size,
            "content_type": uploaded_file.content_type,
        }
    )
