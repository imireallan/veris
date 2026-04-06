from config.settings.base import *  # noqa: F401,F403
from config.settings.base import env

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["*"])


DEBUG = env.bool("DEBUG", default=True)
SECRET_KEY = env.str("DJANGO_SECRET_KEY", default="django-insecure-change-me-in-production")

INSTALLED_APPS = INSTALLED_APPS + ["django_extensions"]

CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:3000", "http://127.0.0.1:3000"],
)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "root": {
        "handlers": ["console"],
        "level": "DEBUG",
    },
}
