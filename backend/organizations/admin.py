from django.contrib import admin
from django.utils.html import format_html

from organizations.models import (
    CustomRole,
    Invitation,
    Organization,
    OrganizationCreationConfig,
    OrganizationMembership,
)


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "status", "subscription_tier", "created_at")
    list_filter = ("status", "subscription_tier")
    search_fields = ("name", "slug")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(CustomRole)
class CustomRoleAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "created_at")
    list_filter = ("organization",)
    search_fields = ("name", "organization__name")
    readonly_fields = ("id", "created_at", "updated_at")
    filter_horizontal = ("permissions",) if False else ()  # JSONField, no filter_horizontal


@admin.register(OrganizationMembership)
class OrganizationMembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "organization", "fallback_role", "is_lead_assessor", "joined_at")
    list_filter = ("fallback_role", "is_lead_assessor", "organization")
    search_fields = ("user__email", "organization__name")
    readonly_fields = ("id", "joined_at")
    raw_id_fields = ("user", "organization", "role")


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ("email", "organization", "fallback_role", "status", "expires_at", "invited_by")
    list_filter = ("status", "fallback_role", "organization")
    search_fields = ("email", "organization__name", "invited_by__email")
    readonly_fields = ("id", "token", "created_at", "updated_at")
    raw_id_fields = ("organization", "invited_by")
    
    def has_change_permission(self, request, obj=None):
        # Prevent manual token changes
        return False


@admin.register(OrganizationCreationConfig)
class OrganizationCreationConfigAdmin(admin.ModelAdmin):
    """
    Singleton config admin — only one instance should exist.
    """
    list_display = ("helper_title", "auto_send_invitation", "invitation_expiry_days", "updated_at")
    readonly_fields = ("id", "created_at", "updated_at")
    fieldsets = (
        ("Prerequisites", {
            "fields": (
                "require_contract_upload",
                "require_client_email",
                "require_framework_selection",
                "require_industry_sector",
            )
        }),
        ("Invitation Settings", {
            "fields": (
                "auto_send_invitation",
                "invitation_expiry_days",
            )
        }),
        ("Permissions", {
            "fields": ("allowed_creator_roles",)
        }),
        ("Helper Content", {
            "fields": (
                "helper_title",
                "helper_description",
                "prerequisite_warning",
            )
        }),
    )
    
    def has_add_permission(self, request):
        # Prevent creating multiple instances
        if self.model.objects.exists():
            return False
        return True
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of singleton
        return False
