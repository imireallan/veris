# Veris Platform: Complete Use Case Documentation

## Overview

**Veris** is a B2B SaaS platform for sustainability assessments and compliance management. It enables consultancies (like TDi) to manage client assessments against multiple frameworks (Bettercoal, OECD, RBA, etc.) with AI-powered evidence validation.

---

## User Roles

| Role | Description | Primary Goals |
|------|-------------|---------------|
| **Platform Admin** | Veris/TDi internal team | Manage platform, onboard consultancies, monitor usage |
| **Consultancy Admin** | TDi consultant managing multiple clients | Oversee all client engagements, assign team members |
| **Consultant** | TDi staff working on client assessments | Complete assessments, validate evidence, generate reports |
| **Client Admin** | Client organization (e.g., Bettercoal producer) | Manage their organization, invite team members |
| **Client Contributor** | Client staff submitting assessment data | Complete questionnaires, upload evidence |
| **Auditor/Reviewer** | Third-party verifier (future role) | Review submissions, verify claims, approve certifications |

---

## Feature Map

```
Veris Platform
├── Authentication & Onboarding
│   ├── User Registration
│   ├── Invitation Flow
│   └── Multi-Tenancy (Org Switching)
├── Organization Management
│   ├── Organization Setup
│   ├── Member Management
│   ├── Custom Roles (RBAC)
│   └── Invitations
├── Assessments
│   ├── Framework Management
│   ├── Assessment Creation
│   ├── Questionnaire Completion
│   ├── Evidence Upload
│   └── AI Validation
├── Evidence & Knowledge
│   ├── Document Upload
│   ├── AI Processing (Embedding)
│   ├── Vector Search (RAG)
│   └── Cross-Document Validation
├── Continuous Improvement
│   ├── CIP (Continuous Improvement Plan)
│   ├── Task Management
│   ├── AI Nudges/Reminders
│   └── Progress Tracking
├── Reporting & Analytics
│   ├── Gap Analysis
│   ├── Score Dashboards
│   ├── Cross-Framework Mapping
│   └── Export (PDF, Excel)
└── Administration
    ├── User Management
    ├── Audit Logs
    └── Platform Settings
```

---

# Use Case 1: Consultancy Onboards New Client

## UC-001: Create Client Organization

**Users Involved**: Consultancy Admin, Platform Admin

**Goal**: Set up a new client organization in Veris

**Preconditions**:
- Consultancy has Veris account
- Client has signed contract with consultancy

**Main Flow**:
1. Consultancy Admin logs into Veris
2. Navigates to Organizations → Create New
3. Enters client details:
   - Organization name (e.g., "Bettercoal Producer ABC")
   - Industry sector
   - Primary framework (e.g., Bettercoal)
   - Contact information
4. System creates organization with default settings
5. System generates invitation link for Client Admin

**Postconditions**:
- Client organization exists in system
- Invitation sent to Client Admin
- Consultancy linked as managing consultancy

**Business Value**: Enables multi-tenant architecture where consultancy can manage multiple clients from single dashboard

---

## UC-002: Invite Client Admin

**Users Involved**: Consultancy Admin, Client Admin

**Goal**: Grant Client Admin access to their organization

**Preconditions**:
- Client organization created
- Client Admin email obtained

**Main Flow**:
1. Consultancy Admin goes to Organization → Members → Invite
2. Enters Client Admin email
3. Selects role: "Client Admin"
4. Sets invitation expiry (default: 7 days)
5. System sends email with secure invitation link
6. Client Admin clicks link
7. Client Admin creates password + completes profile
8. System creates user + links to organization via OrganizationMembership

**Postconditions**:
- Client Admin has access to organization
- OrganizationMembership record created
- Invitation marked as accepted

**Business Value**: Secure onboarding without manual user creation. Invitation flow ensures only authorized users get access.

**Related Code**:
- `backend/organizations/models.py` → Invitation model
- `backend/organizations/views/__init__.py` → InvitationViewSet
- `tests/organizations/test_invitations.py` → Test coverage

---

# Use Case 2: User Authentication & Multi-Tenancy

## UC-010: User Login

**Users Involved**: All authenticated users

**Goal**: Access Veris platform securely

