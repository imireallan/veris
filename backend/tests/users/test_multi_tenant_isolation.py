"""
Tests for multi-tenant data isolation in UserViewSet.
Ensures users can only see data from organizations they belong to.
"""

import pytest
from rest_framework import status

from assessments.models import Assessment


@pytest.mark.django_db
class TestUserViewSetMultiTenant:
    """Test UserViewSet organization scoping."""

    def test_superuser_sees_all_users(
        self, api_factory, make_user, make_org, make_membership, superuser
    ):
        """Superusers can see all users across all organizations."""
        org1 = make_org(name="Org 1")
        org2 = make_org(name="Org 2")
        user1 = make_user(email="user1@org1.com")
        user2 = make_user(email="user2@org2.com")
        make_membership(user=user1, organization=org1, fallback_role="ADMIN")
        make_membership(user=user2, organization=org2, fallback_role="ADMIN")

        client = api_factory
        client.force_authenticate(user=superuser)
        url = "/api/users/"
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 3  # superuser + user1 + user2

    def test_user_sees_only_org_members(
        self, api_factory, make_user, make_org, make_membership
    ):
        """Regular users only see members of their organization."""
        org1 = make_org(name="Org 1")
        org2 = make_org(name="Org 2")
        user1 = make_user(email="user1@org1.com")
        user2 = make_user(email="user2@org1.com")
        user3 = make_user(email="user3@org2.com")
        make_membership(user=user1, organization=org1, fallback_role="ADMIN")
        make_membership(user=user2, organization=org1, fallback_role="OPERATOR")
        make_membership(user=user3, organization=org2, fallback_role="ADMIN")

        client = api_factory
        client.force_authenticate(user=user1)
        url = "/api/users/"
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Should only see user1 and user2 (both in org1)
        assert len(response.data["results"]) == 2
        emails = [u["email"] for u in response.data["results"]]
        assert user1.email in emails
        assert user2.email in emails
        assert user3.email not in emails

    def test_user_sees_users_from_specific_org(
        self, api_factory, make_user, make_org, make_membership
    ):
        """Users can filter by specific organization they belong to."""
        org1 = make_org(name="Org 1")
        org2 = make_org(name="Org 2")
        user1 = make_user(email="user1@multi.com")
        user2 = make_user(email="user2@org1.com")
        user3 = make_user(email="user3@org2.com")
        # user1 belongs to both orgs
        make_membership(user=user1, organization=org1, fallback_role="ADMIN")
        make_membership(user=user1, organization=org2, fallback_role="ADMIN")
        make_membership(user=user2, organization=org1, fallback_role="OPERATOR")
        make_membership(user=user3, organization=org2, fallback_role="OPERATOR")

        client = api_factory
        client.force_authenticate(user=user1)
        # Filter by org1
        url = "/api/users/"
        response = client.get(url, {"organization": str(org1.id)})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 2
        emails = [u["email"] for u in response.data["results"]]
        assert user1.email in emails
        assert user2.email in emails
        assert user3.email not in emails

    def test_user_cannot_access_other_org(
        self, api_factory, make_user, make_org, make_membership
    ):
        """Users cannot access users from organizations they don't belong to."""
        org1 = make_org(name="Org 1")
        org2 = make_org(name="Org 2")
        user1 = make_user(email="user1@org1.com")
        user2 = make_user(email="user2@org2.com")
        make_membership(user=user1, organization=org1, fallback_role="ADMIN")
        make_membership(user=user2, organization=org2, fallback_role="ADMIN")

        client = api_factory
        client.force_authenticate(user=user1)
        # Try to access org2 users
        url = "/api/users/"
        response = client.get(url, {"organization": str(org2.id)})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 0  # Empty list, not 403
        assert response.data["count"] == 0

    def test_me_endpoint_returns_memberships(
        self, api_factory, make_user, make_org, make_membership
    ):
        """The /me endpoint returns all user memberships with role info."""
        user = make_user(email="test@user.com", name="Test User")
        org1 = make_org(name="Org 1", slug="org1")
        org2 = make_org(name="Org 2", slug="org2")
        make_membership(user=user, organization=org1, fallback_role="ADMIN")
        make_membership(user=user, organization=org2, fallback_role="OPERATOR")

        client = api_factory
        client.force_authenticate(user=user)
        url = "/api/auth/me/"
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == user.email
        assert "full_name" in response.data  # API returns full_name, not name
        assert len(response.data["organizations"]) == 2

        org_data = {org["name"]: org for org in response.data["organizations"]}
        assert org_data["Org 1"]["fallback_role"] == "ADMIN"
        assert org_data["Org 2"]["fallback_role"] == "OPERATOR"

    def test_accessible_organizations_endpoint_returns_memberships(
        self, api_factory, make_user, make_org, make_membership
    ):
        user = make_user(email="test@user.com", name="Test User")
        org1 = make_org(name="Org 1", slug="org1")
        org2 = make_org(name="Org 2", slug="org2")
        make_membership(user=user, organization=org1, fallback_role="ADMIN")
        make_membership(user=user, organization=org2, fallback_role="ASSESSOR")

        client = api_factory
        client.force_authenticate(user=user)
        response = client.get("/api/organizations/accessible/")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        org_data = {org["name"]: org for org in response.data}
        assert org_data["Org 1"]["fallback_role"] == "ADMIN"
        assert org_data["Org 2"]["fallback_role"] == "ASSESSOR"

    def test_accessible_organizations_endpoint_returns_all_orgs_for_superuser(
        self, api_factory, make_org, superuser
    ):
        org1 = make_org(name="Org 1", slug="org1")
        org2 = make_org(name="Org 2", slug="org2")

        client = api_factory
        client.force_authenticate(user=superuser)
        response = client.get("/api/organizations/accessible/")

        assert response.status_code == status.HTTP_200_OK
        org_data = {org["name"]: org for org in response.data}
        assert org_data[org1.name]["fallback_role"] == "SUPERADMIN"
        assert org_data[org2.name]["fallback_role"] == "SUPERADMIN"

    def test_superuser_can_list_org_members_without_membership(
        self, api_factory, make_org, make_user, make_membership, superuser
    ):
        """Platform admins can inspect org members without tenant membership."""
        org = make_org(name="Bettercoal", slug="bettercoal")
        member = make_user(email="client-admin@bettercoal.test")
        make_membership(user=member, organization=org, fallback_role="ADMIN")

        client = api_factory
        client.force_authenticate(user=superuser)
        response = client.get(f"/api/organizations/{org.id}/members/")

        assert response.status_code == status.HTTP_200_OK
        data = response.data["results"] if "results" in response.data else response.data
        emails = [row["user_email"] for row in data]
        assert "client-admin@bettercoal.test" in emails

    def test_superuser_can_list_org_invitations_without_membership(
        self, api_factory, make_org, superuser
    ):
        """Platform admins can inspect org invitations without tenant membership."""
        org = make_org(name="EO100", slug="eo100")

        client = api_factory
        client.force_authenticate(user=superuser)
        response = client.get(f"/api/organizations/{org.id}/invitations/")

        assert response.status_code == status.HTTP_200_OK

    def test_cannot_invite_existing_superuser_to_org(
        self, api_factory, make_org, make_user, make_membership, superuser
    ):
        """Tenant invitations must not attach platform admins to client orgs."""
        org = make_org(name="CGWG", slug="cgwg")
        admin = make_user(email="admin@cgwg.test")
        make_membership(user=admin, organization=org, fallback_role="ADMIN")

        client = api_factory
        client.force_authenticate(user=admin)
        response = client.post(
            f"/api/organizations/{org.id}/invitations/",
            {"email": superuser.email, "fallback_role": "OPERATOR"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Platform admins cannot be invited" in str(response.data)

    def test_superuser_cannot_accept_org_invitation(
        self, api_factory, make_org, superuser
    ):
        """Even legacy/manual pending invites cannot create superuser memberships."""
        from organizations.models import Invitation, OrganizationMembership

        org = make_org(name="Legacy Invite Org", slug="legacy-invite-org")
        invitation = Invitation.objects.create(
            organization=org,
            email=superuser.email,
            invited_by=superuser,
            fallback_role="OPERATOR",
        )

        client = api_factory
        client.force_authenticate(user=superuser)
        response = client.post(f"/api/invitations/{invitation.token}/accept/")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Platform admins cannot accept tenant invitations" in str(response.data)
        assert not OrganizationMembership.objects.filter(
            user=superuser,
            organization=org,
        ).exists()


@pytest.mark.django_db
class TestAssessmentViewSetMultiTenant:
    """Test AssessmentViewSet organization scoping."""

    def test_user_sees_only_org_assessments(
        self, api_factory, make_user, make_org, make_membership
    ):
        """Users only see assessments from their organization."""
        from datetime import timedelta

        from django.utils import timezone

        org1 = make_org(name="Org 1")
        org2 = make_org(name="Org 2")
        user1 = make_user(email="user1@org1.com")
        user2 = make_user(email="user2@org2.com")
        make_membership(user=user1, organization=org1, fallback_role="ADMIN")
        make_membership(user=user2, organization=org2, fallback_role="ADMIN")

        # Create assessments
        now = timezone.now()
        a1 = Assessment.objects.create(
            organization=org1,
            created_by=user1,
            framework_id=None,
            start_date=now,
            due_date=now + timedelta(days=30),
        )

        client = api_factory
        client.force_authenticate(user=user1)
        url = f"/api/organizations/{org1.id}/assessments/"
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["id"] == str(a1.id)

    def test_user_cannot_see_other_org_assessments(
        self, api_factory, make_user, make_org, make_membership
    ):
        """Users cannot see assessments from other organizations."""

        org1 = make_org(name="Org 1")
        org2 = make_org(name="Org 2")
        user1 = make_user(email="user1@org1.com")
        make_membership(user=user1, organization=org1, fallback_role="ADMIN")

        # Create assessment in org2
        user2 = make_user(email="user2@org2.com")
        make_membership(user=user2, organization=org2, fallback_role="ADMIN")

        client = api_factory
        client.force_authenticate(user=user1)
        url = f"/api/organizations/{org2.id}/assessments/"
        response = client.get(url)

        # Should get 403 or empty list
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN]
        if response.status_code == status.HTTP_200_OK:
            assert len(response.data["results"]) == 0


@pytest.mark.django_db
class TestFlatAssessmentViewSetMultiTenant:
    """Test FlatAssessmentViewSet organization scoping."""

    def test_flat_assessments_scoped_to_user_orgs(
        self, api_factory, make_user, make_org, make_membership
    ):
        """Flat assessment endpoint returns only org-scoped assessments."""
        from datetime import timedelta

        from django.utils import timezone

        org1 = make_org(name="Org 1")
        org2 = make_org(name="Org 2")
        user1 = make_user(email="user1@org1.com")
        user2 = make_user(email="user2@org2.com")
        make_membership(user=user1, organization=org1, fallback_role="ADMIN")
        make_membership(user=user2, organization=org2, fallback_role="ADMIN")

        # Create assessments
        now = timezone.now()
        a1 = Assessment.objects.create(
            organization=org1,
            created_by=user1,
            framework_id=None,
            start_date=now,
            due_date=now + timedelta(days=30),
        )

        client = api_factory
        client.force_authenticate(user=user1)
        url = "/api/assessments/"
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Should only see org1 assessments
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["id"] == str(a1.id)
