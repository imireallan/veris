from rest_framework import serializers

from themes.models import Theme
from themes.utils import hex_to_hsl, hsl_to_hex, is_valid_hex


class ThemeSerializer(serializers.ModelSerializer):
    """Theme serializer that outputs HSL values for frontend CSS variables.

    Supports both light and dark mode color schemes.
    All color fields are output in HSL format (e.g., '217 89 51') for direct
    use in CSS custom properties like --primary: hsl(var(--primary)).
    Write operations accept HSL strings and convert to HEX for storage.
    """

    # Light mode - HSL-formatted color fields (read-only, computed from HEX storage)
    primary = serializers.SerializerMethodField()
    primary_foreground = serializers.SerializerMethodField()
    secondary = serializers.SerializerMethodField()
    secondary_foreground = serializers.SerializerMethodField()
    accent = serializers.SerializerMethodField()
    accent_foreground = serializers.SerializerMethodField()
    background = serializers.SerializerMethodField()
    foreground = serializers.SerializerMethodField()
    muted = serializers.SerializerMethodField()
    muted_foreground = serializers.SerializerMethodField()
    card = serializers.SerializerMethodField()
    card_foreground = serializers.SerializerMethodField()
    border = serializers.SerializerMethodField()
    destructive = serializers.SerializerMethodField()
    destructive_foreground = serializers.SerializerMethodField()
    success = serializers.SerializerMethodField()

    # Dark mode - HSL-formatted color fields (read-only)
    primary_dark = serializers.SerializerMethodField()
    primary_foreground_dark = serializers.SerializerMethodField()
    secondary_dark = serializers.SerializerMethodField()
    secondary_foreground_dark = serializers.SerializerMethodField()
    accent_dark = serializers.SerializerMethodField()
    accent_foreground_dark = serializers.SerializerMethodField()
    background_dark = serializers.SerializerMethodField()
    foreground_dark = serializers.SerializerMethodField()
    muted_dark = serializers.SerializerMethodField()
    muted_foreground_dark = serializers.SerializerMethodField()
    card_dark = serializers.SerializerMethodField()
    card_foreground_dark = serializers.SerializerMethodField()
    border_dark = serializers.SerializerMethodField()
    destructive_dark = serializers.SerializerMethodField()
    destructive_foreground_dark = serializers.SerializerMethodField()
    success_dark = serializers.SerializerMethodField()

    # Light mode - Write-only HSL input fields
    primary_hsl = serializers.CharField(write_only=True, required=False)
    primary_foreground_hsl = serializers.CharField(write_only=True, required=False)
    secondary_hsl = serializers.CharField(write_only=True, required=False)
    secondary_foreground_hsl = serializers.CharField(write_only=True, required=False)
    accent_hsl = serializers.CharField(write_only=True, required=False)
    accent_foreground_hsl = serializers.CharField(write_only=True, required=False)
    background_hsl = serializers.CharField(write_only=True, required=False)
    foreground_hsl = serializers.CharField(write_only=True, required=False)
    muted_hsl = serializers.CharField(write_only=True, required=False)
    muted_foreground_hsl = serializers.CharField(write_only=True, required=False)
    card_hsl = serializers.CharField(write_only=True, required=False)
    card_foreground_hsl = serializers.CharField(write_only=True, required=False)
    border_hsl = serializers.CharField(write_only=True, required=False)
    destructive_hsl = serializers.CharField(write_only=True, required=False)
    destructive_foreground_hsl = serializers.CharField(write_only=True, required=False)
    success_hsl = serializers.CharField(write_only=True, required=False)

    # Dark mode - Write-only HSL input fields
    primary_hsl_dark = serializers.CharField(write_only=True, required=False)
    primary_foreground_hsl_dark = serializers.CharField(write_only=True, required=False)
    secondary_hsl_dark = serializers.CharField(write_only=True, required=False)
    secondary_foreground_hsl_dark = serializers.CharField(
        write_only=True, required=False
    )
    accent_hsl_dark = serializers.CharField(write_only=True, required=False)
    accent_foreground_hsl_dark = serializers.CharField(write_only=True, required=False)
    background_hsl_dark = serializers.CharField(write_only=True, required=False)
    foreground_hsl_dark = serializers.CharField(write_only=True, required=False)
    muted_hsl_dark = serializers.CharField(write_only=True, required=False)
    muted_foreground_hsl_dark = serializers.CharField(write_only=True, required=False)
    card_hsl_dark = serializers.CharField(write_only=True, required=False)
    card_foreground_hsl_dark = serializers.CharField(write_only=True, required=False)
    border_hsl_dark = serializers.CharField(write_only=True, required=False)
    destructive_hsl_dark = serializers.CharField(write_only=True, required=False)
    destructive_foreground_hsl_dark = serializers.CharField(
        write_only=True, required=False
    )
    success_hsl_dark = serializers.CharField(write_only=True, required=False)

    # Branding
    logo_url = serializers.URLField(required=False, allow_blank=True)
    logo_url_dark = serializers.URLField(required=False, allow_blank=True)
    favicon_url = serializers.URLField(required=False, allow_blank=True)
    font_family = serializers.CharField(required=False)
    button_radius = serializers.FloatField(required=False)
    custom_css = serializers.CharField(required=False, allow_blank=True)
    custom_css_dark = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Theme
        fields = [
            "id",
            "organization",
            # Light mode colors
            "primary",
            "primary_foreground",
            "secondary",
            "secondary_foreground",
            "accent",
            "accent_foreground",
            "background",
            "foreground",
            "muted",
            "muted_foreground",
            "card",
            "card_foreground",
            "border",
            "destructive",
            "destructive_foreground",
            "success",
            # Dark mode colors
            "primary_dark",
            "primary_foreground_dark",
            "secondary_dark",
            "secondary_foreground_dark",
            "accent_dark",
            "accent_foreground_dark",
            "background_dark",
            "foreground_dark",
            "muted_dark",
            "muted_foreground_dark",
            "card_dark",
            "card_foreground_dark",
            "border_dark",
            "destructive_dark",
            "destructive_foreground_dark",
            "success_dark",
            # Light mode HSL input
            "primary_hsl",
            "primary_foreground_hsl",
            "secondary_hsl",
            "secondary_foreground_hsl",
            "accent_hsl",
            "accent_foreground_hsl",
            "background_hsl",
            "foreground_hsl",
            "muted_hsl",
            "muted_foreground_hsl",
            "card_hsl",
            "card_foreground_hsl",
            "border_hsl",
            "destructive_hsl",
            "destructive_foreground_hsl",
            "success_hsl",
            # Dark mode HSL input
            "primary_hsl_dark",
            "primary_foreground_hsl_dark",
            "secondary_hsl_dark",
            "secondary_foreground_hsl_dark",
            "accent_hsl_dark",
            "accent_foreground_hsl_dark",
            "background_hsl_dark",
            "foreground_hsl_dark",
            "muted_hsl_dark",
            "muted_foreground_hsl_dark",
            "card_hsl_dark",
            "card_foreground_hsl_dark",
            "border_hsl_dark",
            "destructive_hsl_dark",
            "destructive_foreground_hsl_dark",
            "success_hsl_dark",
            # Branding
            "logo_url",
            "logo_url_dark",
            "favicon_url",
            "font_family",
            "button_radius",
            "custom_css",
            "custom_css_dark",
        ]
        read_only_fields = [
            "id",
            # Light mode
            "primary",
            "primary_foreground",
            "secondary",
            "secondary_foreground",
            "accent",
            "accent_foreground",
            "background",
            "foreground",
            "muted",
            "muted_foreground",
            "card",
            "card_foreground",
            "border",
            "destructive",
            "destructive_foreground",
            "success",
            # Dark mode
            "primary_dark",
            "primary_foreground_dark",
            "secondary_dark",
            "secondary_foreground_dark",
            "accent_dark",
            "accent_foreground_dark",
            "background_dark",
            "foreground_dark",
            "muted_dark",
            "muted_foreground_dark",
            "card_dark",
            "card_foreground_dark",
            "border_dark",
            "destructive_dark",
            "destructive_foreground_dark",
            "success_dark",
        ]

    def _get_hsl(self, hex_value: str) -> str:
        """Convert HEX to HSL string."""
        return hex_to_hsl(hex_value)

    # Light mode getters
    def get_primary(self, obj: Theme) -> str:
        return self._get_hsl(obj.primary_color)

    def get_primary_foreground(self, obj: Theme) -> str:
        h, s, lightness = self._parse_hsl(self.get_primary(obj))
        return self._get_hsl("#FFFFFF") if lightness < 50 else self._get_hsl("#000000")

    def get_secondary(self, obj: Theme) -> str:
        return self._get_hsl(obj.secondary_color)

    def get_secondary_foreground(self, obj: Theme) -> str:
        h, s, lightness = self._parse_hsl(self.get_secondary(obj))
        return self._get_hsl("#FFFFFF") if lightness < 50 else self._get_hsl("#000000")

    def get_accent(self, obj: Theme) -> str:
        return self._get_hsl(obj.accent_color)

    def get_accent_foreground(self, obj: Theme) -> str:
        h, s, lightness = self._parse_hsl(self.get_accent(obj))
        return self._get_hsl("#FFFFFF") if lightness < 50 else self._get_hsl("#000000")

    def get_background(self, obj: Theme) -> str:
        return self._get_hsl(obj.background_color)

    def get_foreground(self, obj: Theme) -> str:
        return self._get_hsl(obj.text_color)

    def get_muted(self, obj: Theme) -> str:
        return self._get_hsl(obj.muted_color)

    def get_muted_foreground(self, obj: Theme) -> str:
        return self._get_hsl(obj.muted_foreground_color)

    def get_card(self, obj: Theme) -> str:
        return self._get_hsl(obj.card_color)

    def get_card_foreground(self, obj: Theme) -> str:
        return self._get_hsl(obj.card_foreground_color)

    def get_border(self, obj: Theme) -> str:
        return self._get_hsl(obj.border_color)

    def get_destructive(self, obj: Theme) -> str:
        return self._get_hsl(obj.destructive_color)

    def get_destructive_foreground(self, obj: Theme) -> str:
        return self._get_hsl(obj.destructive_foreground_color)

    def get_success(self, obj: Theme) -> str:
        return self._get_hsl(obj.success_color)

    # Dark mode getters
    def get_primary_dark(self, obj: Theme) -> str:
        return self._get_hsl(obj.primary_color_dark)

    def get_primary_foreground_dark(self, obj: Theme) -> str:
        h, s, lightness = self._parse_hsl(self.get_primary_dark(obj))
        return self._get_hsl("#FFFFFF") if lightness < 50 else self._get_hsl("#000000")

    def get_secondary_dark(self, obj: Theme) -> str:
        return self._get_hsl(obj.secondary_color_dark)

    def get_secondary_foreground_dark(self, obj: Theme) -> str:
        h, s, lightness = self._parse_hsl(self.get_secondary_dark(obj))
        return self._get_hsl("#FFFFFF") if lightness < 50 else self._get_hsl("#000000")

    def get_accent_dark(self, obj: Theme) -> str:
        return self._get_hsl(obj.accent_color_dark)

    def get_accent_foreground_dark(self, obj: Theme) -> str:
        h, s, lightness = self._parse_hsl(self.get_accent_dark(obj))
        return self._get_hsl("#FFFFFF") if lightness < 50 else self._get_hsl("#000000")

    def get_background_dark(self, obj: Theme) -> str:
        return self._get_hsl(obj.background_color_dark)

    def get_foreground_dark(self, obj: Theme) -> str:
        return self._get_hsl(obj.text_color_dark)

    def get_muted_dark(self, obj: Theme) -> str:
        return self._get_hsl(obj.muted_color_dark)

    def get_muted_foreground_dark(self, obj: Theme) -> str:
        return self._get_hsl(obj.muted_foreground_color_dark)

    def get_card_dark(self, obj: Theme) -> str:
        return self._get_hsl(obj.card_color_dark)

    def get_card_foreground_dark(self, obj: Theme) -> str:
        return self._get_hsl(obj.card_foreground_color_dark)

    def get_border_dark(self, obj: Theme) -> str:
        return self._get_hsl(obj.border_color_dark)

    def get_destructive_dark(self, obj: Theme) -> str:
        return self._get_hsl(obj.destructive_color_dark)

    def get_destructive_foreground_dark(self, obj: Theme) -> str:
        return self._get_hsl(obj.destructive_foreground_color_dark)

    def get_success_dark(self, obj: Theme) -> str:
        return self._get_hsl(obj.success_color_dark)

    @staticmethod
    def _parse_hsl(hsl_str: str) -> tuple:
        """Parse HSL string back to tuple for calculations."""
        if not hsl_str:
            return (0, 0, 50)
        parts = hsl_str.split()
        try:
            h = float(parts[0].rstrip("%"))
            s = float(parts[1].rstrip("%"))
            lightness = float(parts[2].rstrip("%"))
            return (h, s, lightness)
        except (IndexError, ValueError):
            return (0, 0, 50)

    def create(self, validated_data):
        """Create theme, converting HSL input to HEX for storage.
        
        Validates that color fields are in correct format before saving.
        Prevents HSL strings from being stored in HEX fields.
        """
        # Light mode fields
        hsl_fields = {
            "primary_hsl": "primary_color",
            "primary_foreground_hsl": "primary_foreground_color",
            "secondary_hsl": "secondary_color",
            "secondary_foreground_hsl": "secondary_foreground_color",
            "accent_hsl": "accent_color",
            "accent_foreground_hsl": "accent_foreground_color",
            "background_hsl": "background_color",
            "foreground_hsl": "text_color",
            "muted_hsl": "muted_color",
            "muted_foreground_hsl": "muted_foreground_color",
            "card_hsl": "card_color",
            "card_foreground_hsl": "card_foreground_color",
            "border_hsl": "border_color",
            "destructive_hsl": "destructive_color",
            "destructive_foreground_hsl": "destructive_foreground_color",
            "success_hsl": "success_color",
        }

        # Dark mode fields
        hsl_fields_dark = {
            "primary_hsl_dark": "primary_color_dark",
            "primary_foreground_hsl_dark": "primary_foreground_color_dark",
            "secondary_hsl_dark": "secondary_color_dark",
            "secondary_foreground_hsl_dark": "secondary_foreground_color_dark",
            "accent_hsl_dark": "accent_color_dark",
            "accent_foreground_hsl_dark": "accent_foreground_color_dark",
            "background_hsl_dark": "background_color_dark",
            "foreground_hsl_dark": "text_color_dark",
            "muted_hsl_dark": "muted_color_dark",
            "muted_foreground_hsl_dark": "muted_foreground_color_dark",
            "card_hsl_dark": "card_color_dark",
            "card_foreground_hsl_dark": "card_foreground_color_dark",
            "border_hsl_dark": "border_color_dark",
            "destructive_hsl_dark": "destructive_color_dark",
            "destructive_foreground_hsl_dark": "destructive_foreground_color_dark",
            "success_hsl_dark": "success_color_dark",
        }

        # Convert HSL fields to HEX
        for hsl_field, model_field in hsl_fields.items():
            if hsl_field in validated_data:
                hsl_value = validated_data.pop(hsl_field)
                if hsl_value:
                    validated_data[model_field] = hsl_to_hex(hsl_value)
        
        for hsl_field, model_field in hsl_fields_dark.items():
            if hsl_field in validated_data:
                hsl_value = validated_data.pop(hsl_field)
                if hsl_value:
                    validated_data[model_field] = hsl_to_hex(hsl_value)

        # Validate that any direct color fields (not from HSL conversion) are valid HEX
        # This prevents accidental storage of HSL strings in HEX fields
        color_fields = [
            "primary_color", "primary_foreground_color",
            "secondary_color", "secondary_foreground_color",
            "accent_color", "accent_foreground_color",
            "background_color", "text_color",
            "muted_color", "muted_foreground_color",
            "card_color", "card_foreground_color",
            "border_color", "destructive_color", "destructive_foreground_color",
            "success_color",
            "primary_color_dark", "primary_foreground_color_dark",
            "secondary_color_dark", "secondary_foreground_color_dark",
            "accent_color_dark", "accent_foreground_color_dark",
            "background_color_dark", "text_color_dark",
            "muted_color_dark", "muted_foreground_color_dark",
            "card_color_dark", "card_foreground_color_dark",
            "border_color_dark", "destructive_color_dark", "destructive_foreground_color_dark",
            "success_color_dark",
        ]
        
        for field in color_fields:
            if field in validated_data:
                value = validated_data[field]
                if value and not is_valid_hex(value):
                    # If it looks like HSL (contains spaces), reject it
                    if ' ' in str(value):
                        raise serializers.ValidationError({
                            field: f"Must be HEX format (e.g., '#10b981'), not HSL ('{value}'). "
                                   f"Use the _hsl fields for HSL input."
                        })

        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update theme, converting HSL input to HEX for storage.
        
        Validates that color fields are in correct format before saving.
        Prevents HSL strings from being stored in HEX fields.
        """
        # Light mode fields
        hsl_fields = {
            "primary_hsl": "primary_color",
            "primary_foreground_hsl": "primary_foreground_color",
            "secondary_hsl": "secondary_color",
            "secondary_foreground_hsl": "secondary_foreground_color",
            "accent_hsl": "accent_color",
            "accent_foreground_hsl": "accent_foreground_color",
            "background_hsl": "background_color",
            "foreground_hsl": "text_color",
            "muted_hsl": "muted_color",
            "muted_foreground_hsl": "muted_foreground_color",
            "card_hsl": "card_color",
            "card_foreground_hsl": "card_foreground_color",
            "border_hsl": "border_color",
            "destructive_hsl": "destructive_color",
            "destructive_foreground_hsl": "destructive_foreground_color",
            "success_hsl": "success_color",
        }

        # Dark mode fields
        hsl_fields_dark = {
            "primary_hsl_dark": "primary_color_dark",
            "primary_foreground_hsl_dark": "primary_foreground_color_dark",
            "secondary_hsl_dark": "secondary_color_dark",
            "secondary_foreground_hsl_dark": "secondary_foreground_color_dark",
            "accent_hsl_dark": "accent_color_dark",
            "accent_foreground_hsl_dark": "accent_foreground_color_dark",
            "background_hsl_dark": "background_color_dark",
            "foreground_hsl_dark": "text_color_dark",
            "muted_hsl_dark": "muted_color_dark",
            "muted_foreground_hsl_dark": "muted_foreground_color_dark",
            "card_hsl_dark": "card_color_dark",
            "card_foreground_hsl_dark": "card_foreground_color_dark",
            "border_hsl_dark": "border_color_dark",
            "destructive_hsl_dark": "destructive_color_dark",
            "destructive_foreground_hsl_dark": "destructive_foreground_color_dark",
            "success_hsl_dark": "success_color_dark",
        }

        # Convert HSL fields to HEX
        for hsl_field, model_field in hsl_fields.items():
            if hsl_field in validated_data:
                hsl_value = validated_data.pop(hsl_field)
                if hsl_value:
                    validated_data[model_field] = hsl_to_hex(hsl_value)
        
        for hsl_field, model_field in hsl_fields_dark.items():
            if hsl_field in validated_data:
                hsl_value = validated_data.pop(hsl_field)
                if hsl_value:
                    validated_data[model_field] = hsl_to_hex(hsl_value)

        # Validate that any direct color fields (not from HSL conversion) are valid HEX
        # This prevents accidental storage of HSL strings in HEX fields
        color_fields = [
            "primary_color", "primary_foreground_color",
            "secondary_color", "secondary_foreground_color",
            "accent_color", "accent_foreground_color",
            "background_color", "text_color",
            "muted_color", "muted_foreground_color",
            "card_color", "card_foreground_color",
            "border_color", "destructive_color", "destructive_foreground_color",
            "success_color",
            "primary_color_dark", "primary_foreground_color_dark",
            "secondary_color_dark", "secondary_foreground_color_dark",
            "accent_color_dark", "accent_foreground_color_dark",
            "background_color_dark", "text_color_dark",
            "muted_color_dark", "muted_foreground_color_dark",
            "card_color_dark", "card_foreground_color_dark",
            "border_color_dark", "destructive_color_dark", "destructive_foreground_color_dark",
            "success_color_dark",
        ]
        
        for field in color_fields:
            if field in validated_data:
                value = validated_data[field]
                if value and not is_valid_hex(value):
                    # If it looks like HSL (contains spaces), reject it
                    if ' ' in str(value):
                        raise serializers.ValidationError({
                            field: f"Must be HEX format (e.g., '#10b981'), not HSL ('{value}'). "
                                   f"Use the _hsl fields for HSL input."
                        })

        return super().update(instance, validated_data)
