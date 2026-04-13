from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action

from themes.models import Theme
from themes.serializers import ThemeSerializer
from organizations.models import Organization


class ThemeViewSet(viewsets.ModelViewSet):
    """Theme API for organization branding customization.
    
    Endpoints:
        GET /api/themes/<org_id>/ - Get theme for organization
        PUT /api/themes/<org_id>/ - Update theme (requires org admin)
        PATCH /api/themes/<org_id>/ - Partial update theme (requires org admin)
    """
    serializer_class = ThemeSerializer
    
    def get_permissions(self):
        """Require auth for all operations - manual permission checks inside actions."""
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter themes by organization from URL kwarg."""
        org_id = self.kwargs.get("org_id") or self.kwargs.get("organization__id")
        if org_id:
            return Theme.objects.filter(organization_id=org_id)
        return Theme.objects.none()
    
    def _get_org_id_from_request(self):
        """Extract org_id from URL - handles 'pk', 'org_id', and 'organization__id' kwargs."""
        return self.kwargs.get("org_id") or self.kwargs.get("organization__id") or self.kwargs.get("pk")
    
    def _check_theme_permissions(self, org_id):
        """Check if user has permission to modify theme for given org."""
        if not org_id:
            return False, "Organization ID required"
        
        if self.request.user.is_superuser or self.request.user.is_staff:
            return True, None
        
        try:
            org = Organization.objects.get(id=org_id)
            membership = org.members.filter(user=self.request.user).first()
            if not membership:
                return False, "Permission denied"
            if membership.fallback_role not in ["ADMIN", "OWNER"]:
                return False, "Permission denied"
            return True, None
        except Organization.DoesNotExist:
            return False, "Organization not found"
    
    def retrieve(self, request, *args, **kwargs):
        """Get theme for specific organization."""
        org_id = self._get_org_id_from_request()
        if not org_id:
            return Response(
                {"error": "Organization ID required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        theme, created = Theme.objects.get_or_create(organization_id=org_id)
        serializer = self.get_serializer(theme)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """Update theme - requires organization admin permissions."""
        org_id = self._get_org_id_from_request()
        has_permission, error_msg = self._check_theme_permissions(org_id)
        
        if not has_permission:
            return Response(
                {"error": error_msg or "Permission denied"},
                status=status.HTTP_403_FORBIDDEN if error_msg == "Permission denied" else status.HTTP_400_BAD_REQUEST
            )
        
        theme, created = Theme.objects.get_or_create(organization_id=org_id)
        serializer = self.get_serializer(theme, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """Partial update theme - requires organization admin permissions."""
        org_id = self._get_org_id_from_request()
        has_permission, error_msg = self._check_theme_permissions(org_id)
        
        if not has_permission:
            return Response(
                {"error": error_msg or "Permission denied"},
                status=status.HTTP_403_FORBIDDEN if error_msg == "Permission denied" else status.HTTP_400_BAD_REQUEST
            )
        
        theme, created = Theme.objects.get_or_create(organization_id=org_id)
        serializer = self.get_serializer(theme, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=["get", "put", "patch"], url_path="(?P<org_id>[^/.]+)")
    def theme_by_org(self, request, org_id=None):
        """Get or update theme by organization ID.
        
        GET: Retrieve theme for organization
        PUT/PATCH: Update theme (requires admin permissions)
        """
        if not org_id:
            return Response(
                {"error": "Organization ID required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check permissions for write operations
        if request.method in ["PUT", "PATCH"]:
            has_permission, error_msg = self._check_theme_permissions(org_id)
            if not has_permission:
                return Response(
                    {"error": error_msg or "Permission denied"},
                    status=status.HTTP_403_FORBIDDEN if error_msg == "Permission denied" else status.HTTP_400_BAD_REQUEST
                )
        
        theme, created = Theme.objects.get_or_create(organization_id=org_id)
        
        if request.method == "GET":
            serializer = self.get_serializer(theme)
            return Response(serializer.data)
        else:
            # PUT or PATCH - both use partial=True for flexibility
            serializer = self.get_serializer(
                theme, 
                data=request.data, 
                partial=True  # Allow partial updates for both PUT and PATCH
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
