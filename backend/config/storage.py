"""
Storage Configuration — S3 (Production) vs Local (Development)

Usage:
    - Development: Files stored in ./media/ directory
    - Production: Files stored in AWS S3 bucket

Settings (add to .env):
    # AWS S3 (Production)
    AWS_ACCESS_KEY_ID=...
    AWS_SECRET_ACCESS_KEY=...
    AWS_STORAGE_BUCKET_NAME=veris-media-prod
    AWS_S3_REGION_NAME=us-east-1
    AWS_S3_CUSTOM_DOMAIN=  # Optional: CloudFront domain

    # Or use for dev too (optional)
    USE_S3=true
"""

from django.conf import settings
from django.core.files.storage import FileSystemStorage
from storages.backends.s3boto3 import S3Boto3Storage


class S3MediaStorage(S3Boto3Storage):
    """
    S3 storage for media files (evidence documents, uploads).

    Configuration via Django settings:
    - AWS_STORAGE_BUCKET_NAME
    - AWS_S3_REGION_NAME
    - AWS_ACCESS_KEY_ID
    - AWS_SECRET_ACCESS_KEY
    - AWS_S3_CUSTOM_DOMAIN (optional, for CloudFront)
    """

    location = "media"
    default_acl = "private"  # Keep documents private, access via signed URLs
    file_overwrite = False  # Don't overwrite existing files
    querystring_auth = True  # Require signed URLs for access


class LocalMediaStorage(FileSystemStorage):
    """
    Local filesystem storage for development.
    Files stored in MEDIA_ROOT directory.
    """

    pass


def get_media_storage():
    """
    Return appropriate storage backend based on settings.

    Usage in models:
        from config.storage import get_media_storage
        file_storage = get_media_storage()
        file_storage.save('path/file.pdf', content)
    """
    use_s3 = getattr(settings, "USE_S3", False)

    if use_s3:
        # Validate required settings
        required = [
            "AWS_STORAGE_BUCKET_NAME",
            "AWS_ACCESS_KEY_ID",
            "AWS_SECRET_ACCESS_KEY",
        ]
        missing = [s for s in required if not getattr(settings, s, None)]
        if missing:
            raise ValueError(
                f"USE_S3=True but missing settings: {', '.join(missing)}. "
                "Set USE_S3=False for local storage or configure AWS credentials."
            )
        return S3MediaStorage()
    else:
        return LocalMediaStorage()