**Preconditions**:
- User account exists
- User has at least one organization membership

**Main Flow**:
1. User navigates to Veris login page
2. Enters email + password
3. System validates credentials (bcrypt hash)
4. System generates JWT access token (7-day expiry)
5. System returns user profile + primary organization
6. User redirected to dashboard

**Postconditions**:
- User authenticated
- JWT token stored in frontend
- User can access organization-scoped resources

**Technical Details**:
```python
# Token generation
POST /api/token/
{
  "email": "user@example.com",
  "password": "password123"
}

# Response
{
  "access": "jwt-token-here",
  "refresh": "refresh-token-here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "orgId": "org-uuid"  # Primary/last-active org
  }
}
```

**Business Value**: Secure authentication with JWT. 7-day token reduces login friction for consultants working across multiple sessions.

---

## UC-011: Switch Organization Context

**Users Involved**: Consultants managing multiple clients

**Goal**: Switch between client organizations without re-login

**Preconditions**:
- User has OrganizationMembership in multiple organizations
- User is authenticated

**Main Flow**:
1. User clicks organization selector (top nav)
2. System shows list of user's organizations:
   - "Bettercoal Producer ABC" (Client)
   - "EO100 Mining Corp" (Client)
   - "TDi Internal" (Consultancy)
3. User selects target organization
4. Frontend updates organization context
5. All subsequent API calls use new org ID

**Postconditions**:
- User context switched
- Dashboard shows data for selected org
- API requests scoped to new org

**Technical Details**:
```python
# OrganizationMembership through-table enables N:M relationship
class OrganizationMembership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    role = models.ForeignKey(CustomRole, on_delete=models.SET_NULL)
    
# Query all user's organizations
memberships = OrganizationMembership.objects.filter(user=user)
orgs = [m.organization for m in memberships]
```

**Business Value**: Critical for consultants managing 10+ clients. No need to maintain multiple accounts or re-login.

---

# Use Case 3: Assessment Workflow

## UC-020: Create Assessment

**Users Involved**: Consultant, Client Admin

**Goal**: Start new sustainability assessment for client

**Preconditions**:
- Client organization exists
- Assessment template available (Bettercoal, OECD, etc.)
- User has permission to create assessments

**Main Flow**:
1. Consultant navigates to Assessments → Create New
2. Selects framework:
   - Bettercoal (12 principles, 144 provisions)
   - OECD Due Diligence
   - RBA (Responsible Business Alliance)
   - Custom framework
3. Sets assessment period (e.g., "2026 Annual Assessment")
4. Assigns focus areas to team members
5. System generates questionnaire from framework
6. Assessment status: "In Progress"

**Postconditions**:
- Assessment record created
- Questions generated from framework template
- Notifications sent to assigned team members

**Business Value**: Standardized assessment creation. Framework templates ensure consistency across clients.

---

## UC-021: Complete Questionnaire

**Users Involved**: Client Contributor, Consultant

**Goal**: Submit answers to assessment questions

**Preconditions**:
- Assessment created
- User has access to organization
- Questions available

**Main Flow**:
1. User opens assessment questionnaire
2. System displays questions grouped by focus area:
   - Human Rights
   - Environment
   - Business Ethics
   - etc.
3. For each question, user provides:
   - Answer text (narrative response)
   - Self-score (0-5 scale)
   - Uploads evidence documents
4. User saves progress (auto-save to localStorage + backend)
5. User marks question as "Complete"
6. System tracks completion % per focus area

**Postconditions**:
- AssessmentResponse records created
- Evidence files uploaded
- Progress tracked

**Example Question**:
```json
{
  "id": "question-uuid",
  "text": "Does the company have an environmental policy covering waste management?",
  "framework": "Bettercoal",
  "provision": "3.2",
  "scoring_criteria": {
    "0": "No policy exists",
    "2": "Policy exists but incomplete",
    "4": "Comprehensive policy with targets",
    "5": "Policy + implementation + monitoring"
  }
}
```

**Business Value**: Structured data collection. Scoring criteria ensure consistent evaluation across clients.

---

## UC-022: Upload Evidence

**Users Involved**: Client Contributor, Consultant

**Goal**: Attach supporting documents to assessment responses

