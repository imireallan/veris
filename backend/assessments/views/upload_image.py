import imghdr

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from assessments.models import UploadedImage

MAX_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_TYPES = {"jpeg", "png", "gif", "webp", "bmp", "tiff"}


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_image(request):
    uploaded_file = request.FILES.get("file")
    if not uploaded_file:
        return Response(
            {"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Size validation
    if uploaded_file.size > MAX_SIZE:
        return Response(
            {"error": "File too large. Maximum size is 5MB."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Type validation
    file_type = imghdr.what(None, h=uploaded_file.read(32))
    uploaded_file.seek(0)
    if file_type not in ALLOWED_TYPES:
        return Response(
            {"error": "Invalid image file type."}, status=status.HTTP_400_BAD_REQUEST
        )

    image = UploadedImage.objects.create(uploaded_by=request.user, file=uploaded_file)

    return Response(
        {
            "url": request.build_absolute_uri(image.file.url),
            "id": str(image.pk),
        }
    )
