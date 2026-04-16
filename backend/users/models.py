import uuid

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.hashers import make_password
from django.db import models


class UserManager(BaseUserManager):
    """Custom manager for the User model with email as username."""

    def _create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.password = make_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser):
    """Custom user model with email as unique identifier."""

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        COORDINATOR = "COORDINATOR", "Coordinator"
        OPERATOR = "OPERATOR", "Operator"
        EXECUTIVE = "EXECUTIVE", "Executive"
        ASSESSOR = "ASSESSOR", "Assessor"
        CONSULTANT = "CONSULTANT", "Consultant"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        PENDING = "PENDING", "Pending"
        DEACTIVATED = "DEACTIVATED", "Deactivated"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=300, default="")

    # Global Profile Attributes (merged from AssessorProfile)
    biography = models.TextField(blank=True, default="")
    direct_phone_number = models.CharField(max_length=50, blank=True, default="")
    country = models.CharField(max_length=2, blank=True, default="")
    region = models.CharField(max_length=255, blank=True, default="")

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    timezone = models.CharField(max_length=100, default="UTC")
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    password = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "users"
        ordering = ["email"]

    def __str__(self):
        return f"{self.email} ({self.name})"

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True

    @property
    def fallback_role(self):
        """
        Get the user's fallback role from their primary organization membership.
        Returns 'SUPERADMIN' for superusers, otherwise the fallback_role from first membership.
        """
        if self.is_superuser:
            return "SUPERADMIN"

        # Get primary membership (first one)
        from organizations.models import OrganizationMembership

        membership = OrganizationMembership.objects.filter(user=self).first()
        if membership:
            return membership.fallback_role

        return None
