# Veris Wireframes

Created: April 26, 2026
Format: Excalidraw (.excalidraw files)

## Files Created

| File | Description |
|------|-------------|
| `01-multi-tenant-hierarchy.excalidraw` | Platform hierarchy: Veris → Consultancy → Client Org → Sites |
| `02-dashboard-layout.excalidraw` | Main dashboard with sidebar nav, KPI cards, quick actions |
| `03-assessment-creation-flow.excalidraw` | 4-step assessment creation wizard |
| `04-questionnaire-evidence.excalidraw` | Questionnaire UI with evidence upload & AI mapping |
| `05-org-settings-users.excalidraw` | Team management, invitations, RBAC matrix |
| `06-framework-import.excalidraw` | **NEW** Admin UI: Upload Excel → Framework + Template |

## How to View

### Option 1: Open Locally (Immediate)
```bash
# macOS
open ~/projects/Veris/wireframes/01-multi-tenant-hierarchy.excalidraw

# Or drag-and-drop any .excalidraw file onto https://excalidraw.com
```

### Option 2: Upload for Shareable Link
```bash
cd ~/projects/Veris
python ~/.hermes/skills/creative/excalidraw/scripts/upload.py wireframes/01-multi-tenant-hierarchy.excalidraw
```

This uploads to excalidraw.com and returns a shareable URL (no account required to view).

### Option 3: Import into Other Tools

| Tool | Import Method |
|------|---------------|
| **Miro** | Screenshot the Excalidraw view, paste into Miro |
| **Figma** | Export SVG from Excalidraw → Import to Figma |
| **Whimsical** | Screenshot or recreate from reference |
| **Lucidchart** | Import SVG or recreate |

## Wireframe Summary

### 1. Multi-Tenant Hierarchy
Shows the 4-level structure:
- **Veris Platform** (Super Admin)
- **Consultancy/TDi** (Platform Admin)
- **Client Organization** (Org Admin) - Bettercoal, E0100, CGWG
- **Sites** (Coordinator/Operator) - Mine, Port/Storage, Transport

Key insight: Platform superusers do NOT have OrganizationMembership - their authority is global.

### 2. Dashboard Layout
Three-column layout inspired by Circle.so:
- **Left sidebar** (220px) - Navigation, org context
- **Top bar** (60px) - Breadcrumbs, org switcher, user menu
- **Main content** - KPI cards, quick actions, activity feed

Role-aware: Settings tab only visible to ORG ADMIN.

### 3. Assessment Creation Flow
4-step wizard:
1. Select Framework (Bettercoal, E0100, CGWG, Custom)
2. Select Template & Version (auto-default)
3. Configure (name, timeline, sites, team)
4. Create & redirect to questionnaire

Backend auto-sets: organization_id, created_by, template_version.

### 4. Questionnaire & Evidence Pipeline
Key features:
- Left sidebar: Question navigation with progress
- Main area: Question, response type, evidence upload
- AI module: Auto-maps evidence to provisions
- Pipeline: Upload → S3 → Extract → Embed → Map → Display

Reusable AI pattern from ApplyFlow (provider-agnostic, structured JSON output).

### 5. Organization Settings & Users
Tabs: General | Team | Invitations | Terminology | Theme | Subscription

Team management:
- Active members table with role editing
- Pending invitations with resend
- 30-day expiry on invitation tokens

RBAC roles: ADMIN, COORDINATOR, CONSULTANT, OPERATOR, ASSESSOR

### 6. Framework Import (NEW)
**3-step flow for admins to import new ESG standards:**

**Step 1: Upload**
- Drag & drop Excel/CSV file (Bettercoal format)
- Auto-validates hierarchy: Principle → Category → Provision
- Downloadable template format available

**Step 2: Preview & Configure**
- Shows detected structure (e.g., "12 Principles, 48 Categories, 144 Provisions")
- Editable metadata: name, version, description
- Checkbox: "Create template from this framework"

**Step 3: Processing**
- Progress bar with step-by-step status
- Async job for large files (avoids timeout)
- Success screen with links to view/edit template

**Technical:**
- Endpoint: `POST /api/frameworks/import/`
- Returns `job_id` for polling (async processing)
- Creates: Framework + AssessmentTemplate + AssessmentQuestions

## Next Wireframes to Create

Priority order for MVP:

- [ ] Assessment findings & report generation
- [ ] Site management CRUD
- [ ] Cross-framework mapping view
- [ ] CIP (Continuous Improvement Plan) tracking
- [ ] Public SAQ form (CGWG no-login flow)
- [ ] Superadmin platform dashboard
- [ ] Terminology customization UI
- [ ] Theme customization (HSL color picker)

## Technical Notes

All wireframes align with existing Veris patterns:
- `veris-multi-tenant-organization-auto-set` - Backend org auto-setting
- `veris-invitation-onboarding-pattern` - Invitation-based onboarding
- `veris-evidence-pipeline-pattern` - Evidence upload & AI mapping
- `veris-durable-rbac-pattern` - Role-based permissions
- `react-router-v7` - Frontend routing patterns

## Design System

Colors used in wireframes (Excalidraw palette):
- 🔵 Primary: `#a5d8ff` (Light Blue) - Platform, inputs
- 🟢 Success: `#b2f2bb` (Light Green) - Completed, positive
- 🟠 Warning: `#ffd8a8` (Light Orange) - Client orgs, external
- 🟦 Data: `#c3fae8` (Light Teal) - Storage, sites
- 🟡 Notes: `#fff3bf` (Light Yellow) - Guidance, info
- 🔴 Critical: `#ffc9c9` (Light Red) - Errors, validation
- 🟣 Special: `#d0bfff` (Light Purple) - AI, processing
