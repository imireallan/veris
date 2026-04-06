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

full-reset: down-clean ## Wipe everything, rebuild from scratch, migrate + seed
	@echo "\033[33m>>> Rebuilding all images...\033[0m"
	docker compose up -d --build db
	@sleep 3
	docker compose up -d --build backend frontend
	@echo "Waiting for database..."
	@until docker compose exec db pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done
	@echo "Running migrations + seed..."
	docker compose run --rm backend python manage.py migrate
	docker compose run --rm backend python manage.py seed
	@echo "\033[33m>>> Migrating Bettercoal data...\033[0m"
	$(MAKE) migrate-bettercoal
	@echo ""
	@echo "\033[32m========================================\033[0m"
	@echo "\033[32m  Full reset complete!\033[0m"
	@echo "\033[32m  Login: admin@example.com / admin\033[0m"
	@echo "\033[32m========================================\033[0m"
	@echo ""
	@echo "\033[33m>>> Quick verification:\033[0m"
	@docker exec veris-db-1 psql -U postgres -d veris -c \
		"SELECT 'Orgs: ' || COUNT(*) FROM organizations UNION ALL SELECT 'Users: ' || COUNT(*) FROM users UNION ALL SELECT 'Frameworks: ' || COUNT(*) FROM frameworks UNION ALL SELECT 'Sites: ' || COUNT(*) FROM sites UNION ALL SELECT 'Assessments: ' || COUNT(*) FROM assessments UNION ALL SELECT 'Findings: ' || COUNT(*) FROM findings;"

wire: ## Full end-to-end setup: DB → migrations → seed → bettercoal → verify
	@echo "\033[33m>>> Starting database...\033[0m"
	$(MAKE) db-up
	@echo "Waiting for database (healthcheck)..."
	@until docker compose exec db pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done
	@echo "\033[33m>>> Running Django migrations...\033[0m"
	docker compose run --rm backend python manage.py migrate
	@echo "\033[33m>>> Seeding demo data...\033[0m"
	docker compose run --rm backend python manage.py seed
	@echo "\033[33m>>> Migrating Bettercoal data...\033[0m"
	$(MAKE) migrate-bettercoal
	@echo ""
	@echo "\033[32m========================================\033[0m"
	@echo "\033[32m  Wire complete! App is ready.\033[0m"
	@echo "\033[32m  Login: admin@example.com / admin\033[0m"
	@echo "\033[32m========================================\033[0m"
	@echo ""
	@echo "\033[33m>>> Verification:\033[0m"
	@docker exec veris-db-1 psql -U postgres -d veris -c \
		"SELECT 'Orgs: ' || COUNT(*) FROM organizations UNION ALL SELECT 'Users: ' || COUNT(*) FROM users UNION ALL SELECT 'Frameworks: ' || COUNT(*) FROM frameworks UNION ALL SELECT 'Sites: ' || COUNT(*) FROM sites UNION ALL SELECT 'Assessments: ' || COUNT(*) FROM assessments UNION ALL SELECT 'Findings: ' || COUNT(*) FROM findings UNION ALL SELECT 'Focus Areas: ' || COUNT(*) FROM esg_focus_areas;"


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

migrate-bettercoal: ## Migrate Bettercoal data into Veris DB
	@echo "Loading bettercoal.sql into temp database..."
	@docker exec veris-db-1 psql -U postgres -c "DROP DATABASE IF EXISTS bettercoal_temp;"
	@docker exec veris-db-1 psql -U postgres -c "CREATE DATABASE bettercoal_temp;"
	@docker cp backend/bettercoal.sql veris-db-1:/tmp/bettercoal.sql
	@docker exec veris-db-1 psql -U postgres -d bettercoal_temp -f /tmp/bettercoal.sql
	@echo "Temp DB loaded. Running migration..."
	docker compose exec backend python migrate_bettercoal.py
	@echo "Bettercoal migration complete!"

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