**Preconditions**:
- Assessment in progress
- User has answer text ready
- Evidence documents available (PDF, DOCX, images)

**Main Flow**:
1. User clicks "Upload Evidence" on question
2. Selects file from computer
3. System validates:
   - File type (PDF, DOCX, XLSX, PNG, JPG, etc.)
   - File size (< 25MB)
   - Virus scan (future)
4. System uploads to storage:
   - Development: Local filesystem (`./media/`)
   - Production: AWS S3 (private bucket)
5. System returns file URL
6. File attached to AssessmentResponse.evidence_files

**Postconditions**:
- File stored in S3/local
- KnowledgeDocument record created (for AI processing)
- File linked to assessment response

**Technical Details**:
```python
# Upload endpoint
POST /api/upload-evidence/
Content-Type: multipart/form-data

Response:
{
  "url": "/media/evidence_documents/abc123_policy.pdf",
  "file_name": "environmental_policy_2025.pdf",
  "file_size": 524288,
  "content_type": "application/pdf"
}
```

**Business Value**: Evidence-backed assessments. Documents stored securely with organization scoping.

---

# Use Case 4: AI Validation (Phase 2 Feature)

## UC-030: Process Evidence Document

**Users Involved**: System (automated), Consultant

**Goal**: Convert uploaded evidence into searchable vector embeddings

**Preconditions**:
- Evidence document uploaded
- KnowledgeDocument record created
- Pinecone + embedding API configured

**Main Flow**:
1. System triggers processing (manual or automated)
2. PDF text extraction (pypdf library)
3. Text chunking (1000 chars, 200 overlap)
4. Embedding generation:
   - OpenAI: text-embedding-3-small (1536 dims)
   - HuggingFace: all-MiniLM-L6-v2 (384 dims, free)
5. Vectors stored in Pinecone with metadata:
   ```json
   {
     "document_id": "doc-uuid",
     "organization_id": "org-uuid",
     "chunk_index": 0,
     "text": "Our company is committed to...",
     "framework_tags": ["bettercoal"]
   }
   ```
6. KnowledgeDocument updated:
   - `embeddings_indexed: true`
   - `chunk_count: 12`
   - `vector_ids: [...]`

**Postconditions**:
- Document searchable via semantic similarity
- Ready for AI validation

**Business Value**: Enables RAG (Retrieval-Augmented Generation) for validation, cross-framework mapping, and AI recommendations.

---

## UC-031: Validate Response Against Evidence

**Users Involved**: Consultant, Client Contributor

**Goal**: Automatically verify that assessment responses are supported by uploaded evidence

**Preconditions**:
- Assessment response submitted
- Evidence documents processed (embedded)
- User has permission to validate

**Main Flow**:
1. User clicks "Validate with AI" on response
2. System embeds response text (same model as evidence)
3. System queries Pinecone for similar evidence chunks:
   - Filter: organization_id = response.org_id
   - Top-K: 5 most similar chunks
   - Threshold: 0.5 minimum similarity
4. System calculates confidence score:
   ```python
   if no_matches:
       confidence = 0.1
   else:
       avg_similarity = mean(match.scores)
       count_boost = min(num_matches * 0.1, 0.3)
       confidence = min(avg_similarity * (0.7 + count_boost), 0.95)
   ```
5. System determines status:
   - ≥ 0.80: "validated" (green)
   - 0.50-0.79: "flagged" (yellow)
   - < 0.50: "insufficient_evidence" (red)
6. System extracts citations (document IDs from matches)
7. System generates feedback text
8. AssessmentResponse updated with validation results

**Postconditions**:
- Response has validation_status, confidence_score, citations
- User sees AI feedback
- Consultant can prioritize review based on status

**Example Response**:
```json
{
  "validation_status": "validated",
  "confidence_score": 0.87,
  "citations": ["doc-uuid-1", "doc-uuid-2"],
  "feedback": "Response validated with 87% confidence. Found 3 supporting evidence chunk(s) in uploaded documents.",
  "matching_chunks": 3
}
```

**Business Value**: 
- **Consultants**: Quickly identify weak responses needing attention
- **Clients**: Confidence that submissions are evidence-backed
- **Auditors**: Traceable citations from response → source documents
- **Veris**: Differentiated AI feature vs. competitors

