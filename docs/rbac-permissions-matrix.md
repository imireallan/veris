# Veris RBAC Permissions Matrix

## Overview

Veris uses a multi-tenant RBAC (Role-Based Access Control) system where permissions are scoped to organizations. Users can belong to multiple organizations with different roles in each.

## User Roles

| Role | Priority | Description |
|------|----------|-------------|
| SUPERADMIN | 100 | Platform-level administrator |
| ADMIN | 80 | Organization administrator |
| COORDINATOR | 60 | Manages assessments and templates |
| CONSULTANT | 50 | External consultant with view access |
| EXECUTIVE | 40 | Executive view-only access |
| ASSESSOR | 30 | Assessor with limited view access |
| OPERATOR | 20 | Basic operational access |

## Permission Matrix by Resource

### Organizations

| Action | SUPERADMIN | ADMIN | COORDINATOR | OPERATOR | ASSESSOR | CONSULTANT | EXECUTIVE |
|--------|------------|-------|-------------|----------|----------|------------|-----------|
| View own org | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all orgs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create org | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit org settings | ✅* | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Send invitations | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

*Org settings (name, slug, status, subscription) require SUPERADMIN only

### Assessments

| Action | SUPERADMIN | ADMIN | COORDINATOR | OPERATOR | ASSESSOR | CONSULTANT | EXECUTIVE |
|--------|------------|-------|-------------|----------|----------|------------|-----------|
| View assessments | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create assessment | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit assessment | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete assessment | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View questionnaire | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit responses | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

### Templates

| Action | SUPERADMIN | ADMIN | COORDINATOR | OPERATOR | ASSESSOR | CONSULTANT | EXECUTIVE |
|--------|------------|-------|-------------|----------|----------|------------|-----------|
| View templates | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create template | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit template | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete template | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Add questions | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Sites

| Action | SUPERADMIN | ADMIN | COORDINATOR | OPERATOR | ASSESSOR | CONSULTANT | EXECUTIVE |
|--------|------------|-------|-------------|----------|----------|------------|-----------|
| View sites | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create site | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit site | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete site | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Findings

| Action | SUPERADMIN | ADMIN | COORDINATOR | OPERATOR | ASSESSOR | CONSULTANT | EXECUTIVE |
|--------|------------|-------|-------------|----------|----------|------------|-----------|
| View findings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create finding | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit finding | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete finding | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Tasks

| Action | SUPERADMIN | ADMIN | COORDINATOR | OPERATOR | ASSESSOR | CONSULTANT | EXECUTIVE |
|--------|------------|-------|-------------|----------|----------|------------|-----------|
| View tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create task | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update task status | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete task | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Members & Invitations

| Action | SUPERADMIN | ADMIN | COORDINATOR | OPERATOR | ASSESSOR | CONSULTANT | EXECUTIVE |
|--------|------------|-------|-------------|----------|----------|------------|-----------|
| View members | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Invite members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Update roles | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Resend invitation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Theme & Branding

| Action | SUPERADMIN | ADMIN | COORDINATOR | OPERATOR | ASSESSOR | CONSULTANT | EXECUTIVE |
|--------|------------|-------|-------------|----------|----------|------------|-----------|
| View theme | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit theme | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Backend Implementation

### Permission Classes

Located in `backend/users/permissions.py`:

- `IsOrganizationMember` - User belongs to the organization
- `IsOrganizationOwnerOrAdmin` - User has admin-level permissions
- `IsAssessmentOwner` - User has access to the assessment (via org membership)
- `HasPermission('permission_key')` - Generic permission checker

### QuerySet Filtering

All organization-scoped resources filter by user's memberships:

```python
# Example from AssessmentViewSet
def get_queryset(self):
    user = self.request.user
    
    if user.is_superuser:
        return Assessment.objects.all()
    
    memberships = OrganizationMembership.objects.filter(
        user=user
    ).values_list("organization_id", flat=True)
    
    if not memberships:
        return Assessment.objects.none()
    
    return Assessment.objects.filter(
        organization_id__in=memberships
    )
```

## Frontend Implementation

### RBAC Helper Class

Located in `frontend/app/types/rbac.ts`:

```typescript
class RBAC {
  static isOrgMember(user: User, orgId: string): boolean
  static canManageOrg(user: User, orgId: string): boolean
  static canCreateAssessments(user: User, orgId: string): boolean
  static canAccessAssessments(user: User, orgId: string): boolean
  static canManageTemplates(user: User, orgId: string): boolean
  // ... etc
}
```

### Graceful Error Handling

All routes handle 403 errors gracefully:

1. **Backend** - Returns empty arrays instead of 403 for list endpoints
2. **Frontend Loader** - Catches errors and returns empty data with `accessDenied` flag
3. **UI** - Shows appropriate empty states instead of crashing

Example pattern:

```typescript
export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const { orgId } = params;

  // Check RBAC - return empty state instead of throwing
  if (!RBAC.isOrgMember(user, orgId!)) {
    return { 
      items: [], 
      accessDenied: true,
    };
  }

  // Fetch with error handling
  const response = await api.get(`/api/org/${orgId}/items/`, token, request)
    .catch((err: any) => {
      if (err.status === 403) {
        return { results: [] };
      }
      return { results: [] };
    });

  return { items: response.results || [] };
}
```

## Security Principles

1. **Never trust the client** - All permission checks happen on backend
2. **Fail closed** - Default to denying access when in doubt
3. **Least privilege** - Users only see what they need
4. **Defense in depth** - Multiple layers of permission checks
5. **Graceful degradation** - Show empty states, never crash

## Testing

Run the multi-tenant isolation tests:

```bash
cd backend
pytest tests/users/test_multi_tenant_isolation.py -v
```

Key test scenarios:
- User cannot access another org's data
- SUPERADMIN can access all orgs
- Operators can view but not create assessments
- Admins can manage members but not org settings

## Common Pitfalls

1. **Forgetting to filter querysets** - Always filter by org membership
2. **Exposing 403 to frontend** - Return empty arrays instead
3. **Hardcoding role checks** - Use permission classes
4. **Missing RBAC checks in frontend** - Add both backend AND frontend checks
5. **Not handling multi-org users** - Check all memberships, not just primary org
