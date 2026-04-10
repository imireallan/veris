from rest_framework import serializers

from themes.models import Theme


class ThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Theme
        fields = [
            "id",
            "organization",
            "primary_color",
            "secondary_color",
            "accent_color",
            "background_color",
            "text_color",
            "logo_url",
            "favicon_url",
            "font_family",
            "button_radius",
            "custom_css",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
