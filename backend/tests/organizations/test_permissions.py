"""Tests for organization-scoped permissions.

Verifies that users can only access resources for organizations
they have a membership in.
"""

import pytest

from users.permissions import IsOrganizationMember, IsOrganizationOwnerOrAdmin


@pytest.mark.django_db
@pytest.mark.integrated
class TestOrganizationPermissions:
    """Test RBAC and membership-based access."""

    def test_is_organization_member_success(
        self, make_user, make_org, make_membership, request_factory
    ):
        """User with membership should be allowed."""
        user = make_user()
        org = make_org()
        make_membership(user=user, organization=org)

        request = request_factory.get(f"/api/organizations/{org.id}/")
        request.user = user
        view = type("View", (), {"kwargs": {"org_pk": org.id}})()

        assert IsOrganizationMember().has_permission(request, view) is True

    def test_is_organization_member_failure(self, make_user, make_org, request_factory):
        """User without membership should be denied."""
        user = make_user()
        org = make_org()

        request = request_factory.get(f"/api/organizations/{org.id}/")
        request.user = user
        view = type("View", (), {"kwargs": {"org_pk": org.id}})()

        assert IsOrganizationMember().has_permission(request, view) is False

    def test_superuser_bypass(self, superuser, make_org, request_factory):
        """Superusers should always be allowed regardless of membership."""
        org = make_org()

        request = request_factory.get(f"/api/organizations/{org.id}/")
        request.user = superuser
        view = type("View", (), {"kwargs": {"org_pk": org.id}})()

        assert IsOrganizationMember().has_permission(request, view) is True

    def test_is_org_owner_or_admin_success(
        self, make_user, make_org, make_membership, request_factory
    ):
        """User with ADMIN fallback role should be allowed."""
        user = make_user()
        org = make_org()
        make_membership(user=user, organization=org, fallback_role="ADMIN")

        request = request_factory.get(f"/api/organizations/{org.id}/")
        request.user = user
        view = type("View", (), {"kwargs": {"org_pk": org.id}})()

        assert IsOrganizationOwnerOrAdmin().has_permission(request, view) is True

    def test_is_org_owner_or_admin_failure(
        self, make_user, make_org, make_membership, request_factory
    ):
        """User with OPERATOR role should be denied Admin permission."""
        user = make_user()
        org = make_org()
        make_membership(user=user, organization=org, fallback_role="OPERATOR")

        request = request_factory.get(f"/api/organizations/{org.id}/")
        request.user = user
        view = type("View", (), {"kwargs": {"org_pk": org.id}})()

        assert IsOrganizationOwnerOrAdmin().has_permission(request, view) is False

    def test_is_org_owner_with_custom_role_admin(
        self, make_user, make_org, make_membership, make_custom_role, request_factory
    ):
        """User with CustomRole named 'Admin' should be allowed."""
        user = make_user()
        org = make_org()
        role = make_custom_role(organization=org, name="Admin")
        make_membership(user=user, organization=org, role=role)

        request = request_factory.get(f"/api/organizations/{org.id}/")
        request.user = user
        view = type("View", (), {"kwargs": {"org_pk": org.id}})()

        assert IsOrganizationOwnerOrAdmin().has_permission(request, view) is True

    def test_is_org_owner_or_admin_superuser_bypass(
        self, superuser, make_org, request_factory
    ):
        """Superuser should be allowed to perform org-admin actions without membership."""
        org = make_org()

        request = request_factory.get(f"/api/organizations/{org.id}/")
        request.user = superuser
        view = type("View", (), {"kwargs": {"org_pk": org.id}})()

        assert IsOrganizationOwnerOrAdmin().has_permission(request, view) is True
