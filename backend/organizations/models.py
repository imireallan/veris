import uuid

from django.conf import settings
from django.db import models


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

    def __str__(self):
        return f"{self.name} ({self.organization.name})"


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

    def __str__(self):
        return f"{self.user.email} @ {self.organization.name}"
