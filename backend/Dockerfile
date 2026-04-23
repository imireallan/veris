# ─────────────────────────────────────────────
# Base
# ─────────────────────────────────────────────
FROM python:3.11-slim AS base

# Install system dependencies for WeasyPrint (PDF generation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-xlib-2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# 1. Force UV to use system python
# 2. Add the global site-packages to PYTHONPATH
# 3. Ensure /usr/local/bin (where uvicorn lives) is in PATH
ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    UV_COMPILE_BYTECODE=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# ─────────────────────────────────────────────
# Builder (Installs Prod Dependencies)
# ─────────────────────────────────────────────
FROM base AS builder

# Install ONLY production dependencies
RUN --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# ─────────────────────────────────────────────
# Development (Includes Dev Group)
# ─────────────────────────────────────────────

FROM builder AS development

# Note: Removed --no-install-project so binaries are created
RUN --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --group dev

COPY . .

EXPOSE 8000
EXPOSE 5678
ENV DJANGO_SETTINGS_MODULE=config.settings.development
CMD ["python", "-m", "debugpy","--listen", "0.0.0.0:5678","manage.py", "runserver","0.0.0.0:8000","--noreload"]

# ─────────────────────────────────────────────
# Production Runtime
# ─────────────────────────────────────────────
FROM base AS production

# Copy the uv-managed virtual environment from the builder stage.
# UV_PROJECT_ENVIRONMENT points at /opt/venv, so copying /usr/local/* misses
# installed dependencies and console entrypoints in production.
COPY --from=builder /opt/venv /opt/venv

COPY . .

EXPOSE 8000
ENV DJANGO_SETTINGS_MODULE=config.settings.production

# Gunicorn is already in your [project.dependencies]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]