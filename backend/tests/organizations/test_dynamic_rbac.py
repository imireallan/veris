"""Tests for dynamic RBAC and custom role permissions.

Verifies that:
- CustomRole.has_permission() works correctly
- OrganizationMembership.has_permission() checks custom roles first, then fallback
- HasPermission permission class works with specific permission keys
- Default fallback role permissions are correctly mapped
"""

import pytest

from users.permissions import HasPermission, IsOrganizationOwnerOrAdmin


@pytest.mark.django_db
@pytest.mark.integrated
class TestCustomRolePermissions:
    """Test CustomRole model permission checks."""

    def test_custom_role_has_permission_success(
        self, make_user, make_org, make_membership, make_custom_role
    ):
        """CustomRole.has_permission() should return True for granted permissions."""
        org = make_org()
        role = make_custom_role(
            organization=org,
            name="Custom Admin",
            permissions=["user:invite", "report:edit", "assessment:approve"],
        )

        assert role.has_permission("user:invite") is True
        assert role.has_permission("report:edit") is True
        assert role.has_permission("assessment:approve") is True

    def test_custom_role_has_permission_failure(
        self, make_user, make_org, make_membership, make_custom_role
    ):
        """CustomRole.has_permission() should return False for missing permissions."""
        org = make_org()
        role = make_custom_role(
            organization=org,
            name="Limited Role",
            permissions=["assessment:view", "report:view"],
        )

        assert role.has_permission("user:invite") is False
        assert role.has_permission("assessment:delete") is False
        assert role.has_permission("role:manage") is False

    def test_custom_role_empty_permissions(
        self, make_user, make_org, make_membership, make_custom_role
    ):
        """CustomRole with empty permissions list should deny all."""
        org = make_org()
        role = make_custom_role(organization=org, name="No Permissions", permissions=[])

        # Explicitly check the permissions field
        assert role.permissions == []
        assert role.has_permission("user:invite") is False
        assert role.has_permission("assessment:view") is False


@pytest.mark.django_db
@pytest.mark.integrated
class TestOrganizationMembershipPermissions:
    """Test OrganizationMembership.has_permission() with custom roles and fallbacks."""

    def test_membership_uses_custom_role_permissions(
        self, make_user, make_org, make_membership, make_custom_role
    ):
        """Membership should use custom role permissions when role is set."""
        user = make_user()
        org = make_org()
        role = make_custom_role(
            organization=org,
            name="Custom Assessor",
            permissions=["assessment:view", "evidence:upload", "report:view"],
        )
        membership = make_membership(user=user, organization=org, role=role)

        # Should have custom role permissions
        assert membership.has_permission("assessment:view") is True
        assert membership.has_permission("evidence:upload") is True
        assert membership.has_permission("report:view") is True

        # Should NOT have permissions not in custom role
        assert membership.has_permission("user:invite") is False
        assert membership.has_permission("assessment:delete") is False

    def test_membership_falls_back_to_fallback_role(
        self, make_user, make_org, make_membership
    ):
        """Membership should use fallback role permissions when no custom role."""
        user = make_user()
        org = make_org()
        membership = make_membership(
            user=user, organization=org, fallback_role="COORDINATOR"
        )

        # Coordinator permissions
        assert membership.has_permission("assessment:create") is True
        assert membership.has_permission("assessment:edit") is True
        assert membership.has_permission("report:view") is True
        assert membership.has_permission("report:export") is True
        assert membership.has_permission("evidence:upload") is True
        assert membership.has_permission("user:invite") is True

        # Should NOT have admin-only permissions
        assert membership.has_permission("user:remove") is False
        assert membership.has_permission("role:manage") is False
        assert membership.has_permission("assessment:delete") is False

    def test_membership_custom_role_overrides_fallback(
        self, make_user, make_org, make_membership, make_custom_role
    ):
        """Custom role permissions should override fallback role defaults."""
        user = make_user()
        org = make_org()
        # Create a custom role with LIMITED permissions (no user:invite)
        role = make_custom_role(
            organization=org,
            name="Limited Coordinator",
            permissions=["assessment:view"],
        )
        # Even with COORDINATOR fallback, custom role should take precedence
        membership = make_membership(
            user=user, organization=org, fallback_role="COORDINATOR", role=role
        )

        # Custom role only has assessment:view
        assert membership.has_permission("assessment:view") is True
        # Should NOT have COORDINATOR default permissions
        assert membership.has_permission("user:invite") is False
        assert membership.has_permission("assessment:create") is False

    def test_membership_admin_fallback_role(self, make_user, make_org, make_membership):
        """ADMIN fallback role should have all admin permissions."""
        user = make_user()
        org = make_org()
        membership = make_membership(user=user, organization=org, fallback_role="ADMIN")

        # Full admin permissions
        assert membership.has_permission("user:invite") is True
        assert membership.has_permission("user:remove") is True
        assert membership.has_permission("role:manage") is True
        assert membership.has_permission("org:settings") is True
        assert membership.has_permission("assessment:create") is True
        assert membership.has_permission("assessment:edit") is True
        assert membership.has_permission("assessment:delete") is True
        assert membership.has_permission("assessment:approve") is True
        assert membership.has_permission("report:view") is True
        assert membership.has_permission("report:export") is True
        assert membership.has_permission("evidence:upload") is True
        assert membership.has_permission("evidence:approve") is True

    def test_membership_operator_minimal_permissions(
        self, make_user, make_org, make_membership
    ):
        """OPERATOR fallback role should have minimal permissions."""
        user = make_user()
        org = make_org()
        membership = make_membership(
            user=user, organization=org, fallback_role="OPERATOR"
        )

        # Minimal permissions
        assert membership.has_permission("assessment:view") is True
        assert membership.has_permission("evidence:upload") is True

        # Should NOT have other permissions
        assert membership.has_permission("assessment:edit") is False
        assert membership.has_permission("report:view") is False
        assert membership.has_permission("user:invite") is False

    def test_membership_executive_read_only(self, make_user, make_org, make_membership):
        """EXECUTIVE fallback role should have read-only access."""
        user = make_user()
        org = make_org()
        membership = make_membership(
            user=user, organization=org, fallback_role="EXECUTIVE"
        )

        # Read-only permissions
        assert membership.has_permission("assessment:view") is True
        assert membership.has_permission("report:view") is True
        assert membership.has_permission("report:export") is True

        # No write permissions
        assert membership.has_permission("assessment:edit") is False
        assert membership.has_permission("evidence:upload") is False
        assert membership.has_permission("user:invite") is False


