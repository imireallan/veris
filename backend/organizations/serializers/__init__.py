from rest_framework import serializers

from organizations.models import CustomRole, Organization, OrganizationMembership


class CustomRoleSerializer(serializers.ModelSerializer):
    """Serializer for organization-specific custom roles."""

    class Meta:
        model = CustomRole
        fields = [
            "id",
            "organization",
            "name",
            "permissions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "organization": {"write_only": True},
        }


class OrganizationMembershipSerializer(serializers.ModelSerializer):
    """Serializer for organization membership with role details."""

    role_name = serializers.SerializerMethodField()
    role_permissions = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = OrganizationMembership
        fields = [
            "id",
            "user",
            "user_email",
            "user_name",
            "organization",
            "role",
            "role_name",
            "role_permissions",
            "fallback_role",
            "is_lead_assessor",
            "specializations",
            "joined_at",
        ]
        read_only_fields = ["id", "joined_at", "role_name", "role_permissions"]

    def get_role_name(self, obj):
        """Return custom role name or fallback role name."""
        if obj.role:
            return obj.role.name
        return obj.get_fallback_role_display()

    def get_role_permissions(self, obj):
        """Return the permissions for this membership."""
        if obj.role:
            return obj.role.permissions
        # Return default permissions for fallback role
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
        return DEFAULT_ROLE_PERMISSIONS.get(obj.fallback_role, [])


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "slug",
            "status",
            "subscription_tier",
            "custom_domain",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
