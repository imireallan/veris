from rest_framework import permissions, viewsets

from organizations.models import Organization
from organizations.serializers import OrganizationSerializer


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
