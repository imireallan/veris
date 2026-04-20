# Active Organization Context Fix - Implementation Summary

## Problem
Organization switching was not working because the `OrganizationContextMiddleware` ran before DRF's JWT authentication populated `request.user`. This meant:
- Middleware saw `AnonymousUser` instead of authenticated user
- `request.organization` and `request.membership` were never set
- `/api/auth/me/` returned stale org data

## Solution
Created custom JWT authentication class that resolves org context AFTER token validation.

## Files Changed

### 1. `backend/users/authentication.py` (NEW)
Custom `JWTOrganizationAuthentication` class that:
- Extends `rest_framework_simplejwt.authentication.JWTAuthentication`
- Calls `super().authenticate()` to validate JWT and get user
- Reads `X-Organization-Id` header from request
- Queries `OrganizationMembership` for user + org
- Attaches `request.organization` and `request.membership`
- Returns `(user, validated_token)` for DRF to assign `request.user`

### 2. `backend/config/settings/base.py`
Changed REST Framework authentication class:
```python
# Before:
"rest_framework_simplejwt.authentication.JWTAuthentication",

# After:
"users.authentication.JWTOrganizationAuthentication",
```

### 3. `backend/organizations/middleware.py`
Updated `OrganizationContextMiddleware` to:
- Check if `request.organization` is already set (by JWT auth)
- Skip processing if already set (avoids duplication)
- Only handle session-based auth fallback

### 4. `backend/tests/users/test_jwt_auth.py` (NEW)
5 tests covering:
- JWT auth + org context resolution
- Invalid org ID rejection (403)
- Superuser access to any org
- Missing org header handling
- Multiple org membership + header selection

## Request Flow (JWT Auth)

```
1. Frontend: User clicks org switcher
   ↓
2. Frontend: POST /resources/organizations/select
   - Sets cookie: selectedOrganizationId
   ↓
3. Frontend: Reloads page
   ↓
4. Loader: requireUser() calls /api/auth/me/
   - Header: Authorization: Bearer <JWT>
   - Header: X-Organization-Id: <org_uuid>
   ↓
5. Backend: JWTOrganizationAuthentication.authenticate()
   - Validates JWT token → gets user
   - Reads X-Organization-Id header
   - Queries OrganizationMembership
   - Sets request.organization, request.membership
   - Returns (user, token)
   ↓
6. DRF: Assigns request.user = user
   ↓
7. Middleware: OrganizationContextMiddleware.process_request()
   - Sees request.organization already set
   - Skips (no duplication)
   ↓
8. View: /api/auth/me/ executes
   - request.user, request.organization, request.membership all available
   - Returns correct active_organization in response
   ↓
9. Frontend: UI updates with new org context
```

## Testing

### Unit Tests
```bash
cd backend
uv run pytest tests/users/test_jwt_auth.py -v
# 5 passed
```

### Full Backend Suite
```bash
uv run pytest tests/ -v
# 90 passed
```

### Manual Testing (Next Steps)
1. Start backend + frontend
2. Login with multi-org user
3. Click org switcher
4. Select different org
5. Verify UI updates with new org name
6. Verify API calls use correct org context

## Why This Works

**Key insight:** DRF authentication happens in `APIView.initial()` which runs BEFORE the view executes but AFTER middleware. By subclassing JWT auth and resolving org context there, we ensure:

1. `request.user` is authenticated (JWT validated)
2. `request.organization` is resolved (from header)
3. `request.membership` is available (with role info)
4. All before the view logic runs

**Middleware compatibility:** The middleware now acts as a fallback for session-based auth while skipping JWT requests (which already have org context set).

## Trade-offs

**Pros:**
- No dependency changes (stayed with SimpleJWT)
- Minimal code (~80 lines new, ~10 lines modified)
- All existing tests pass
- Clear separation of concerns
- Works for both JWT and session auth

**Cons:**
- Org context resolution logic exists in two places (auth class + middleware)
- Middleware check adds slight overhead (hasattr check)
- Both must stay in sync if logic changes

**Alternative considered:**
- Switching JWT packages → No advantage, same extension needed
- Moving all org logic to middleware → Would require reordering middleware + custom DRF auth anyway
- Using signals → More complex, harder to debug

## Next Steps

1. ✅ Backend implementation complete
2. ✅ Unit tests passing
3. ⏳ Manual end-to-end testing
4. ⏳ Frontend toast notification (blocked on successful switch)
5. ⏳ Regression testing with existing flows
