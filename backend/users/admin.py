from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from users.models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ("email", "name", "status", "is_staff", "created_at")
    list_filter = ("status", "is_staff")
    search_fields = ("email", "name")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("email",)

    filter_horizontal = ()

    fieldsets = (
        ("Personal info", {"fields": ("email", "name")}),
        ("Role & Status", {"fields": ("status", "timezone")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "password")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    add_fieldsets = (
        (None, {"fields": ("email", "name", "password1", "password2")}),
        ("Role & Status", {"fields": ("status",)}),
    )
