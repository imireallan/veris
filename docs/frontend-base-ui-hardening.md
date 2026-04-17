# Frontend Base UI Hardening and Devtools Stabilization

Date: 2026-04-17

## Why this work was done

Superuser sessions were showing freeze-like behavior in the header organization switcher, profile dropdown, and in dev sessions where React Router/TanStack devtools were mounted.

The root issues were not backend org-access problems. They were frontend interaction-pattern problems:

1. broken devtools client injection in local dev
2. Base UI trigger patterns that were still using Radix-style assumptions
3. nested interactive elements inside menu items
4. tooltip wrappers around non-interactive text-only display elements

## Root causes found

### 1. `react-router-devtools` was mounted by default in local dev

Observed in browser console:
- `WebSocket connection to 'ws://localhost:4206/__devtools/ws' failed: ERR_CONNECTION_REFUSED`

Impact:
- injected devtools UI was still rendered in the page
- broken websocket added noise and contributed to overlay/layout interference during debugging

### 2. Header/profile dropdown trigger pattern was fragile

The profile dropdown used a `DropdownMenuTrigger` wrapping a child `div` pretending to be a button.

Impact:
- focus and interaction were less predictable than a direct Base UI trigger
- made dropdown behavior more brittle under heavy superuser/header interaction

### 3. Nested interactive elements inside Base UI menu items

Patterns that existed before cleanup:
- `DropdownMenuItem > Link`
- `DropdownMenuItem > Form > button`
- `DropdownMenuItem > fetcher.Form > button`
- `DropdownMenuTrigger > Button`
- `DropdownMenuTrigger asChild > Button`

Impact:
- menu close/open behavior could become flaky
- focus handling was harder to reason about
- interaction semantics were not aligned with Base UI expectations

### 4. Tooltip triggers around non-interactive text content

Patterns that existed before cleanup:
- `TooltipTrigger asChild` around headings
- `TooltipTrigger asChild` around breadcrumb labels
- `TooltipTrigger asChild` around display badges

Impact:
- unnecessary complexity for simple "show full text on hover" use cases
- created type issues and more fragile trigger semantics than needed

## Files changed

### Devtools stabilization
- `frontend/vite.config.ts`

### Header/profile/menu hardening
- `frontend/app/components/UserDropdown.tsx`
- `frontend/app/components/TemplateCard.tsx`
- `frontend/app/routes/organizations.$orgId.members.tsx`

### Link/button cleanup
- `frontend/app/routes/templates.tsx`

### Tooltip simplification for text-only display
- `frontend/app/components/AssessmentCard.tsx`
- `frontend/app/components/FrameworkMappingBadge.tsx`
- `frontend/app/routes/assessments_detail.tsx`

## Exact fixes applied

### A. Gate `react-router-devtools` behind env flag

File:
- `frontend/vite.config.ts`

Behavior now:
- devtools are OFF by default
- they only load when `ENABLE_ROUTER_DEVTOOLS=true`

Reason:
- local dev should not inject broken websocket-driven tooling into every session by default

### B. Use direct Base UI dropdown triggers

Examples changed:
- profile dropdown trigger in `UserDropdown.tsx`
- template kebab menu trigger in `TemplateCard.tsx`
- member/invitation kebab menu triggers in `organizations.$orgId.members.tsx`

Pattern now preferred:
- direct `DropdownMenuTrigger` with trigger classes on the primitive itself

Avoided pattern:
- `DropdownMenuTrigger` wrapping `Button`
- `DropdownMenuTrigger asChild`

### C. Remove nested interactive children from dropdown items

Examples changed:
- Settings action now uses `navigate(...)`
- Logout action now uses `useSubmit()`
- invitation resend/revoke now use `fetcher.submit(...)`
- member role/remove actions now use direct `onClick`

Pattern now preferred:
- `DropdownMenuItem onClick={...}`

Avoided pattern:
- `DropdownMenuItem > Link`
- `DropdownMenuItem > Form > button`
- `DropdownMenuItem > fetcher.Form > button`
- `DropdownMenuItem > button`

### D. Replace text-only tooltip triggers with native `title`

Examples changed:
- assessment card title
- framework mapping badge hover text
- assessment detail breadcrumb title
- assessment detail heading title

Pattern now preferred for simple full-text hover:
- `title={...}`

Avoided pattern:
- `TooltipTrigger asChild` around non-interactive display text

## Verification performed

### Codebase searches
Verified no remaining matches in `frontend/app` for these risky patterns:
- `asChild`
- `DropdownMenuItem` wrapping `Link|Form|button|fetcher.Form`
- `DropdownMenuTrigger` wrapping `Button`
- `DropdownMenuTrigger` wrapping `button`

### Browser verification
Verified:
- superuser org switcher opens and switches orgs
- profile dropdown opens and settings navigation works
- template card action menu opens correctly
- member actions menu opens correctly
- no console errors during these interactions after devtools gating

### Tests
Verified unit tests still pass:
- `frontend/tests/unit/organization-selection.test.ts`
- `frontend/tests/unit/rbac.test.ts`

## Durable frontend rules from this cleanup

1. Do not use `asChild` with Base UI dropdown/menu/button patterns in this app.
2. Prefer direct `DropdownMenuTrigger` elements, not wrapped buttons.
3. Prefer `DropdownMenuItem onClick={...}` over nesting links, forms, or buttons inside menu items.
4. For simple text hover disclosure, prefer native `title` over tooltip-trigger wrappers.
5. Keep dev-only tooling opt-in when it injects runtime UI into the app shell.

## Suggested follow-up

The next cleanup area after interaction hardening is unrelated but currently blocking a clean frontend typecheck:
- `FrameworkMappingModal.tsx`
- `assessments.$id.questionnaire.tsx`
- `assessments.new.tsx`
- `organizations.new.tsx`
- `templates.$id.tsx`
- some action-data typing in `templates.tsx`
