import secrets
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from users.roles import UserRole

DEFAULT_ROLE_PERMISSIONS = {
    UserRole.ADMIN: [
        "user:invite",
        "user:remove",
        "role:manage",
        "org:settings",
        "assessment:create",
        "assessment:view",
        "assessment:edit",
        "assessment:delete",
        "assessment:approve",
        "template:create",
        "template:edit",
        "template:delete",
        "site:create",
        "site:edit",
        "site:delete",
        "task:create",
        "task:edit",
        "task:delete",
        "finding:create",
        "finding:edit",
        "finding:delete",
        "report:view",
        "report:export",
        "evidence:upload",
        "evidence:approve",
    ],
    UserRole.COORDINATOR: [
        "assessment:create",
        "assessment:view",
        "assessment:edit",
        "template:create",
        "template:edit",
        "template:delete",
        "site:create",
        "site:edit",
        "site:delete",
        "task:create",
        "task:edit",
        "task:delete",
        "finding:create",
        "finding:edit",
        "report:view",
        "report:export",
        "evidence:upload",
        "user:invite",
    ],
    UserRole.ASSESSOR: [
        "assessment:view",
        "assessment:edit",
        "evidence:upload",
        "evidence:review",
        "report:view",
    ],
    UserRole.CONSULTANT: [
        "assessment:view",
        "assessment:edit",
        "evidence:upload",
        "report:view",
    ],
    UserRole.EXECUTIVE: [
        "assessment:view",
        "report:view",
        "report:export",
    ],
    UserRole.OPERATOR: [
        "assessment:view",
        "site:create",
        "site:edit",
        "task:create",
        "task:edit",
        "evidence:upload",
    ],
}


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
        max_length=20,
        choices=Status.choices,
        default=Status.TRIAL,
    )
    subscription_tier = models.CharField(
        max_length=20,
        choices=SubscriptionTier.choices,
        default=SubscriptionTier.FREE,
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


class OrganizationTerminology(models.Model):
    """Tenant-specific UI terminology."""

    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name="terminology",
    )
    assessment_label = models.CharField(max_length=100, default="Assessment")
    site_label = models.CharField(max_length=100, default="Site")
    task_label = models.CharField(max_length=100, default="Task")
    evidence_label = models.CharField(max_length=100, default="Evidence")
    report_label = models.CharField(max_length=100, default="Report")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organization_terminology"
        verbose_name = "Organization Terminology"
        verbose_name_plural = "Organization Terminology"

    def __str__(self):
        return f"Terminology for {self.organization.name}"


class OrganizationSettings(models.Model):
    """Tenant-level feature flags and preferences."""

    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name="settings",
    )
    features = models.JSONField(default=dict, blank=True)
    preferences = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organization_settings"
        verbose_name = "Organization Settings"
        verbose_name_plural = "Organization Settings"

    def __str__(self):
        return f"Settings for {self.organization.name}"


