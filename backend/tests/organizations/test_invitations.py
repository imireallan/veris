"""Tests for invitation system.

Verifies that:
- Invitations can be created with custom/fallback roles
- Token-based acceptance works
- Email validation prevents duplicates
- Expiry and status checks work correctly
"""

import pytest
from django.utils import timezone

from organizations.models import Invitation, OrganizationMembership


@pytest.mark.django_db
@pytest.mark.integrated
class TestInvitationModel:
    """Test Invitation model methods."""

    def test_invitation_creation_with_fallback_role(self, make_user, make_org):
        """Invitation should be created with fallback role."""
        inviter = make_user()
        org = make_org()

        invitation = Invitation.objects.create(
            organization=org,
            email="test@example.com",
            fallback_role="COORDINATOR",
            invited_by=inviter,
        )

        assert invitation.token is not None
        assert len(invitation.token) > 0
        assert invitation.status == Invitation.Status.PENDING
        assert invitation.fallback_role == "COORDINATOR"
        assert invitation.role is None

    def test_invitation_creation_with_custom_role(
        self, make_user, make_org, make_custom_role
    ):
        """Invitation should be created with custom role."""
        inviter = make_user()
        org = make_org()
        role = make_custom_role(organization=org, name="Custom Role")

        invitation = Invitation.objects.create(
            organization=org,
            email="test@example.com",
            role=role,
            fallback_role="OPERATOR",
            invited_by=inviter,
        )

        assert invitation.role == role
        assert invitation.fallback_role == "OPERATOR"

    def test_invitation_is_expired(self, make_user, make_org):
        """Invitation should detect expiry correctly."""
        inviter = make_user()
        org = make_org()

        # Create invitation that expires in 7 days (default)
        invitation = Invitation.objects.create(
            organization=org,
            email="test@example.com",
            invited_by=inviter,
        )

        assert invitation.is_expired() is False

        # Manually set to expired
        invitation.expires_at = timezone.now() - timezone.timedelta(days=1)
        invitation.save()

        assert invitation.is_expired() is True

    def test_invitation_accept_success(self, make_user, make_org):
        """Invitation.accept() should create membership."""
        inviter = make_user()
        org = make_org()
        invitee = make_user(email="test@example.com")

        invitation = Invitation.objects.create(
            organization=org,
            email="test@example.com",
            fallback_role="COORDINATOR",
            invited_by=inviter,
        )

        result = invitation.accept(invitee)

        assert result is True
        assert invitation.status == Invitation.Status.ACCEPTED
        assert invitation.accepted_at is not None

        # Check membership was created
        membership = OrganizationMembership.objects.get(user=invitee, organization=org)
        assert membership.fallback_role == "COORDINATOR"

    def test_invitation_accept_with_custom_role(
        self, make_user, make_org, make_custom_role
    ):
        """Invitation with custom role should create membership with that role."""
        inviter = make_user()
        org = make_org()
        role = make_custom_role(organization=org, name="Custom Assessor")
        invitee = make_user(email="test@example.com")

        invitation = Invitation.objects.create(
            organization=org,
            email="test@example.com",
            role=role,
            fallback_role="OPERATOR",
            invited_by=inviter,
        )

        invitation.accept(invitee)

        membership = OrganizationMembership.objects.get(user=invitee, organization=org)
        assert membership.role == role

    def test_invitation_accept_already_accepted(self, make_user, make_org):
        """Cannot accept invitation twice."""
        inviter = make_user()
        org = make_org()
        invitee = make_user(email="test@example.com")

        invitation = Invitation.objects.create(
            organization=org,
            email="test@example.com",
            invited_by=inviter,
        )

        # First accept
        assert invitation.accept(invitee) is True

        # Second accept should fail
        assert invitation.accept(invitee) is False
        assert invitation.status == Invitation.Status.ACCEPTED

    def test_invitation_accept_expired(self, make_user, make_org):
        """Expired invitation cannot be accepted."""
        inviter = make_user()
        org = make_org()
        invitee = make_user(email="test@example.com")

        invitation = Invitation.objects.create(
            organization=org,
            email="test@example.com",
            invited_by=inviter,
        )
        invitation.expires_at = timezone.now() - timezone.timedelta(days=1)
        invitation.save()

        result = invitation.accept(invitee)

        assert result is False
        assert invitation.status == Invitation.Status.EXPIRED

    def test_invitation_decline(self, make_user, make_org):
        """Invitation can be declined."""
        inviter = make_user()
        org = make_org()

        invitation = Invitation.objects.create(
            organization=org,
            email="test@example.com",
            invited_by=inviter,
        )

        result = invitation.decline()

        assert result is True
        assert invitation.status == Invitation.Status.DECLINED


