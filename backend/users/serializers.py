from rest_framework import serializers

from organizations.models import OrganizationMembership
from .models import User


class OrganizationMembershipSerializer(serializers.ModelSerializer):
    """Nested serializer for organization membership info."""

    organization_name = serializers.CharField(
        source="organization.name",
        read_only=True,
    )
    organization_slug = serializers.CharField(
        source="organization.slug",
        read_only=True,
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
            "status",
            "is_default",
            "is_lead_assessor",
            "joined_at",
            "last_accessed_at",
        ]

    def get_role_name(self, obj):
        """Return custom role name if it exists, otherwise fallback role."""
        if obj.role:
            return obj.role.name
        return obj.fallback_role


class UserSerializer(serializers.ModelSerializer):
    """
    General-purpose user serializer.
    Good for admin/internal CRUD use.
    """

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
            "is_superuser",
            "is_active",
            "created_at",
            "updated_at",
            "memberships",
        )
        read_only_fields = (
            "id",
            "email",
            "created_at",
            "updated_at",
        )


class ActiveOrganizationSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.CharField(allow_blank=True, required=False)


class ActiveMembershipSerializer(serializers.Serializer):
    role = serializers.CharField(allow_null=True, required=False)
    fallback_role = serializers.CharField(allow_null=True, required=False)
    is_default = serializers.BooleanField(required=False)
    status = serializers.CharField(required=False)


class OrganizationOptionSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.CharField(allow_blank=True, required=False)
    role = serializers.CharField(allow_null=True, required=False)
    fallback_role = serializers.CharField(allow_null=True, required=False)
    status = serializers.CharField(required=False)
    is_default = serializers.BooleanField(required=False)


class MeSerializer(serializers.ModelSerializer):
    """
    Auth/bootstrap serializer for /me.
    Uses request.organization and request.membership when available.
    """

    full_name = serializers.CharField(source="name", read_only=True)
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    picture_url = serializers.SerializerMethodField()

    organization_count = serializers.SerializerMethodField()
    active_organization = serializers.SerializerMethodField()
    active_membership = serializers.SerializerMethodField()
    active_permissions = serializers.SerializerMethodField()
    recent_organizations = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "first_name",
            "last_name",
            "picture_url",
            "is_superuser",
            "is_staff",
            "timezone",
            "country",
            "organization_count",
            "active_organization",
            "active_membership",
            "active_permissions",
            "recent_organizations",
        )

    def _get_memberships(self, obj):
        return (
            obj.memberships.select_related("organization", "role")
            .filter(status=OrganizationMembership.Status.ACTIVE)
            .order_by("-is_default", "-last_accessed_at", "joined_at")
        )

    def _get_active_membership(self, obj):
        request = self.context.get("request")
        membership = getattr(request, "membership", None) if request else None

        if membership:
            return membership

        return self._get_memberships(obj).first()

    def _get_active_organization(self, obj):
        request = self.context.get("request")
        organization = getattr(request, "organization", None) if request else None

        if organization:
            return organization

        membership = self._get_active_membership(obj)
        return membership.organization if membership else None

    def get_first_name(self, obj):
        if not obj.name:
            return None
        return obj.name.split(" ")[0]

    def get_last_name(self, obj):
        if not obj.name or " " not in obj.name.strip():
            return None
        return " ".join(obj.name.split(" ")[1:])

    def get_picture_url(self, obj):
        return None

    def get_organization_count(self, obj):
        return self._get_memberships(obj).count()

    def get_active_organization(self, obj):
        organization = self._get_active_organization(obj)
        if not organization:
            return None

        return {
            "id": organization.id,
            "name": organization.name,
            "slug": organization.slug,
        }

    def get_active_membership(self, obj):
        membership = self._get_active_membership(obj)
        if not membership:
            return None

        return {
            "role": membership.role.name if membership.role else None,
            "fallback_role": membership.fallback_role,
            "is_default": membership.is_default,
            "status": membership.status,
        }

    def get_active_permissions(self, obj):
        membership = self._get_active_membership(obj)
        if not membership:
            return []

        permission_candidates = [
            "user:invite",
            "user:remove",
            "role:manage",
            "org:settings",
            "assessment:create",
            "assessment:view",
            "assessment:edit",
            "assessment:delete",
            "assessment:approve",
            "report:view",
            "report:export",
            "evidence:upload",
            "evidence:review",
            "evidence:approve",
        ]

        return [
            permission
            for permission in permission_candidates
            if membership.has_permission(permission)
        ]

    def get_recent_organizations(self, obj):
        memberships = self._get_memberships(obj)[:5]

        return [
            {
                "id": membership.organization.id,
                "name": membership.organization.name,
                "slug": membership.organization.slug,
                "role": membership.role.name if membership.role else None,
                "fallback_role": membership.fallback_role,
                "status": membership.status,
                "is_default": membership.is_default,
            }
            for membership in memberships
        ]