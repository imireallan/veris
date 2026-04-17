# Veris Selected-Org RBAC Policy Matrix

Date: 2026-04-17
Status: Proposed policy before implementation

## Core principle

The selected organization from the org switcher must control all org-scoped permissions and resource visibility.

A user may hold different roles in different organizations.

Example:
- Org 1: ASSESSOR
- Org 2: ADMIN

Therefore:
- when selected org = Org 1, the effective role is ASSESSOR
- when selected org = Org 2, the effective role is ADMIN

Permissions for org-scoped pages/actions must always be resolved from:
- `RBAC.getOrgRole(user, selectedOrg.id)`

Never from:
- `user.fallbackRole`
- `user.orgId`
- first membership / primary membership

---

## Critical distinction

There are two permission classes in Veris.

### A. Org-scoped permissions
These depend on the selected org membership.

Examples:
- create assessment
- edit assessment
- manage tasks/findings
- manage members/invitations
- manage templates
- access org-specific settings pages
- create/edit sites inside an org

### B. Platform / consultancy-scoped permissions
These do NOT depend on the selected client org membership.

Examples:
- create organization
- view all organizations as superadmin
- future billing / subscription operations
- future consultancy-wide configuration

This means:
- being ADMIN in a selected client org should not automatically imply global ability to create new organizations
- creating a new organization is not a client-org-scoped permission

---

## Policy decisions

### Decision 1: Selected org drives org-scoped access
Approved policy:
- selected org determines effective org role
- all org-scoped resource checks must use selected org role

### Decision 2: `/organizations` is a cross-org directory, not a selected-org-only page
Approved policy:
- `/organizations` shows all accessible organizations
- each org card shows the membership role for that org
- selected org should be highlighted in the directory
- actions shown on each org card can be gated by that org-specific role

### Decision 3: `/assessments` is selected-org-first
Approved policy:
- default list scope should be the selected org
- optional aggregate mode (“All my orgs”) is acceptable for read-only browsing/filtering
- all create/edit/delete actions must be evaluated against the selected org role

### Decision 4: Organization creation is not selected-org-scoped
Approved policy:
- creating organizations should remain a platform-level or future consultancy-level permission
- it should not be granted because a user is ADMIN in the currently selected client org

### Decision 5: Superadmin is platform-level
Approved policy:
- superuser / SUPERADMIN should not need org membership to function
- superadmin may switch org context for previewing and operating within org-scoped UI
- selected org gives superadmin context, not authority source

---

## Recommended behavior by page

## `/organizations`

Purpose:
- directory of all organizations the user can access

Should show:
- all accessible organizations
- selected org visual highlight
- per-org membership badge
- per-org actions based on membership in that org

Should not do:
- treat selected org as the only visible org
- derive “New Organization” from selected org membership role

Top-level create button:
- SUPERADMIN only today
- future: consultancy-admin if/when a true consultancy-level tenant model exists

## `/assessments`

Purpose:
- selected-org operational workspace for assessments

Default behavior:
- show assessments for selected org
- heading/breadcrumb should reflect selected org context
- `New Assessment` button should only render if selected org role allows it

Optional behavior:
- allow a read-only “All my orgs” mode for search/filtering
- if in “All my orgs” mode, mutations still require selected org context

Recommended create behavior:
- if selected org role does not allow creation, hide or disable create CTA
- if aggregate mode is active, either:
  - switch back to selected org before create
  - or require explicit org selection in create flow

---

## Effective role matrix

| Selected Org Role | View org details | View assessments | Create assessment | Edit assessment | Manage members/invites | Manage templates | Manage org settings |
|-------------------|------------------|------------------|------------------|-----------------|------------------------|------------------|---------------------|
| SUPERADMIN | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| ADMIN | Yes | Yes | Yes | Yes | Yes | Yes | No (org settings remain SUPERADMIN-only in current Veris convention) |
| COORDINATOR | Yes | Yes | Yes | Yes | No | Yes | No |
| OPERATOR | Yes | Yes | Yes (current RBAC) | No | No | No | No |
| ASSESSOR | Yes | Yes | No | No | No | No | No |
| CONSULTANT | Yes | Yes | No | No | No | No | No |
| EXECUTIVE | Yes | Yes | No | No | No | No | No |

Note:
- This table reflects the current RBAC structure in `frontend/app/types/rbac.ts`
- If the business wants OPERATOR to lose create-assessment ability, change that separately as a product decision

---

## Organizations page action matrix

| Context | Allowed today | Recommended UI treatment |
|---------|---------------|--------------------------|
| SUPERADMIN on `/organizations` | view all orgs, create org | show global “New Organization” button |
| Regular user on `/organizations` | view accessible orgs | no global create-org button |
| ADMIN on an org card | org-scoped management actions for that org | show org-specific actions on that card/detail page |
| ASSESSOR on an org card | view-only | no manage/create actions for that org |

---

## Assessments page action matrix

| Context | List scope | Create CTA | Mutation rules |
|---------|------------|------------|----------------|
| SUPERADMIN + selected org | selected org by default; may aggregate | show | allowed |
| ADMIN in selected org | selected org | show | allowed for selected org |
| COORDINATOR in selected org | selected org | show | allowed for selected org |
| OPERATOR in selected org | selected org | show under current RBAC | allowed only if backend keeps OPERATOR create permission |
| ASSESSOR in selected org | selected org | hide | read-only |
| CONSULTANT/EXECUTIVE in selected org | selected org | hide | read-only |
| Any user in aggregate mode | all accessible orgs | hide or force explicit target-org resolution | no ambiguous cross-org mutation |

---

## Superadmin policy

### Recommended answer
Should the superuser still be attached to an organization as an admin?

Answer:
- not as a requirement
- optional as a convenience only

Recommended model:
- SUPERADMIN is platform-level
- org membership is optional context, not the source of superadmin authority

Why:
- keeps platform admin distinct from client-org admin
- avoids leaking client-org semantics into platform operations
- makes org switching a context switch, not an authority switch, for superadmin

---

## Backend/Frontend rule summary

1. Selected org controls org-scoped permissions.
2. `/organizations` is cross-org directory UI.
3. `/assessments` is selected-org-first workspace UI.
4. Create organization remains global/platform-scoped.
5. SUPERADMIN remains platform-level.

---

## Immediate implementation consequences

1. `RBAC.canCreateOrganization(user)` should stay global, not selected-org-based.
2. `Assessments` page should gate the create button using selected org role.
3. `Assessments` loader/UI should default to selected org rather than aggregate-only behavior.
4. `Organizations` page should keep showing all accessible orgs, but visually indicate selected org and respect per-org role badges/actions.
5. Any org-scoped route should use `getSelectedOrganizationForRequest()` or explicit org route params plus org-specific RBAC checks.
