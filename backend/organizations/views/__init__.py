from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from organizations.models import (
    CustomRole,
    Invitation,
    Organization,
    OrganizationCreationConfig,
    OrganizationMembership,
)
from organizations.serializers import (
    CustomRoleSerializer,
    InvitationSerializer,
    OrganizationCreationConfigSerializer,
    OrganizationMembershipSerializer,
    OrganizationSerializer,
)
from users.permissions import IsOrganizationMember, IsOrganizationOwnerOrAdmin


class OrganizationViewSet(viewsets.ModelViewSet):
    """Organization routes — /api/organizations/.

    - SUPERADMIN / Django superuser: can see all organizations.
    - All other users (including org ADMIN): only their own organization.
    """

    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "pk"

    def get_queryset(self):
        user = self.request.user

        # Platform-level admins: can see all orgs
        if user.is_superuser or getattr(user, "role", None) == "SUPERADMIN":
            return Organization.objects.all()

        # All other users (including org ADMIN): only their own org
        user_org = getattr(user, "organization_id", None)
        if user_org:
            return Organization.objects.filter(id=user_org)

        return Organization.objects.none()

    def perform_create(self, serializer):
        """
        Create organization and optionally send invitation to client admin.
        
        Expects additional context from request data:
        - client_email: Email for sending invitation
        - framework: Primary framework selection
        - sector: Industry sector
        """
        organization = serializer.save()
        
        # Handle invitation if client_email provided
        client_email = self.request.data.get("client_email")
        if client_email:
            from organizations.models import Invitation
            from organizations.email_service import send_invitation_email
            
            # Create invitation with ADMIN role
            invitation = Invitation.objects.create(
                organization=organization,
                email=client_email,
                fallback_role="ADMIN",
                invited_by=self.request.user,
            )
            
            # Send invitation email
            config = OrganizationCreationConfig.get_solo()
            if config.auto_send_invitation:
                send_invitation_email(invitation)


class CustomRoleViewSet(viewsets.ModelViewSet):
    """Custom role management — /api/organizations/:org_pk/roles/.

    Allows organizations to create and manage custom roles with specific permissions.
    Only ADMIN users can manage roles.
    """

    serializer_class = CustomRoleSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationOwnerOrAdmin]
    lookup_field = "pk"

    def get_queryset(self):
        org_pk = self.kwargs.get("org_pk")
        return CustomRole.objects.filter(organization_id=org_pk)

    def perform_create(self, serializer):
        org_pk = self.kwargs.get("org_pk")
        serializer.save(organization_id=org_pk)


class OrganizationMembershipViewSet(viewsets.ReadOnlyModelViewSet):
    """Organization membership routes — /api/organizations/:org_pk/members/.

    Lists members of an organization with their roles and permissions.
    """

    serializer_class = OrganizationMembershipSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember]
    lookup_field = "pk"

    def get_queryset(self):
        org_pk = self.kwargs.get("org_pk")
        return (
            OrganizationMembership.objects.filter(organization_id=org_pk)
            .select_related("user", "role")
            .order_by("user__email")
        )

    @action(detail=True, methods=["post"])
    def update_role(self, request, pk=None, org_pk=None):
        """Update a member's role (custom role or fallback role)."""
        membership = self.get_object()

        # Check if user has permission to update roles
        if not membership.has_permission("role:manage"):
            # Check if requesting user is admin of this org
            requesting_membership = OrganizationMembership.objects.filter(
                user=request.user, organization_id=org_pk
            ).first()
            if not requesting_membership or not requesting_membership.has_permission(
                "role:manage"
            ):
                return Response(
                    {"detail": "You do not have permission to manage roles."},
                    status=403,
                )

        role_id = request.data.get("role")
        fallback_role = request.data.get("fallback_role")

        if role_id:
            # Validate role belongs to same org
            role = CustomRole.objects.filter(id=role_id, organization_id=org_pk).first()
            if not role:
                return Response(
                    {
                        "detail": "Invalid role or role does not belong to this organization."
                    },
                    status=400,
                )
            membership.role = role
            membership.fallback_role = None
        elif fallback_role:
            valid_fallback_roles = [
                "ADMIN",
                "COORDINATOR",
                "OPERATOR",
                "EXECUTIVE",
                "ASSESSOR",
                "CONSULTANT",
            ]
            if fallback_role not in valid_fallback_roles:
                return Response(
                    {
                        "detail": f"Invalid fallback role. Must be one of: {valid_fallback_roles}"
                    },
                    status=400,
                )
            membership.role = None
            membership.fallback_role = fallback_role
        else:
            return Response(
                {"detail": "Either 'role' or 'fallback_role' must be provided."},
                status=400,
            )

        membership.save()
        return Response(self.get_serializer(membership).data)


