"""Authentication API views: login (JWT) and user profile."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from organizations.models import OrganizationMembership
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
    """Return the authenticated user's profile with organization and role details."""
    user = request.user
    
    # Get all memberships for this user
    memberships = OrganizationMembership.objects.filter(user=user).select_related('organization')
    
    # Get user's primary organization (first membership or none)
    primary_membership = memberships.first()
    org_id = str(primary_membership.organization_id) if primary_membership else None
    org_name = primary_membership.organization.name if primary_membership else None
    
    # Get user's primary role (from first membership or superuser status)
    role = None
    fallback_role = None
    if user.is_superuser:
        role = "SUPERADMIN"
        fallback_role = "SUPERADMIN"
    elif primary_membership and primary_membership.role:
        role = primary_membership.role.name
        fallback_role = primary_membership.fallback_role
    elif primary_membership:
        role = primary_membership.fallback_role
        fallback_role = primary_membership.fallback_role
    
    # Build organization list for multi-org users
    orgs = [
        {
            "id": str(m.organization_id),
            "name": m.organization.name,
            "role": m.role.name if m.role else m.fallback_role,
            "fallback_role": m.fallback_role,  # Durable permission level
        }
        for m in memberships
    ]
    
    return Response(
        {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.name,
            "first_name": None,
            "last_name": None,
            "org_id": org_id,
            "org_name": org_name,
            "role": role,  # Display name (custom role or fallback)
            "fallback_role": fallback_role,  # Durable permission level for RBAC
            "organizations": orgs,
            "picture_url": None,
            "is_superuser": user.is_superuser,
            "is_staff": user.is_staff,
            "timezone": user.timezone,
            "country": user.country,
        }
    )
