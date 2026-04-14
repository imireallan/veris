from rest_framework import serializers

from organizations.models import OrganizationMembership

from .models import User


class OrganizationMembershipSerializer(serializers.ModelSerializer):
    """Nested serializer for organization membership info."""

    organization_name = serializers.CharField(
        source="organization.name", read_only=True
    )
    organization_slug = serializers.CharField(
        source="organization.slug", read_only=True
    )
    role_name = serializers.SerializerMethodField()

    class Meta:
        model = OrganizationMembership
        fields = [
            "id",
            "organization_id",
            "organization_name",
            "organization_slug",
            "role_name",
            "fallback_role",
            "is_lead_assessor",
            "joined_at",
        ]

    def get_role_name(self, obj):
        """Return custom role name if exists, otherwise fallback role."""
        if obj.role:
            return obj.role.name
        return obj.fallback_role


class UserSerializer(serializers.ModelSerializer):
    memberships = OrganizationMembershipSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "name",
            "status",
            "timezone",
            "country",
            "is_staff",
            "is_active",
            "created_at",
            "updated_at",
            "memberships",
        )
        read_only_fields = ("id", "email", "created_at", "updated_at")
