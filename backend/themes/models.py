import uuid

from django.db import models


class Theme(models.Model):
    """Stores all customization settings per organization."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.OneToOneField(
        "organizations.Organization", on_delete=models.CASCADE, related_name="theme"
    )
    primary_color = models.CharField(max_length=20, default="#1A73E8")
    secondary_color = models.CharField(max_length=20, default="#5F6368")
    accent_color = models.CharField(max_length=20, default="#1A73E8")
    background_color = models.CharField(max_length=20, default="#FFFFFF")
    text_color = models.CharField(max_length=20, default="#20190D")
    logo_url = models.URLField(max_length=1000, blank=True, default="")
    favicon_url = models.URLField(max_length=1000, blank=True, default="")
    font_family = models.CharField(max_length=200, default="Inter, system-ui, sans-serif")
    button_radius = models.FloatField(default=4.0)
    custom_css = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "themes"
        ordering = ["organization__name"]

    def __str__(self):
        return f"{self.organization.name} Theme"
