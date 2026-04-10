import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class Organization(models.Model):
    """Multi-tenant organization (tenant) model."""

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        SUSPENDED = "SUSPENDED", "Suspended"
        TRIAL = "TRIAL", "Trial"

    class SubscriptionTier(models.TextChoices):
        FREE = "FREE", "Free"
        STANDARD = "STANDARD", "Standard"
        ENTERPRISE = "ENTERPRISE", "Enterprise"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=500)
    slug = models.SlugField(max_length=500, unique=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.TRIAL
    )
    subscription_tier = models.CharField(
        max_length=20, choices=SubscriptionTier.choices, default=SubscriptionTier.FREE
    )
    custom_domain = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organizations"
        ordering = ["name"]
        verbose_name = "Organization"
        verbose_name_plural = "Organizations"

    def __str__(self):
        return self.name


class CustomRole(models.Model):
    """Organization-specific roles with custom names and permission sets."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="custom_roles"
    )
    name = models.CharField(max_length=100)
    permissions = models.JSONField(
        default=list,
        help_text="List of permission keys, e.g., ['user:invite', 'report:edit']",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "custom_roles"
        unique_together = ("organization", "name")
        verbose_name = "Custom Role"
        verbose_name_plural = "Custom Roles"

    def __str__(self):
        return f"{self.name} ({self.organization.name})"

    def has_permission(self, permission_key: str) -> bool:
        """Check if this role has a specific permission."""
        return permission_key in self.permissions


class OrganizationMembership(models.Model):
    """Through-table enabling users to belong to multiple organizations with different roles."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memberships"
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="members"
    )
    # Link to the custom role for this specific org
    role = models.ForeignKey(
        CustomRole, on_delete=models.SET_NULL, null=True, blank=True
    )
    # Fallback to standard roles if no custom role is assigned
    fallback_role = models.CharField(
        max_length=20,
        choices=[
            ("ADMIN", "Admin"),
            ("COORDINATOR", "Coordinator"),
            ("OPERATOR", "Operator"),
            ("EXECUTIVE", "Executive"),
            ("ASSESSOR", "Assessor"),
            ("CONSULTANT", "Consultant"),
        ],
        default="OPERATOR",
    )

    # Membership-specific attributes (Merged from AssessorProfile)
    is_lead_assessor = models.BooleanField(default=False)
    specializations = models.JSONField(default=list, blank=True)
    current_organisation_name = models.CharField(max_length=255, blank=True, null=True)

    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "organization_memberships"
        unique_together = ("user", "organization")
        verbose_name = "Organization Membership"
        verbose_name_plural = "Organization Memberships"

    def __str__(self):
        return f"{self.user.email} @ {self.organization.name}"

    def has_permission(self, permission_key: str) -> bool:
        """
        Check if this membership grants a specific permission.
        Prioritizes custom role permissions, falls back to fallback_role defaults.
        """
        # If custom role exists, use its permissions
        if self.role:
            return self.role.has_permission(permission_key)

        # Fallback: map fallback_role to default permissions
        DEFAULT_ROLE_PERMISSIONS = {
            "ADMIN": [
                "user:invite",
                "user:remove",
                "role:manage",
                "org:settings",
                "assessment:create",
                "assessment:edit",
                "assessment:delete",
                "assessment:approve",
                "report:view",
                "report:export",
                "evidence:upload",
                "evidence:approve",
            ],
            "COORDINATOR": [
                "assessment:create",
                "assessment:edit",
                "report:view",
                "report:export",
                "evidence:upload",
                "user:invite",
            ],
            "ASSESSOR": [
                "assessment:view",
                "assessment:edit",
                "evidence:upload",
                "evidence:review",
                "report:view",
            ],
            "CONSULTANT": [
                "assessment:view",
                "assessment:edit",
                "evidence:upload",
                "report:view",
            ],
            "EXECUTIVE": ["assessment:view", "report:view", "report:export"],
            "OPERATOR": ["assessment:view", "evidence:upload"],
        }

        role_perms = DEFAULT_ROLE_PERMISSIONS.get(self.fallback_role, [])
        return permission_key in role_perms


class Invitation(models.Model):
    """Invitation to join an organization with a specific role."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        DECLINED = "DECLINED", "Declined"
        EXPIRED = "EXPIRED", "Expired"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="invitations"
    )
    email = models.EmailField()
    # Role assignment (custom role or fallback)
    role = models.ForeignKey(
        CustomRole, on_delete=models.SET_NULL, null=True, blank=True
    )
    fallback_role = models.CharField(
        max_length=20,
        choices=[
            ("ADMIN", "Admin"),
            ("COORDINATOR", "Coordinator"),
            ("OPERATOR", "Operator"),
            ("EXECUTIVE", "Executive"),
            ("ASSESSOR", "Assessor"),
            ("CONSULTANT", "Consultant"),
        ],
        default="OPERATOR",
    )
    # Token for secure acceptance link
    token = models.CharField(max_length=64, unique=True, editable=False)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_invitations",
    )
    # Timestamps
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "invitations"
        ordering = ["-created_at"]
        verbose_name = "Invitation"
        verbose_name_plural = "Invitations"

    def __str__(self):
        return f"{self.email} → {self.organization.name} ({self.status})"

    def save(self, *args, **kwargs):
        # Generate token on creation
        if not self.token:
            self.token = self._generate_token()
        # Set default expiry (7 days) if not set
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(days=7)
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_token() -> str:
        """Generate a secure random token for invitation acceptance."""
        import secrets

        return secrets.token_urlsafe(32)

    def is_expired(self) -> bool:
        """Check if invitation has expired."""
        return timezone.now() > self.expires_at

    def accept(self, user) -> bool:
        """
        Accept the invitation for a user.
        Creates OrganizationMembership and marks invitation as accepted.
        Returns True if successful, False if invitation is invalid/expired.
        """
        if self.status != self.Status.PENDING:
            return False

        if self.is_expired():
            self.status = self.Status.EXPIRED
            self.save(update_fields=["status"])
            return False

        # Create membership
        OrganizationMembership.objects.get_or_create(
            user=user,
            organization=self.organization,
            defaults={
                "role": self.role,
                "fallback_role": self.fallback_role,
            },
        )

        # Mark as accepted
        self.status = self.Status.ACCEPTED
        self.accepted_at = timezone.now()
        self.save(update_fields=["status", "accepted_at"])
        return True

    def decline(self) -> bool:
        """Decline the invitation. Returns True if successful."""
        if self.status != self.Status.PENDING:
            return False

        self.status = self.Status.DECLINED
        self.save(update_fields=["status"])
        return True
