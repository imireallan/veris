from __future__ import annotations

from django.core.exceptions import PermissionDenied
from django.utils.deprecation import MiddlewareMixin

from organizations.models import Organization, OrganizationMembership


class OrganizationContextMiddleware(MiddlewareMixin):
    """
    Attaches the active organization and membership to the request.

    Expected request header:
        X-Organization-Id: <organization_uuid>

    Sets:
        request.organization
        request.membership

    Behavior:
    - If user is anonymous, leaves both as None
    - If header is missing, leaves both as None
    - If header is invalid or user is not a member, raises PermissionDenied
    """

    HEADER_NAME = "HTTP_X_ORGANIZATION_ID"

    def process_request(self, request):
        request.organization = None
        request.membership = None

        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return None

        org_id = request.META.get(self.HEADER_NAME)
        if not org_id:
            return None

        if user.is_superuser:
            organization = Organization.objects.filter(id=org_id).first()
            if not organization:
                raise PermissionDenied("Invalid organization context.")

            request.organization = organization
            request.membership = None
            return None

        membership = (
            OrganizationMembership.objects.select_related("organization", "role")
            .filter(
                user=user,
                organization_id=org_id,
                status=OrganizationMembership.Status.ACTIVE,
            )
            .first()
        )

        if not membership:
            raise PermissionDenied(
                "Invalid organization context or you do not have access to this organization."
            )

        request.organization = membership.organization
        request.membership = membership
        return None
