# UC-001: Create Client Organization - Implementation Guide

## Overview
This guide implements **UC-001: Create Client Organization** from `docs/complete-use-cases.md` with:
- Prerequisite validation
- Admin-configurable settings (no code changes needed)
- Integrated invitation flow
- Permission-based UI with helper text

---

## Prerequisites

### System Requirements
- [ ] User is authenticated
- [ ] User has `SUPERADMIN` or `CONSULTANCY_ADMIN` role
- [ ] Consultancy organization exists (for non-platform admins)

### Business Prerequisites (Configurable)
These can be enabled/disabled by platform admins without code changes:

| Prerequisite | Description | Configurable | Default |
|-------------|-------------|--------------|---------|
| `require_contract_upload` | Require contract document before creating org | ✅ Yes | `false` |
| `require_client_email` | Require client admin email for invitation | ✅ Yes | `true` |
| `require_framework_selection` | Require primary framework selection | ✅ Yes | `true` |
| `auto_send_invitation` | Auto-send invitation after org creation | ✅ Yes | `true` |

---

## User Flow

### Step 1: Navigate to Organizations
```
Dashboard → Organizations → Create New
```

### Step 2: Fill Organization Form
**Required Fields:**
- Organization Name* (e.g., "Bettercoal Producer ABC")
- Industry Sector* (dropdown: Mining, Agriculture, Energy, Manufacturing, Other)
- Client Admin Email* (for invitation)

**Optional Fields:**
- Primary Framework (Bettercoal, OECD, RBA, Custom)
- Contract Document (if `require_contract_upload` is enabled)
- Contact Information (phone, address)

### Step 3: System Validation
Backend checks:
1. User has permission to create organizations
2. Required fields are filled
3. Contract uploaded (if required)
4. Client admin email is valid

### Step 4: Organization Creation
System creates:
1. Organization record
2. OrganizationMembership for client admin (pending)
3. Invitation record (if `auto_send_invitation`)

### Step 5: Invitation Sent
- Email sent to client admin with secure invitation link
- Invitation expires in 7 days (configurable)

---

## API Endpoints

### POST /api/organizations/
**Request:**
```json
{
  "name": "Bettercoal Producer ABC",
  "industry_sector": "MINING",
  "client_admin_email": "admin@client.com",
  "primary_framework": "BETTERCOAL",
  "contract_document": "url_to_uploaded_file"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Bettercoal Producer ABC",
  "status": "ACTIVE",
  "invitation": {
    "id": "uuid",
    "email": "admin@client.com",
    "expires_at": "2026-04-18T00:00:00Z",
    "invitation_link": "http://localhost:5173/invitations/{token}/accept"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Prerequisite not met",
  "details": {
    "missing_prerequisites": ["contract_upload"],
    "message": "Contract document is required before creating organizations. Please upload the signed contract first."
  }
}
```

---

## Permission Matrix

| User Role | Can Create Org | Can Skip Contract | Can Auto-Invite |
|-----------|---------------|-------------------|-----------------|
| `SUPERADMIN` | ✅ Yes | ✅ Yes | ✅ Yes |
| `CONSULTANCY_ADMIN` | ✅ Yes | ❌ No | ✅ Yes |
| `CONSULTANT` | ❌ No | N/A | N/A |
| `CLIENT_ADMIN` | ❌ No | N/A | N/A |

---

## Admin Configuration

Platform admins can configure prerequisites at:
**Settings → Organization Settings → Creation Rules**

Configuration stored in `OrganizationCreationConfig` model:
```python
class OrganizationCreationConfig(models.Model):
    require_contract_upload = models.BooleanField(default=False)
    require_client_email = models.BooleanField(default=True)
    require_framework_selection = models.BooleanField(default=True)
    auto_send_invitation = models.BooleanField(default=True)
    invitation_expiry_days = models.PositiveIntegerField(default=7)
    allowed_creators = models.JSONField(default=list)  # ['SUPERADMIN', 'CONSULTANCY_ADMIN']
```

---

## Frontend Components

### PrerequisiteCheck Helper
```tsx
<PrerequisiteCheck
  type="organization_creation"
  render={({ canProceed, missingPrerequisites, helperText }) => (
    <Form method="post">
      {!canProceed && (
        <Alert variant="warning">
          <AlertTitle>Prerequisites Not Met</AlertTitle>
          <AlertDescription>{helperText}</AlertDescription>
        </Alert>
      )}
      <Input 
        name="client_admin_email" 
        disabled={!canProceed}
        placeholder={canProceed ? "Client admin email" : "Complete prerequisites first"}
      />
      <Button type="submit" disabled={!canProceed}>
        Create Organization
      </Button>
    </Form>
  )}
/>
```

### Permission-Based UI
```tsx
{user.canCreateOrganization ? (
  <Form method="post">
    {/* Creation form */}
  </Form>
) : (
  <EmptyState
    icon={Lock}
    title="Organization Creation Restricted"
    description="Only Consultancy Admins and Platform Admins can create new organizations."
    action={
      <Button variant="outline" onClick={() => navigate('/contact-support')}>
        Request Access
      </Button>
    }
  />
)}
```

---

## Testing Checklist

### Manual Testing
- [ ] SUPERADMIN can create org without contract
- [ ] CONSULTANCY_ADMIN blocked without contract (if required)
- [ ] CONSULTANT cannot see create button
- [ ] Invitation email sent correctly
- [ ] Invitation link expires after 7 days
- [ ] Helper text shows for missing prerequisites

### Automated Testing
- [ ] Unit test: `test_organization_creation_prerequisites`
- [ ] Integration test: `test_org_creation_with_invitation`
- [ ] E2E test: `test_uc001_complete_flow`

---

## Related Files

**Backend:**
- `backend/organizations/views/__init__.py` - OrganizationViewSet
- `backend/organizations/models.py` - Organization, Invitation models
- `backend/organizations/serializers/__init__.py` - Validation logic
- `backend/organizations/management/commands/seed_creation_config.py` - Default config

**Frontend:**
- `frontend/app/routes/organizations.tsx` - Main org list + create form
- `frontend/app/components/PrerequisiteCheck.tsx` - Reusable helper
- `frontend/app/components/PermissionGate.tsx` - Permission-based rendering

**Documentation:**
- `docs/complete-use-cases.md` - UC-001 specification
- `docs/organization-creation-config.md` - Admin configuration guide
