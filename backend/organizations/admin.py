from django.contrib import admin

from organizations.models import Organization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "status", "subscription_tier", "created_at")
    list_filter = ("status", "subscription_tier")
    search_fields = ("name", "slug")
    readonly_fields = ("id", "created_at", "updated_at")
