"""
Organization-scoped permission classes for multi-tenant security.
Supports both fallback roles and custom roles with dynamic permissions.
"""

from rest_framework import permissions

from organizations.models import OrganizationMembership


class IsOrganizationMember(permissions.BasePermission):
    """
    Permission that checks if the user belongs to the organization
    specified in the URL kwargs (org_pk).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Get organization ID from URL kwargs
        org_pk = view.kwargs.get("org_pk")
        if not org_pk:
            org_pk = request.query_params.get("organization")

        if not org_pk:
            # For non-nested routes, rely on get_queryset filtering
            return True

        # Superusers bypass org membership check
        if request.user.is_superuser:
            return True

        # Check if user has a membership in this organization
        return OrganizationMembership.objects.filter(
            user=request.user, organization_id=org_pk
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
    Permission that checks if the user has admin-level permissions.
    Supports both fallback roles (ADMIN) and custom roles with 'role:manage' permission.
    Superusers always pass.

    For backward compatibility, custom roles named "Admin" (case-insensitive) also pass.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Superusers bypass org checks
        if request.user.is_superuser:
            return True

        org_pk = view.kwargs.get("org_pk")
        if not org_pk:
            org_pk = (
                request.query_params.get("organization")
                if hasattr(request, "query_params")
                else request.GET.get("organization")
            )

        if not org_pk:
            return True

        # Check membership for role/permissions
        membership = OrganizationMembership.objects.filter(
            user=request.user, organization_id=org_pk
        ).first()

        if not membership:
            return False

        # Check if membership grants admin-level permissions
        # 1. Has 'role:manage' permission (custom or fallback)
        # 2. Is ADMIN fallback role (backward compatibility)
        # 3. Custom role named "Admin" (backward compatibility)
        if membership.has_permission("role:manage"):
            return True

        if membership.fallback_role == "ADMIN":
            return True

        # Backward compatibility: custom role named "Admin"
        if membership.role and membership.role.name.lower() == "admin":
            return True

        return False


class HasPermission(permissions.BasePermission):
    """
    Generic permission class that checks for a specific permission key.
    Usage: permission_classes = [HasPermission('user:invite')]

    Can be instantiated with a permission string or used as a base class.
    """

    required_permission = None

    def __init__(self, permission_key=None):
        super().__init__()
        self.required_permission = permission_key or self.required_permission

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        org_pk = view.kwargs.get("org_pk")
        if not org_pk:
            # Try to get from query params (DRF request)
            if hasattr(request, "query_params"):
                org_pk = request.query_params.get("organization")
            # Try to get from GET params (Django request)
            elif hasattr(request, "GET"):
                org_pk = request.GET.get("organization")

        if not org_pk:
            # For non-org-scoped routes, cannot check permissions
            return False

        membership = OrganizationMembership.objects.filter(
            user=request.user, organization_id=org_pk
        ).first()

        if not membership:
            return False

        return membership.has_permission(self.required_permission)


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
        org_id = getattr(obj, "organization_id", None) or getattr(
            obj, "assessment", None
        )
        if org_id:
            # If org_id is a model instance (FK), get its id
            if hasattr(org_id, "id"):
                org_id = str(org_id.id)
            elif hasattr(org_id, "organization_id"):
                org_id = str(org_id.organization_id)

            return OrganizationMembership.objects.filter(
                user=user, organization_id=org_id
            ).exists()

        return False


class CanManageAssessments(permissions.BasePermission):
    """
    Permission for assessment CRUD operations based on role.

    Matrix:
    - View: All org members (handled by IsOrganizationMember)
    - Create: ADMIN, COORDINATOR, OPERATOR
    - Edit: ADMIN, COORDINATOR
    - Delete: ADMIN, COORDINATOR
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        org_pk = view.kwargs.get("org_pk")
        if not org_pk:
            org_pk = request.query_params.get("organization")

        if not org_pk:
            return True

        membership = OrganizationMembership.objects.filter(
            user=request.user, organization_id=org_pk
        ).first()

        if not membership:
            return False

        # CREATE - ADMIN, COORDINATOR, OPERATOR
        if request.method == "POST":
            return membership.fallback_role in ["ADMIN", "COORDINATOR", "OPERATOR"]

        # DELETE - ADMIN, COORDINATOR only
        if request.method == "DELETE":
            return membership.fallback_role in ["ADMIN", "COORDINATOR"]

        # UPDATE/PUT/PATCH - ADMIN, COORDINATOR only
        if request.method in ["PUT", "PATCH"]:
            return membership.fallback_role in ["ADMIN", "COORDINATOR"]

        # SAFE methods (GET, HEAD, OPTIONS) - all org members
        if request.method in permissions.SAFE_METHODS:
            return True

        return False


