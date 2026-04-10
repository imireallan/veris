from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from organizations.models import CustomRole, Organization, OrganizationMembership
from organizations.serializers import (
    CustomRoleSerializer,
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
