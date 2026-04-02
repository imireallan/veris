import environ
from config.settings.base import *  # noqa: F401,F403
from config.settings.base import BASE_DIR

env = environ.Env()
environ.Env.read_env(env_file=BASE_DIR / ".env")

DEBUG = False

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS")

DATABASES = {"default": env.db("DATABASE_URL")}

SECRET_KEY = env.str("SECRET_KEY")

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")

CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

LOGGING = {
    "version": 1,
    "disable_existing_loggers": True,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
        "file": {"class": "logging.FileHandler", "filename": "/var/log/django.log"},
    },
    "root": {
        "handlers": ["console", "file"],
        "level": "WARNING",
    },
}
