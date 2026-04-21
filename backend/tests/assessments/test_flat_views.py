"""Tests for flat assessment views, including aggregate endpoint."""

import sys
from types import SimpleNamespace

import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from assessments.models import Assessment, AssessmentReport
from organizations.models import Organization, OrganizationMembership
from users.models import User
from users.roles import UserRole


@pytest.mark.django_db
class TestFlatAssessmentViewSet:
    """Test the FlatAssessmentViewSet and its aggregate endpoint."""

    def setup_method(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="test@example.com", password="testpass123", name="Test User"
        )

        # Create two organizations
        self.org1 = Organization.objects.create(name="Org 1", slug="org-1")
        self.org2 = Organization.objects.create(name="Org 2", slug="org-2")

        # Create memberships for both organizations
        self.membership1 = OrganizationMembership.objects.create(
            user=self.user, organization=self.org1, fallback_role=UserRole.OPERATOR
        )
        self.membership2 = OrganizationMembership.objects.create(
            user=self.user, organization=self.org2, fallback_role=UserRole.ASSESSOR
        )

        # Create assessments in both organizations
        self.assessment1 = Assessment.objects.create(
            organization=self.org1,
            start_date="2024-01-01T00:00:00Z",
            due_date="2024-12-31T23:59:59Z",
            created_by=self.user,
        )
        self.assessment2 = Assessment.objects.create(
            organization=self.org2,
            start_date="2024-01-01T00:00:00Z",
            due_date="2024-12-31T23:59:59Z",
            created_by=self.user,
        )

    def test_get_queryset_returns_all_user_assessments(self):
        """Test that get_queryset returns all assessments user has access to."""
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/assessments/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["results"]) == 2
        assessment_ids = {item["id"] for item in data["results"]}
        assert str(self.assessment1.id) in assessment_ids
        assert str(self.assessment2.id) in assessment_ids

    def test_get_queryset_filters_by_organization(self):
        """Test that get_queryset filters by organization when specified."""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(f"/api/assessments/?organization={self.org1.id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["results"]) == 1
        assert data["results"][0]["organization"] == str(self.org1.id)

    def test_aggregate_endpoint_returns_all_assessments(self):
        """Test that aggregate endpoint returns assessments from all user organizations."""
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/assessments/aggregate/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        assessment_ids = {item["id"] for item in data}
        assert str(self.assessment1.id) in assessment_ids
        assert str(self.assessment2.id) in assessment_ids

    def test_aggregate_endpoint_filters_by_specific_orgs(self):
        """Test that aggregate endpoint can filter by specific org IDs."""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(
            f"/api/assessments/aggregate/?org_ids={self.org1.id}"
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["organization"] == str(self.org1.id)

    def test_aggregate_endpoint_with_multiple_org_ids(self):
        """Test that aggregate endpoint works with multiple org IDs."""
        self.client.force_authenticate(user=self.user)

        org_ids = f"{self.org1.id},{self.org2.id}"
        response = self.client.get(f"/api/assessments/aggregate/?org_ids={org_ids}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        assessment_ids = {item["id"] for item in data}
        assert str(self.assessment1.id) in assessment_ids
        assert str(self.assessment2.id) in assessment_ids

    def test_aggregate_endpoint_does_not_leak_other_org_assessments(self):
        """Regular users cannot use org_ids to access assessments from other orgs."""
        other_org = Organization.objects.create(name="Other Org", slug="other-org")
        other_assessment = Assessment.objects.create(
            organization=other_org,
            start_date="2024-01-01T00:00:00Z",
            due_date="2024-12-31T23:59:59Z",
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/assessments/aggregate/?org_ids={other_org.id}"
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
        assert all(item["id"] != str(other_assessment.id) for item in data)

    def test_aggregate_endpoint_unauthenticated(self):
        """Test that aggregate endpoint returns 403 for unauthenticated users."""
        response = self.client.get("/api/assessments/aggregate/")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_aggregate_endpoint_no_memberships(self):
        """Test that aggregate endpoint returns empty when user has no memberships."""
        user_no_memberships = User.objects.create_user(
            email="no-memberships@example.com",
            password="testpass123",
            name="No Memberships User",
        )
        self.client.force_authenticate(user=user_no_memberships)
        response = self.client.get("/api/assessments/aggregate/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_aggregate_endpoint_with_superadmin(self):
        """Test that superadmin can see all assessments."""
        # Create another org and assessment that user shouldn't have access to
        org3 = Organization.objects.create(name="Org 3", slug="org-3")
        assessment3 = Assessment.objects.create(
            organization=org3,
            start_date="2024-01-01T00:00:00Z",
            due_date="2024-12-31T23:59:59Z",
        )

        superuser = User.objects.create_superuser(
            email="super2@example.com",  # Different email to avoid conflict
            password="superpass123",
            name="Super User 2",
        )

        self.client.force_authenticate(user=superuser)
        response = self.client.get("/api/assessments/aggregate/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Superadmin should see all assessments
        assert isinstance(data, list)
        assert len(data) == 3
        assessment_ids = {item["id"] for item in data}
        assert str(self.assessment1.id) in assessment_ids
        assert str(self.assessment2.id) in assessment_ids
        assert str(assessment3.id) in assessment_ids


@pytest.mark.django_db
class TestFlatAssessmentReportViewSet:
    def setup_method(self):
        self.client = APIClient()
        self.org = Organization.objects.create(name="Report Org", slug="report-org")

        self.viewer = User.objects.create_user(
            email="viewer@example.com",
            password="testpass123",
            name="Viewer",
        )
        self.no_report_user = User.objects.create_user(
            email="operator@example.com",
            password="testpass123",
            name="Operator",
        )
        self.exporter = User.objects.create_user(
            email="executive@example.com",
            password="testpass123",
            name="Executive",
        )

        OrganizationMembership.objects.create(
            user=self.viewer,
            organization=self.org,
            fallback_role=UserRole.ASSESSOR,
        )
        OrganizationMembership.objects.create(
            user=self.no_report_user,
            organization=self.org,
            fallback_role=UserRole.OPERATOR,
        )
        OrganizationMembership.objects.create(
            user=self.exporter,
            organization=self.org,
            fallback_role=UserRole.EXECUTIVE,
        )

        self.assessment = Assessment.objects.create(
            organization=self.org,
            start_date="2024-01-01T00:00:00Z",
            due_date="2024-12-31T23:59:59Z",
            created_by=self.viewer,
        )
        self.report = AssessmentReport.objects.create(
            organization=self.org,
            assessment=self.assessment,
            title="Assessment Report",
            executive_summary="Read me",
        )

    def authenticate_with_org_context(self, user):
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {access_token}",
            HTTP_X_ORGANIZATION_ID=str(self.org.id),
        )

    def test_list_requires_report_view_permission(self):
        self.client.force_authenticate(user=self.no_report_user)

        response = self.client.get(
            f"/api/reports/?assessment={self.assessment.id}&org={self.org.id}"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_allows_user_with_report_view_permission(self):
        self.client.force_authenticate(user=self.viewer)

        response = self.client.get(
            f"/api/reports/?assessment={self.assessment.id}&org={self.org.id}"
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["results"]) == 1
        assert data["results"][0]["id"] == str(self.report.id)

    def test_retrieve_requires_report_view_permission(self):
        self.client.force_authenticate(user=self.no_report_user)

        response = self.client.get(
            f"/api/reports/{self.report.id}/",
            HTTP_X_ORGANIZATION_ID=str(self.org.id),
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_retrieve_allows_user_with_report_view_permission(self):
        self.client.force_authenticate(user=self.viewer)

        response = self.client.get(
            f"/api/reports/{self.report.id}/",
            HTTP_X_ORGANIZATION_ID=str(self.org.id),
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["id"] == str(self.report.id)

    def test_export_requires_report_export_permission(self):
        self.authenticate_with_org_context(self.viewer)

        response = self.client.get(f"/api/reports/{self.report.id}/export/pdf/")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.json()["error"] == "Access denied"

    def test_export_allows_user_with_report_export_permission(self, monkeypatch):
        self.authenticate_with_org_context(self.exporter)

        class FakeReportGenerator:
            def __init__(self, report):
                self.report = report

            def generate_pdf(self):
                return b"%PDF-1.4 fake pdf bytes"

            def generate_filename(self):
                return "assessment-report.pdf"

        fake_reports_services = SimpleNamespace(
            ReportGenerator=FakeReportGenerator,
            ReportGenerationError=Exception,
        )
        monkeypatch.setitem(sys.modules, "reports.services", fake_reports_services)

        response = self.client.get(f"/api/reports/{self.report.id}/export/pdf/")

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/pdf"
        assert "assessment-report.pdf" in response["Content-Disposition"]
        assert response.content.startswith(b"%PDF-1.4")
