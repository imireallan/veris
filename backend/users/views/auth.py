"""Authentication API views: login (JWT) and user profile."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import User


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """Authenticate user with email and password, return JWT tokens."""
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"detail": "Email and password are required"}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"detail": "Invalid credentials"}, status=401)

    if not user.check_password(password):
        return Response({"detail": "Invalid credentials"}, status=401)

    if not user.is_active:
        return Response({"detail": "Account is disabled"}, status=401)

    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
            "user_id": str(user.id),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Return the authenticated user's profile."""
    user = request.user
    return Response(
        {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.name,
            "first_name": None,
            "last_name": None,
            "org_id": str(user.organization_id) if user.organization_id else None,
            "role": user.role,
            "picture_url": None,
        }
    )
