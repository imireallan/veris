# Veris Selected-Org RBAC Code Change Map

Date: 2026-04-17
Status: Exact change map before implementation

## Goal

Translate the selected-org RBAC policy into exact code changes for:
- `frontend/app/types/rbac.ts`
- `frontend/app/routes/organizations.tsx`
- `frontend/app/routes/assessments.tsx`

---

## 1. `frontend/app/types/rbac.ts`

## Current state
Strengths:
- already has `getOrgMembership(user, orgId)`
- already has `getOrgRole(user, orgId)`
- most org-scoped methods already resolve from org role

Problem areas:
- `canCreateOrganization(user)` is global, but the product meaning is not documented in code
- there is no helper that explicitly answers “what is the current selected org role?”
- page code may still ignore these org-scoped checks and render CTAs unconditionally

## Recommended changes

### A. Clarify `canCreateOrganization()` semantics in comments
Current behavior is correct for current policy, but it needs clearer intent.

Recommended update:
- keep it global/platform-scoped
- add comment that it is intentionally NOT selected-org-scoped

Suggested comment:
```ts
/**
 * Platform-level permission.
 * Creating organizations is NOT derived from the selected client org membership.
 * Today this is SUPERADMIN-only / platform-scoped behavior.
 */
```

### B. Add helper for selected-org role resolution (optional but useful)
Suggested helper:
```ts
static getSelectedOrgRole(user: User, selectedOrgId: string | null | undefined): string | null {
  if (!selectedOrgId) return null;
  return RBAC.getOrgRole(user, selectedOrgId);
}
```

### C. Ensure no future org-scoped methods use `user.fallbackRole` directly
Audit target:
- `canManageOrg`
- `canManageTemplates`
- `canCreateAssessments`
- `canAccessAssessments`
- `canEditAssessment`
- all sites/tasks/findings/template delete checks

Current state appears mostly correct.

---

## 2. `frontend/app/routes/organizations.tsx`

## Current state
Good:
- shows all accessible orgs
- shows membership role badge per org card
- global create action is already effectively SUPERADMIN/platform-scoped in action

Problems:
- top-level create button uses `user.fallbackRole === SUPERADMIN || config?.can_create`
- page does not visually indicate selected org
- page does not separate “directory of orgs” from “global create org” semantics clearly
- search param changes wipe all params instead of being merge-safe

## Recommended changes

### A. Keep page as cross-org directory
No change in page purpose.

### B. Add selected-org highlight
Use selected org from outlet/server context and visually mark its card.

Suggested implementation areas:
- import/use selected org from outlet context or derive from `organizationOptions`
- compare `org.id` to selected org id
- add a selected badge or ring style

Suggested UI additions per card:
- selected state border/ring
- small badge: `Current`

### C. Keep create-org button global-only
Recommended behavior:
- show `New Organization` only for platform-level permission
- do NOT derive from per-org selected membership role

Recommended logic:
```ts
const canCreate = user.isSuperuser || user.fallbackRole === UserRole.SUPERADMIN;
```

If `config?.can_create` means something broader, it should be renamed/documented as a platform/tenant-level capability, not org-level capability.

### D. Preserve query params safely
Current code:
```ts
onChange={(v) => setSearchParams(v ? { q: v } : {})}
```
This nukes other params.

Recommended pattern:
```ts
onChange={(v) => {
  const next = new URLSearchParams(searchParams);
  if (v) next.set("q", v);
  else next.delete("q");
  setSearchParams(next);
}}
```

### E. Optional per-card action gating
If this page later gets per-card action menus, use:
- `RBAC.getOrgRole(user, org.id)`
- not selected org role

Why:
- `/organizations` is directory UI
- actions are per target org card

---

## 3. `frontend/app/routes/assessments.tsx`

## Current state
Good:
- already supports org filter and aggregate mode
- already loads accessible organizations

Problems:
- `New Assessment` button is currently unconditional
- page defaults to aggregate mode when no org filter is present
- this weakens selected-org-first product behavior
- create action is ambiguous in aggregate mode

## Recommended changes

### A. Make page selected-org-first
Current loader behavior:
- if no org filter → `/api/assessments/aggregate/`

