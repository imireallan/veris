"""
Centralized role definitions for the Veris platform.

Use these enums consistently across models, serializers, and permission checks.
"""

from django.db import models


class UserRole(models.TextChoices):
    """
    Standard role hierarchy for organization members.
    Ordered by permission level (highest to lowest).
    """

    SUPERADMIN = "SUPERADMIN", "Super Admin"
    ADMIN = "ADMIN", "Admin"
    COORDINATOR = "COORDINATOR", "Coordinator"
    OPERATOR = "OPERATOR", "Operator"
    EXECUTIVE = "EXECUTIVE", "Executive"
    ASSESSOR = "ASSESSOR", "Assessor"
    CONSULTANT = "CONSULTANT", "Consultant"

    @classmethod
    def get_hierarchy(cls):
        """Return roles ordered by permission level."""
        return [
            cls.SUPERADMIN,
            cls.ADMIN,
            cls.COORDINATOR,
            cls.OPERATOR,
            cls.EXECUTIVE,
            cls.ASSESSOR,
            cls.CONSULTANT,
        ]

    @classmethod
    def can_manage_templates(cls, role: str) -> bool:
        """Check if role can manage templates."""
        return role in [cls.SUPERADMIN, cls.ADMIN, cls.COORDINATOR]

    @classmethod
    def can_create_assessments(cls, role: str) -> bool:
        """Check if role can create assessments."""
        return role in [cls.SUPERADMIN, cls.ADMIN, cls.COORDINATOR, cls.OPERATOR]

    @classmethod
    def can_view_assessments(cls, role: str) -> bool:
        """Check if role can view assessments."""
        return role in cls.get_hierarchy()  # All roles can view

    @classmethod
    def can_delete_resources(cls, role: str) -> bool:
        """Check if role can delete resources (ADMIN, COORDINATOR only)."""
        return role in [cls.SUPERADMIN, cls.ADMIN, cls.COORDINATOR]
