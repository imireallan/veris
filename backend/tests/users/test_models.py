"""Tests for User model after multi-tenancy migration.

Verifies that the User model no longer has flat organization/role fields
and that profile fields are stored directly on the user.
"""

import pytest

from users.models import User


@pytest.mark.django_db
@pytest.mark.integrated
class TestUserModel:
    """User model should work without flat org/role fields."""

    def test_create_user_minimal(self):
        """Create a user with just email and password."""
        user = User.objects.create_user(email="test@example.com", password="pass123")
        assert user.pk is not None
        assert user.email == "test@example.com"
        assert user.is_active is True
        assert user.status == User.Status.PENDING

    def test_create_user_with_profile_fields(self):
        """Profile fields (biography, country, etc.) live on User directly."""
        user = User.objects.create_user(
            email="assessor@example.com",
            password="pass123",
            name="Jane Assessor",
            biography="Experienced sustainability assessor",
            country="GB",
            region="London",
            direct_phone_number="+44 20 1234 5678",
        )
        assert user.biography == "Experienced sustainability assessor"
        assert user.country == "GB"
        assert user.region == "London"
        assert user.direct_phone_number == "+44 20 1234 5678"

    def test_user_has_no_organization_field(self):
        """User model must NOT have a flat organization FK."""
        field_names = [f.name for f in User._meta.get_fields()]
        assert "organization" not in field_names, (
            "User model should not have a flat 'organization' field. "
            "Use OrganizationMembership instead."
        )

    def test_user_has_no_role_field(self):
        """User model must NOT have a flat role field — roles live on memberships."""
        field_names = [f.name for f in User._meta.get_fields()]
        assert "role" not in field_names, (
            "User model should not have a flat 'role' field. "
            "Roles are on OrganizationMembership."
        )

    def test_create_superuser_no_role_kwarg(self):
        """create_superuser should work without setting a 'role' field."""
        user = User.objects.create_superuser(
            email="admin@example.com",
            password="adminpass123",
        )
        assert user.is_staff is True
        assert user.is_superuser is True

    def test_user_str_repr(self):
        user = User.objects.create_user(
            email="str@test.com", password="pass", name="Test Name"
        )
        assert "str@test.com" in str(user)
        assert "Test Name" in str(user)