class CanManageSites(permissions.BasePermission):
    """
    Permission for site CRUD operations based on role.

    Matrix:
    - View: All org members
    - Create: ADMIN, COORDINATOR, OPERATOR
    - Edit: ADMIN, COORDINATOR, OPERATOR
    - Delete: ADMIN, COORDINATOR
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        org_pk = view.kwargs.get("org_pk")
        if not org_pk:
            org_pk = request.query_params.get("organization")

        if not org_pk:
            return True

        membership = OrganizationMembership.objects.filter(
            user=request.user, organization_id=org_pk
        ).first()

        if not membership:
            return False

        # DELETE - ADMIN, COORDINATOR only
        if request.method == "DELETE":
            return membership.fallback_role in ["ADMIN", "COORDINATOR"]

        # CREATE/UPDATE - ADMIN, COORDINATOR, OPERATOR
        if request.method in ["POST", "PUT", "PATCH"]:
            return membership.fallback_role in ["ADMIN", "COORDINATOR", "OPERATOR"]

        # SAFE methods - all org members
        if request.method in permissions.SAFE_METHODS:
            return True

        return False


class CanManageTasks(permissions.BasePermission):
    """
    Permission for task CRUD operations based on role.

    Matrix:
    - View: All org members
    - Create: ADMIN, COORDINATOR, OPERATOR
    - Update: ADMIN, COORDINATOR, OPERATOR
    - Delete: ADMIN, COORDINATOR
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        org_pk = view.kwargs.get("org_pk")
        if not org_pk:
            org_pk = request.query_params.get("organization")

        if not org_pk:
            return True

        membership = OrganizationMembership.objects.filter(
            user=request.user, organization_id=org_pk
        ).first()

        if not membership:
            return False

        # DELETE - ADMIN, COORDINATOR only
        if request.method == "DELETE":
            return membership.fallback_role in ["ADMIN", "COORDINATOR"]

        # CREATE/UPDATE - ADMIN, COORDINATOR, OPERATOR
        if request.method in ["POST", "PUT", "PATCH"]:
            return membership.fallback_role in ["ADMIN", "COORDINATOR", "OPERATOR"]

        # SAFE methods - all org members
        if request.method in permissions.SAFE_METHODS:
            return True

        return False


class CanManageFindings(permissions.BasePermission):
    """
    Permission for finding CRUD operations based on role.

    Matrix:
    - View: All org members
    - Create: ADMIN, COORDINATOR
    - Edit: ADMIN, COORDINATOR
    - Delete: ADMIN only
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        org_pk = view.kwargs.get("org_pk")
        if not org_pk:
            org_pk = request.query_params.get("organization")

        if not org_pk:
            return True

        membership = OrganizationMembership.objects.filter(
            user=request.user, organization_id=org_pk
        ).first()

        if not membership:
            return False

        # DELETE - ADMIN only
        if request.method == "DELETE":
            return membership.fallback_role == "ADMIN"

        # CREATE/UPDATE - ADMIN, COORDINATOR only
        if request.method in ["POST", "PUT", "PATCH"]:
            return membership.fallback_role in ["ADMIN", "COORDINATOR"]

        # SAFE methods - all org members
        if request.method in permissions.SAFE_METHODS:
            return True

        return False


class CanManageTemplates(permissions.BasePermission):
    """
    Permission for template CRUD operations based on role.

    Matrix:
    - View: All org members
    - Create: ADMIN, COORDINATOR
    - Edit: ADMIN, COORDINATOR
    - Delete: ADMIN, COORDINATOR
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        org_pk = view.kwargs.get("org_pk")
        if not org_pk:
            org_pk = request.query_params.get("organization")

        if not org_pk:
            return True

        membership = OrganizationMembership.objects.filter(
            user=request.user, organization_id=org_pk
        ).first()

        if not membership:
            return False

        # All write operations - ADMIN, COORDINATOR only
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            return membership.fallback_role in ["ADMIN", "COORDINATOR"]

        # SAFE methods - all org members
        if request.method in permissions.SAFE_METHODS:
            return True

        return False
