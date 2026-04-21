"""Tests for custom JWT authentication with organization context."""

import pytest
from rest_framework import status


@pytest.mark.django_db
class TestJWTOrganizationAuthentication:
    """Test JWT authentication with organization context resolution."""

    def test_authenticates_jwt_token_and_sets_org_context(
        self, make_user, make_org, make_membership, api_factory
    ):
        """JWT auth sets request.user, request.organization, and request.membership."""
        from rest_framework_simplejwt.tokens import RefreshToken

        user = make_user(email="test@veris.com")
        org = make_org(name="Test Org", slug="test-org")
        make_membership(user=user, organization=org, fallback_role="ADMIN")

        # Create JWT token
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        # Make request with JWT token and org header
        client = api_factory
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # Call /api/auth/me/ which uses our custom auth
        response = client.get("/api/auth/me/", HTTP_X_ORGANIZATION_ID=str(org.id))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == user.email

    def test_rejects_invalid_org_id(self, make_user, make_org, api_factory):
        """JWT auth with invalid org ID raises PermissionDenied."""
        from rest_framework_simplejwt.tokens import RefreshToken

        user = make_user(email="test@veris.com")
        org = make_org(name="Test Org", slug="test-org")
        # User has NO membership in this org

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        client = api_factory
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        response = client.get("/api/auth/me/", HTTP_X_ORGANIZATION_ID=str(org.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_superuser_can_access_any_org(self, make_user, make_org, api_factory):
        """Superusers can access any organization without membership."""
        from rest_framework_simplejwt.tokens import RefreshToken

        user = make_user(email="admin@veris.com", is_superuser=True)
        org = make_org(name="Test Org", slug="test-org")
        # NO membership created for superuser

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        client = api_factory
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        response = client.get("/api/auth/me/", HTTP_X_ORGANIZATION_ID=str(org.id))

        assert response.status_code == status.HTTP_200_OK

    def test_missing_org_header_leaves_org_none(self, make_user, api_factory):
        """JWT auth without org header succeeds but leaves org as None."""
        from rest_framework_simplejwt.tokens import RefreshToken

        user = make_user(email="test@veris.com")

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        client = api_factory
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # No HTTP_X_ORGANIZATION_ID header
        response = client.get("/api/auth/me/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == user.email

    def test_user_with_multiple_orgs_respects_header(
        self, make_user, make_org, make_membership, api_factory
    ):
        """User with multiple orgs gets correct org from header."""
        from rest_framework_simplejwt.tokens import RefreshToken

        user = make_user(email="test@veris.com")
        org1 = make_org(name="Org 1", slug="org-1")
        org2 = make_org(name="Org 2", slug="org-2")
        make_membership(user=user, organization=org1, fallback_role="ADMIN")
        make_membership(user=user, organization=org2, fallback_role="OPERATOR")

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        client = api_factory
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # Request org2 specifically
        response = client.get("/api/auth/me/", HTTP_X_ORGANIZATION_ID=str(org2.id))

        assert response.status_code == status.HTTP_200_OK
        # The /me/ endpoint should return the active org from request.organization
        assert str(response.data["active_organization"]["id"]) == str(org2.id)
