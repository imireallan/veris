"""Custom JWT authentication with organization context resolution."""

from django.core.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication

from organizations.models import Organization, OrganizationMembership


class JWTOrganizationAuthentication(JWTAuthentication):
    """
    JWT authentication that also resolves organization context.
    
    Reads X-Organization-Id header and attaches:
        request.organization
        request.membership
    
    This runs AFTER JWT token validation, so request.user is already set.
    """

    HEADER_NAME = "HTTP_X_ORGANIZATION_ID"

    def authenticate(self, request):
        """
        Authenticate JWT token and resolve organization context.
        
        Returns:
            Tuple (user, validated_token) if successful
            None if no Authorization header present
        Raises:
            PermissionDenied if organization context is invalid
        """
        # Step 1: Authenticate the JWT token (sets request.user via DRF)
        auth_result = super().authenticate(request)
        
        if auth_result is None:
            return None
        
        user, validated_token = auth_result
        
        # Step 2: Resolve organization context from header
        self._resolve_organization_context(request, user)
        
        return auth_result

    def _resolve_organization_context(self, request, user):
        """
        Resolve and attach organization context to the request.
        
        Sets:
            request.organization
            request.membership
        """
        request.organization = None
        request.membership = None
        
        org_id = request.META.get(self.HEADER_NAME)
        
        # No org header - leave as None, let view handle it
        if not org_id:
            return
        
        # Superuser: just verify org exists, no membership required
        if user.is_superuser:
            organization = Organization.objects.filter(id=org_id).first()
            if not organization:
                raise PermissionDenied("Invalid organization context.")
            
            request.organization = organization
            request.membership = None
            return
        
        # Regular user: must have active membership
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
