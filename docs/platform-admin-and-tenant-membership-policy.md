# Platform Admin and Tenant Membership Policy

## Decision

Platform admins do not need organization membership to operate inside client tenant organizations.

A platform admin's authority comes from platform-level identity, currently `User.is_superuser`. Tenant membership authority comes from `OrganizationMembership` and applies only when a user is participating in a specific client's workflow.

Do not create `OrganizationMembership` records for platform admins just to make organization pages, organization-scoped APIs, invitations, settings, themes, or terminology work.

## Veris operating model

For the TDi deployment of Veris:

```text
Veris Platform
└── Operator / Consultancy: TDi
    ├── Platform admins and support users
    ├── Delivery consultants and assessors
    └── Client tenant organizations
        ├── EO100
        ├── Bettercoal
        └── CGWG
```

TDi has two different identities in the product:

1. TDi as platform/operator
   - Runs Veris globally.
   - Creates and configures client tenants.
   - Provides support/debug/admin operations.
   - Does not require tenant membership.

2. TDi as service provider/consultancy
   - Works inside a client's assessment workflow.
   - Reviews evidence, supports assessments, coordinates delivery.
   - Requires tenant membership because the user is participating in that client's business process.

These must not be conflated.

## User classes

### 1. Platform users

Examples:
- TDi Veris platform admin
- TDi support/operator user
- Internal Veris admin account

Authority source:

```text
User.is_superuser = true
```

Future extension:

```text
User.platform_role = PLATFORM_ADMIN | PLATFORM_SUPPORT | PLATFORM_VIEWER
```

Rules:
- Can access any organization without `OrganizationMembership`.
- Can pass a valid organization context, e.g. `X-Organization-Id`, to operate on an org-scoped endpoint.
- `request.membership` may be `None` and that is valid.
- Must not be invited to organizations through the tenant invitation flow.
- Should not appear as a normal client org member unless they also have a deliberate delivery role.

### 2. Consultancy delivery users

Examples:
- TDi consultant assigned to Bettercoal
- TDi assessor assigned to EO100
- TDi coordinator managing CGWG delivery

Authority source:

```text
OrganizationMembership(user, organization, fallback_role)
```

Rules:
- Must be linked to each client org they actively work in.
- Permissions are organization-scoped.
- Same user can have different roles in different client orgs.

Examples:

```text
allan@tdi.com @ Bettercoal = CONSULTANT
allan@tdi.com @ EO100 = ASSESSOR
allan@tdi.com @ CGWG = COORDINATOR
```

### 3. Client tenant users

Examples:
- Bettercoal admin
- EO100 site operator
- CGWG member user
- Client executive

Authority source:

```text
OrganizationMembership(user, organization, fallback_role)
```

Rules:
- Must have tenant membership.
- Can only access organizations they belong to.
- Never receives platform-wide authority through tenant roles.

## Product rule

```text
Platform authority answers: "Can this user operate Veris globally?"
Tenant membership answers: "What role does this user play inside this client org?"
```

Therefore:

```text
Superuser accessing /organizations/bettercoal/settings
→ allowed without Bettercoal membership

TDi consultant accessing /organizations/bettercoal/assessments
→ requires Bettercoal OrganizationMembership

Bettercoal admin inviting a user to Bettercoal
→ creates an invitation for a tenant user, not for a platform admin
```

## Invitation policy

Tenant invitations are for tenant participation only.

Do not allow invitations to create or attach platform admins.

Backend enforcement should block invitation creation if the invited email already belongs to a platform admin account:

```text
POST /api/organizations/:org_pk/invitations/
email = existing superuser email
→ 400 Bad Request
→ "Platform admins cannot be invited to client organizations. Assign delivery users through an explicit membership/admin process instead."
```

Invitation acceptance should also guard against superusers accepting old or manually-created pending invitations:

```text
POST /api/invitations/:token/accept/
authenticated user is_superuser = true
→ 403 Forbidden
→ no OrganizationMembership created
```

The existing rule remains:

```text
fallback_role = SUPERADMIN
→ invalid tenant invitation role
```

## API and backend rules

1. Superusers bypass membership checks.

```python
if request.user.is_superuser:
    return True
```

2. Superusers can resolve requested organization context without membership.

```python
if user.is_superuser and org_id:
    request.organization = Organization.objects.get(id=org_id)
    request.membership = None
```

3. Non-superusers require active membership.

```python
OrganizationMembership.objects.filter(
    user=user,
    organization_id=org_id,
    status=OrganizationMembership.Status.ACTIVE,
).exists()
```

4. Do not call `get_request_membership()` in code paths where a superuser should be allowed, unless the code handles `None` correctly.

5. Frontend route guards must check platform authority before tenant role.

```typescript
if (user.isSuperuser) return true;
return user.activePermissions?.includes(permission) ?? false;
```

## Data hygiene

Existing superuser memberships are not automatically corrupt data, but they should be treated as exceptional.

Acceptable cases:
- A superuser also has a deliberate delivery/testing role in a tenant.
- Historical seed/test data.

Not acceptable:
- Membership exists only because platform admin API routes break without it.
- Superusers are shown as normal client members by default.
- Tenant invitations are used to grant platform admins tenant access.

Recommended cleanup command after enforcement is in place:

```bash
python manage.py shell -c "
from organizations.models import OrganizationMembership
qs = OrganizationMembership.objects.filter(user__is_superuser=True)
for m in qs.select_related('user', 'organization'):
    print(m.user.email, m.organization.name, m.fallback_role, m.status)
"
```

Review each row manually before deleting because some may be deliberate delivery/test memberships.

## Permission matrix

| User type | Requires OrganizationMembership? | Can access all orgs? | Can be invited to tenant? |
|---|---:|---:|---:|
| Platform superuser/admin | No | Yes | No |
| Platform support user | No, if modeled as platform role | Limited by platform role | No |
| TDi consultant/assessor | Yes, per client | No | Yes |
| Client org admin | Yes | No | Yes |
| Client operator/assessor/executive | Yes | No | Yes |

## Durable implementation invariant

```text
Never depend on tenant membership for platform-admin authority.
Never use tenant invitations to manage platform admins.
```
