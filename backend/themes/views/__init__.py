from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from themes.models import OrganizationTheme
from themes.serializers import ThemeSerializer


class ThemeViewSet(viewsets.ModelViewSet):
    """Organization theme API resolved from request.organization/request.membership."""

    serializer_class = ThemeSerializer
    permission_classes = [IsAuthenticated]

    def _get_request_organization(self):
        if self.request.user.is_superuser:
            org_id = (
                self.kwargs.get("org_id")
                or self.kwargs.get("organization__id")
                or self.kwargs.get("pk")
            )
            if org_id:
                return org_id

        organization = getattr(self.request, "organization", None)
        return organization.id if organization else None

    def _get_request_membership(self):
        return getattr(self.request, "membership", None)

    def get_queryset(self):
        org_id = self._get_request_organization()
        if not org_id:
            return OrganizationTheme.objects.none()
        return OrganizationTheme.objects.filter(organization_id=org_id)

    def _can_manage_theme(self):
        if self.request.user.is_superuser:
            return True

        membership = self._get_request_membership()
        if not membership:
            return False

        return membership.has_permission("org:settings")

    def retrieve(self, request, *args, **kwargs):
        org_id = self._get_request_organization()
        if not org_id:
            return Response(
                {"error": "Organization context required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        theme, _ = OrganizationTheme.objects.get_or_create(organization_id=org_id)
        serializer = self.get_serializer(theme)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        if not self._can_manage_theme():
            return Response(
                {"error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN,
            )

        org_id = self._get_request_organization()
        if not org_id:
            return Response(
                {"error": "Organization context required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        theme, _ = OrganizationTheme.objects.get_or_create(organization_id=org_id)
        serializer = self.get_serializer(theme, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(organization_id=org_id)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        if not self._can_manage_theme():
            return Response(
                {"error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN,
            )

        org_id = self._get_request_organization()
        if not org_id:
            return Response(
                {"error": "Organization context required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        theme, _ = OrganizationTheme.objects.get_or_create(organization_id=org_id)
        serializer = self.get_serializer(theme, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(organization_id=org_id)
        return Response(serializer.data)

    @action(
        detail=False, methods=["get", "put", "patch"], url_path="(?P<org_id>[^/.]+)"
    )
    def theme_by_org(self, request, org_id=None):
        if request.user.is_superuser:
            self.kwargs["org_id"] = org_id

        if request.method == "GET":
            return self.retrieve(request, *(), **self.kwargs)
        if request.method == "PUT":
            return self.update(request, *(), **self.kwargs)
        return self.partial_update(request, *(), **self.kwargs)
