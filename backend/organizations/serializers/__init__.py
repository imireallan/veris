from rest_framework import serializers

from organizations.models import (
    CustomRole,
    Invitation,
    Organization,
    OrganizationCreationConfig,
    OrganizationMembership,
)


class InvitationSerializer(serializers.ModelSerializer):
    """Serializer for organization invitations."""

    invited_by_email = serializers.EmailField(source="invited_by.email", read_only=True)
    invited_by_name = serializers.CharField(source="invited_by.name", read_only=True)
    role_name = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = Invitation
        fields = [
            "id",
            "organization",
            "email",
            "role",
            "role_name",
            "fallback_role",
            "token",
            "status",
            "invited_by",
            "invited_by_email",
            "invited_by_name",
            "expires_at",
            "accepted_at",
            "is_expired",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "organization",
            "invited_by",
            "token",
            "status",
            "expires_at",
            "accepted_at",
            "is_expired",
            "created_at",
        ]

    def get_role_name(self, obj):
        """Return custom role name or fallback role name."""
        if obj.role:
            return obj.role.name
        return obj.get_fallback_role_display()

    def validate_email(self, email):
        """Check if user already exists or has pending invitation."""
        from users.models import User

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            # Check if they already have membership in this org
            org = self.context.get("organization")
            if (
                org
                and OrganizationMembership.objects.filter(
                    user__email=email, organization=org
                ).exists()
            ):
                raise serializers.ValidationError(
                    "User is already a member of this organization."
                )

        # Check for existing pending invitation
        org = self.context.get("organization")
        if (
            org
            and Invitation.objects.filter(
                email=email, organization=org, status=Invitation.Status.PENDING
            ).exists()
        ):
            raise serializers.ValidationError(
                "An invitation has already been sent to this email."
            )

        return email

    def validate(self, data):
        """Validate role assignment."""
        # Ensure role belongs to the same organization
        role = data.get("role")
        org = self.context.get("organization")

        if role and org and role.organization != org:
            raise serializers.ValidationError(
                "Role must belong to the same organization."
            )

        return data


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


class OrganizationCreationConfigSerializer(serializers.ModelSerializer):
    """Serializer for organization creation configuration."""

    class Meta:
        model = OrganizationCreationConfig
        fields = [
            "id",
            "require_contract_upload",
            "require_client_email",
            "require_framework_selection",
            "require_industry_sector",
            "auto_send_invitation",
            "invitation_expiry_days",
            "allowed_creator_roles",
            "helper_title",
            "helper_description",
            "prerequisite_warning",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
