"""
Organization-scoped permission classes for strict multi-tenant security.
All org-scoped authorization should prefer request.membership.
"""

from rest_framework import permissions

from organizations.models import OrganizationMembership

SAFE_METHODS = permissions.SAFE_METHODS


def _get_request_org_id(request, view):
    organization = getattr(request, "organization", None)
    if organization:
        return str(organization.id)

    if view is not None:
        org_pk = getattr(view, "kwargs", {}).get("org_pk")
        if org_pk:
            return str(org_pk)

    if hasattr(request, "query_params"):
        return request.query_params.get("organization") or request.query_params.get(
            "org"
        )

    if hasattr(request, "GET"):
        return request.GET.get("organization") or request.GET.get("org")

    return None


def get_request_membership(request, view=None):
    if not request.user or not request.user.is_authenticated:
        return None

    if request.user.is_superuser:
        return None

    membership = getattr(request, "membership", None)
    organization = getattr(request, "organization", None)

    if membership and organization:
        return membership

    org_id = _get_request_org_id(request, view)
    if not org_id:
        return None

    return (
        OrganizationMembership.objects.select_related("organization", "role")
        .filter(
            user=request.user,
            organization_id=org_id,
            status=OrganizationMembership.Status.ACTIVE,
        )
        .first()
    )


def has_membership_permission(request, permission_key: str, view=None) -> bool:
    if request.user.is_superuser:
        return True

    membership = get_request_membership(request, view)
    if not membership:
        return False

    return membership.has_permission(permission_key)


class IsOrganizationMember(permissions.BasePermission):
    """Requires a valid active membership resolved by middleware."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return get_request_membership(request, view) is not None


class IsOrganizationMemberOrReadOnly(permissions.BasePermission):
    """Authenticated read access, tenant-scoped write access."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return True

        return IsOrganizationMember().has_permission(request, view)


class IsOrganizationOwnerOrAdmin(permissions.BasePermission):
    """Org admin-level actions must come from request.membership permissions."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        membership = get_request_membership(request, view)
        if not membership:
            return False

        return membership.has_permission("role:manage") or bool(
            membership.role and membership.role.name.lower() == "admin"
        )


class HasPermission(permissions.BasePermission):
    required_permission = None

    def __init__(self, permission_key=None):
        super().__init__()
        self.required_permission = permission_key or self.required_permission

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if not self.required_permission:
            return False

        return has_membership_permission(request, self.required_permission, view)


class IsAssessmentOwner(permissions.BasePermission):
    """Object must belong to the active organization for non-superusers."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True

        organization = getattr(request, "organization", None)
        if not organization:
            return False

        org_id = getattr(obj, "organization_id", None)
        if org_id is None and hasattr(obj, "assessment"):
            org_id = getattr(obj.assessment, "organization_id", None)

        if org_id is None and hasattr(obj, "template"):
            org_id = getattr(obj.template, "owner_org_id", None)

        return str(org_id) == str(organization.id)


class CanManageAssessments(permissions.BasePermission):
    def has_permission(self, request, view):
        if not IsOrganizationMember().has_permission(request, view):
            return False

        if request.method in SAFE_METHODS:
            return True
        if request.method == "POST":
            return has_membership_permission(request, "assessment:create", view)
        if request.method in ["PUT", "PATCH"]:
            return has_membership_permission(request, "assessment:edit", view)
        if request.method == "DELETE":
            return has_membership_permission(request, "assessment:delete", view)
        return False


class CanManageSites(permissions.BasePermission):
    def has_permission(self, request, view):
        if not IsOrganizationMember().has_permission(request, view):
            return False

        if request.method in SAFE_METHODS:
            return True
        if request.method == "POST":
            return has_membership_permission(request, "site:create", view)
        if request.method in ["PUT", "PATCH"]:
            return has_membership_permission(request, "site:edit", view)
        if request.method == "DELETE":
            return has_membership_permission(request, "site:delete", view)
        return False


class CanManageTasks(permissions.BasePermission):
    def has_permission(self, request, view):
        if not IsOrganizationMember().has_permission(request, view):
            return False

        if request.method in SAFE_METHODS:
            return True
        if request.method == "POST":
            return has_membership_permission(request, "task:create", view)
        if request.method in ["PUT", "PATCH"]:
            return has_membership_permission(request, "task:edit", view)
        if request.method == "DELETE":
            return has_membership_permission(request, "task:delete", view)
        return False


class CanManageFindings(permissions.BasePermission):
    def has_permission(self, request, view):
        if not IsOrganizationMember().has_permission(request, view):
            return False

        if request.method in SAFE_METHODS:
            return True
        if request.method == "POST":
            return has_membership_permission(request, "finding:create", view)
        if request.method in ["PUT", "PATCH"]:
            return has_membership_permission(request, "finding:edit", view)
        if request.method == "DELETE":
            return has_membership_permission(request, "finding:delete", view)
        return False


class CanManageTemplates(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        if getattr(view, "action", None) == "public":
            return True

        if request.method in SAFE_METHODS:
            return get_request_membership(request, view) is not None

        if request.method == "POST":
            return has_membership_permission(request, "template:create", view)
        if request.method in ["PUT", "PATCH"]:
            return has_membership_permission(request, "template:edit", view)
        if request.method == "DELETE":
            return has_membership_permission(request, "template:delete", view)
        return False