Recommended behavior:
- if no explicit filter, default to selected org from server helper
- aggregate mode should be explicit, not the silent default

Recommended loader shape:
1. load `selectedOrg` with `getSelectedOrganizationForRequest()`
2. determine mode:
   - explicit `scope=all` or similar → aggregate
   - else selected-org mode
3. fetch:
   - selected org → `/api/assessments?organization=${selectedOrg.id}``
   - aggregate mode → `/api/assessments/aggregate/`

Suggested return fields:
```ts
return {
  assessments,
  frameworks,
  focusAreas,
  organizations,
  orgFilter,
  selectedOrg,
  scope,
  user,
};
```

### B. Gate create CTA by selected-org role
Current code:
```tsx
<Link to="/assessments/new">
  <Button>New Assessment</Button>
</Link>
```

Recommended:
```tsx
const canCreateInSelectedOrg = selectedOrg
  ? RBAC.canCreateAssessments(user, selectedOrg.id)
  : false;
```

Render rules:
- selected-org mode + allowed role → show button
- selected-org mode + disallowed role → hide button
- aggregate mode → either hide button or show a button that switches into selected-org mode first

Best current choice:
- hide in aggregate mode

### C. Make the org selector reflect page mode clearly
Recommended options:
- `Current Organization`
- `All My Organizations`

Current `All Organizations` label is okay, but behavior should be explicit.

Suggested query params:
- `scope=current`
- `scope=all`
- optional `org` still supported for explicit selection

### D. Page copy should reflect selected org context
Examples:
- title in selected-org mode:
  - `Assessments`
  - subtitle: `Viewing assessments for {selectedOrg.name}`
- title in aggregate mode:
  - `Assessments`
  - subtitle: `Viewing assessments across all your organizations`

### E. Assessment creation route should remain selected-org-driven
`assessments.new.tsx` is already close to the right pattern:
- uses `getSelectedOrganizationForRequest()`

What to verify during implementation:
- route loader/action also explicitly deny creation if selected org role is insufficient
- not just rely on hidden button

---

## 4. `frontend/app/routes/dashboard_layout.tsx`

This file was not requested directly, but it matters.

## Current state
- nav links include `Assessments`, `Templates`, `Organizations`
- `Theme` link already respects selected org + org-scoped permission

## Recommended changes

### A. Keep nav mostly visible for readable sections
- `Organizations`: always visible if user has any org access
- `Assessments`: visible if selected org exists and `RBAC.canAccessAssessments(user, selectedOrg.id)`
- `Templates`: visible if selected org exists and template access allowed in selected org

### B. Avoid using selected org to hide cross-org directory pages incorrectly
- `/organizations` should remain visible as directory

---

## 5. Backend implications

Although your question focused on frontend, backend must enforce the same policy.

## Recommended backend rule
For org-scoped mutations:
- use the org id from route/body/selected context
- derive membership for that org
- enforce using membership fallback_role for that org

For platform-scoped actions:
- do not derive from selected client org membership
- use platform-level role / superuser check

### Specific implication
`/api/organizations/` create should remain platform-scoped.
Do not make it succeed merely because selected org membership role is ADMIN.

---

## Summary of exact code changes

### `frontend/app/types/rbac.ts`
- keep org-scoped methods role-by-org
- add comment clarifying `canCreateOrganization()` is platform-scoped
- optional: add `getSelectedOrgRole()` helper

### `frontend/app/routes/organizations.tsx`
- keep page as all-accessible-org directory
- add selected-org highlight
- keep create-org button platform-scoped only
- preserve search params safely
- future per-card actions should use target-org role, not selected-org role

### `frontend/app/routes/assessments.tsx`
- change default mode from aggregate to selected-org-first
- load `selectedOrg` in loader
- gate `New Assessment` by `RBAC.canCreateAssessments(user, selectedOrg.id)`
- make aggregate mode explicit and preferably read-only
- reflect current scope in page copy

---

## Recommended implementation order

1. patch `organizations.tsx` search handling + selected-org highlight
2. patch `assessments.tsx` loader to selected-org-first
3. patch `assessments.tsx` create CTA gating
4. verify `assessments.new.tsx` enforces org-scoped create permission on server path
5. document `canCreateOrganization()` as global/platform-scoped
