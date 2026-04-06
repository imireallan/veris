from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from users.models import User, AssessorProfile


@admin.register(AssessorProfile)
class AssessorProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "can_be_lead_assessor", "country", "current_organisation")
    list_filter = ("role", "can_be_lead_assessor", "country")
    search_fields = ("user__email", "user__name", "biography", "current_organisation")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ("email", "name", "role", "status", "is_staff", "created_at")
    list_filter = ("role", "status", "is_staff")
    search_fields = ("email", "name")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("email",)

    # Override BaseUserAdmin default which references groups/user_permissions
    filter_horizontal = ()

    fieldsets = (
        ("Personal info", {"fields": ("email", "name", "organization")}),
        ("Role & Status", {"fields": ("role", "status", "timezone")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "password")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    add_fieldsets = (
        (None, {"fields": ("email", "name", "password1", "password2")}),
        ("Role & Status", {"fields": ("role", "organization")}),
    )
