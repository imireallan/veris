"""
Organization-scoped permission classes for multi-tenant security.
"""

from rest_framework import permissions
from organizations.models import Organization, OrganizationMembership


class IsOrganizationMember(permissions.BasePermission):
    """
    Permission that checks if the user belongs to the organization
    specified in the URL kwargs (org_pk).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Get organization ID from URL kwargs
        org_pk = view.kwargs.get('org_pk')
        if not org_pk:
            org_pk = request.query_params.get('organization')

        if not org_pk:
            # For non-nested routes, rely on get_queryset filtering
            return True

        # Superusers bypass org membership check
        if request.user.is_superuser:
            return True

        # Check if user has a membership in this organization
        return OrganizationMembership.objects.filter(
            user=request.user, 
            organization_id=org_pk
        ).exists()


class IsOrganizationMemberOrReadOnly(permissions.BasePermission):
    """
    Allow read access to anyone authenticated, write only for org members.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Safe methods always allowed for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True

        return IsOrganizationMember().has_permission(request, view)


class IsOrganizationOwnerOrAdmin(permissions.BasePermission):
    """
    Permission that checks if the user is an admin or belongs to the organization.
    Superusers / SUPERADMIN role always pass. Regular users must belong to the org.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Superusers bypass org checks
        if request.user.is_superuser:
            return True

        org_pk = view.kwargs.get('org_pk')
        if not org_pk:
            org_pk = request.query_params.get('organization')

        if not org_pk:
            return True

        # Check membership for role
        membership = OrganizationMembership.objects.filter(
            user=request.user, 
            organization_id=org_pk
        ).first()
        
        if membership:
            # Check if membership role (custom or fallback) is Admin
            if membership.fallback_role == 'ADMIN' or (membership.role and membership.role.name == 'Admin'):
                return True

        return False


class IsAssessmentOwner(permissions.BasePermission):
    """
    Permission that checks if the user owns the assessment
    (through organization membership or direct ownership).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Delegate to has_object_permission for object-level checks
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        # Admin/superuser always allowed
        if user.is_superuser:
            return True
            
        # Check org membership
        org_id = getattr(obj, 'organization_id', None) or getattr(obj, 'assessment', None)
        if org_id:
            # If org_id is a model instance (FK), get its id
            if hasattr(org_id, 'id'):
                org_id = str(org_id.id)
            elif hasattr(org_id, 'organization_id'):
                org_id = str(org_id.organization_id)
                
            return OrganizationMembership.objects.filter(
                user=user, 
                organization_id=org_id
            ).exists()
            
        return False