@pytest.mark.django_db
@pytest.mark.integrated
class TestHasPermissionClass:
    """Test HasPermission permission class."""

    def test_has_permission_success(
        self, make_user, make_org, make_membership, request_factory
    ):
        """HasPermission should allow users with the required permission."""
        user = make_user()
        org = make_org()
        make_membership(
            user=user,
            organization=org,
            fallback_role="ADMIN",  # Has user:invite
        )

        request = request_factory.get(f"/api/organizations/{org.id}/test/")
        request.user = user
        view = type("View", (), {"kwargs": {"org_pk": org.id}})()

        permission = HasPermission("user:invite")
        assert permission.has_permission(request, view) is True

    def test_has_permission_failure(
        self, make_user, make_org, make_membership, request_factory
    ):
        """HasPermission should deny users without the required permission."""
        user = make_user()
        org = make_org()
        make_membership(
            user=user,
            organization=org,
            fallback_role="OPERATOR",  # Does NOT have user:invite
        )

        request = request_factory.get(f"/api/organizations/{org.id}/test/")
        request.user = user
        view = type("View", (), {"kwargs": {"org_pk": org.id}})()

        permission = HasPermission("user:invite")
        assert permission.has_permission(request, view) is False

    def test_has_permission_superuser_bypass(
        self, superuser, make_org, request_factory
    ):
        """Superusers should bypass HasPermission checks."""
        org = make_org()

        request = request_factory.get(f"/api/organizations/{org.id}/test/")
        request.user = superuser
        view = type("View", (), {"kwargs": {"org_pk": org.id}})()

        permission = HasPermission("user:invite")
        assert permission.has_permission(request, view) is True

    def test_has_permission_no_membership(self, make_user, make_org, request_factory):
        """HasPermission should deny users without membership."""
        user = make_user()
        org = make_org()

        request = request_factory.get(f"/api/organizations/{org.id}/test/")
        request.user = user
        view = type("View", (), {"kwargs": {"org_pk": org.id}})()

        permission = HasPermission("user:invite")
        assert permission.has_permission(request, view) is False

    def test_has_permission_no_org_pk(
        self, make_user, make_org, make_membership, request_factory
    ):
        """HasPermission should return False when no org_pk is provided."""
        user = make_user()
        org = make_org()
        make_membership(user=user, organization=org, fallback_role="ADMIN")

        request = request_factory.get("/api/test/")
        request.user = user
        view = type("View", (), {"kwargs": {}})()

        permission = HasPermission("user:invite")
        assert permission.has_permission(request, view) is False


