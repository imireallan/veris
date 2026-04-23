# ─────────────────────────────────────────────
# Base
# ─────────────────────────────────────────────
FROM python:3.11-slim AS base

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
# Builder (Production Dependencies)
# ─────────────────────────────────────────────
FROM base AS builder

# Install production dependencies only
# We use --no-install-project to cache layers before copying source code
RUN --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# ─────────────────────────────────────────────
# Development (Includes Testing Tools)
# ─────────────────────────────────────────────

FROM builder AS development

# Note: Removed --no-install-project so binaries are created
RUN --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --group dev

COPY . .

EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]

# ─────────────────────────────────────────────
# Production (Lean Runtime)
# ─────────────────────────────────────────────
FROM base AS production

# Copy the uv-managed virtual environment from the builder stage.
# UV_PROJECT_ENVIRONMENT points at /opt/venv, so this is the only portable
# runtime copy target.
COPY --from=builder /opt/venv /opt/venv

COPY . .

EXPOSE 8001

# Using --workers 2 as in your original, but uvicorn[standard] handles this well
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]