@pytest.mark.django_db
@pytest.mark.integrated
class TestInvitationViewSet:
    def test_list_invitations(self, api_factory, make_user, make_org, make_membership):
        """Admin can list invitations."""
        admin = make_user()
        org = make_org()
        make_membership(user=admin, organization=org, fallback_role="ADMIN")

        Invitation.objects.create(
            organization=org,
            email="test@example.com",
            invited_by=admin,
        )

        api_factory.force_authenticate(user=admin)
        response = api_factory.get(f"/api/organizations/{org.id}/invitations/")

        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["email"] == "test@example.com"

    def test_create_invitation(self, api_factory, make_user, make_org, make_membership):
        """Admin can create invitation."""
        admin = make_user()
        org = make_org()
        make_membership(user=admin, organization=org, fallback_role="ADMIN")

        api_factory.force_authenticate(user=admin)
        response = api_factory.post(
            f"/api/organizations/{org.id}/invitations/",
            {
                "email": "newuser@example.com",
                "fallback_role": "COORDINATOR",
            },
            format="json",
        )

        assert response.status_code == 201
        assert response.data["email"] == "newuser@example.com"
        assert response.data["fallback_role"] == "COORDINATOR"

    def test_create_duplicate_invitation_fails(
        self, api_factory, make_user, make_org, make_membership
    ):
        """Cannot create duplicate invitation for same email."""
        admin = make_user()
        org = make_org()
        make_membership(user=admin, organization=org, fallback_role="ADMIN")

        # Create first invitation
        Invitation.objects.create(
            organization=org,
            email="test@example.com",
            invited_by=admin,
        )

        # Try to create duplicate
        api_factory.force_authenticate(user=admin)
        response = api_factory.post(
            f"/api/organizations/{org.id}/invitations/",
            {"email": "test@example.com", "fallback_role": "OPERATOR"},
            format="json",
        )

        assert response.status_code == 400
        assert "already been sent" in str(response.data)

    def test_non_admin_cannot_create_invitation(
        self, api_factory, make_user, make_org, make_membership
    ):
        """Non-admin users cannot create invitations."""
        user = make_user()
        org = make_org()
        make_membership(user=user, organization=org, fallback_role="OPERATOR")

        api_factory.force_authenticate(user=user)
        response = api_factory.post(
            f"/api/organizations/{org.id}/invitations/",
            {"email": "test@example.com", "fallback_role": "OPERATOR"},
            format="json",
        )

        assert response.status_code == 403

    def test_revoke_invitation(self, api_factory, make_user, make_org, make_membership):
        """Admin can revoke pending invitation."""
        admin = make_user()
        org = make_org()
        make_membership(user=admin, organization=org, fallback_role="ADMIN")

        invitation = Invitation.objects.create(
            organization=org,
            email="test@example.com",
            invited_by=admin,
        )

        api_factory.force_authenticate(user=admin)
        response = api_factory.post(
            f"/api/organizations/{org.id}/invitations/{invitation.id}/revoke/"
        )

        assert response.status_code == 200
        invitation.refresh_from_db()
        assert invitation.status == Invitation.Status.DECLINED

    def test_superuser_can_create_invitation_without_membership(
        self, api_factory, superuser, make_org
    ):
        """Platform superuser can invite into an org without belonging to it."""
        org = make_org()

        api_factory.force_authenticate(user=superuser)
        response = api_factory.post(
            f"/api/organizations/{org.id}/invitations/",
            {
                "email": "super-invited@example.com",
                "fallback_role": "ADMIN",
            },
            format="json",
            HTTP_X_ORGANIZATION_ID=str(org.id),
        )

        assert response.status_code == 201
        assert response.data["email"] == "super-invited@example.com"
        assert response.data["fallback_role"] == "ADMIN"


