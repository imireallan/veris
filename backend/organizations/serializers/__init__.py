from rest_framework import serializers

from organizations.models import (
    CustomRole,
    Invitation,
    Organization,
    OrganizationCreationConfig,
    OrganizationMembership,
)
from organizations.permissions import DEFAULT_ROLE_PERMISSIONS


class OrganizationOptionSerializer(serializers.ModelSerializer):
    """
    Lightweight organization option serializer for switchers and bootstrap payloads.
    """

    role = serializers.SerializerMethodField()
    fallback_role = serializers.CharField(source="fallback_role", read_only=True)
    status = serializers.CharField(read_only=True)
    is_default = serializers.BooleanField(read_only=True)
    name = serializers.CharField(source="organization.name", read_only=True)
    slug = serializers.CharField(source="organization.slug", read_only=True)
    id = serializers.UUIDField(source="organization.id", read_only=True)

    class Meta:
        model = OrganizationMembership
        fields = [
            "id",
            "name",
            "slug",
            "role",
            "fallback_role",
            "status",
            "is_default",
        ]

    def get_role(self, obj):
        return obj.role.name if obj.role else None


class InvitationSerializer(serializers.ModelSerializer):
    """Serializer for organization invitations."""

    invited_by_email = serializers.EmailField(source="invited_by.email", read_only=True)
    invited_by_name = serializers.CharField(source="invited_by.name", read_only=True)
    role_name = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = Invitation
        fields = [
            "id",
            "organization",
            "email",
            "invited_name",
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
            "created_at",
            "is_expired",
        ]
        read_only_fields = [
            "id",
            "organization",
            "invited_by",
            "token",
            "status",
            "expires_at",
            "accepted_at",
            "created_at",
            "is_expired",
        ]

    def get_role_name(self, obj):
        if obj.role:
            return obj.role.name
        return obj.get_fallback_role_display()

    def get_is_expired(self, obj):
        return obj.is_expired()

    def validate_email(self, email):
        from users.models import User

        org = self.context.get("organization")

        if User.objects.filter(email__iexact=email).exists():
            if (
                org
                and OrganizationMembership.objects.filter(
                    user__email__iexact=email,
                    organization=org,
                ).exists()
            ):
                raise serializers.ValidationError(
                    "User is already a member of this organization."
                )

        if (
            org
            and Invitation.objects.filter(
                email__iexact=email,
                organization=org,
                status=Invitation.Status.PENDING,
            ).exists()
        ):
            raise serializers.ValidationError(
                "An invitation has already been sent to this email."
            )

        return email

    def validate(self, data):
        role = data.get("role")
        org = self.context.get("organization")

        if role and org and role.organization_id != org.id:
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
            "key",
            "description",
            "permissions",
            "is_active",
            "is_system_role",
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
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    organization_slug = serializers.CharField(source="organization.slug", read_only=True)

    class Meta:
        model = OrganizationMembership
        fields = [
            "id",
            "user",
            "user_email",
            "user_name",
            "organization",
            "organization_name",
            "organization_slug",
            "role",
            "role_name",
            "role_permissions",
            "fallback_role",
            "status",
            "is_default",
            "is_lead_assessor",
            "specializations",
            "joined_at",
            "last_accessed_at",
        ]
        read_only_fields = [
            "id",
            "joined_at",
            "last_accessed_at",
            "role_name",
            "role_permissions",
            "organization_name",
            "organization_slug",
        ]

    def get_role_name(self, obj):
        if obj.role:
            return obj.role.name
        return obj.get_fallback_role_display()

    def get_role_permissions(self, obj):
        if obj.role:
            return obj.role.permissions
        return DEFAULT_ROLE_PERMISSIONS.get(obj.fallback_role, [])


class OrganizationSerializer(serializers.ModelSerializer):
    """
    Full organization serializer for CRUD/detail views.
    """

    client_email = serializers.CharField(write_only=True, required=False)
    framework = serializers.CharField(write_only=True, required=False)
    sector = serializers.CharField(write_only=True, required=False)

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
            "client_email",
            "framework",
            "sector",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        validated_data.pop("client_email", None)
        validated_data.pop("framework", None)
        validated_data.pop("sector", None)
        return super().create(validated_data)


class OrganizationDetailSerializer(OrganizationSerializer):
    """
    Optional richer org detail serializer for org detail pages.
    """

    member_count = serializers.SerializerMethodField()

    class Meta(OrganizationSerializer.Meta):
        fields = OrganizationSerializer.Meta.fields + [
            "member_count",
        ]

    def get_member_count(self, obj):
        return obj.memberships.filter(
            status=OrganizationMembership.Status.ACTIVE
        ).count()


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
            "allow_authenticated_users",
            "allow_staff_users",
            "allow_superusers",
            "helper_title",
            "helper_description",
            "prerequisite_warning",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]