"""Isolated (unit) tests for User model — no DB required.

Tests pure Python logic: field introspection, choices, defaults.
"""

import pytest

from users.models import User


@pytest.mark.isolated
class TestUserModelIsolated:
    """User model logic that does not require a database."""

    def test_status_choices_exist(self):
        """User.Status enum should have expected values."""
        assert User.Status.PENDING is not None
        assert User.Status.ACTIVE is not None

    def test_username_field_is_email(self):
        """Django auth uses the USERNAME_FIELD for auth lookups."""
        assert User.USERNAME_FIELD == "email"

    def test_required_fields_are_minimal(self):
        """REQUIRED_FIELDS should be empty — email + password is enough."""
        assert User.REQUIRED_FIELDS == []

    def test_model_has_profile_fields(self):
        """Profile fields should be defined on the model class."""
        all_field_names = {f.name for f in User._meta.get_fields()}
        expected = {"biography", "country", "region", "direct_phone_number"}
        assert expected.issubset(
            all_field_names
        ), f"Missing profile fields: {expected - all_field_names}"