@pytest.mark.django_db
@pytest.mark.integrated
class TestInvitationAcceptView:
    """Test standalone invitation acceptance endpoints."""

    def test_check_invitation_valid(self, api_factory, make_user, make_org):
        """GET invitation token returns details."""
        inviter = make_user()
        org = make_org()

        invitation = Invitation.objects.create(
            organization=org,
            email="test@example.com",
            fallback_role="COORDINATOR",
            invited_by=inviter,
        )

        response = api_factory.get(f"/api/invitations/{invitation.token}/")

        assert response.status_code == 200
        assert response.data["email"] == "test@example.com"
        assert response.data["organization"]["name"] == org.name
        assert response.data["role_name"] == "Coordinator"
        assert response.data["status"] == Invitation.Status.PENDING
        assert response.data["needs_onboarding"] is True

    def test_check_invitation_existing_user_needs_no_onboarding(
        self, api_factory, make_user, make_org
    ):
        """Existing users with passwords should not be sent through onboarding."""
        inviter = make_user()
        org = make_org()
        make_user(email="test@example.com", password="securepass123")

        invitation = Invitation.objects.create(
            organization=org,
            email="test@example.com",
            fallback_role="COORDINATOR",
            invited_by=inviter,
        )

        response = api_factory.get(f"/api/invitations/{invitation.token}/")

        assert response.status_code == 200
        assert response.data["has_existing_account"] is True
        assert response.data["needs_onboarding"] is False

    def test_check_invitation_invalid_token(self, api_factory):
        """Invalid token returns 404."""
        response = api_factory.get("/api/invitations/invalid-token/")

        assert response.status_code == 404

    def test_check_invitation_expired(self, api_factory, make_user, make_org):
        """Expired invitation returns 410."""
        inviter = make_user()
        org = make_org()

        invitation = Invitation.objects.create(
            organization=org,
            email="test@example.com",
            invited_by=inviter,
        )
        invitation.expires_at = timezone.now() - timezone.timedelta(days=1)
        invitation.save()

        response = api_factory.get(f"/api/invitations/{invitation.token}/")

        assert response.status_code == 410
        assert "expired" in str(response.data["detail"]).lower()

    def test_accept_invitation_success(self, api_factory, make_user, make_org):
        """Valid user can accept invitation."""
        inviter = make_user()
        org = make_org()
        invitee = make_user(email="test@example.com")

        invitation = Invitation.objects.create(
            organization=org,
            email="test@example.com",
            fallback_role="COORDINATOR",
            invited_by=inviter,
        )

        api_factory.force_authenticate(user=invitee)
        response = api_factory.post(f"/api/invitations/{invitation.token}/accept/")

        assert response.status_code == 200
        assert "accepted" in str(response.data["detail"]).lower()
        assert response.data["needs_onboarding"] is False

        # Verify membership created
        assert OrganizationMembership.objects.filter(
            user=invitee, organization=org
        ).exists()

    def test_accept_invitation_email_mismatch(self, api_factory, make_user, make_org):
        """User with different email cannot accept."""
        inviter = make_user()
        org = make_org()
        wrong_user = make_user(email="wrong@example.com")

        invitation = Invitation.objects.create(
            organization=org,
            email="test@example.com",
            invited_by=inviter,
        )

        api_factory.force_authenticate(user=wrong_user)
        response = api_factory.post(f"/api/invitations/{invitation.token}/accept/")

        assert response.status_code == 403
        assert "email does not match" in str(response.data["detail"]).lower()

    def test_accept_invitation_unauthenticated(self, api_factory, make_user, make_org):
        """Unauthenticated user cannot accept invitation."""
        inviter = make_user()
        org = make_org()

        invitation = Invitation.objects.create(
            organization=org,
            email="test@example.com",
            invited_by=inviter,
        )

        response = api_factory.post(f"/api/invitations/{invitation.token}/accept/")

        assert response.status_code == 401

    def test_decline_invitation(self, api_factory, make_user, make_org):
        """Anyone can decline invitation."""
        inviter = make_user()
        org = make_org()

        invitation = Invitation.objects.create(
            organization=org,
            email="test@example.com",
            invited_by=inviter,
        )

        response = api_factory.post(f"/api/invitations/{invitation.token}/decline/")

        assert response.status_code == 200
        assert "declined" in str(response.data["detail"]).lower()

        invitation.refresh_from_db()
        assert invitation.status == Invitation.Status.DECLINED
