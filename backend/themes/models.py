import uuid

from django.db import models


class Theme(models.Model):
    """Stores all customization settings per organization.
    
    Supports separate color schemes for light and dark modes.
    All color fields store HSL values without units (e.g., "217 89 51").
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.OneToOneField(
        "organizations.Organization", on_delete=models.CASCADE, related_name="theme"
    )
    # Primary colors - light mode
    primary_color = models.CharField(max_length=20, default="160 84 39")
    primary_foreground_color = models.CharField(max_length=20, default="0 0 100")
    secondary_color = models.CharField(max_length=20, default="210 40 96")
    secondary_foreground_color = models.CharField(max_length=20, default="222 47 11")
    accent_color = models.CharField(max_length=20, default="38 92 50")
    accent_foreground_color = models.CharField(max_length=20, default="0 0 0")
    # Primary colors - dark mode
    primary_color_dark = models.CharField(max_length=20, default="160 84 39")
    primary_foreground_color_dark = models.CharField(max_length=20, default="0 0 100")
    secondary_color_dark = models.CharField(max_length=20, default="210 40 16")
    secondary_foreground_color_dark = models.CharField(max_length=20, default="210 40 96")
    accent_color_dark = models.CharField(max_length=20, default="38 92 50")
    accent_foreground_color_dark = models.CharField(max_length=20, default="0 0 0")
    # Surface colors - light mode
    background_color = models.CharField(max_length=20, default="0 0 100")
    text_color = models.CharField(max_length=20, default="222 84 5")
    muted_color = models.CharField(max_length=20, default="210 40 96")
    muted_foreground_color = models.CharField(max_length=20, default="215 16 47")
    card_color = models.CharField(max_length=20, default="0 0 100")
    card_foreground_color = models.CharField(max_length=20, default="222 84 5")
    # Surface colors - dark mode
    background_color_dark = models.CharField(max_length=20, default="222 84 5")
    text_color_dark = models.CharField(max_length=20, default="210 40 96")
    muted_color_dark = models.CharField(max_length=20, default="217 33 17")
    muted_foreground_color_dark = models.CharField(max_length=20, default="215 20 65")
    card_color_dark = models.CharField(max_length=20, default="222 84 5")
    card_foreground_color_dark = models.CharField(max_length=20, default="210 40 96")
    # State colors - light mode
    border_color = models.CharField(max_length=20, default="214 32 91")
    destructive_color = models.CharField(max_length=20, default="0 84 60")
    destructive_foreground_color = models.CharField(max_length=20, default="0 0 100")
    success_color = models.CharField(max_length=20, default="142 76 36")
    # State colors - dark mode
    border_color_dark = models.CharField(max_length=20, default="217 33 17")
    destructive_color_dark = models.CharField(max_length=20, default="0 63 31")
    destructive_foreground_color_dark = models.CharField(max_length=20, default="0 0 100")
    success_color_dark = models.CharField(max_length=20, default="142 76 36")
    # Branding
    logo_url = models.URLField(max_length=1000, blank=True, default="")
    logo_url_dark = models.URLField(max_length=1000, blank=True, default="")
    favicon_url = models.URLField(max_length=1000, blank=True, default="")
    font_family = models.CharField(
        max_length=200, default="Inter, system-ui, sans-serif"
    )
    button_radius = models.FloatField(default=4.0)
    custom_css = models.TextField(blank=True, default="")
    custom_css_dark = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "themes"
        ordering = ["organization__name"]

    def __str__(self):
        return f"{self.organization.name} Theme"