**Related Documentation**:
- `docs/ai-validation-scoring.md` — Scoring algorithm details
- `docs/ai-validation-use-cases.md` — End-to-end testing guide

---

## UC-032: Review Flagged Responses

**Users Involved**: Consultant, Client Contributor

**Goal**: Human review of AI-flagged responses

**Preconditions**:
- Responses validated
- Some responses have status "flagged" or "insufficient_evidence"

**Main Flow**:
1. Consultant opens assessment dashboard
2. Filters responses by validation_status:
   - Show: "flagged" + "insufficient_evidence"
3. For each flagged response:
   - Review answer text
   - Review AI feedback (e.g., "Found 1 partial match")
   - Review cited documents (if any)
   - Decide action:
     a. Accept (override AI, mark as valid)
     b. Request revision (notify client contributor)
     c. Request more evidence
4. Consultant adds notes/feedback
5. Client Contributor revises response or uploads additional evidence
6. Re-validate (optional)

**Postconditions**:
- Flagged responses resolved
- Assessment quality improved
- Client learns what evidence is needed

**Business Value**: Human-in-the-loop AI. AI flags issues, humans make final judgment. Improves assessment quality while building trust.

---

# Use Case 5: Continuous Improvement (CIP)

## UC-040: Generate CIP from Assessment

**Users Involved**: Consultant, Client Admin

**Goal**: Convert assessment findings into actionable improvement plan

**Preconditions**:
- Assessment completed
- Gaps identified (low-scoring questions)
- AI validation complete

**Main Flow**:
1. System analyzes assessment results
2. Identifies gaps (score < threshold):
   - Score < 2: Critical gap
   - Score 2-3: Moderate gap
   - Score 3-4: Minor gap
3. For each gap, AI generates:
   - Recommended actions
   - Priority level
   - Estimated effort (days/weeks)
   - Related framework requirements
4. System creates CIP (Continuous Improvement Plan):
   - CIPCycle record
   - Task records for each action
   - Due dates based on priority
5. Consultant reviews + adjusts CIP
6. CIP assigned to Client Admin

**Postconditions**:
- CIP created with tasks
- Client has clear action plan
- Progress tracking enabled

**Business Value**: Transforms static assessment into dynamic improvement roadmap. Drives ongoing engagement (not just annual check-box).

---

## UC-041: Track CIP Progress

**Users Involved**: Client Contributor, Consultant

**Goal**: Monitor and update CIP task completion

**Preconditions**:
- CIP created
- Tasks assigned
- User has access to organization

**Main Flow**:
1. Client Contributor opens CIP dashboard
2. Views tasks by status:
   - Not Started
   - In Progress
   - Completed
   - Overdue
3. Updates task progress:
   - Changes status
   - Adds comments
   - Uploads evidence of completion
4. System sends AI nudges (future):
   - "Task X is due in 3 days"
   - "You have 5 overdue tasks"
5. Consultant monitors progress remotely
6. System calculates completion % per focus area

**Postconditions**:
- CIP progress tracked
- Overdue tasks visible
- Evidence linked to tasks

**Business Value**: Continuous monitoring vs. periodic assessment. Keeps clients engaged between annual assessments.

---

# Use Case 6: Cross-Framework Intelligence (Phase 3)

## UC-050: Answer Once, Map to Many

**Users Involved**: Client Contributor, Consultant

**Goal**: Submit one response that maps to multiple frameworks

**Preconditions**:
- Client assessed against multiple frameworks (e.g., Bettercoal + OECD)
- Response submitted for one framework
- Cross-framework mapping data available

**Main Flow**:
1. Client submits response for Bettercoal Provision 3.2
2. System identifies overlapping requirements:
   - Bettercoal 3.2 ↔ OECD Human Rights
   - Bettercoal 3.2 ↔ RBA Labor Standards
3. AI maps response to related framework questions
4. System suggests: "This response also addresses OECD HR-12. Would you like to apply it?"
5. User confirms mapping
6. Response linked to multiple framework questions
7. Completion % updates across all frameworks

**Postconditions**:
- One response mapped to N frameworks
- Reduced duplicate work for client
- Cross-framework dashboard shows unified progress

