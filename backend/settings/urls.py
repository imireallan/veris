from django.urls import path

from . import views

app_name = "settings"

urlpatterns = [
    path("settings/", views.settings_dashboard, name="dashboard"),
    path("settings/<uuid:org_id>/", views.settings_dashboard, name="dashboard_org"),
    path("settings/<uuid:org_id>/org/", views.org_settings, name="org_settings"),
    path("settings/<uuid:org_id>/theme/", views.theme_settings, name="theme_settings"),
    path(
        "settings/<uuid:org_id>/frameworks/",
        views.framework_settings,
        name="framework_settings",
    ),
    path("settings/<uuid:org_id>/users/", views.user_settings, name="user_settings"),
    path(
        "settings/<uuid:org_id>/integrations/",
        views.integrations_settings,
        name="integrations",
    ),
    path("settings/<uuid:org_id>/api-keys/", views.api_keys_settings, name="api_keys"),
    path("settings/<uuid:org_id>/features/", views.feature_settings, name="features"),
    path("settings/orgs/", views.org_settings, name="org_list"),
]
