SHELL := /bin/bash
.PHONY: help setup up up-build down clean install

DEFAULT_GOAL := help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies (Python + Node)
	cd backend && pip install -r requirements.txt
	cd frontend && npm install
	cd ai_engine && pip install -r requirements.txt

setup: install .env ## Initialise app: creates .env, runs migrations, seeds demo data
	make db-up
	@echo "Waiting for database..."
	@sleep 3
	cd backend && python manage.py makemigrations
	cd backend && python manage.py migrate
	cd backend && python manage.py seed
	@echo ""
	@echo "\033[32m========================================\033[0m"
	@echo "\033[32m  App initialised and seeded!\033[0m"
	@echo "\033[32m  Login: admin@example.com / admin\033[0m"
	@echo "\033[32m========================================\033[0m"

.env: .env.example
	@echo "Creating .env from .env.example..."
	cp .env.example .env

db-up: ## Start database only
	docker compose up -d db

up: ## Start all services
	docker compose up

up-dev: ## Start all services with hot-reload (watch mode)
	docker compose watch

down: ## Stop all services
	docker compose down

down-clean: ## Stop and remove all containers, volumes, and networks
	docker compose down -v --rmi local

backend-migrate: ## Run Django migrations
	cd backend && python manage.py migrate

backend-seed: ## Seed database with demo data
	cd backend && python manage.py seed

backend-shell: ## Open Django shell
	cd backend && python manage.py shell

backend-test: ## Run backend tests
	cd backend && pytest

frontend-dev: ## Start frontend dev server
	cd frontend && npm run dev

ai-dev: ## Start AI engine dev server
	cd ai_engine && uvicorn main:app --reload --port 8001

lint: ## Lint all services
	cd backend && black . && flake8 .
	cd frontend && npx tsc --noEmit

clean: ## Remove .env file
	rm -f .env
