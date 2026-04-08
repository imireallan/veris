"""
Organization-scoped permission classes for multi-tenant security.
"""

from rest_framework import permissions
from organizations.models import Organization


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

        # Check if user belongs to this organization
        user_org_id = getattr(request.user, 'organization_id', None)
        return user_org_id == org_pk or request.user.is_superuser


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
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        org_pk = view.kwargs.get('org_pk')
        if not org_pk:
            org_pk = request.query_params.get('organization')

        if not org_pk:
            return True

        user_role = getattr(request.user, 'role', None)
        return (
            user_role in ('ADMIN', 'SUPERUSER')
            or getattr(request.user, 'organization_id', None) == org_pk
        )


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
        if getattr(user, 'role', None) in ('ADMIN', 'SUPERUSER'):
            return True
        # Check org membership
        org_id = getattr(obj, 'organization_id', None) or getattr(obj, 'assessment', None)
        if org_id:
            # If org_id is a model instance (FK), get its id
            if hasattr(org_id, 'id'):
                org_id = str(org_id.id)
            user_org = getattr(user, 'organization_id', None)
            if user_org and str(user_org) == str(org_id):
                return True
        # Check assessment FK
        assessment_obj = getattr(obj, 'assessment', None)
        if assessment_obj:
            assessment_org = getattr(assessment_obj, 'organization_id', None)
            if assessment_org:
                if hasattr(assessment_org, 'id'):
                    assessment_org = str(assessment_org.id)
                user_org = getattr(user, 'organization_id', None)
                if user_org and str(user_org) == str(assessment_org):
                    return True
        return False
