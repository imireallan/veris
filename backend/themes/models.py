import re
import uuid

from django.core.exceptions import ValidationError
from django.db import models

HSL_TRIPLE_RE = re.compile(r"^\d{1,3}\s+\d{1,3}\s+\d{1,3}$")


def validate_hsl_triplet(value):
    if not HSL_TRIPLE_RE.match(value):
        raise ValidationError("Color must be in 'H S L' format, e.g. '217 89 51'.")


class OrganizationTheme(models.Model):
    """
    Visual white-label settings per organization.

    Stores theme tokens for light and dark modes.
    Color fields store HSL triplets without units, e.g. "217 89 51".
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.OneToOneField(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="theme",
    )

    app_name = models.CharField(max_length=255, blank=True, default="")
    login_title = models.CharField(max_length=255, blank=True, default="")
    login_subtitle = models.CharField(max_length=500, blank=True, default="")
    support_email = models.EmailField(blank=True, default="")

    primary_color = models.CharField(
        max_length=20, default="160 84 39", validators=[validate_hsl_triplet]
    )
    primary_foreground_color = models.CharField(
        max_length=20, default="0 0 100", validators=[validate_hsl_triplet]
    )
    secondary_color = models.CharField(
        max_length=20, default="210 40 96", validators=[validate_hsl_triplet]
    )
    secondary_foreground_color = models.CharField(
        max_length=20, default="222 47 11", validators=[validate_hsl_triplet]
    )
    accent_color = models.CharField(
        max_length=20, default="38 92 50", validators=[validate_hsl_triplet]
    )
    accent_foreground_color = models.CharField(
        max_length=20, default="0 0 0", validators=[validate_hsl_triplet]
    )

    primary_color_dark = models.CharField(
        max_length=20, default="160 84 39", validators=[validate_hsl_triplet]
    )
    primary_foreground_color_dark = models.CharField(
        max_length=20, default="0 0 100", validators=[validate_hsl_triplet]
    )
    secondary_color_dark = models.CharField(
        max_length=20, default="210 40 16", validators=[validate_hsl_triplet]
    )
    secondary_foreground_color_dark = models.CharField(
        max_length=20, default="210 40 96", validators=[validate_hsl_triplet]
    )
    accent_color_dark = models.CharField(
        max_length=20, default="38 92 50", validators=[validate_hsl_triplet]
    )
    accent_foreground_color_dark = models.CharField(
        max_length=20, default="0 0 0", validators=[validate_hsl_triplet]
    )

    background_color = models.CharField(
        max_length=20, default="0 0 100", validators=[validate_hsl_triplet]
    )
    text_color = models.CharField(
        max_length=20, default="222 84 5", validators=[validate_hsl_triplet]
    )
    muted_color = models.CharField(
        max_length=20, default="210 40 96", validators=[validate_hsl_triplet]
    )
    muted_foreground_color = models.CharField(
        max_length=20, default="215 16 47", validators=[validate_hsl_triplet]
    )
    card_color = models.CharField(
        max_length=20, default="0 0 100", validators=[validate_hsl_triplet]
    )
    card_foreground_color = models.CharField(
        max_length=20, default="222 84 5", validators=[validate_hsl_triplet]
    )

    background_color_dark = models.CharField(
        max_length=20, default="222 84 5", validators=[validate_hsl_triplet]
    )
    text_color_dark = models.CharField(
        max_length=20, default="210 40 96", validators=[validate_hsl_triplet]
    )
    muted_color_dark = models.CharField(
        max_length=20, default="217 33 17", validators=[validate_hsl_triplet]
    )
    muted_foreground_color_dark = models.CharField(
        max_length=20, default="215 20 65", validators=[validate_hsl_triplet]
    )
    card_color_dark = models.CharField(
        max_length=20, default="222 84 5", validators=[validate_hsl_triplet]
    )
    card_foreground_color_dark = models.CharField(
        max_length=20, default="210 40 96", validators=[validate_hsl_triplet]
    )

    border_color = models.CharField(
        max_length=20, default="214 32 91", validators=[validate_hsl_triplet]
    )
    destructive_color = models.CharField(
        max_length=20, default="0 84 60", validators=[validate_hsl_triplet]
    )
    destructive_foreground_color = models.CharField(
        max_length=20, default="0 0 100", validators=[validate_hsl_triplet]
    )
    success_color = models.CharField(
        max_length=20, default="142 76 36", validators=[validate_hsl_triplet]
    )

    border_color_dark = models.CharField(
        max_length=20, default="217 33 17", validators=[validate_hsl_triplet]
    )
    destructive_color_dark = models.CharField(
        max_length=20, default="0 63 31", validators=[validate_hsl_triplet]
    )
    destructive_foreground_color_dark = models.CharField(
        max_length=20, default="0 0 100", validators=[validate_hsl_triplet]
    )
    success_color_dark = models.CharField(
        max_length=20, default="142 76 36", validators=[validate_hsl_triplet]
    )

    logo_url = models.URLField(max_length=1000, blank=True, default="")
    logo_url_dark = models.URLField(max_length=1000, blank=True, default="")
    favicon_url = models.URLField(max_length=1000, blank=True, default="")
    font_family = models.CharField(
        max_length=200,
        default="Inter, system-ui, sans-serif",
    )
    button_radius = models.FloatField(default=4.0)
    custom_css = models.TextField(blank=True, default="")
    custom_css_dark = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organization_themes"
        ordering = ["organization__name"]

    def __str__(self):
        return f"{self.organization.name} Theme"

    def get_light_tokens(self):
        return {
            "primary": self.primary_color,
            "primary-foreground": self.primary_foreground_color,
            "secondary": self.secondary_color,
            "secondary-foreground": self.secondary_foreground_color,
            "accent": self.accent_color,
            "accent-foreground": self.accent_foreground_color,
            "background": self.background_color,
            "foreground": self.text_color,
            "muted": self.muted_color,
            "muted-foreground": self.muted_foreground_color,
            "card": self.card_color,
            "card-foreground": self.card_foreground_color,
            "border": self.border_color,
            "destructive": self.destructive_color,
            "destructive-foreground": self.destructive_foreground_color,
            "success": self.success_color,
        }

    def get_dark_tokens(self):
        return {
            "primary": self.primary_color_dark,
            "primary-foreground": self.primary_foreground_color_dark,
            "secondary": self.secondary_color_dark,
            "secondary-foreground": self.secondary_foreground_color_dark,
            "accent": self.accent_color_dark,
            "accent-foreground": self.accent_foreground_color_dark,
            "background": self.background_color_dark,
            "foreground": self.text_color_dark,
            "muted": self.muted_color_dark,
            "muted-foreground": self.muted_foreground_color_dark,
            "card": self.card_color_dark,
            "card-foreground": self.card_foreground_color_dark,
            "border": self.border_color_dark,
            "destructive": self.destructive_color_dark,
            "destructive-foreground": self.destructive_foreground_color_dark,
            "success": self.success_color_dark,
        }
