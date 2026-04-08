# Bettercoal Platform Architecture

## What It Is

A **Django monolith** for managing environmental/social compliance assessments in the coal mining industry. Multi-stakeholder workflow: mining companies ("suppliers/producers") get assessed by independent assessors, with oversight from member companies and a secretariat.

## Path

`/Users/allanimire/projects/TDi/bettercoal`

---

## Core Entities

| Entity | Purpose |
|---|---|
| **AssuranceProcess** | Central workflow instance linking everything together |
| **SupplierOrganisation** | Mining company being assessed |
| **MineSite** | Individual mine location with detailed ops/environmental data |
| **AssessmentReport** | Site-assessment report with findings per provision |
| **CIP (Continuous Improvement Plan)** | Tracks findings and remediation over time |
| **CIPCode** | Versioned framework: Principles > Categories > Provisions |
| **SupplierQuestionnaire** | Virtual model linking categories to mine sites |

---

## User Roles

1. **Secretariat** — Platform admin/superuser
2. **Supplier** — Mining company staff (Coordinator + Team Members)
3. **Assessor** — Lead + Team assessors who conduct assessments
4. **Member** — Bettercoal member companies, view-only access to assigned processes

---

## Main Workflow (4 Phases)

### 1. Producer Commitment
- Secretariat invites supplier
- Supplier signs Letter of Commitment (LOC) + Commitment Agreement (CA)

### 2. Desktop Review
- Supplier submits operations info (mine sites, certs, safety stats, environmental data)
- Secretariat assigns lead assessor
- Lead assessor defines site assessment scope
- Supplier completes questionnaire (Yes/No/N/A per provision)
- Lead assessor uploads assessment plan

### 3. Site-Assessment
- Assessors draft Site-Assessment Report (rate each provision: Meets / Substantially Meets / Partially Meets / Misses)
- Supplier reviews and comments
- Assessors incorporate feedback
- Secretariat approves draft
- Lead assessor finalizes report

### 4. Continuous Improvement Plan (CIP)
- Assessors set deadlines for findings
- Supplier assigns responsible parties
- CIP finalized → creates monitoring cycles (1/3/6/9/12/15/18 months)
- Each cycle: evidence upload → review → submit → deadline reminders

---

## Key Architectural Patterns

### ActionGraph (Custom Workflow Engine)
Frozen dataclass-based state machine:
- **Action** — Individual step with prerequisite chain, role ACL (access/edit/submit), email config
- **ActionGroup** — Groups actions into phases
- **ActionGraph** — Top-level container, copied per-request with user role + completed actions

### ActionableModel
Abstract base giving any model action tracking (django-actstream), deadlines, and state management.

### Document Management
GenericForeignKey-based — files attach to any model (provisions, findings, reports, signed docs).

### Deadline & Reminder System
- ActionDeadline tied to ActionGraph actions via identifier
- Auto-creates ActionDeadlineReminder based on days_ahead config
- Cron job sends emails for reminders due today
- Reminders auto-invalidated when action completes

---

## Django Apps

| App | Purpose |
|---|---|
| `assurance_process/` | Core process, invitations, ops info, action graph |
| `supplier_questionnaire/` | Questionnaire submission and responses |
| `assessment_planning/` | Assessment plan document upload |
| `assessment_report/` | Site assessment drafting, review, findings |
| `cip/` | Continuous Improvement Plan with monitoring cycles |
| `cip_code/` | Versioned CIP provisions/principles framework |
| `users/` | Custom user model with profile types |
| `common/` | Shared models (Document, ActionableModel) |
| `deadlines/` | ActionDeadline + ActionDeadlineReminder + cron |
| `notifications/` | Email notifications and in-app alerts |
| `dashboard/` | Dashboard views |

---

## Known Issues

- Can't open new process if supplier has no coordinator
- Using existing supplier fails: "Supplier not invited. Fix the errors on the form"
- Monitoring tab (`cip/{id}/monitoring`) returns 403
- Name doesn't wrap on assurance process listing (pushes status bar out of frame)
- Status bar pop-ups push out of frame
- "Is the mine site in Indigenous territories?" question is repeated

---

## Tech Stack

- Django 3.x (Python 3.9)
- PostgreSQL
- Jinja2 templates (not React)
- CKEditor for rich text
- django-two-factor-auth
- SOPS for secrets
- Docker Compose (dev), Helm/K8s (prod)
- Gunicorn
