# Veris Selected-Org RBAC Implementation Plan

> For Hermes: Use this plan before changing selected-org RBAC behavior in code.

Goal: Make selected org context control all org-scoped resource permissions while keeping organization creation as a global/platform-scoped permission.

Architecture: Separate Veris permission semantics into two layers: org-scoped permissions driven by selected org membership, and platform-scoped permissions driven by superadmin/global authority. Keep `/organizations` as a cross-org directory and make `/assessments` selected-org-first.

Tech Stack: React Router v7, TypeScript, existing `RBAC` helper, `getSelectedOrganizationForRequest`, current Django org/membership backend.

---

## Policy summary

1. Selected org controls org-scoped permissions.
2. `/organizations` remains a cross-org directory.
3. `/assessments` becomes selected-org-first.
4. Create organization remains platform-scoped.
5. SUPERADMIN remains platform-level, not membership-dependent.

Reference docs:
- `docs/selected-org-rbac-policy-matrix.md`
- `docs/selected-org-rbac-code-change-map.md`

---

## Task 1: Clarify RBAC semantics in code comments

Objective: Prevent future confusion between org-scoped and platform-scoped actions.

Files:
- Modify: `frontend/app/types/rbac.ts`

Steps:
1. Add a comment above `canCreateOrganization()` explicitly stating it is platform-scoped.
2. Optionally add a helper `getSelectedOrgRole(user, selectedOrgId)` delegating to `getOrgRole()`.
3. Verify no org-scoped methods rely on `user.fallbackRole` directly when `orgId` is available.

Verification:
- Read `rbac.ts` and confirm comments/helpers reflect the intended policy.

---

## Task 2: Make `/organizations` a better cross-org directory

Objective: Keep all accessible orgs visible, but make selected org context obvious.

Files:
- Modify: `frontend/app/routes/organizations.tsx`

Steps:
1. Preserve search params safely using `URLSearchParams` instead of resetting everything.
2. Determine the selected org id from outlet context / accessible orgs.
3. Add selected-org visual treatment to the matching org card.
4. Keep `New Organization` button gated by platform/superadmin logic only.
5. Do not hide other orgs when selected org changes.

Verification:
- Search works without dropping other params.
- Selected org card is visibly highlighted.
- Non-superadmin users do not see global org creation.

---

## Task 3: Make `/assessments` selected-org-first

Objective: Align list behavior with org-switcher context and role-in-org permissions.

Files:
- Modify: `frontend/app/routes/assessments.tsx`

Steps:
1. Update the loader to fetch `selectedOrg` with `getSelectedOrganizationForRequest()`.
2. If no explicit aggregate mode is requested, fetch assessments for selected org.
3. Introduce explicit scope handling:
   - current org
   - all my orgs
4. Return `selectedOrg` and `scope` from the loader.
5. Update subtitle/copy to reflect selected org vs aggregate mode.

Verification:
- Visiting `/assessments` with a selected org shows that org’s assessments by default.
- Aggregate mode only happens explicitly.

---

## Task 4: Gate assessment creation by selected-org role

Objective: Ensure create permissions match the selected org membership role.

Files:
- Modify: `frontend/app/routes/assessments.tsx`
- Review: `frontend/app/routes/assessments.new.tsx`

Steps:
1. In `assessments.tsx`, compute:
   - `canCreateInSelectedOrg = selectedOrg ? RBAC.canCreateAssessments(user, selectedOrg.id) : false`
2. Show `New Assessment` button only when:
   - selected org exists
   - current scope is selected-org mode
   - selected org role allows creation
3. In aggregate mode, hide create CTA or force switch back to selected org.
4. In `assessments.new.tsx`, verify loader/action also deny create if selected org role is insufficient.
5. If needed, add a server-side RBAC guard in loader/action for create route.

Verification:
- ASSESSOR in selected org cannot see/use create assessment.
- ADMIN in selected org can see/use create assessment.
- Aggregate mode does not offer ambiguous create behavior.

---

## Task 5: Validate nav behavior in dashboard layout

Objective: Make sure navigation reflects selected-org access semantics without hiding cross-org directory pages.

Files:
- Modify if needed: `frontend/app/routes/dashboard_layout.tsx`

Steps:
1. Keep `Organizations` visible as cross-org directory.
2. Gate `Templates` and other org-sensitive links using selected org role.
3. Keep `Assessments` visible for any selected org role that can at least view assessments.

Verification:
- Changing selected org changes what org-scoped links/actions are available.
- `Organizations` remains available as a directory page.

---

## Task 6: Add regression coverage

Objective: Lock in the new semantics.

Files:
- Create or modify targeted unit tests around RBAC and selected-org behavior
- Potential areas:
  - `frontend/tests/unit/rbac.test.ts`
  - new route-level tests if present in project conventions

Tests to add:
1. user ADMIN in orgA / ASSESSOR in orgB:
   - `canCreateAssessments(user, orgA)` → true
   - `canCreateAssessments(user, orgB)` → false
2. `canCreateOrganization(user)` remains independent of selected org role
3. selected-org-first assessments CTA logic

Verification:
- tests pass locally

---

## Task 7: Refresh docs after implementation

Objective: Keep policy and code aligned.

Files:
- Modify: `docs/selected-org-rbac-policy-matrix.md`
- Modify: `docs/selected-org-rbac-code-change-map.md`
- Optionally update: `docs/current-product-goal-alignment-review.md` if this meaningfully improves alignment

Verification:
- docs reflect implemented behavior, not just proposal

---

## Success criteria

This work is complete when:
- switching org changes effective org-scoped permissions
- `/assessments` defaults to selected org context
- assessment creation is allowed/hidden based on selected org role
- `/organizations` still shows all accessible orgs
- organization creation remains platform-scoped
- superadmin does not require org membership to function
