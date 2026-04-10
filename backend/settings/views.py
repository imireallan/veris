"""Settings views — admin pages for customizing client configurations."""

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render

from assessments.models import ESGFocusArea, Framework
from organizations.models import Organization
from themes.models import Theme
from users.models import User


def _get_org(request, org_id=None):
    """Get org from kwargs or user's org."""
    if org_id:
        return get_object_or_404(Organization, id=org_id)
    # Fallback to first org for admin users
    return Organization.objects.first()


@login_required
def settings_dashboard(request, org_id=None):
    """Main settings dashboard."""
    org = _get_org(request, org_id)
    if not org:
        orgs = Organization.objects.all()
        return render(request, "settings/org_list.html", {"orgs": orgs})

    theme, _ = Theme.objects.get_or_create(organization=org)
    frameworks = Framework.objects.all()
    focus_area_count = org.focus_areas.count()
    user_count = User.objects.filter(organization=org).count()

    return render(
        request,
        "settings/dashboard.html",
        {
            "org": org,
            "theme": theme,
            "frameworks": frameworks,
            "focus_area_count": focus_area_count,
            "user_count": user_count,
            "orgs": Organization.objects.all(),
        },
    )


@login_required
def org_settings(request, org_id=None):
    """Organization settings — name, slug, sector, status."""
    org = _get_org(request, org_id)
    if not org:
        return redirect("settings:org_list")

    if request.method == "POST":
        org.name = request.POST.get("name", org.name)
        org.slug = request.POST.get("slug", org.slug)
        org.subscription_tier = request.POST.get(
            "subscription_tier", org.subscription_tier
        )
        org.status = request.POST.get("status", org.status)
        org.custom_domain = request.POST.get("custom_domain", org.custom_domain)
        org.save()
        messages.success(request, f"Organization '{org.name}' updated.")
        return redirect("settings:org_settings", org_id=org.id)

    return render(
        request,
        "settings/org_settings.html",
        {"org": org, "orgs": Organization.objects.all()},
    )


@login_required
def theme_settings(request, org_id=None):
    """Theme/branding settings — colors, fonts, logo."""
    org = _get_org(request, org_id)
    if not org:
        return redirect("settings:org_list")

    theme, _ = Theme.objects.get_or_create(organization=org)

    if request.method == "POST":
        theme.primary_color = request.POST.get("primary_color", theme.primary_color)
        theme.secondary_color = request.POST.get(
            "secondary_color", theme.secondary_color
        )
        theme.accent_color = request.POST.get("accent_color", theme.accent_color)
        theme.background_color = request.POST.get(
            "background_color", theme.background_color
        )
        theme.text_color = request.POST.get("text_color", theme.text_color)
        theme.logo_url = request.POST.get("logo_url", theme.logo_url)
        theme.favicon_url = request.POST.get("favicon_url", theme.favicon_url)
        theme.font_family = request.POST.get("font_family", theme.font_family)
        theme.button_radius = request.POST.get("button_radius", theme.button_radius)
        theme.custom_css = request.POST.get("custom_css", theme.custom_css)
        theme.save()
        messages.success(request, "Theme updated successfully.")
        return redirect("settings:theme_settings", org_id=org.id)

    color_preview = {
        "primary": theme.primary_color or "#47B881",
        "secondary": theme.secondary_color or "#2D5A7B",
        "accent": theme.accent_color or "#E88D67",
        "background": theme.background_color or "#FAFAFA",
    }

    return render(
        request,
        "settings/theme_settings.html",
        {"org": org, "theme": theme, "color_preview": color_preview},
    )


@login_required
def framework_settings(request, org_id=None):
    """Framework configuration — which ESG standards are active."""
    org = _get_org(request, org_id)
    if not org:
        return redirect("settings:org_list")

    frameworks = Framework.objects.all()
    focus_areas = ESGFocusArea.objects.filter(organization=org)

    if request.method == "POST":
        for area in focus_areas:
            key = f"focus_area_{area.id}"
            area.is_active = request.POST.get(key) == "on"
            area.save(update_fields=["is_active"])
        messages.success(request, "Framework configuration updated.")
        return redirect("settings:framework_settings", org_id=org.id)

    return render(
        request,
        "settings/framework_settings.html",
        {"org": org, "frameworks": frameworks, "focus_areas": focus_areas},
    )


@login_required
def user_settings(request, org_id=None):
    """User/team management for an organization."""
    org = _get_org(request, org_id)
    if not org:
        return redirect("settings:org_list")

    users = User.objects.filter(organization=org)

    if request.method == "POST":
        action = request.POST.get("action")
        if action == "add_user":
            email = request.POST.get("email")
            name = request.POST.get("name")
            role = request.POST.get("role", User.Role.COORDINATOR)
            if email and name and not User.objects.filter(email=email).exists():
                User.objects.create_user(
                    email=email, name=name, organization=org, role=role
                )
                messages.success(request, f"User '{name}' added.")
            else:
                messages.error(request, "User already exists or invalid data.")
        elif action == "update_role":
            user_id = request.POST.get("user_id")
            new_role = request.POST.get("role")
            if user_id and new_role:
                user = get_object_or_404(User, id=user_id, organization=org)
                user.role = new_role
                user.save(update_fields=["role"])
                messages.success(request, f"Role updated for {user.email}.")
        return redirect("settings:user_settings", org_id=org.id)

    return render(
        request,
        "settings/user_settings.html",
        {"org": org, "users": users, "roles": User.Role.choices},
    )


@login_required
def integrations_settings(request, org_id=None):
    """Third-party integrations — LLM providers, Stripe, etc."""
    org = _get_org(request, org_id)
    if not org:
        return redirect("settings:org_list")
    return render(request, "settings/integrations.html", {"org": org})


@login_required
def api_keys_settings(request, org_id=None):
    """API key management."""
    org = _get_org(request, org_id)
    if not org:
        return redirect("settings:org_list")
    return render(request, "settings/api_keys.html", {"org": org})


@login_required
def feature_settings(request, org_id=None):
    """Feature flags — toggle features per org."""
    org = _get_org(request, org_id)
    if not org:
        return redirect("settings:org_list")
    return render(request, "settings/features.html", {"org": org})
