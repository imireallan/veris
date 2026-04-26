"""Tests for organization terminology API wiring."""

import pytest
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from organizations.models import OrganizationTerminology


def authenticate(client, user):
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")


@pytest.mark.django_db
class TestOrganizationTerminologyAPI:
    def test_get_creates_and_returns_default_terminology_for_admin(
        self, admin_user, api_factory
    ):
        user, org, _membership = admin_user()
        client = api_factory
        authenticate(client, user)

        response = client.get(
            f"/api/organizations/{org.id}/terminology/",
            HTTP_X_ORGANIZATION_ID=str(org.id),
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["assessment_label"] == "Assessment"
        assert response.data["site_label"] == "Site"
        assert OrganizationTerminology.objects.filter(organization=org).exists()

    def test_patch_requires_org_settings_permission(self, user_with_org, api_factory):
        user, org, _membership = user_with_org(fallback_role="ASSESSOR")
        client = api_factory
        authenticate(client, user)

        response = client.patch(
            f"/api/organizations/{org.id}/terminology/",
            {"assessment_label": "Audit"},
            format="json",
            HTTP_X_ORGANIZATION_ID=str(org.id),
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_patch_updates_terminology_for_admin(self, admin_user, api_factory):
        user, org, _membership = admin_user()
        client = api_factory
        authenticate(client, user)

        response = client.patch(
            f"/api/organizations/{org.id}/terminology/",
            {
                "assessment_label": "Audit",
                "site_label": "Facility",
                "task_label": "Action",
                "evidence_label": "Document",
                "report_label": "Scorecard",
            },
            format="json",
            HTTP_X_ORGANIZATION_ID=str(org.id),
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["assessment_label"] == "Audit"
        assert response.data["site_label"] == "Facility"
        assert response.data["task_label"] == "Action"
        assert response.data["evidence_label"] == "Document"
        assert response.data["report_label"] == "Scorecard"

    def test_me_bootstrap_includes_active_terminology(self, admin_user, api_factory):
        user, org, _membership = admin_user()
        OrganizationTerminology.objects.create(
            organization=org,
            assessment_label="Audit",
            site_label="Facility",
            task_label="Action",
            evidence_label="Document",
            report_label="Scorecard",
        )
        client = api_factory
        authenticate(client, user)

        response = client.get(
            "/api/auth/me/",
            HTTP_X_ORGANIZATION_ID=str(org.id),
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["active_terminology"] == {
            "assessment_label": "Audit",
            "site_label": "Facility",
            "task_label": "Action",
            "evidence_label": "Document",
            "report_label": "Scorecard",
        }
