from config.settings.base import *  # noqa: F401,F403
from config.settings.base import (
    AWS_S3_CUSTOM_DOMAIN,
    AWS_S3_REGION_NAME,
    AWS_STORAGE_BUCKET_NAME,
    env,
)

DEBUG = False

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS")

SECRET_KEY = env.str("DJANGO_SECRET_KEY")

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")

CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=True)
CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE", default=True)

# Production uses S3 for file storage
USE_S3 = True
s3_host = AWS_S3_CUSTOM_DOMAIN or (
    f"{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com"
    if AWS_STORAGE_BUCKET_NAME
    else ""
)
MEDIA_URL = f"https://{s3_host.rstrip('/')}/media/" if s3_host else "/media/"
MEDIA_ROOT = None
STORAGES = {
    "default": {
        "BACKEND": "config.storage.S3MediaStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
}
