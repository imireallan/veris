"""Email configuration for Veris.

Supports three modes:
1. Local development: Fake SMTP server (MailHog-style) on localhost:1025
2. Testing: Console email backend (prints to stdout)
3. Production: Real SMTP server (SendGrid, AWS SES, etc.)
"""

from config.settings.base import env

# ── Email Backend Selection ─────────────────────────────────────
# Determines how emails are sent. Options:
# - 'django.core.mail.backends.smtp.EmailBackend' → Real SMTP server
# - 'django.core.mail.backends.console.EmailBackend' → Print to console (testing)
# - 'django.core.mail.backends.dummy.EmailBackend' → Discard emails (dev fallback)

# Default to SMTP for local dev with fake-smtp-server
EMAIL_BACKEND = env.str(
    "EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend"
)

# ── SMTP Configuration (for smtp.EmailBackend) ─────────────────
EMAIL_HOST = env.str("EMAIL_HOST", default="localhost")
EMAIL_PORT = env.int("EMAIL_PORT", default=1025)
EMAIL_HOST_USER = env.str("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env.str("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=False)
EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL", default=False)

# ── Default From Addresses ──────────────────────────────────────
# Used for system-generated emails (invitations, notifications, etc.)
SERVER_EMAIL = env.str("SERVER_EMAIL", default="no-reply@veris.local")
DEFAULT_FROM_EMAIL = env.str("DEFAULT_FROM_EMAIL", default=SERVER_EMAIL)

# ── Email Configuration Validation ─────────────────────────────
# Only validate in production (not local dev with fake SMTP)
if env.str("DJANGO_SETTINGS_MODULE", "").endswith("production"):
    if EMAIL_BACKEND == "django.core.mail.backends.smtp.EmailBackend":
        if not EMAIL_HOST:
            raise ValueError("EMAIL_HOST must be configured for production SMTP")
        if not DEFAULT_FROM_EMAIL or DEFAULT_FROM_EMAIL == "no-reply@veris.local":
            raise ValueError("DEFAULT_FROM_EMAIL must be configured for production")

# ── Environment-Specific Overrides ─────────────────────────────
# These are automatically applied based on DJANGO_SETTINGS_MODULE

# For testing: use console backend
if env.str("DJANGO_SETTINGS_MODULE", "").endswith("testing"):
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# For local dev with fake-smtp-server:
# - EMAIL_HOST=localhost, EMAIL_PORT=1025 (default)
# - No auth required
# - Web UI available at http://localhost:1080
