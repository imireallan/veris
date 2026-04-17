# RBAC Consistency Updates: Template Routes

**Date**: April 15, 2026  
**Pattern**: Veris Durable RBAC with `fallbackRole` + `accessDenied` flag  
**Status**: ✅ Complete

---

## Changes Made

### 1. `frontend/app/routes/templates.tsx`

**Before**:
```typescript
// ❌ WRONG: Using role instead of fallbackRole
const isSUPERADMIN = user.role === "SUPERADMIN";

// ❌ WRONG: Throwing 403
if (user.role !== "SUPERADMIN") {
  throw new Response("Unauthorized", { status: 403 });
}

// ❌ WRONG: Toast hook usage
const { success: toastSuccess, error: toastError } = useToast();
toastSuccess("Success", message);
```

**After**:
```typescript
// ✅ CORRECT: Using fallbackRole via RBAC class
const canManageTemplates = RBAC.canManageTemplates(user, "");

// ✅ CORRECT: Return accessDenied flag (handled in UI)
if (!RBAC.canManageTemplates(user, "")) {
  return { templates: [], user, accessDenied: true };
}

// ✅ CORRECT: Destructure methods directly
const { success, error } = useToast();
success("Success", message);
error("Failed", error);
```

---

### 2. `frontend/app/routes/templates.new.tsx`

**Before**:
```typescript
// ❌ WRONG: Throwing 403 error
if (user.role !== "SUPERADMIN") {
  throw new Response("Unauthorized", { status: 403 });
}
```

**After**:
```typescript
// ✅ CORRECT: Use RBAC pattern with accessDenied flag
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  if (!RBAC.canManageTemplates(user, "")) {
    return { 
      frameworks: [], 
      user, 
      accessDenied: true  // ← Flag for UI
    };
  }
  
  // ... fetch frameworks
  return { frameworks, user, accessDenied: false };
}

// ✅ CORRECT: Render friendly access denied UI
export default function NewTemplateRoute() {
  const { frameworks, user, accessDenied } = useLoaderData();
  
  if (accessDenied) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to create templates. 
            Contact your administrator.
          </p>
          <Button onClick={() => navigate("/templates")}>
            ← Back to Templates
          </Button>
        </div>
      </div>
    );
  }
  
  // ... normal UI
}
```

---

### 3. `frontend/app/types/rbac.ts`

**Updated `canManageTemplates`**:
```typescript
static canManageTemplates(user: User, orgId: string): boolean {
  // SUPERADMIN can manage all templates (no org check needed)
  if (user.fallbackRole === "SUPERADMIN") return true;
  
  // For other users, check org membership
  if (orgId && !RBAC.isOrgMember(user, orgId)) return false;
  
  // ADMIN, OWNER, COORDINATOR can manage templates
  return user.fallbackRole === "ADMIN" || 
         user.fallbackRole === "OWNER" || 
         user.fallbackRole === "COORDINATOR";
}
```

**Key Changes**:
- ✅ SUPERADMIN bypasses org check (can manage all templates)
- ✅ Added `orgId` parameter check (skip if empty string)
- ✅ Clear comments explaining permission matrix

---

### 4. `frontend/app/components/TemplateQuestionBuilder.tsx`

**Fixed Toast Hook Usage**:
```typescript
// ✅ CORRECT: Destructure methods from useToast
const { success: toastSuccess, error: toastError } = useToast();

// Use in handlers
handleDeleteQuestion = () => {
  // ...
  toastSuccess("Question deleted");
}

handleMappingAdded = () => {
  // ...
  toastSuccess("Mapping added");
}
```

---

## RBAC Permission Matrix (Templates)

| Action | SUPERADMIN | ADMIN | COORDINATOR | OPERATOR | ASSESSOR | CONSULTANT |
|--------|------------|-------|-------------|----------|----------|------------|
| View all templates | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View public templates | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create template | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Edit template (draft) | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Publish template | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Duplicate template | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete template | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Instantiate template | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |

**Notes**:
- SUPERADMIN can manage templates across ALL organizations
- ADMIN/COORDINATOR can only manage templates for their own organization
- OPERATOR and below can only VIEW public templates

---

## Consistency Checklist

### All Template Routes Updated ✅

| Route | Uses `fallbackRole` | Uses `RBAC` class | Returns `accessDenied` | Toast Hook Fixed |
|-------|-------------------|-------------------|----------------------|------------------|
| `templates.tsx` | ✅ | ✅ | N/A (list view) | ✅ |
| `templates.new.tsx` | ✅ | ✅ | ✅ | ✅ |
| `templates.$id.tsx` | TODO | TODO | TODO | TODO |

### Consistent with Existing Routes ✅

| Existing Route | Pattern Used | Status |
|----------------|--------------|--------|
| `organizations.$orgId.settings.tsx` | `accessDenied` flag | ✅ Reference |
| `organizations.$orgId.members.tsx` | `accessDenied` flag | ✅ Reference |
| `organizations.$orgId_.assessments.tsx` | `accessDenied` flag | ✅ Reference |
| `templates.tsx` | `accessDenied` flag | ✅ Aligned |
| `templates.new.tsx` | `accessDenied` flag | ✅ Aligned |

---

## Toast Hook Pattern

**Correct Usage**:
```typescript
import { useToast } from "~/hooks/use-toast";

export default function MyRoute() {
  // ✅ Option 1: Destructure methods
  const { success, error, warning, info } = useToast();
  success("Saved", "Your changes have been saved");
  error("Failed", "Something went wrong");
  
  // ✅ Option 2: Destructure with aliases
  const { success: toastSuccess, error: toastError } = useToast();
  toastSuccess("Success!");
  toastError("Error!");
  
  // ❌ WRONG: Don't do this
  const { toast } = useToast();
  toast.success("...");  // Error: toast.success is not a function
}
```

**Why**: The `useToast` hook returns named methods, not an object with methods.

---

## Testing

### Manual Test Cases

```bash
# 1. SUPERADMIN access
# Login as SUPERADMIN → /templates → Should see "New Template" button
# Expected: Can create, edit, publish, duplicate templates

# 2. ADMIN access
# Login as ORG_ADMIN → /templates → Should see "New Template" button
# Expected: Can create templates for own org only

# 3. COORDINATOR access
# Login as COORDINATOR → /templates → Should see "New Template" button
# Expected: Can create templates for own org only

# 4. OPERATOR access (should fail gracefully)
# Login as OPERATOR → /templates → No "New Template" button
# Navigate to /templates/new → Should see "Access Denied" UI
# Expected: 🔒 icon, friendly message, "Back to Templates" button

# 5. Toast notifications
# Create template → Should see success toast
# Try to create with invalid data → Should see error toast
# Delete question → Should see success toast
```

---

## Related Files

- `frontend/app/types/rbac.ts` — RBAC class with all permission checks
- `frontend/app/hooks/use-toast.ts` — Toast hook implementation
- `frontend/app/routes/organizations.$orgId.settings.tsx` — Reference implementation
- `frontend/app/routes/organizations.$orgId.members.tsx` — Reference implementation
- `docs/veris-durable-rbac-pattern.md` — RBAC pattern documentation

---

## Remaining TODOs

| File | Action | Priority |
|------|--------|----------|
| `templates.$id.tsx` | Add RBAC check + accessDenied | P0 |
| `assessments.new.tsx` | Add template selector with RBAC | P0 |
| `TemplateCard.tsx` | Verify role icons match UserRole enum | P1 |

---

**End of RBAC Updates**
