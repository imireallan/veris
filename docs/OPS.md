# Veris - Operations Guide

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       AWS EKS Cluster                           │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │ Django   │ │ FastAPI  │ │ Nginx/   │ │ Redis              │ │
│  │ Core Pods│ │ AI Pods  │ │ Ingress  │ │ Cache Pods         │ │
│  │ (3+)     │ │ (2+)     │ │          │ │                    │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Sidecars                               │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────────┐  │  │
│  │  │Sentry    │ │CloudWatch│ │ Prometheus/Grafana       │  │  │
│  │  │Agent     │ │Agent     │ │ Metrics                  │  │  │
│  │  └──────────┘ └──────────┘ └──────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
    ┌─────────┐       ┌─────────┐       ┌──────────────────┐
    │ RDS     │       │ S3      │       │ Pinecone         │
    │ Postgres│       │ Storage │       │ Vector DB        │
    └─────────┘       └─────────┘       └──────────────────┘
```

## Container Strategy

Uses Docker Compose for local development and AWS ECR + EKS for production.

### Local Development (Docker Compose)

Services:
- `frontend` (React Router v7 UI)
- `backend` (Django Core)
- `ai_engine` (FastAPI AI Service)
- `postgres` (Database)
- `redis` (Cache/Queue)

```bash
docker compose up --build
```

### Production Deployment

- **Images**: Built via GitHub Actions, pushed to AWS ECR
- **Orchestration**: AWS EKS with rolling updates
- **Secrets**: AWS Secrets Manager injected into pods
- **Domain**: Route53 with ACM certificates

## CI/CD Pipeline (GitHub Actions)

### Validation
- Frontend: `tsc --noEmit`, `eslint`, `vitest`
- Backend: `pytest`, `flake8`, `mypy`
- AI Engine: `pytest`, `pylint`

### Build
- Multi-stage Docker builds for minimal image size
- Security scanning with Trivy

### Deploy
- Blue/green deployment to EKS
- Database migrations via init container
- Health checks before traffic switch

## Monitoring & Observability

### Sentry Integration
- All services report errors to Sentry
- Custom tags: `service`, `organization_id`, `user_role`
- Performance monitoring for API endpoints

### CloudWatch
- System metrics: CPU, memory, disk
- Custom metrics: AI token usage, RAG latency
- Log aggregation from all pods

### Business Metrics
- Assessment completion rates
- Knowledge base utilization
- AI response accuracy (manual feedback loop)
- User engagement by feature

## Scaling Strategy

### Horizontal Pod Autoscaling
- Django Core: Scale based on request count
- FastAPI AI: Scale based on GPU utilization (if applicable) or request queue depth

### Database
- Read replicas for dashboard queries
- Connection pooling via PgBouncer
- Regular VACUUM and ANALYZE jobs

### Vector Database
- Pinecone auto-scaling based on query volume
- Regular index optimization
- Backup strategy via Pinecone snapshots

## Backup & Disaster Recovery

### Database
- Automated daily backups with 30-day retention
- Point-in-time recovery enabled
- Cross-region replication for DR

### File Storage
- S3 versioning enabled for all document storage
- Lifecycle policies for old assessments
- Cross-region replication for critical documents

### Recovery Procedures
- RTO: 4 hours
- RPO: 1 hour
- Runbook maintained in `docs/`
- Quarterly DR drills

## Security

### Data Protection
- All data encrypted at rest (AES-256)
- TLS 1.3 for all communications
- Multi-tenant data isolation enforced at ORM level

### Access Control
- JWT-based authentication
- Role-based authorization
- IP whitelisting for admin endpoints
- Regular security audits

### Compliance
- GDPR ready (data export, deletion, consent)
- SOC 2 Type II preparation
- Regular penetration testing