@pytest.mark.django_db
@pytest.mark.integrated
class TestIsOrganizationOwnerOrAdminWithPermissions:
    """Test IsOrganizationOwnerOrAdmin uses permission-based checks."""

    def test_admin_with_custom_role_manage_permission(
        self, make_user, make_org, make_membership, make_custom_role, request_factory
    ):
        """User with custom role having 'role:manage' should pass admin check."""
        user = make_user()
        org = make_org()
        role = make_custom_role(
            organization=org,
            name="Custom Admin",
            permissions=["role:manage", "user:invite", "org:settings"],
        )
        make_membership(user=user, organization=org, role=role)

        request = request_factory.get(f"/api/organizations/{org.id}/test/")
        request.user = user
        view = type("View", (), {"kwargs": {"org_pk": org.id}})()

        assert IsOrganizationOwnerOrAdmin().has_permission(request, view) is True

    def test_user_without_manage_permission_fails(
        self, make_user, make_org, make_membership, make_custom_role, request_factory
    ):
        """User with custom role lacking 'role:manage' should fail admin check."""
        user = make_user()
        org = make_org()
        role = make_custom_role(
            organization=org,
            name="Viewer",
            permissions=["assessment:view", "report:view"],
        )
        make_membership(user=user, organization=org, role=role)

        request = request_factory.get(f"/api/organizations/{org.id}/test/")
        request.user = user
        view = type("View", (), {"kwargs": {"org_pk": org.id}})()

        assert IsOrganizationOwnerOrAdmin().has_permission(request, view) is False

    def test_admin_fallback_role_still_works(
        self, make_user, make_org, make_membership, request_factory
    ):
        """ADMIN fallback role should still pass (backward compatibility)."""
        user = make_user()
        org = make_org()
        make_membership(user=user, organization=org, fallback_role="ADMIN")

        request = request_factory.get(f"/api/organizations/{org.id}/test/")
        request.user = user
        view = type("View", (), {"kwargs": {"org_pk": org.id}})()

        assert IsOrganizationOwnerOrAdmin().has_permission(request, view) is True


@pytest.mark.django_db
@pytest.mark.integrated
class TestDefaultRolePermissionMappings:
    """Test that default role permissions are correctly defined."""

    def test_assessor_permissions(self, make_user, make_org, make_membership):
        """Standard ASSESSOR role should not export reports by default."""
        user = make_user()
        org = make_org()
        membership = make_membership(
            user=user, organization=org, fallback_role="ASSESSOR"
        )

        assert membership.has_permission("assessment:view") is True
        assert membership.has_permission("assessment:edit") is True
        assert membership.has_permission("evidence:upload") is True
        assert membership.has_permission("evidence:review") is True
        assert membership.has_permission("report:view") is True
        assert membership.has_permission("report:export") is False

        # Should NOT have admin permissions
        assert membership.has_permission("user:invite") is False
        assert membership.has_permission("assessment:delete") is False

    def test_lead_assessor_can_export_reports(
        self, make_user, make_org, make_membership
    ):
        """Lead assessor flag should grant report export without broadening all assessors."""
        user = make_user()
        org = make_org()
        membership = make_membership(
            user=user,
            organization=org,
            fallback_role="ASSESSOR",
            is_lead_assessor=True,
        )

        assert membership.has_permission("report:view") is True
        assert membership.has_permission("report:export") is True

    def test_consultant_permissions(self, make_user, make_org, make_membership):
        """CONSULTANT role should have basic assessment permissions."""
        user = make_user()
        org = make_org()
        membership = make_membership(
            user=user, organization=org, fallback_role="CONSULTANT"
        )

        assert membership.has_permission("assessment:view") is True
        assert membership.has_permission("assessment:edit") is True
        assert membership.has_permission("evidence:upload") is True
        assert membership.has_permission("report:view") is True

        # Should NOT have review or admin permissions
        assert membership.has_permission("evidence:review") is False
        assert membership.has_permission("user:invite") is False
