SHELL := /bin/bash
.DEFAULT_GOAL := help

.PHONY: help setup up up-build down down-clean db-up \
        backend-makemigrations backend-migrate backend-seed backend-shell backend-bash backend-test \
        frontend-install frontend-logs \
        ai-shell ai-bash ai-test \
        logs logs-backend logs-frontend logs-ai clean

# ─────────────────────────────────────────────
# Help
# ─────────────────────────────────────────────
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-24s\033[0m %s\n", $$1, $$2}'

# ─────────────────────────────────────────────
# Environment
# ─────────────────────────────────────────────
.env: .env.example
	@echo "Creating .env from .env.example..."
	if [ -f .env ]; then \
		echo ".env already exists. Skipping creation."; \
	else \
		cp .env.example .env; \
	fi

# ─────────────────────────────────────────────
# Core Lifecycle
# ─────────────────────────────────────────────
setup: .env ## Initialise app (db + migrations + seed)
	$(MAKE) db-up
	@echo "Waiting for database (healthcheck)..."
	@until docker compose exec db pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done

	# Run setup tasks in ephemeral containers
	docker compose run --rm backend python manage.py makemigrations
	docker compose run --rm backend python manage.py migrate
	docker compose run --rm backend python manage.py seed

	@echo ""
	@echo "\033[32m========================================\033[0m"
	@echo "\033[32m  App initialised and seeded!\033[0m"
	@echo "\033[32m========================================\033[0m"

up: ## Start all services (dev)
	docker compose up

up-build: ## Start all services with rebuild
	docker compose up --build

down: ## Stop all services
	docker compose down

down-clean: ## Stop everything + remove volumes
	docker compose down -v --remove-orphans

db-up: ## Start database only
	docker compose up -d db

# ─────────────────────────────────────────────
# Backend (Django)
# ─────────────────────────────────────────────
backend-makemigrations: ## Create migrations
	docker compose run --rm backend python manage.py makemigrations

backend-migrate: ## Apply migrations
	docker compose run --rm backend python manage.py migrate

backend-seed: ## Seed DB
	docker compose run --rm backend python manage.py seed

backend-shell: ## Django shell (requires running container)
	docker compose exec backend python manage.py shell

backend-bash: ## Bash into backend container
	docker compose exec backend bash

backend-test: ## Run backend tests
	docker compose run --rm backend pytest

create-superuser: ## Create Django superuser
	docker compose run --rm backend python manage.py createsuperuser

# ─────────────────────────────────────────────
# Frontend (Vite)
# ─────────────────────────────────────────────
frontend-install: ## Install dependencies
	docker compose exec frontend npm install

frontend-logs: ## Tail frontend logs
	docker compose logs -f frontend

# ─────────────────────────────────────────────
# AI Engine (FastAPI)
# ─────────────────────────────────────────────
ai-shell: ## Python shell in AI container
	docker compose exec ai_engine python

ai-bash: ## Bash into AI container
	docker compose exec ai_engine bash

ai-test: ## Run AI tests
	docker compose run --rm ai_engine pytest

# ─────────────────────────────────────────────
# Logs / Debugging
# ─────────────────────────────────────────────
logs: ## Tail all logs
	docker compose logs -f

logs-backend: ## Tail backend logs
	docker compose logs -f backend

logs-frontend: ## Tail frontend logs
	docker compose logs -f frontend

logs-ai: ## Tail AI engine logs
	docker compose logs -f ai_engine

# ─────────────────────────────────────────────
# Utility
# ─────────────────────────────────────────────
clean: ## Remove .env file
	rm -f .env