**Business Value**: Massive efficiency gain. Client answers each question once, system maps to all relevant frameworks. Key differentiator vs. competitors.

---

## UC-051: Auto-Generate Gap Analysis Report

**Users Involved**: Consultant, Client Admin

**Goal**: Instant gap analysis report upon assessment completion

**Preconditions**:
- Assessment completed (>80% questions answered)
- AI validation complete
- CIP generated

**Main Flow**:
1. Consultant clicks "Generate Gap Analysis"
2. System compiles:
   - Low-scoring questions by focus area
   - Validation status distribution
   - CIP tasks created
   - Benchmark vs. industry peers (future)
3. AI generates narrative summary:
   - Strengths (high-scoring areas)
   - Critical gaps (priority actions)
   - Recommended timeline
4. Report exported as PDF
5. Report shared with Client Admin

**Postconditions**:
- Gap analysis report generated
- Client has clear priorities
- Consultant has deliverable for client meeting

**Business Value**: Instant report generation saves consultant 4-8 hours of manual work. Consistent format across all clients.

---

# Use Case 7: Administration & Governance

## UC-060: Manage Custom Roles (RBAC)

**Users Involved**: Consultancy Admin, Client Admin

**Goal**: Create organization-specific roles with custom permissions

**Preconditions**:
- Organization exists
- Default roles insufficient (e.g., need "Environmental Manager" role)

**Main Flow**:
1. Admin navigates to Settings → Roles
2. Clicks "Create Custom Role"
3. Defines role:
   - Name: "Environmental Manager"
   - Permissions (checkboxes):
     - [✓] assessments:read
     - [✓] assessments:write
     - [✓] evidence:upload
     - [ ] members:invite
     - [ ] roles:manage
4. Saves role
5. Assigns role to users via OrganizationMembership

**Postconditions**:
- CustomRole record created
- Role assigned to users
- Permission checks use role.permissions_json

**Technical Details**:
```python
# Dynamic RBAC (not hardcoded)
class CustomRole(models.Model):
    name = models.CharField(max_length=100)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    permissions_json = models.JSONField(default=dict)
    
# Permission check
if membership.role.has_permission('assessments:write'):
    # Allow access
```

**Business Value**: Flexible RBAC supports diverse client org structures. Bettercoal "Producer" vs. EO100 "Coordinator" vs. custom titles.

---

## UC-061: Audit User Actions

**Users Involved**: Platform Admin, Compliance Officer

**Goal**: Track all user actions for compliance/audit trail

**Preconditions**:
- System configured with audit logging
- User performs action

**Main Flow**:
1. User performs action (e.g., deletes assessment)
2. System logs to AuditLog table:
   ```python
   {
     "user_id": "uuid",
     "action": "assessment.deleted",
     "resource_type": "Assessment",
     "resource_id": "uuid",
     "timestamp": "2026-04-10T18:45:00Z",
     "ip_address": "192.168.1.1",
     "metadata": {"assessment_name": "2026 Annual"}
   }
   ```
3. Admin queries audit logs:
   - By user
   - By resource
   - By action type
   - By date range
4. Admin exports for compliance reporting

**Postconditions**:
- Audit trail complete
- Compliance requirements met
- Suspicious activity detectable

**Business Value**: Required for enterprise clients (ISO 27001, SOC 2). Enables forensic investigation of data issues.

---

# Use Case 8: White-Label Distribution (Phase 4)

## UC-070: Customize Branding per Consultancy

**Users Involved**: Platform Admin, Consultancy Admin

**Goal**: White-label Veris for consultancy brand

**Preconditions**:
- Consultancy on enterprise plan
- Consultancy has brand assets (logo, colors)

**Main Flow**:
1. Platform Admin enables white-label for consultancy
2. Consultancy Admin uploads:
   - Logo (PNG, SVG)
   - Brand colors (primary, secondary)
   - Custom domain (optional: assessments.tdi.com)
3. System creates Theme record:
   ```python
   {
     "organization": "tdi-uuid",
     "logo_url": "s3://...",
     "primary_color": "#0052CC",
     "secondary_color": "#FF5630",
     "custom_domain": "assessments.tdi.com"
   }
   ```
4. Frontend applies theme dynamically
5. Emails sent from consultancy domain (future)

