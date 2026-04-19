"""Authentication API views: login (JWT) and user profile."""

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from users.serializers import MeSerializer
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from organizations.models import OrganizationMembership
from users.models import User


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """Authenticate user with email and password, return JWT tokens and org bootstrap."""
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

    memberships = (
        OrganizationMembership.objects.select_related("organization", "role")
        .filter(
            user=user,
            status=OrganizationMembership.Status.ACTIVE,
        )
        .order_by("-is_default", "-last_accessed_at", "joined_at")
    )

    organization_count = memberships.count()
    active_membership = memberships.first()

    active_organization = None
    active_membership_payload = None

    if active_membership:
        active_organization = {
            "id": str(active_membership.organization.id),
            "name": active_membership.organization.name,
            "slug": active_membership.organization.slug,
        }
        active_membership_payload = {
            "role": active_membership.role.name if active_membership.role else None,
            "fallback_role": active_membership.fallback_role,
            "is_default": active_membership.is_default,
            "status": active_membership.status,
        }

    return Response(
        {
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
            "user_id": str(user.id),
            "active_organization": active_organization,
            "active_membership": active_membership_payload,
            "organization_count": organization_count,
            "requires_org_selection": False,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    serializer = MeSerializer(request.user, context={"request": request})
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([AllowAny])
def set_password_view(request):
    """
    Set password for invited users who have no password yet.
    Requires invitation token to verify the user is invited.
    Creates the user if they don't exist yet.

    POST /api/auth/set-password/
    {
        "token": "***",
        "password": "***"
    }
    """
    from organizations.models import Invitation
    from users.models import User

    token = request.data.get("token")
    password = request.data.get("password")

    if not token or not password:
        return Response(
            {"detail": "Token and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Verify invitation exists and is pending/accepted
    try:
        invitation = Invitation.objects.select_related(
            "organization", "invited_by"
        ).get(token=token)
    except Invitation.DoesNotExist:
        return Response(
            {"detail": "Invalid invitation token"}, status=status.HTTP_404_NOT_FOUND
        )

    if invitation.status == Invitation.Status.EXPIRED:
        return Response(
            {"detail": "This invitation has expired"}, status=status.HTTP_410_GONE
        )

    if invitation.status not in [Invitation.Status.PENDING, Invitation.Status.ACCEPTED]:
        return Response(
            {"detail": "This invitation has already been processed"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Find or create user by invitation email
    user, created = User.objects.get_or_create(
        email=invitation.email,
        defaults={
            "name": invitation.email.split("@")[0],
            "status": User.Status.ACTIVE,
            "is_active": True,
        },
    )

    # Check if user already has a password set (empty string means no password)
    if user.password and user.has_usable_password():
        return Response(
            {"detail": "Password already set. Please login instead."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Set password
    user.set_password(password)
    user.status = User.Status.ACTIVE
    user.is_active = True
    user.save(update_fields=["password", "status", "is_active", "updated_at"])

    # Mark invitation as accepted if still pending
    if invitation.status == Invitation.Status.PENDING:
        invitation.accept(user)

    return Response(
        {"detail": "Password set successfully. You can now login."},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password_request_view(request):
    """
    Request a password reset link via email.

    POST /api/auth/reset-password/request/
    {
        "email": "user@example.com"
    }
    """
    email = request.data.get("email")

    if not email:
        return Response(
            {"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Always return success to prevent email enumeration
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"detail": "If this email exists, a reset link has been sent."},
            status=status.HTTP_200_OK,
        )

    # Generate reset token
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    # Build reset URL
    frontend_url = settings.FRONTEND_URL.rstrip("/")
    reset_url = f"{frontend_url}/reset-password/{uid}/{token}"

    # Send email
    send_mail(
        subject="Reset Your Veris Password",
        message=f"""
Hello,

You requested to reset your password for Veris.

Click the link below to set a new password:
{reset_url}

This link will expire in 24 hours.

If you didn't request this, please ignore this email.

Best regards,
The Veris Team
""",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )

    return Response(
        {"detail": "If this email exists, a reset link has been sent."},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password_confirm_view(request):
    """
    Confirm password reset with token.

    POST /api/auth/reset-password/confirm/
    {
        "uid": "urlsafe-base64-user-id",
        "token": "reset-token",
        "password": "new-password"
    }
    """
    uid = request.data.get("uid")
    token = request.data.get("token")
    password = request.data.get("password")

    if not uid or not token or not password:
        return Response(
            {"detail": "UID, token, and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        uid = urlsafe_base64_decode(uid).decode()
        user = User.objects.get(pk=uid)
    except (User.DoesNotExist, ValueError, UnicodeDecodeError):
        return Response(
            {"detail": "Invalid reset link"}, status=status.HTTP_400_BAD_REQUEST
        )

    if not default_token_generator.check_token(user, token):
        return Response(
            {"detail": "Invalid or expired reset link"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Set new password
    user.set_password(password)
    user.save(update_fields=["password", "updated_at"])

    return Response(
        {"detail": "Password reset successfully. You can now login."},
        status=status.HTTP_200_OK,
    )
