"""Django settings for running tests.

Uses SQLite in-memory — no Docker, no .env file needed.
Overrides DATABASES before base.py tries to read DATABASE_URL.
"""

import os

# Provide a fallback DATABASE_URL so base.py's environ.Env() doesn't crash
# when there is no .env file (e.g. in CI).
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")

# Now it's safe to import base
from config.settings.base import *  # noqa: F401,F403

DEBUG = True

# Override with SQLite regardless — tests should never hit Postgres
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

CELERY_TASK_ALWAYS_EAGER = True

# Use fast hashers in tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Don't write static files in tests
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"