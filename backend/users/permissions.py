"""
Organization-scoped permission classes for multi-tenant security.
"""

from rest_framework import permissions
from django.shortcuts import get_object_or_404
from organizations.models import Organization


class IsOrganizationMember(permissions.BasePermission):
    """
    Permission that checks if the user belongs to the organization
    specified in the URL kwargs (org_pk).
    """
    
    def has_permission(self, request, view):
        # Get organization ID from URL kwargs
        org_pk = view.kwargs.get('org_pk')
        if not org_pk:
            # For non-nested routes, check query params or fallback
            org_pk = request.query_params.get('organization')
            
        if not org_pk:
            # If no org_pk specified, allow the request (will be filtered in queryset)
            return True
            
        # Check if user belongs to this organization
        return request.user.organization_id == org_pk


class IsOrganizationOwnerOrAdmin(permissions.BasePermission):
    """
    Permission that checks if the user is an admin or belongs to the organization.
    """
    
    def has_permission(self, request, view):
        org_pk = view.kwargs.get('org_pk')
        if not org_pk:
            org_pk = request.query_params.get('organization')
            
        if not org_pk:
            return True
            
        user = request.user
        # Allow if user is admin or belongs to the organization
        return (user.role == 'ADMIN' or 
                user.organization_id == org_pk)


class IsAssessmentOwner(permissions.BasePermission):
    """
    Permission that checks if the user owns the assessment
    (through organization membership or direct ownership).
    """
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        # Allow if user is admin
        if user.role == 'ADMIN':
            return True
        # Allow if user belongs to the assessment's organization
        if hasattr(obj, 'organization_id'):
            return user.organization_id == obj.organization_id
        # Allow if user created the assessment
        if hasattr(obj, 'created_by'):
            return user.id == obj.created_by_id
        return False
    

# Custom permission classes for organization-scoped access
class IsOrganizationMember(permissions.BasePermission):
    """
    Permission that checks if the user belongs to the organization
    specified in the URL kwargs (org_pk).
    """
    
    def has_permission(self, request, view):
        # Get organization ID from URL kwargs
        org_pk = view.kwargs.get('org_pk')
        if not org_pk:
            # For non-nested routes, check query params or fallback
            org_pk = request.query_params.get('organization')
            
        if not org_pk:
            # If no org_pk specified, allow the request (will be filtered in queryset)
            return True
            
        # Check if user belongs to this organization
        return request.user.organization_id == org_pk


class IsOrganizationOwnerOrAdmin(permissions.BasePermission):
    """
    Permission that checks if the user is an admin or belongs to the organization.
    """
    
    def has_permission(self, request, view):
        org_pk = view.kwargs.get('org_pk')
        if not org_pk:
            org_pk = request.query_params.get('organization')
            
        if not org_pk:
            return True
            
        user = request.user
        # Allow if user is admin or belongs to the organization
        return (user.role == 'ADMIN' or 
                user.organization_id == org_pk)


class IsAssessmentOwner(permissions.BasePermission):
    """
    Permission that checks if the user owns the assessment
    (through organization membership or direct ownership).
    """
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        # Allow if user is admin
        if user.role == 'ADMIN':
            return True
        # Allow if user belongs to the assessment's organization
        if hasattr(obj, 'organization_id'):
            return user.organization_id == obj.organization_id
        # Allow if user created the assessment
        if hasattr(obj, 'created_by'):
            return user.id == obj.created_by_id
        return False