class CustomRole(models.Model):
    """Organization-specific roles with custom names and permission sets."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="custom_roles",
    )
    name = models.CharField(max_length=100)
    key = models.SlugField(max_length=100)
    description = models.TextField(blank=True, default="")
    permissions = models.JSONField(
        default=list,
        help_text="List of permission keys, e.g. ['user:invite', 'report:edit']",
    )
    is_active = models.BooleanField(default=True)
    is_system_role = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "custom_roles"
        unique_together = ("organization", "key")
        ordering = ["organization__name", "name"]
        verbose_name = "Custom Role"
        verbose_name_plural = "Custom Roles"

    def __str__(self):
        return f"{self.name} ({self.organization.name})"

    def has_permission(self, permission_key: str) -> bool:
        return self.is_active and permission_key in self.permissions


class OrganizationMembership(models.Model):
    """A user's membership in an organization."""

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INVITED = "INVITED", "Invited"
        SUSPENDED = "SUSPENDED", "Suspended"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role = models.ForeignKey(
        CustomRole,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="memberships",
    )
    fallback_role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.OPERATOR,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    is_default = models.BooleanField(default=False)

    # Membership-specific attributes
    is_lead_assessor = models.BooleanField(default=False)
    specializations = models.JSONField(default=list, blank=True)

    joined_at = models.DateTimeField(auto_now_add=True)
    last_accessed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "organization_memberships"
        unique_together = ("user", "organization")
        ordering = ["organization__name", "user__email"]
        verbose_name = "Organization Membership"
        verbose_name_plural = "Organization Memberships"

    def __str__(self):
        return f"{self.user.email} @ {self.organization.name}"

    def clean(self):
        if self.role and self.role.organization_id != self.organization_id:
            raise ValidationError(
                {"role": "Selected custom role must belong to the same organization."}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def has_permission(self, permission_key: str) -> bool:
        if self.status != self.Status.ACTIVE:
            return False

        if permission_key == "report:export" and self.is_lead_assessor:
            return True

        if self.role:
            return self.role.has_permission(permission_key)

        role_permissions = DEFAULT_ROLE_PERMISSIONS.get(self.fallback_role, [])
        return permission_key in role_permissions


class Invitation(models.Model):
    """Invitation to join an organization with a specific role."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        DECLINED = "DECLINED", "Declined"
        EXPIRED = "EXPIRED", "Expired"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="invitations",
    )
    email = models.EmailField()
    invited_name = models.CharField(max_length=255, blank=True, default="")

    role = models.ForeignKey(
        CustomRole,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invitations",
    )
    fallback_role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.OPERATOR,
    )

    token = models.CharField(max_length=64, unique=True, editable=False)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_invitations",
    )

    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "invitations"
        ordering = ["-created_at"]
        verbose_name = "Invitation"
        verbose_name_plural = "Invitations"
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "email", "status"],
                condition=models.Q(status="PENDING"),
                name="unique_pending_invitation_per_org_email",
            )
        ]

    def __str__(self):
        return f"{self.email} → {self.organization.name} ({self.status})"

    def clean(self):
        if self.role and self.role.organization_id != self.organization_id:
            raise ValidationError(
                {"role": "Selected custom role must belong to the same organization."}
            )

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = self._generate_token()

        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(days=7)

        self.full_clean()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_token() -> str:
        return secrets.token_urlsafe(32)

    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    def accept(self, user) -> bool:
        if self.status != self.Status.PENDING:
            return False

        if self.is_expired():
            self.status = self.Status.EXPIRED
            self.save(update_fields=["status"])
            return False

        if user.email.lower() != self.email.lower():
            return False

        OrganizationMembership.objects.get_or_create(
            user=user,
            organization=self.organization,
            defaults={
                "role": self.role,
                "fallback_role": self.fallback_role,
                "status": OrganizationMembership.Status.ACTIVE,
            },
        )

        self.status = self.Status.ACCEPTED
        self.accepted_at = timezone.now()
        self.save(update_fields=["status", "accepted_at"])
        return True

    def decline(self) -> bool:
        if self.status != self.Status.PENDING:
            return False

        self.status = self.Status.DECLINED
        self.save(update_fields=["status"])
        return True


class OrganizationCreationConfig(models.Model):
    """
    Platform-level config for organization creation.
    This is not tenant-specific.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    require_contract_upload = models.BooleanField(
        default=False,
        help_text="Require signed contract document before creating organizations",
    )
    require_client_email = models.BooleanField(
        default=True,
        help_text="Require client admin email for automatic invitation",
    )
    require_framework_selection = models.BooleanField(
        default=True,
        help_text="Require primary framework selection during creation",
    )
    require_industry_sector = models.BooleanField(
        default=True,
        help_text="Require industry sector selection",
    )

    auto_send_invitation = models.BooleanField(
        default=True,
        help_text="Automatically send invitation email after organization creation",
    )
    invitation_expiry_days = models.PositiveIntegerField(
        default=7,
        help_text="Number of days before invitation links expire",
    )

    # Platform-level creator permissions
    allow_authenticated_users = models.BooleanField(default=False)
    allow_staff_users = models.BooleanField(default=True)
    allow_superusers = models.BooleanField(default=True)

    helper_title = models.CharField(
        max_length=200,
        default="Create New Organization",
        help_text="Title shown in the creation form",
    )
    helper_description = models.TextField(
        blank=True,
        default="Set up a new client organization. They will receive an invitation to join the platform.",
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
        instance = cls.objects.first()
        if instance:
            return instance
        return cls.objects.create()

    def can_user_create_organization(self, user) -> tuple[bool, list[str]]:
        if self.allow_superusers and user.is_superuser:
            return True, []

        if self.allow_staff_users and user.is_staff:
            return True, []

        if self.allow_authenticated_users and user.is_authenticated:
            return True, []

        return False, ["role_not_allowed"]

    def get_prerequisites(self) -> list:
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
