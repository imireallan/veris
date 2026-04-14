# Organization Switcher Implementation

## Overview
Implemented organization switching for multi-tenant users. Backend P0-3 changes now return `organizations[]` array with per-org `fallback_role`, enabling users to belong to and switch between multiple organizations.

## Files Modified

### New Files
- `app/components/OrganizationSwitcher.tsx` — Main switcher component with localStorage persistence

### Modified Files
- `app/components/AppLayout.tsx` — Added org switcher to header (visible for multi-org users)
- `app/components/UserDropdown.tsx` — Updated to show selected org, simplified org list

## Features

### 1. Organization Switcher (Header)
- **Visible only for multi-org users** (2+ organizations)
- Single-org users see a static badge
- Dropdown shows all organizations with checkmark for selected
- Persists selection in `localStorage` (`veris:selected-organization`)
- Navigates to selected org's dashboard on change

### 2. Smart Org Selection
Priority order:
1. Stored org ID from localStorage
2. First organization (fallback)

### 3. User Dropdown Updates
- Shows **current organization** (from switcher) instead of "primary"
- Displays role badge for current org
- Compact list of all orgs (read-only, no navigation links)
- Cleaner UX — navigation happens via header switcher

## API Integration

### Backend Response Shape
```typescript
GET /api/auth/me/
{
  "id": "...",
  "email": "...",
  "organizations": [
    {
      "id": "uuid",
      "name": "Org Name",
      "slug": "org-slug",
      "role": "Custom Role Name",  // Display
      "fallback_role": "ADMIN"      // Permission
    }
  ]
}
```

### Session Helper
`app/.server/sessions.ts` already maps this correctly:
```typescript
organizations: data.organizations ?? [],
fallbackRole: data.fallback_role ?? undefined,
```

## Usage Patterns

### In Routes
```typescript
import { getSelectedOrganization } from "~/components/OrganizationSwitcher";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const selectedOrg = getSelectedOrganization(user);
  
  if (!selectedOrg) {
    throw redirect("/onboarding");
  }
  
  // Use selectedOrg.id for API calls
  const assessments = await api.get(`/organizations/${selectedOrg.id}/assessments/`);
}
```

### In Components
```typescript
import { getSelectedOrganization } from "~/components/OrganizationSwitcher";

function MyComponent({ user }: { user: User }) {
  const selectedOrg = getSelectedOrganization(user);
  
  return (
    <div>
      <h1>{selectedOrg?.name} Dashboard</h1>
      {/* Use selectedOrg.id for org-scoped operations */}
    </div>
  );
}
```

## Next Steps (Not Implemented)

### 1. Update API Client Helper
Create/update API client to automatically use selected org:

```typescript
// app/.server/lib/api.ts
export async function apiGet(request: Request, path: string) {
  const user = await requireUser(request);
  const selectedOrg = getSelectedOrganization(user);
  
  // Auto-inject org context for org-scoped routes
  const orgScopedPaths = ['/assessments/', '/findings/', '/tasks/'];
  if (orgScopedPaths.some(p => path.startsWith(p))) {
    path = `/organizations/${selectedOrg.id}${path}`;
  }
  
  // ... fetch with token
}
```

### 2. Route Migration
Audit and update routes to use `getSelectedOrganization()`:
- `/organizations/$orgId/*` — Already correct (explicit org in URL)
- `/assessments/*` — Should use selected org
- `/knowledge/*` — Should use selected org
- `/data/*` — Should use selected org

### 3. Breadcrumb Updates
Update breadcrumbs to show current org name from switcher state.

### 4. Settings Page RBAC
Verify `/settings` routes check `fallbackRole` correctly:
- Theme management: ADMIN or SUPERADMIN
- Org settings: ADMIN or SUPERADMIN (backend enforces)

## Testing Checklist

- [ ] User with 1 org sees static badge (no dropdown)
- [ ] User with 2+ orgs sees switcher dropdown
- [ ] Switching orgs navigates to correct org dashboard
- [ ] Selected org persists after page reload
- [ ] User dropdown shows correct current org
- [ ] API calls use selected org context (TODO: implement API client update)

## Design Notes

### Why localStorage?
- Simpler than session cookie for UI state
- Survives tab refresh
- Per-browser (user can have different orgs selected on different devices)

### Why not URL-based?
- Current routes use `/organizations/:orgId/*` pattern
- Switcher provides global context across all routes
- Can combine both approaches in future (URL as source of truth)

### Why remove navigation links from dropdown?
- Reduces confusion — one clear way to switch (header switcher)
- Dropdown is for info, switcher is for action
- Cleaner mental model
