from uuid import UUID

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
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
    OrganizationDetailSerializer,
    OrganizationMembershipSerializer,
    OrganizationSerializer,
)
from users.permissions import IsOrganizationMember, IsOrganizationOwnerOrAdmin


def get_request_organization(request):
    organization = getattr(request, "organization", None)
    if organization:
        return organization

    org_id = None
    parser_context = getattr(request, "parser_context", None) or {}
    kwargs = parser_context.get("kwargs") or {}
    org_id = kwargs.get("org_pk") or kwargs.get("organization_pk")

    if not org_id:
        resolver_match = getattr(request, "resolver_match", None)
        if resolver_match:
            org_id = resolver_match.kwargs.get("org_pk") or resolver_match.kwargs.get(
                "organization_pk"
            )

    if not org_id:
        raise PermissionDenied("Organization context is required.")

    organization = Organization.objects.filter(id=org_id).first()
    if not organization:
        raise PermissionDenied("Invalid organization context.")

    return organization


def get_request_membership(request):
    membership = getattr(request, "membership", None)
    if membership:
        return membership

    if request.user.is_superuser:
        return None

    organization = get_request_organization(request)
    membership = (
        OrganizationMembership.objects.select_related("organization", "role")
        .filter(
            user=request.user,
            organization=organization,
            status=OrganizationMembership.Status.ACTIVE,
        )
        .first()
    )
    if not membership:
        raise PermissionDenied("Valid organization membership is required.")
    return membership


class OrganizationViewSet(viewsets.ModelViewSet):
    """
    Organization routes — /api/organizations/

    - Platform superusers can see all organizations.
    - Other users can only see organizations they belong to.
    """

    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "pk"

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return Organization.objects.all().order_by("name")

        membership_org_ids = OrganizationMembership.objects.filter(
            user=user,
            status=OrganizationMembership.Status.ACTIVE,
        ).values_list("organization_id", flat=True)

        return Organization.objects.filter(id__in=membership_org_ids).order_by("name")

    def get_object(self):
        queryset = self.get_queryset()
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]

        try:
            UUID(str(lookup_value))
        except (ValueError, AttributeError):
            raise NotFound(detail="Invalid organization ID format.")

        try:
            obj = queryset.get(**{self.lookup_field: lookup_value})
        except queryset.model.DoesNotExist:
            membership_exists = OrganizationMembership.objects.filter(
                user=self.request.user,
                status=OrganizationMembership.Status.ACTIVE,
            ).exists()

            if not membership_exists:
                raise NotFound(
                    detail="You don't have access to any organizations. Please contact your administrator."
                )

            raise NotFound(detail="You don't have access to this organization.")

        self.check_object_permissions(self.request, obj)
        return obj

    def get_serializer_class(self):
        if self.action == "retrieve":
            return OrganizationDetailSerializer
        return OrganizationSerializer

    @action(detail=False, methods=["get"], url_path="accessible")
    def accessible(self, request):
        """Return lightweight org options for switchers/filters."""
        user = request.user

        if user.is_superuser:
            data = [
                {
                    "id": str(org.id),
                    "name": org.name,
                    "slug": org.slug,
                    "role": "SUPERADMIN",
                    "fallback_role": "SUPERADMIN",
                }
                for org in Organization.objects.all().order_by("name")
            ]
            return Response(data)

        memberships = (
            OrganizationMembership.objects.filter(
                user=user,
                status=OrganizationMembership.Status.ACTIVE,
            )
            .select_related("organization", "role")
            .order_by("organization__name")
        )

        data = [
            {
                "id": str(m.organization_id),
                "name": m.organization.name,
                "slug": m.organization.slug,
                "role": m.role.name if m.role else None,
                "fallback_role": m.fallback_role,
                "status": m.status,
                "is_default": m.is_default,
            }
            for m in memberships
        ]
        return Response(data)

    def perform_create(self, serializer):
        organization = serializer.save()

        client_email = self.request.data.get("client_email")
        if client_email:
            from organizations.email_service import send_invitation_email

            invitation = Invitation.objects.create(
                organization=organization,
                email=client_email,
                fallback_role="ADMIN",
                invited_by=self.request.user,
            )

            config = OrganizationCreationConfig.get_solo()
            if config.auto_send_invitation:
                send_invitation_email(invitation)


