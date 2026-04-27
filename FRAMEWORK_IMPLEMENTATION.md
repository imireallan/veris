# Framework & Template System - Complete Implementation

## Overview
Implemented complete framework management and template instantiation flow with proper RBAC controls.

---

## Files Created

### 1. **Frameworks List** 
`frontend/app/routes/organizations.$orgId.frameworks.tsx`
- Lists all frameworks imported by the organization
- Shows stats: principles, categories, provisions count
- Links to framework detail and import wizard
- **RBAC**: Requires org membership (`RBAC.isOrgMember`)

### 2. **Framework Detail**
`frontend/app/routes/organizations.$orgId.frameworks.$frameworkId.tsx`
- Three tabs: Structure, Templates, Details
- Shows hierarchy: Principles → Categories → Provisions
- Lists all templates linked to this framework
- **RBAC**: Requires org membership

### 3. **Instantiate Assessment**
`frontend/app/routes/organizations.$orgId.templates.$templateId.instantiate.tsx`
- Form to create assessment from published template
- Optional: site selection, custom name, due date
- Calls backend: `POST /api/templates/:id/instantiate/`
- **RBAC**: Requires `RBAC.canCreateAssessments`
- Only works for PUBLISHED templates

---

## Files Modified

### 1. **Backend: Template Views**
`backend/assessments/views/template_views.py`
```python
# Changed: Org users can now see org-owned templates in ANY status
# Before: Only PUBLISHED templates visible
# After: Org-owned drafts visible for editing/publishing
return AssessmentTemplate.objects.filter(
    Q(is_public=True, status=AssessmentTemplate.Status.PUBLISHED) | Q(owner_org=organization),
)
```

### 2. **Frontend: Org Templates List**
`frontend/app/routes/organizations.$orgId.templates.tsx`
- Fixed API endpoint: `/api/templates/` (was non-existent `/api/organizations/:orgId/templates/`)
- Updated create action to use correct endpoint with `owner_org` field
- Added "Instantiate" link for published templates

### 3. **Frontend: Template Editor**
`frontend/app/routes/organizations.$orgId.templates.$templateId.tsx`
- Added null check for template (fixes original error)
- Added "Publish Template" button (DRAFT → PUBLISHED)
- Added "Instantiate Assessment" button (for PUBLISHED templates)
- Shows "Draft" badge when status is DRAFT

### 4. **Frontend: Org Detail Layout**
`frontend/app/routes/organizations.$orgId.tsx`
- Added "Frameworks →" link to navigation
- Renamed "Manage Templates" → "Templates"

### 5. **Frontend: Framework Import**
`frontend/app/routes/organizations.$orgId.frameworks.import.tsx`
- Added "View All Frameworks" button

### 6. **Frontend: Routes Config**
`frontend/app/routes.ts`
- Added route: `/organizations/:orgId/frameworks`
- Added route: `/organizations/:orgId/frameworks/:frameworkId`
- Added route: `/organizations/:orgId/templates/:templateId/instantiate`

---

## RBAC Matrix

| Route | Permission Required | Backend Check |
|-------|-------------------|---------------|
| `GET /api/frameworks/` | Authenticated | `IsAuthenticated` |
| `GET /api/frameworks/:id/` | Authenticated | `IsAuthenticated` |
| `POST /api/frameworks/import/` | Org Member + Admin | `IsOrganizationMember` |
| `GET /api/templates/` | Org Member | `CanManageTemplates` (filters by org) |
| `POST /api/templates/` | Superadmin OR Org Admin | `CanManageTemplates` |
| `POST /api/templates/:id/publish/` | Superadmin OR Org Admin | `CanManageTemplates` |
| `POST /api/templates/:id/instantiate/` | Org Member + `assessment:create` | `CanManageTemplates` + org check |
| `GET /organizations/:orgId/frameworks` | Org Member | `RBAC.isOrgMember` |
| `GET /organizations/:orgId/templates` | Org Member | `RBAC.isOrgMember` |
| `POST /organizations/:orgId/templates/:id/instantiate` | `assessment:create` | `RBAC.canCreateAssessments` |

---

## User Flows

### Flow 1: Import Framework → Create Template → Publish → Instantiate

```
1. Org Admin goes to /organizations/:orgId/frameworks/import
   - Uploads Excel/CSV with Bettercoal structure
   - Backend creates: Framework + AssessmentTemplate (DRAFT) + Questions

2. System redirects to /organizations/:orgId/frameworks/import/:jobId
   - Shows import progress
   - On completion: Framework + Template created

3. User clicks "Edit Template" → /organizations/:orgId/templates/:templateId
   - Reviews auto-generated questions
   - Adds custom questions
   - Clicks "Publish Template"

4. Template now shows "Instantiate Assessment" button
   - Clicks it → /organizations/:orgId/templates/:templateId/instantiate
   - Fills form: name, dates, optional site
   - Creates Assessment instance

5. Assessment appears in /organizations/:orgId/assessments
   - Ready for evidence upload and AI mapping
```

