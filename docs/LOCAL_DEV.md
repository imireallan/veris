# Veris - Local Development Setup

## Prerequisites

- Docker & Docker Compose
- Python 3.11+ (via uv or pyenv)
- Node.js 18+ and npm/pnpm
- Git

## Repository Structure

```
Veris/
├── frontend/              # React Router v7 + Tailwind
├── backend/               # Django Core API
├── ai_engine/             # FastAPI AI Service
├── docker-compose.yml     # Local orchestration
├── .env                   # Local secrets (git-ignored)
└── docs/                  # All documentation
```

## Quick Start

### 1. Clone and Setup

```bash
git clone <repo-url>
cd Veris
cp .env.example .env
```

### 2. Configure Environment

Required variables in `.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:password@db:5432/veris

# AI Service
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pc-...
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=sustainability-ai

# Frontend
SESSION_SECRET=your_random_secret_here
SITE_URL=http://localhost:3000

# Django
DJANGO_SECRET_KEY=your_django_secret_key
```

### 3. Start Services

```bash
docker compose up --build
```

This starts:
- Frontend: http://localhost:3000
- Django API: http://localhost:8001
- FastAPI AI: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 4. Database Setup

```bash
# Run migrations
docker compose exec backend python manage.py migrate

# Create superuser
docker compose exec backend python manage.py createsuperuser

# Load initial data
docker compose exec backend python manage.py loaddata fixtures/initial.json
```

### 5. Verify Setup

```bash
# Check all services
curl http://localhost:8000/health     # AI Service
curl http://localhost:8001/health/    # Django Backend
open http://localhost:3000            # Frontend
```

## Development Workflow

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Hot reload enabled. Changes reflect immediately.

### Backend Development

```bash
cd backend
pip install -r requirements.txt
python manage.py runserver
```

Or with Docker:
```bash
docker compose exec backend bash
```

### AI Service Development

```bash
cd ai_engine
uv pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Or with Docker:
```bash
docker compose exec ai_engine bash
```

## Testing

### Frontend Tests
```bash
cd frontend
npm test                    # Vitest unit tests
npm run playwright          # Playwright e2e tests
```

### Backend Tests
```bash
cd backend
pytest                      # All tests
pytest -m unit             # Unit tests only
pytest -m integration      # Integration tests
```

### AI Engine Tests
```bash
cd ai_engine
pytest                     # All tests
pytest tests/unit          # Unit tests
```

## Debugging

### Common Issues

1. Database connection errors
   ```bash
   docker compose logs db
   docker compose restart db
   ```

2. AI Service not responding
   ```bash
   docker compose logs ai_engine
   # Check API keys in .env
   ```

3. Frontend build errors
   ```bash
   cd frontend
   rm -rf node_modules
   npm install
   ```

### Logging

All services log to stdout. View with:
```bash
docker compose logs -f        # All services
docker compose logs -f backend # Backend only
docker compose logs -f ai_engine # AI Service only
```

## Production-like Local Testing

```bash
# Build production images
docker compose -f docker-compose.prod.yml build

# Run with production settings
docker compose -f docker-compose.prod.yml up
```

This uses:
- Production Django settings
- Optimized frontend build
- Gunicorn for Django
- Uvicorn workers for FastAPI
