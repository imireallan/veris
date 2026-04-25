"""Tests for the demo seed management command."""

import pytest
from django.core.management import call_command

from organizations.models import CustomRole, Organization, OrganizationMembership
from users.models import User


@pytest.mark.django_db
@pytest.mark.integrated
class TestSeedCommand:
    def test_seed_creates_e2e_org_admin_qa_users_with_all_demo_roles(self):
        call_command("seed")

        org = Organization.objects.get(slug="e2e-org-admin-qa")
        assert str(org.id) == "03abc363-bf7a-4d3e-a5a2-dd47b8d37ccc"
        assert org.name == "E2E Org Admin QA"

        expected_users = {
            "allanimire+veris-e2e-org-admin@gmail.com": "ADMIN",
            "allanimire+veris-e2e-coordinator@gmail.com": "COORDINATOR",
            "allanimire+veris-e2e-executive@gmail.com": "EXECUTIVE",
            "allanimire+veris-e2e-consultant@gmail.com": "CONSULTANT",
            "allanimire+veris-e2e-operator@gmail.com": "OPERATOR",
            "allanimire+veris-e2e-assessor@gmail.com": "ASSESSOR",
        }

        memberships = {}
        for email, fallback_role in expected_users.items():
            user = User.objects.get(email=email)
            membership = OrganizationMembership.objects.get(user=user, organization=org)
            memberships[email] = membership
            assert membership.fallback_role == fallback_role
            assert membership.status == OrganizationMembership.Status.ACTIVE

        admin_role = CustomRole.objects.get(
            organization=org,
            key="eo-e2e-org-admin",
        )
        assert admin_role.name == "EO E2E Org Admin"
        assert admin_role.is_system_role is True
        assert (
            memberships["allanimire+veris-e2e-org-admin@gmail.com"].role == admin_role
        )

    def test_seed_does_not_create_superuser_tenant_memberships(self):
        call_command("seed")

        admin_user = User.objects.get(email="admin@example.com")
        assert admin_user.is_superuser is True
        assert not OrganizationMembership.objects.filter(user=admin_user).exists()
