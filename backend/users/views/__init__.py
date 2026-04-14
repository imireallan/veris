from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from organizations.models import OrganizationMembership
from users.models import User
from users.serializers import UserSerializer


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    lookup_field = "pk"
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filter users by organization membership for multi-tenant isolation.
        Superusers can see all users; regular users only see members of their org.
        Users can always access their own profile.
        """
        user = self.request.user

        # Allow users to access their own profile
        if self.action == "retrieve" and self.kwargs.get("pk") == str(user.id):
            return User.objects.filter(id=user.id)

        # Superusers can see all users
        if user.is_superuser:
            return User.objects.all()

        # Get organization from URL kwarg or query params
        org_pk = self.kwargs.get("org_pk") or self.request.query_params.get(
            "organization"
        )

        if not org_pk:
            # If no org specified, return users from all orgs the user belongs to
            memberships = OrganizationMembership.objects.filter(user=user).values_list(
                "organization_id", flat=True
            )
            if memberships:
                return User.objects.filter(memberships__organization_id__in=memberships)
            return User.objects.none()

        # Check if user has access to this organization
        if not OrganizationMembership.objects.filter(
            user=user, organization_id=org_pk
        ).exists():
            return User.objects.none()

        # Return only users who are members of this organization
        return User.objects.filter(memberships__organization_id=org_pk).distinct()

    def get_permissions(self):
        """
        Allow users to update their own profile without org membership checks.
        """
        if self.action == "partial_update" and self.kwargs.get("pk") == str(
            self.request.user.id
        ):
            # User updating their own profile - just need to be authenticated
            return [IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=["get"])
    def me(self, request):
        """Get current user with organization memberships."""
        user = request.user
        memberships = OrganizationMembership.objects.filter(user=user).select_related(
            "organization", "role"
        )

        # Build organization list with role info
        organizations = []
        for membership in memberships:
            org_data = {
                "id": str(membership.organization.id),
                "name": membership.organization.name,
                "slug": membership.organization.slug,
            }

            # Determine role display
            if membership.role:
                org_data["role"] = membership.role.name  # Custom role name
                org_data["fallback_role"] = membership.fallback_role  # Permission role
            else:
                org_data["role"] = membership.fallback_role
                org_data["fallback_role"] = membership.fallback_role

            organizations.append(org_data)

        # Determine global role display
        role = None
        fallback_role = None

        if user.is_superuser:
            role = "SUPERADMIN"
            fallback_role = "SUPERADMIN"
        elif memberships:
            # Use first membership for global role display
            first_membership = memberships.first()
            if first_membership.role:
                role = first_membership.role.name
                fallback_role = first_membership.fallback_role
            else:
                role = first_membership.fallback_role
                fallback_role = first_membership.fallback_role

        return Response(
            {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "role": role,
                "fallback_role": fallback_role,
                "organizations": organizations,
            }
        )
