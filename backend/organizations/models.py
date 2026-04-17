import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from users.roles import UserRole


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
        choices=UserRole.choices,
        default=UserRole.OPERATOR,
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
        choices=UserRole.choices,
        default=UserRole.OPERATOR,
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


class OrganizationCreationConfig(models.Model):
    """
    Admin-configurable settings for organization creation.

    Allows platform admins to manage prerequisites without code changes.
    Single instance (singleton) — use OrganizationCreationConfig.get_solo() to access.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Prerequisite toggles
    require_contract_upload = models.BooleanField(
        default=False,
        help_text="Require signed contract document before creating organizations",
    )
    require_client_email = models.BooleanField(
        default=True, help_text="Require client admin email for automatic invitation"
    )
    require_framework_selection = models.BooleanField(
        default=True, help_text="Require primary framework selection during creation"
    )
    require_industry_sector = models.BooleanField(
        default=True, help_text="Require industry sector selection"
    )

    # Invitation settings
    auto_send_invitation = models.BooleanField(
        default=True,
        help_text="Automatically send invitation email after organization creation",
    )
    invitation_expiry_days = models.PositiveIntegerField(
        default=7, help_text="Number of days before invitation links expire"
    )

    # Permission settings
    allowed_creator_roles = models.JSONField(
        default=list,
        help_text="List of roles allowed to create organizations, e.g., ['SUPERADMIN', 'CONSULTANCY_ADMIN']",
    )

    # Helper content (configurable without code changes)
    helper_title = models.CharField(
        max_length=200,
        default="Create New Organization",
        help_text="Title shown in the creation form",
    )
    helper_description = models.TextField(
        blank=True,
        default="Set up a new client organization. They will receive an invitation to join Veris.",
        help_text="Description/helper text shown to users",
    )
    prerequisite_warning = models.TextField(
        blank=True,
        default="Please ensure you have a signed contract before creating a new organization.",
        help_text="Warning shown when prerequisites are not met",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organization_creation_configs"
        verbose_name = "Organization Creation Configuration"
        verbose_name_plural = "Organization Creation Configurations"

    def __str__(self):
        return "Organization Creation Settings"

    @classmethod
    def get_solo(cls):
        """Get or create the singleton config instance."""
        config, _ = cls.objects.get_or_create(
            id=cls.objects.first().id if cls.objects.exists() else uuid.uuid4()
        )
        return config

    def can_user_create_organization(self, user) -> tuple:
        """
        Check if user has permission to create organizations.

        Returns:
            Tuple of (can_create: bool, missing_permissions: list)
        """
        if not self.allowed_creator_roles:
            # Empty list means all authenticated users can create
            return True, []

        user_role = getattr(user, "role", None)

        if user.is_superuser:
            return True, []

        if user_role in self.allowed_creator_roles:
            return True, []

        return False, ["role_not_allowed"]

    def get_prerequisites(self) -> list:
        """Return list of enabled prerequisites for frontend."""
        prerequisites = []

        if self.require_contract_upload:
            prerequisites.append(
                {
                    "key": "contract_upload",
                    "label": "Signed Contract",
                    "description": "Upload the signed client contract",
                    "required": True,
                }
            )

        if self.require_client_email:
            prerequisites.append(
                {
                    "key": "client_email",
                    "label": "Client Admin Email",
                    "description": "Email address for the client administrator",
                    "required": True,
                }
            )

        if self.require_framework_selection:
            prerequisites.append(
                {
                    "key": "framework_selection",
                    "label": "Primary Framework",
                    "description": "Select the primary compliance framework",
                    "required": True,
                }
            )

        if self.require_industry_sector:
            prerequisites.append(
                {
                    "key": "industry_sector",
                    "label": "Industry Sector",
                    "description": "Select the client industry sector",
                    "required": True,
                }
            )

        return prerequisites