class CustomRoleViewSet(viewsets.ModelViewSet):
    """
    Custom role management — /api/organizations/:org_pk/roles/
    """

    serializer_class = CustomRoleSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationOwnerOrAdmin]
    lookup_field = "pk"

    def get_queryset(self):
        organization = get_request_organization(self.request)
        return CustomRole.objects.filter(organization=organization).order_by("name")

    def perform_create(self, serializer):
        organization = get_request_organization(self.request)
        serializer.save(organization=organization)


class OrganizationMembershipViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Organization membership routes — /api/organizations/:org_pk/members/
    """

    serializer_class = OrganizationMembershipSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationMember]
    lookup_field = "pk"

    def get_queryset(self):
        organization = get_request_organization(self.request)
        return (
            OrganizationMembership.objects.filter(
                organization=organization,
                status=OrganizationMembership.Status.ACTIVE,
            )
            .select_related("user", "role")
            .order_by("user__email")
        )

    @action(detail=True, methods=["post"])
    def update_role(self, request, pk=None, org_pk=None):
        membership = self.get_object()
        requesting_membership = get_request_membership(request)

        if not requesting_membership.has_permission("role:manage"):
            return Response(
                {"detail": "You do not have permission to manage roles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        role_id = request.data.get("role")
        fallback_role = request.data.get("fallback_role")
        organization = get_request_organization(request)

        if role_id:
            role = CustomRole.objects.filter(
                id=role_id,
                organization=organization,
                is_active=True,
            ).first()
            if not role:
                return Response(
                    {
                        "detail": "Invalid role or role does not belong to this organization."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            membership.role = role

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
                    status=status.HTTP_400_BAD_REQUEST,
                )
            membership.role = None
            membership.fallback_role = fallback_role

        else:
            return Response(
                {"detail": "Either 'role' or 'fallback_role' must be provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership.save()
        return Response(self.get_serializer(membership).data)

    @action(detail=True, methods=["post"])
    def remove(self, request, pk=None, org_pk=None):
        membership = self.get_object()
        requesting_membership = get_request_membership(request)

        if not requesting_membership.has_permission("user:remove"):
            return Response(
                {"detail": "You do not have permission to remove members."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if membership.user == request.user:
            return Response(
                {
                    "detail": "Cannot remove yourself. Transfer ownership first if needed."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership.delete()
        return Response(
            {"detail": "Member removed successfully."},
            status=status.HTTP_200_OK,
        )


class InvitationViewSet(viewsets.ModelViewSet):
    """
    Organization invitation routes — /api/organizations/:org_pk/invitations/
    """

    serializer_class = InvitationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationOwnerOrAdmin]
    lookup_field = "pk"

    def get_queryset(self):
        organization = get_request_organization(self.request)
        return (
            Invitation.objects.filter(organization=organization)
            .select_related("invited_by", "role")
            .order_by("-created_at")
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization"] = get_request_organization(self.request)
        return context

    def perform_create(self, serializer):
        organization = get_request_organization(self.request)
        inviter_membership = (
            None
            if self.request.user.is_superuser
            else get_request_membership(self.request)
        )
        fallback_role = self.request.data.get("fallback_role", "OPERATOR")

        role_hierarchy = {
            "SUPERADMIN": 100,
            "ADMIN": 80,
            "COORDINATOR": 60,
            "CONSULTANT": 50,
            "EXECUTIVE": 40,
            "ASSESSOR": 30,
            "OPERATOR": 20,
        }

        if fallback_role == "SUPERADMIN":
            raise ValidationError("Cannot invite SUPERADMIN role.")

        if not self.request.user.is_superuser:
            inviter_priority = role_hierarchy.get(
                inviter_membership.fallback_role or "", 0
            )
            invitee_priority = role_hierarchy.get(fallback_role, 0)

            if invitee_priority > inviter_priority:
                raise ValidationError(
                    f"Cannot invite users with {fallback_role} role. Your role allows inviting equal or lower roles."
                )

        invitation = serializer.save(
            organization=organization,
            invited_by=self.request.user,
        )

        from organizations.email_service import send_invitation_email

        send_invitation_email(invitation)

    @action(detail=True, methods=["post"])
    def resend(self, request, pk=None, org_pk=None):
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

        from django.conf import settings

        from organizations.email_service import send_invitation_email

        try:
            email_sent = send_invitation_email(invitation)
            if not email_sent:
                if getattr(settings, "DEBUG", False):
                    return Response(
                        {
                            "detail": f"Invitation resend processed (email logging in development). Would send to: {invitation.email}"
                        },
                        status=status.HTTP_200_OK,
                    )
                return Response(
                    {
                        "detail": "Failed to send invitation email. Please check email configuration or contact support."
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        except Exception as e:
            if getattr(settings, "DEBUG", False):
                return Response(
                    {
                        "detail": f"Invitation resend processed (email error in dev). Would send to: {invitation.email}"
                    },
                    status=status.HTTP_200_OK,
                )
            return Response(
                {"detail": f"Failed to send email: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"detail": "Invitation email resent successfully."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None, org_pk=None):
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


class InvitationAcceptView(APIView):
    """
    Accept or decline an invitation using token.
    No authentication required for checking.
    """

    permission_classes = []

    def get(self, request, token):
        try:
            invitation = Invitation.objects.select_related(
                "organization", "role", "invited_by"
            ).get(token=token)
        except Invitation.DoesNotExist:
            return Response(
                {"detail": "Invalid invitation token."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if invitation.is_expired():
            invitation.status = Invitation.Status.EXPIRED
            invitation.save(update_fields=["status"])
            return Response(
                {"detail": "This invitation has expired."},
                status=status.HTTP_410_GONE,
            )

        if invitation.status not in [
            Invitation.Status.PENDING,
            Invitation.Status.ACCEPTED,
        ]:
            return Response(
                {
                    "detail": f"This invitation has already been {invitation.status.lower()}."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        from users.models import User

        invited_user = User.objects.filter(email__iexact=invitation.email).first()
        has_existing_account = bool(
            invited_user
            and invited_user.password
            and invited_user.has_usable_password()
        )

        return Response(
            {
                "status": invitation.status,
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
                "has_existing_account": has_existing_account,
                "needs_onboarding": not has_existing_account,
            }
        )

    def post(self, request, token, action):
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

        if invitation.is_expired():
            invitation.status = Invitation.Status.EXPIRED
            invitation.save(update_fields=["status"])
            return Response(
                {"detail": "This invitation has expired."},
                status=status.HTTP_410_GONE,
            )

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

        if not request.user or not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required to accept invitation."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if request.user.email.lower() != invitation.email.lower():
            return Response(
                {
                    "detail": "Invitation email does not match your account email. Please login with the correct email or create an account."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if invitation.accept(request.user):
            from organizations.email_service import send_welcome_email

            send_welcome_email(request.user, invitation.organization)
            needs_onboarding = not request.user.has_usable_password()

            return Response(
                {
                    "detail": "Invitation accepted successfully. Welcome to the organization!",
                    "needs_onboarding": needs_onboarding,
                    "token": invitation.token,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "detail": "Failed to accept invitation. It may have expired or been revoked."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class OrganizationCreationConfigViewSet(viewsets.ModelViewSet):
    """
    Organization creation configuration — platform-level singleton config.
    """

    serializer_class = OrganizationCreationConfigSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "pk"

    def get_queryset(self):
        return OrganizationCreationConfig.objects.all()

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]

        if not self.request.user.is_superuser:
            raise PermissionDenied(
                "Only platform superusers can modify creation config."
            )

        return [permissions.IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        """
        Return the singleton config directly instead of a list.
        """
        config = OrganizationCreationConfig.get_solo()
        serializer = self.get_serializer(config)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def prerequisites(self, request):
        config = OrganizationCreationConfig.get_solo()
        can_create, _ = config.can_user_create_organization(request.user)

        return Response(
            {
                "prerequisites": config.get_prerequisites(),
                "can_create": can_create,
                "helper_text": {
                    "title": config.helper_title,
                    "description": config.helper_description,
                    "warning": config.prerequisite_warning,
                },
            }
        )
