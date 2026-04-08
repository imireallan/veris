"""URL routes for the users app's authentication endpoints."""

from django.urls import path
from users.views.auth import login_view, me_view

app_name = "users"

urlpatterns = [
    path("auth/login/", login_view, name="auth-login"),
    path("auth/me/", me_view, name="auth-me"),
]
