"""Tests for OrganizationMembership and multi-tenancy model behavior.

Verifies that the through-table supports users belonging to multiple orgs
with different roles.
"""

import pytest

from organizations.models import OrganizationMembership
from users.models import User


@pytest.mark.django_db
@pytest.mark.integrated
class TestOrganizationMembership:
    """OrganizationMembership should support multi-org, multi-role users."""

    def test_user_belongs_to_multiple_orgs(self, make_user, make_org, make_membership):
        """A single user can have memberships in multiple organizations."""
        user = make_user()
        org_a = make_org(name="Org A", slug="org-a")
        org_b = make_org(name="Org B", slug="org-b")

        mem_a = make_membership(user=user, organization=org_a, fallback_role="ADMIN")
        mem_b = make_membership(
            user=user, organization=org_b, fallback_role="CONSULTANT"
        )

        memberships = OrganizationMembership.objects.filter(user=user)
        assert memberships.count() == 2
        assert mem_a.fallback_role == "ADMIN"
        assert mem_b.fallback_role == "CONSULTANT"

    def test_membership_unique_per_org(self, make_user, make_org, make_membership):
        """A user can only have one membership per organization."""
        user = make_user()
        org = make_org()
        make_membership(user=user, organization=org)

        with pytest.raises(Exception):
            # unique_together constraint should block this
            make_membership(user=user, organization=org)

    def test_membership_with_custom_role(
        self, make_user, make_org, make_membership, make_custom_role
    ):
        """Membership can link to a custom role with permissions."""
        user = make_user()
        org = make_org()
        custom_role = make_custom_role(
            organization=org,
            name="Lead Assessor",
            permissions=["assessment:review", "report:sign"],
        )
        membership = make_membership(user=user, organization=org, role=custom_role)

        assert membership.role == custom_role
        assert membership.role.name == "Lead Assessor"
        assert "assessment:review" in membership.role.permissions

    def test_membership_fallback_role_when_no_custom(
        self, make_user, make_org, make_membership
    ):
        """When no custom role, fallback_role is used."""
        user = make_user()
        org = make_org()
        membership = make_membership(
            user=user, organization=org, fallback_role="ASSESSOR"
        )

        assert membership.role is None
        assert membership.fallback_role == "ASSESSOR"

    def test_membership_lead_assessor_field(self, make_user, make_org, make_membership):
        """is_lead_assessor is a membership-level attribute."""
        user = make_user()
        org = make_org()
        membership = make_membership(user=user, organization=org, is_lead_assessor=True)

        assert membership.is_lead_assessor is True

    def test_membership_specializations(self, make_user, make_org, make_membership):
        """specializations is stored as JSON on the membership."""
        user = make_user()
        org = make_org()
        membership = make_membership(
            user=user,
            organization=org,
            specializations=["Environmental", "Social"],
        )

        membership.refresh_from_db()
        assert "Environmental" in membership.specializations

    def test_delete_org_cascades_memberships(
        self, make_user, make_org, make_membership
    ):
        """Deleting an org should delete its memberships but not the users."""
        user = make_user()
        org = make_org()
        make_membership(user=user, organization=org)

        org.delete()
        assert OrganizationMembership.objects.filter(user=user).count() == 0
        assert User.objects.filter(pk=user.pk).exists()

    def test_membership_str(self, make_user, make_org, make_membership):
        """Membership __str__ includes user email and org name."""
        user = make_user(email="test@mem.com")
        org = make_org(name="Member Org")
        membership = make_membership(user=user, organization=org)

        assert "test@mem.com" in str(membership)
        assert "Member Org" in str(membership)