### Flow 2: View Framework Structure

```
1. User goes to /organizations/:orgId/frameworks
   - Sees list of all frameworks
   - Shows: principles count, provisions count, linked templates

2. Clicks "View" on a framework
   - Goes to /organizations/:orgId/frameworks/:frameworkId
   - Tab 1 "Structure": Shows principle → category hierarchy
   - Tab 2 "Templates": Lists all templates using this framework
   - Tab 3 "Details": Metadata (version, scoring, etc.)
```

---

## Backend Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/frameworks/` | GET | List all frameworks |
| `/api/frameworks/:id/` | GET | Get framework detail |
| `/api/frameworks/import/preview/` | POST | Upload file for preview |
| `/api/frameworks/import/create/` | POST | Submit import job |
| `/api/templates/` | GET | List templates (filtered by org) |
| `/api/templates/:id/` | GET | Get template detail |
| `/api/templates/:id/publish/` | POST | Publish template |
| `/api/templates/:id/instantiate/` | POST | Create assessment from template |
| `/api/templates/:id/questions/` | GET/POST | Manage template questions |
| `/api/organizations/:orgId/sites/` | GET | List sites (for site-specific assessments) |

---

## Key Design Decisions

### 1. **Framework vs Template Separation**
- **Framework**: Reference data (external standard, immutable once imported)
- **Template**: Working blueprint (editable until published, can be customized)
- **Rationale**: Allows multiple templates per framework, org-specific customizations

### 2. **Draft → Publish Workflow**
- Templates start as DRAFT (editable)
- Must be PUBLISHED to instantiate assessments
- Published templates are immutable (must duplicate to edit)
- **Rationale**: Prevents accidental changes to active assessments

### 3. **Org-Scoped Visibility**
- Superadmins: See all templates (any status, any org)
- Org members: See public published + org-owned (any status)
- **Rationale**: Org users need to see their drafts to edit/publish

### 4. **Instantiate Permission**
- Requires `assessment:create` permission (not just template:view)
- Only works on PUBLISHED templates
- **Rationale**: Creating assessments is a separate concern from managing templates

---

## Testing Checklist

### Framework Import
- [ ] Upload Bettercoal Excel file
- [ ] Verify framework created with correct structure
- [ ] Verify template auto-created in DRAFT status
- [ ] Verify questions auto-populated from provisions

### Template Management
- [ ] Create template manually (no framework)
- [ ] Add questions to draft template
- [ ] Publish template
- [ ] Verify published template is immutable
- [ ] Duplicate published template (creates new draft)

### Assessment Instantiation
- [ ] Instantiate from published template
- [ ] Verify assessment created with correct org/site
- [ ] Verify questions linked via template (not copied)
- [ ] Try to instantiate draft template (should fail)

### RBAC
- [ ] Non-member cannot access org frameworks
- [ ] Member without `assessment:create` cannot instantiate
- [ ] Superadmin can manage all templates
- [ ] Org admin can manage org templates

---

## Future Enhancements

1. **Framework Versioning**
   - Import new version of existing framework
   - Migrate templates to new version

2. **Template Customization per Assessment**
   - Copy questions to assessment instance (not just link)
   - Allow per-assessment question customization

3. **Cross-Framework Mapping UI**
   - Visual mapping between provisions of different frameworks
   - AI-suggested mappings

4. **Framework Marketplace**
   - Pre-imported frameworks (GRI, SASB, ISO)
   - One-click enable for organizations

5. **Assessment Templates Gallery**
   - Browse public templates from other orgs
   - Clone and customize

---

## Migration Notes

### Database Changes
No new migrations required - uses existing models:
- `Framework`
- `AssessmentTemplate`
- `AssessmentQuestion`
- `Assessment`
- `FrameworkImportJob`

### Backward Compatibility
- Existing framework imports continue to work
- Existing templates remain accessible
- New routes are additive (no breaking changes)

---

## Known Limitations

1. **No Framework Edit UI**
   - Frameworks are immutable after import
   - Must re-import to update

2. **No Template Search/Filter**
   - Templates list is flat (no filtering by framework, status)

3. **No Bulk Instantiate**
   - Can only create one assessment at a time

4. **No Site Management UI**
   - Sites must be created via API or admin
   - No CRUD interface in frontend

---

## Related Documentation
- Backend: `backend/assessments/views/template_views.py`
- Backend: `backend/assessments/services/framework_import.py`
- Frontend: `frontend/app/types/rbac.ts`
- Backend: `backend/users/permissions.py`
