from django.contrib import admin

from themes.models import OrganizationTheme


@admin.register(OrganizationTheme)
class OrganizationThemeAdmin(admin.ModelAdmin):
    list_display = (
        "organization",
        "primary_color",
        "accent_color",
        "font_family",
        "updated_at",
    )
    search_fields = ("organization__name",)
    readonly_fields = ("id", "created_at", "updated_at")
