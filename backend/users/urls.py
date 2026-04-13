"""URL routes for the users app's authentication endpoints."""

from django.urls import path

from users.views.auth import login_view, me_view, set_password_view, reset_password_request_view, reset_password_confirm_view

app_name = "users"

urlpatterns = [
    path("auth/login/", login_view, name="auth-login"),
    path("auth/me/", me_view, name="auth-me"),
    path("auth/set-password/", set_password_view, name="auth-set-password"),
    path("auth/reset-password/request/", reset_password_request_view, name="auth-reset-password-request"),
    path("auth/reset-password/confirm/", reset_password_confirm_view, name="auth-reset-password-confirm"),
]