class InvitationViewSet(viewsets.ModelViewSet):
    """Organization invitation routes — /api/organizations/:org_pk/invitations/.

    Allows ADMIN users to invite new members via email.
    """

    serializer_class = InvitationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationOwnerOrAdmin]
    lookup_field = "pk"

    def get_queryset(self):
        org_pk = self.kwargs.get("org_pk")
        return (
            Invitation.objects.filter(organization_id=org_pk)
            .select_related("invited_by", "role")
            .order_by("-created_at")
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        org_pk = self.kwargs.get("org_pk")
        if org_pk:
            context["organization"] = Organization.objects.get(id=org_pk)
        return context

    def perform_create(self, serializer):
        org_pk = self.kwargs.get("org_pk")
        organization = Organization.objects.get(id=org_pk)
        invitation = serializer.save(
            organization=organization,
            invited_by=self.request.user,
        )
        # Send invitation email
        from organizations.email_service import send_invitation_email

        send_invitation_email(invitation)

    @action(detail=True, methods=["post"])
    def resend(self, request, pk=None, org_pk=None):
        """Resend an invitation email."""
        invitation = self.get_object()

        if invitation.status != Invitation.Status.PENDING:
            return Response(
                {
                    "detail": "Cannot resend invitation. It has been accepted or declined."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if invitation.is_expired():
            invitation.status = Invitation.Status.EXPIRED
            invitation.save(update_fields=["status"])
            return Response(
                {"detail": "Invitation has expired. Please create a new invitation."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # TODO: Send invitation email
        # send_invitation_email(invitation)

        return Response(
            {"detail": "Invitation email resent successfully."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None, org_pk=None):
        """Revoke a pending invitation."""
        invitation = self.get_object()

        if invitation.status != Invitation.Status.PENDING:
            return Response(
                {"detail": "Can only revoke pending invitations."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitation.status = Invitation.Status.DECLINED
        invitation.save(update_fields=["status"])

        return Response(
            {"detail": "Invitation revoked successfully."},
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────
# Standalone invitation acceptance (no auth required)
# ─────────────────────────────────────────────────────


class InvitationAcceptView(APIView):
    """
    Accept or decline an invitation using token.
    No authentication required - token-based access.

    GET /api/invitations/{token}/ — Check invitation status
    POST /api/invitations/{token}/accept/ — Accept invitation (requires auth)
    POST /api/invitations/{token}/decline/ — Decline invitation
    """

    permission_classes = []  # No auth required for checking

    def get(self, request, token):
        """Check invitation validity and return details."""
        try:
            invitation = Invitation.objects.select_related(
                "organization", "role", "invited_by"
            ).get(token=token)
        except Invitation.DoesNotExist:
            return Response(
                {"detail": "Invalid invitation token."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if expired
        if invitation.is_expired():
            invitation.status = Invitation.Status.EXPIRED
            invitation.save(update_fields=["status"])
            return Response(
                {"detail": "This invitation has expired."},
                status=status.HTTP_410_GONE,
            )

        # Check if already processed
        if invitation.status != Invitation.Status.PENDING:
            return Response(
                {
                    "detail": f"This invitation has already been {invitation.status.lower()}."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Return invitation details
        return Response(
            {
                "email": invitation.email,
                "organization": {
                    "id": str(invitation.organization.id),
                    "name": invitation.organization.name,
                },
                "role_name": (
                    invitation.role.name
                    if invitation.role
                    else invitation.get_fallback_role_display()
                ),
                "invited_by": invitation.invited_by.name,
                "expires_at": invitation.expires_at.isoformat(),
            }
        )

    def post(self, request, token, action):
        """Accept or decline invitation."""
        if action not in ["accept", "decline"]:
            return Response(
                {"detail": "Invalid action. Use 'accept' or 'decline'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            invitation = Invitation.objects.get(token=token)
        except Invitation.DoesNotExist:
            return Response(
                {"detail": "Invalid invitation token."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if expired
        if invitation.is_expired():
            invitation.status = Invitation.Status.EXPIRED
            invitation.save(update_fields=["status"])
            return Response(
                {"detail": "This invitation has expired."},
                status=status.HTTP_410_GONE,
            )

        # Check if already processed
        if invitation.status != Invitation.Status.PENDING:
            return Response(
                {
                    "detail": f"This invitation has already been {invitation.status.lower()}."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action == "decline":
            invitation.decline()
            return Response(
                {"detail": "Invitation declined."},
                status=status.HTTP_200_OK,
            )

        # Accept action
        if not request.user or not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required to accept invitation."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Verify email matches
        if request.user.email.lower() != invitation.email.lower():
            return Response(
                {
                    "detail": "Invitation email does not match your account email. Please login with the correct email or create an account."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Accept the invitation
        if invitation.accept(request.user):
            # Send welcome email
            from organizations.email_service import send_welcome_email

            send_welcome_email(request.user, invitation.organization)

            return Response(
                {
                    "detail": "Invitation accepted successfully. Welcome to the organization!"
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {
                    "detail": "Failed to accept invitation. It may have expired or been revoked."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class OrganizationCreationConfigViewSet(viewsets.ModelViewSet):
    """
    Organization creation configuration — admin-configurable prerequisites.
    
    GET /api/creation-config/ — Get current configuration
    PATCH /api/creation-config/{id}/ — Update configuration (SUPERADMIN only)
    """
    
    serializer_class = OrganizationCreationConfigSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "pk"
    
    def get_queryset(self):
        # Only one config exists (singleton)
        return OrganizationCreationConfig.objects.all()
    
    def get_permissions(self):
        """Only SUPERADMIN can modify config."""
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOrganizationOwnerOrAdmin()]
    
    @action(detail=False, methods=["get"])
    def prerequisites(self, request):
        """Get enabled prerequisites for frontend."""
        config = OrganizationCreationConfig.get_solo()
        return Response({
            "prerequisites": config.get_prerequisites(),
            "can_create": config.can_user_create_organization(request.user)[0],
            "helper_text": {
                "title": config.helper_title,
                "description": config.helper_description,
                "warning": config.prerequisite_warning,
            }
        })