**Postconditions**:
- Consultancy-branded interface
- Clients see consultancy brand, not Veris
- Custom domain configured (optional)

**Business Value**: Consultancies can resell Veris as their own platform. Enables higher pricing and client retention.

---

## UC-071: ASM Portal for Small-Scale Miners

**Users Involved**: ASM (Artisanal Small-scale Miner), Consultancy

**Goal**: Simplified onboarding for small miners (CGWG model)

**Preconditions**:
- Consultancy manages ASM program (e.g., Gemfields, Kering)
- ASM has limited digital literacy/resources

**Main Flow**:
1. ASM receives SMS/email with unique link
2. ASM opens link (no login required)
3. Simplified SAQ (Self-Assessment Questionnaire):
   - 20 questions (vs. 144 for full assessment)
   - Yes/No answers (vs. 0-5 scoring)
   - Voice note upload option (future)
4. ASM submits responses
5. Link expires after 30 days
6. Consultancy reviews submissions

**Postconditions**:
- ASM assessment submitted
- No account created (frictionless)
- Data linked to consultancy program

**Business Value**: Expands addressable market to ASM sector. CGWG already uses this model (no-login web form).

---

# Feature Status Summary

| Feature | Phase | Status | Use Cases |
|---------|-------|--------|-----------|
| **Multi-Tenancy (OrgMembership)** | P0 | ✅ Complete | UC-001, UC-002, UC-011 |
| **Dynamic RBAC** | P0 | ⏳ Pending | UC-060 |
| **Invitation Flow** | P0 | ⏳ Pending | UC-002 |
| **Evidence Upload + S3** | P1 | ✅ Complete | UC-022 |
| **AI Embedding Pipeline** | P1 | ✅ Complete | UC-030 |
| **AI Validation** | P1 | ✅ Complete | UC-031, UC-032 |
| **Cross-Framework Mapping** | P2 | ⏳ Planned | UC-050 |
| **CIP Task Management** | P2 | ⏳ Partial | UC-040, UC-041 |
| **Auto Gap Reports** | P2 | ⏳ Planned | UC-051 |
| **White-Label Engine** | P3 | ⏳ Planned | UC-070 |
| **ASM Portal** | P3 | ⏳ Planned | UC-071 |

---

# Glossary

| Term | Definition |
|------|------------|
| **Assessment** | Structured evaluation against a framework (e.g., Bettercoal annual assessment) |
| **CIP** | Continuous Improvement Plan — actionable tasks derived from assessment gaps |
| **CIP Cycle** | Time-bound CIP (e.g., "2026 Q1 CIP") |
| **Evidence** | Supporting documents uploaded to validate responses |
| **Focus Area** | ESG category (Human Rights, Environment, Ethics, etc.) |
| **Framework** | External standard (Bettercoal, OECD, RBA, etc.) |
| **KnowledgeDocument** | Processed evidence document with vector embeddings |
| **OrganizationMembership** | Through-table linking User → Organization with Role |
| **Provision** | Individual requirement within a framework (Bettercoal has 144) |
| **RAG** | Retrieval-Augmented Generation — AI pattern using vector search |
| **SAQ** | Self-Assessment Questionnaire (simplified for ASM) |
| **Validation Status** | AI confidence: validated/flagged/insufficient_evidence |

---

# Related Documentation

- `docs/ai-validation-scoring.md` — AI scoring algorithm
- `docs/ai-validation-use-cases.md` — AI validation testing guide
- `docs/ai-architecture-decision.md` — AI technical architecture
- `docs/storage-configuration.md` — S3 vs. local storage
- `docs/Veris_API.postman_collection.json` — API reference
- `~/projects/veris_onboarding_docs/roadmap.md` — Product roadmap

---

# Document Maintenance

**Last Updated**: April 10, 2026  
**Owner**: Product/Engineering Team  
**Review Cadence**: Update when new features shipped or user workflows change

**Contribution Process**:
1. Identify new feature or workflow change
2. Add use case following template above
3. Update Feature Status Summary table
4. Link to technical documentation
5. Commit to `docs/` directory

---

**This document is the single source of truth for Veris platform capabilities. All new features must have corresponding use case documentation before merge.**
