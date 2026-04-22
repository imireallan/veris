import pytest

from organizations.models import Organization
from themes.models import OrganizationTheme
from themes.serializers import ThemeSerializer


@pytest.mark.django_db
@pytest.mark.integrated
class TestThemeSerializer:
    def test_serializer_returns_hsl_tokens_from_hsl_triplet_storage(self):
        org = Organization.objects.create(name="Theme Org", slug="theme-org")
        theme = OrganizationTheme.objects.create(
            organization=org,
            primary_color="217 91 60",
            background_color="210 40 96",
            text_color="222 47 11",
            card_color="0 0 100",
            border_color="214 32 91",
        )

        data = ThemeSerializer(theme).data

        assert data["primary"] == "217 91% 60%"
        assert data["background"] == "210 40% 96%"
        assert data["foreground"] == "222 47% 11%"
        assert data["card"] == "0 0% 100%"
        assert data["border"] == "214 32% 91%"

    def test_update_accepts_percent_hsl_and_stores_triplets_without_percent(self):
        org = Organization.objects.create(name="Theme Update Org", slug="theme-update-org")
        theme = OrganizationTheme.objects.create(organization=org)

        serializer = ThemeSerializer(
            theme,
            data={
                "background_hsl": "0 0% 100%",
                "foreground_hsl": "222 84% 5%",
                "primary_hsl_dark": "160 84% 39%",
            },
            partial=True,
        )

        assert serializer.is_valid(), serializer.errors
        serializer.save()
        theme.refresh_from_db()

        assert theme.background_color == "0 0 100"
        assert theme.text_color == "222 84 5"
        assert theme.primary_color_dark == "160 84 39"
