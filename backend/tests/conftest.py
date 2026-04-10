"""Shared test fixtures and factories for Veris test suite."""

import pytest
from django.test import RequestFactory
from rest_framework.test import APIRequestFactory

from organizations.models import CustomRole, Organization, OrganizationMembership
from users.models import User

# ── Factories ──────────────────────────────────────────────────────────────


@pytest.fixture
def api_factory():
    return APIRequestFactory()


@pytest.fixture
def request_factory():
    return RequestFactory()


@pytest.fixture
def make_user():
    """Create and return a user with a predictable email."""
    counter = {"n": 0}

    def _make(email=None, name=None, password="testpass123", **kwargs):
        counter["n"] += 1
        email = email or f"user{counter['n']}@test.com"
        name = name or f"Test User {counter['n']}"
        user = User.objects.create_user(
            email=email, password=password, name=name, **kwargs
        )
        return user

    return _make


@pytest.fixture
def make_org():
    """Create and return an organization."""
    counter = {"n": 0}

    def _make(name=None, slug=None, **kwargs):
        counter["n"] += 1
        name = name or f"Test Org {counter['n']}"
        slug = slug or f"test-org-{counter['n']}"
        org = Organization.objects.create(name=name, slug=slug, **kwargs)
        return org

    return _make


@pytest.fixture
def make_membership():
    """Create and return an OrganizationMembership."""

    def _make(user, organization, fallback_role="OPERATOR", role=None, **kwargs):
        return OrganizationMembership.objects.create(
            user=user,
            organization=organization,
            fallback_role=fallback_role,
            role=role,
            **kwargs,
        )

    return _make


@pytest.fixture
def make_custom_role():
    """Create and return a CustomRole."""

    def _make(organization, name="Admin", permissions=None, **kwargs):
        # Use provided permissions (including empty list) or default
        if permissions is None:
            permissions = ["user:invite", "report:edit"]
        return CustomRole.objects.create(
            organization=organization,
            name=name,
            permissions=permissions,
            **kwargs,
        )

    return _make


# ── Convenience composite fixtures ─────────────────────────────────────────


@pytest.fixture
def user_with_org(make_user, make_org, make_membership):
    """Return a tuple of (user, org, membership) — the basic multi-tenant unit."""

    def _make(fallback_role="OPERATOR"):
        user = make_user()
        org = make_org()
        membership = make_membership(
            user=user, organization=org, fallback_role=fallback_role
        )
        return user, org, membership

    return _make


@pytest.fixture
def admin_user(make_user, make_org, make_membership):
    """Return a tuple of (user, org, membership) where user is org ADMIN."""

    def _make():
        user = make_user()
        org = make_org()
        membership = make_membership(user=user, organization=org, fallback_role="ADMIN")
        return user, org, membership

    return _make


@pytest.fixture
def superuser():
    """Create and return a Django superuser."""
    return User.objects.create_superuser(
        email="super@test.com",
        password="superpass123",
        name="Super User",
    )
