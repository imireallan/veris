# Cross-Framework Mapping: End-to-End Use Case

**Last Updated**: April 15, 2026  
**Status**: Implemented (Phase 2-1)  
**Owner**: Veris Platform

---

## Overview

Cross-Framework Mapping allows consultancies and their clients to answer a question **once** and map that answer to **multiple sustainability frameworks** simultaneously. This eliminates redundant data entry when organizations need to comply with multiple standards at the same time.

### Core Value Proposition

- **Answer Once, Map Everywhere**: A single response applies to all mapped frameworks
- **Reduced Assessment Fatigue**: Sites complete fewer unique questions
- **Cross-Standard Compliance**: Automatically track compliance across multiple frameworks
- **Unified Evidence**: Upload evidence once, it validates against all mapped provisions

---

## Architecture

### Data Model

```
AssessmentQuestion
├── id: UUID
├── text: TextField (the question)
├── framework_mappings: JSONField
│   └── [
│       {
│           "framework_id": "uuid",
│           "framework_name": "Primary Assurance Standard",
│           "provision_code": "P1.2.3",
│           "provision_name": "Environmental Policy"
│       },
│       ...
│   ]
└── assessment: ForeignKey

AssessmentResponse
├── answer_text: TextField
├── evidence_files: JSONField
├── frameworks_mapped_to: JSONField (denormalized from question)
└── question: ForeignKey → AssessmentQuestion
```

### Key Design Decisions

1. **Mappings stored on Questions, not Responses**: Questions define the mapping; responses inherit it
2. **JSONField for flexibility**: Avoids complex many-to-many tables for early-stage MVP
3. **Denormalization on Response**: `frameworks_mapped_to` cached for fast reporting queries

---

## End-to-End Use Case Flow

### Scenario: Primary Assessment Maps to a Secondary Supplier Questionnaire

**Actors**:
- **Consultancy Admin**: Manages frameworks and questionnaires
- **Site Manager**: Completes assessments
- **Client Admin**: Reviews compliance

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: SETUP (Consultancy Admin)                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Admin creates Primary Assurance Standard assessment template                             │
│ 2. Admin adds Supplier Questionnaire as secondary framework to organization                   │
│ 3. Admin opens questionnaire builder                                        │
│ 4. For each question, admin clicks "Map Framework"                          │
│ 5. Admin selects Supplier Questionnaire, enters provision code (e.g., "SAQ.12")               │
│ 6. Question now maps to: Primary Assurance Standard P3.4 + Supplier Questionnaire SAQ.12                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: ASSESSMENT COMPLETION (Site Manager)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Site Manager opens Primary Assurance Standard assessment                                 │
│ 2. Sees question: "Do you have an environmental policy?"                    │
│ 3. Badge shows: [Primary Assurance Standard P3.4] [Supplier Questionnaire SAQ.12]                             │
│ 4. Enters answer: "Yes, implemented since 2023"                             │
│ 5. Uploads evidence: environmental_policy.pdf                               │
│ 6. Saves response                                                           │
│ 7. Response automatically applies to BOTH frameworks                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: COMPLIANCE REPORTING (Client Admin)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Primary Assurance Standard Admin views Primary Assurance Standard compliance dashboard                   │
│    → Sees P3.4: ✓ Compliant (evidence attached)                             │
│ 2. Supplier Questionnaire Admin views Supplier Questionnaire compliance dashboard                               │
│    → Sees SAQ.12: ✓ Compliant (same evidence)                               │
│ 3. Both frameworks show identical compliance status                         │
│ 4. Single evidence file validates both provisions                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Reference

### Get Question Mappings

```http
GET /api/questions/:id/mappings/
Authorization: Bearer ***
```

**Response**:
```json
{
  "mappings": [
    {
      "framework_id": "550e8400-e29b-41d4-a716-446655440001",
      "framework_name": "Primary Assurance Standard",
      "provision_code": "P3.4",
      "provision_name": "Environmental Management"
    },
    {
      "framework_id": "550e8400-e29b-41d4-a716-446655440002",
      "framework_name": "Supplier Questionnaire",
      "provision_code": "SAQ.12",
      "provision_name": "Environmental Policy"
    }
  ]
}
```

### Add Mapping

```http
POST /api/questions/:id/mappings/
Authorization: Bearer ***
Content-Type: application/json

{
  "framework_id": "550e8400-e29b-41d4-a716-446655440002",
  "provision_code": "SAQ.12",
  "provision_name": "Environmental Policy"
}
```

**Response** (201 Created):
```json
{
  "mappings": [
    {
      "framework_id": "550e8400-e29b-41d4-a716-446655440001",
      "framework_name": "Primary Assurance Standard",
      "provision_code": "P3.4",
      "provision_name": "Environmental Management"
    },
    {
      "framework_id": "550e8400-e29b-41d4-a716-446655440002",
      "framework_name": "Supplier Questionnaire",
      "provision_code": "SAQ.12",
      "provision_name": "Environmental Policy"
    }
  ]
}
```

### Remove Mapping

```http
DELETE /api/questions/:id/mappings/:index/
Authorization: Bearer ***
```

**Response** (200 OK):
```json
{
  "message": "Mapping removed",
  "removed": {
    "framework_id": "550e8400-e29b-41d4-a716-446655440002",
    "framework_name": "Supplier Questionnaire",
    "provision_code": "SAQ.12",
    "provision_name": "Environmental Policy"
  },
  "mappings": [
    {
      "framework_id": "550e8400-e29b-41d4-a716-446655440001",
      "framework_name": "Primary Assurance Standard",
      "provision_code": "P3.4",
      "provision_name": "Environmental Management"
    }
  ]
}
```

---

## Frontend Integration

### Components

#### 1. FrameworkMappingBadge

**Location**: `frontend/app/components/FrameworkMappingBadge.tsx`

**Purpose**: Displays mapped frameworks as badges on questionnaire questions

**Props**:
```typescript
interface FrameworkMappingBadgeProps {
  mappings: FrameworkMapping[];
  onAdd?: () => void;      // Callback to open mapping modal
  onRemove?: (index: number) => void;  // Callback to remove mapping
  canEdit?: boolean;       // Show remove buttons (admin only)
}
```

**Usage Example**:
```tsx
<FrameworkMappingBadge
  mappings={question.framework_mappings}
  onAdd={() => setMappingModalOpen(true)}
  onRemove={(index) => handleRemoveMapping(index)}
  canEdit={user.role === 'SUPERADMIN'}
/>
```

**Visual Behavior**:
- No mappings + canEdit: Shows "+ Map Framework" button
- Has mappings: Shows badges with framework name + provision code
- Hover on badge (edit mode): Shows remove (X) button
- Tooltip on hover: Full provision name

---

#### 2. FrameworkMappingModal (Original - Fetcher-based)

**Location**: `frontend/app/components/FrameworkMappingModal.tsx`

**Purpose**: Dialog for adding/removing framework mappings

**Props**:
```typescript
interface FrameworkMappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string;
  organizationId: string;
  currentMappings: FrameworkMapping[];
  onMappingAdded: (mappings: FrameworkMapping[]) => void;
  onMappingRemoved: (mappings: FrameworkMapping[]) => void;
}
```

**Features**:
- Loads available frameworks from `/api/frameworks/?org={orgId}`
- Shows current mappings with inline remove buttons
- Form to add new mapping (framework selector + provision code/name)
- Validates framework selection before submit

**Integration Pattern**:
```tsx
// In questionnaire route
const [mappingModalOpen, setMappingModalOpen] = useState(false);
const [currentMappings, setCurrentMappings] = useState(question.framework_mappings);

const handleMappingAdded = (newMappings: FrameworkMapping[]) => {
  setCurrentMappings(newMappings);
  // Optionally: optimistic UI update, toast notification
};

<FrameworkMappingModal
  open={mappingModalOpen}
  onOpenChange={setMappingModalOpen}
  questionId={question.id}
  organizationId={orgId}
  currentMappings={currentMappings}
  onMappingAdded={handleMappingAdded}
  onMappingRemoved={handleMappingAdded}  // Same handler, new state
/>
```

---

#### 3. useFrameworkMappings Hook (Recommended)

**Location**: `frontend/app/hooks/use-framework-mappings.ts`

**Purpose**: Centralized hook for all mapping CRUD operations with built-in error handling, loading states, and toast notifications.

**Props**:
```typescript
interface UseFrameworkMappingsOptions {
  initialMappings?: FrameworkMapping[];  // Initial state
  onMappingsChange?: (mappings: FrameworkMapping[]) => void;  // Sync callback
  silent?: boolean;  // Disable toast notifications (default: false)
}

interface UseFrameworkMappingsReturn {
  mappings: FrameworkMapping[];
  isLoading: boolean;
  error: string | null;
  addMapping: (frameworkId: string, provisionCode?: string, provisionName?: string) => Promise<boolean>;
  removeMapping: (index: number) => Promise<boolean>;
  refreshMappings: () => Promise<void>;
  clearError: () => void;
}
```

**Usage Example**:
```tsx
import { useFrameworkMappings } from "~/hooks/use-framework-mappings";

function QuestionCard({ question, orgId }: { question: any; orgId: string }) {
  const {
    mappings,
    isLoading,
    error,
    addMapping,
    removeMapping,
  } = useFrameworkMappings(question.id, orgId, {
    initialMappings: question.framework_mappings,
    onMappingsChange: (newMappings) => {
      // Sync with parent state if needed
      updateQuestionState(question.id, { framework_mappings: newMappings });
    },
    silent: false,  // Enable toast notifications
  });

  return (
    <div>
      <FrameworkMappingBadge
        mappings={mappings}
        onAdd={() => setModalOpen(true)}
        onRemove={removeMapping}
        canEdit={canEdit}
      />
      {isLoading && <Spinner />}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
}
```

**Benefits**:
- ✓ Centralized error handling
- ✓ Automatic toast notifications
- ✓ Loading states for all operations
- ✓ Parent state sync via callback
- ✓ Consistent API across components

---

#### 4. FrameworkMappingModal (Updated - Hook-based)

**Location**: `frontend/app/components/FrameworkMappingModal.updated.tsx`

**Purpose**: Enhanced modal using `useFrameworkMappings` hook for all operations.

**Key Improvements over Original**:
- Uses centralized hook instead of direct fetch calls
- Automatic toast notifications on success/error
- Loading states disable form inputs
- Error display inline in modal
- Cleaner component logic (less boilerplate)

**Props** (same as original):
```typescript
interface FrameworkMappingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string;
  organizationId: string;
  currentMappings: FrameworkMapping[];
  onMappingAdded: (mappings: FrameworkMapping[]) => void;
  onMappingRemoved: (mappings: FrameworkMapping[]) => void;
}
```

**When to Use Which Version**:
- **Original (fetcher-based)**: If you need React Router fetcher integration for server-side actions
- **Updated (hook-based)**: For client-side operations with automatic toast notifications (recommended)

---

### Questionnaire Integration

**Location**: `frontend/app/routes/assessments.$id.questionnaire.tsx`

#### Pattern 1: Original (Fetcher-based, No Toast)

```tsx
// For each question in the questionnaire
{questions.map((question) => (
  <Card key={question.id}>
    <CardContent>
      {/* Question text */}
      <h3>{question.text}</h3>
      
      {/* Framework mapping badges */}
      <FrameworkMappingBadge
        mappings={question.framework_mappings}
        onAdd={() => {
          setSelectedQuestionId(question.id);
          setMappingModalOpen(true);
        }}
        canEdit={user.role === 'SUPERADMIN'}
      />
      
      {/* Answer form */}
      <Form method="post">
        <input type="hidden" name="question_id" value={question.id} />
        <textarea name="answer" defaultValue={existingResponse?.answer_text} />
        <Button type="submit" name="intent" value="save-response">
          Save
        </Button>
      </Form>
    </CardContent>
  </Card>
))}

{/* Mapping modal (single instance, controlled by selectedQuestionId) */}
{selectedQuestionId && (
  <FrameworkMappingModal
    open={mappingModalOpen}
    onOpenChange={setMappingModalOpen}
    questionId={selectedQuestionId}
    organizationId={orgId}
    currentMappings={/* fetch or track locally */}
    onMappingAdded={/* update local state */}
    onMappingRemoved={/* update local state */}
  />
)}
```

---

#### Pattern 2: Recommended (Hook-based with Toast)

**Complete Implementation**:

```tsx
import { useState } from "react";
import { useFrameworkMappings } from "~/hooks/use-framework-mappings";
import { FrameworkMappingBadge } from "~/components/FrameworkMappingBadge";
import { FrameworkMappingModal } from "~/components/FrameworkMappingModal.updated";
import { useToast } from "~/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";

function QuestionCard({
  question,
  orgId,
  canEdit,
}: {
  question: any;
  orgId: string;
  canEdit: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const { success: toastSuccess } = useToast();
  
  // Use centralized hook for all mapping operations
  const {
    mappings,
    isLoading,
    error,
    addMapping,
    removeMapping,
  } = useFrameworkMappings(question.id, orgId, {
    initialMappings: question.framework_mappings || [],
    silent: false,  // Enable automatic toast notifications
  });

  const handleMappingAdded = (newMappings: FrameworkMapping[]) => {
    // Hook already shows success toast, but you can add custom logic here
    console.log("Mapping added, total:", newMappings.length);
  };

  const handleMappingRemoved = (newMappings: FrameworkMapping[]) => {
    console.log("Mapping removed, total:", newMappings.length);
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        {/* Question Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-medium">{question.text}</h3>
            
            {/* Mapping Badges */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <FrameworkMappingBadge
                mappings={mappings}
                onAdd={() => setModalOpen(true)}
                onRemove={canEdit ? removeMapping : undefined}
                canEdit={canEdit}
              />
              {isLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
            
            {/* Error Display */}
            {error && (
              <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Answer Form (existing implementation) */}
        {/* ... */}
      </CardContent>

      {/* Mapping Modal */}
      <FrameworkMappingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        questionId={question.id}
        organizationId={orgId}
        currentMappings={mappings}
        onMappingAdded={handleMappingAdded}
        onMappingRemoved={handleMappingRemoved}
      />
    </Card>
  );
}

// Main route component
export default function QuestionnaireRoute() {
  const { assessmentId, orgId, questions, responses } = useLoaderData<typeof loader>();
  const user = useRouteUser(); // Your auth hook
  
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <h2 className="text-2xl font-bold">Questionnaire</h2>
      
      <div className="grid gap-6">
        {questions.map((q: any, idx: number) => {
          const response = responses.find((r: any) => r.question === q.id);
          return (
            <QuestionCard
              key={q.id}
              question={q}
              orgId={orgId}
              canEdit={user.role === 'SUPERADMIN'}
            />
          );
        })}
      </div>
    </div>
  );
}
```

---

### Loading States & Error Handling

#### Loading State Patterns

**1. Inline Spinner (Recommended)**

```tsx
{isLoading && (
  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
)}
```

**2. Disabled Form During Operations**

```tsx
<Select disabled={isLoading}>
  {/* ... */}
</Select>

<Button disabled={isLoading || !selectedFramework}>
  {isLoading ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Saving...
    </>
  ) : (
    "Add Mapping"
  )}
</Button>
```

**3. Badge Loading Overlay**

```tsx
<div className="relative inline-block">
  <FrameworkMappingBadge mappings={mappings} />
  {isLoading && (
    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-full" />
  )}
</div>
```

---

#### Error Handling Patterns

**1. Inline Error Message**

```tsx
{error && (
  <div className="flex items-center gap-2 text-sm text-destructive">
    <AlertCircle className="w-4 h-4" />
    <span>{error}</span>
  </div>
)}
```

**2. Error in Modal**

```tsx
{error && (
  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
    {error}
  </div>
)}
```

**3. Toast Notifications (Automatic via Hook)**

```tsx
// In useFrameworkMappings hook
if (!silent && toastId) {
  dismiss(toastId);
  errorToast("Failed to add mapping", message);
}
```

**4. Error Boundary (Global)**

```tsx
// In root.tsx or error.tsx
export default function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-destructive/10 rounded-lg">
      <h2 className="text-lg font-semibold text-destructive">Mapping Error</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
    </div>
  );
}
```

---

### Toast Notification Integration

The `useFrameworkMappings` hook automatically shows toasts for all operations:

| Operation | Success Toast | Error Toast |
|-----------|--------------|-------------|
| Add Mapping | "Mapping added" | "Failed to add mapping" |
| Remove Mapping | "Mapping removed" | "Failed to remove mapping" |
| Load Mappings | (silent) | "Failed to load mappings" |

**Customize Toast Behavior**:

```tsx
// Disable all toasts (silent mode)
const { addMapping, removeMapping } = useFrameworkMappings(questionId, orgId, {
  silent: true,
});

// Handle toasts manually
const { addMapping } = useFrameworkMappings(questionId, orgId, {
  silent: true,  // Disable automatic toasts
});

const { success, error } = useToast();

const handleAdd = async () => {
  const result = await addMapping(frameworkId);
  if (result) {
    success("Custom message", "Your custom description");
  }
};
```

**Toast Duration**:
- Success: 4 seconds (default)
- Error: 6 seconds (recommended for errors)
- Loading: Until dismissed by completion

**Toast Position**: Top-right (configured in `root.tsx` Toaster)

---

## Backend Implementation

### Model Definition

**Location**: `backend/assessments/models.py`

```python
class AssessmentQuestion(models.Model):
    # ... other fields ...
    
    # Cross-framework mapping (P2-1)
    # Structure: [{"framework_id": "uuid", "provision_code": "P1.2.3", "provision_name": "..."}, ...]
    framework_mappings = models.JSONField(default=list, blank=True)
```

### ViewSet Actions

**Location**: `backend/assessments/views/flat_views.py`

```python
class FlatAssessmentQuestionViewSet(viewsets.ReadOnlyModelViewSet):
    # ... other methods ...
    
    @action(detail=True, methods=["get"], url_path="mappings")
    def get_mappings(self, request, pk=None):
        """Get framework mappings for a question."""
        question = self.get_object()
        return Response({"mappings": question.framework_mappings})
    
    @action(detail=True, methods=["post"], url_path="mappings")
    def add_mapping(self, request, pk=None):
        """Add a framework mapping to a question."""
        question = self.get_object()
        data = request.data
        
        # Validate framework exists
        from assessments.models import Framework
        try:
            framework = Framework.objects.get(id=data["framework_id"])
        except Framework.DoesNotExist:
            return Response(
                {"error": "Framework not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create mapping entry
        mapping = {
            "framework_id": str(framework.id),
            "framework_name": framework.name,
            "provision_code": data.get("provision_code", ""),
            "provision_name": data.get("provision_name", ""),
        }
        
        # Check for duplicates
        existing = next(
            (m for m in question.framework_mappings
             if m["framework_id"] == mapping["framework_id"]
             and m["provision_code"] == mapping["provision_code"]),
            None,
        )
        if existing:
            return Response(
                {"error": "Mapping already exists"}, 
                status=status.HTTP_409_CONFLICT
            )
        
        question.framework_mappings.append(mapping)
        question.save()
        
        return Response(
            {"mappings": question.framework_mappings}, 
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=["delete"], url_path="mappings/(?P<index>[^/.]+)")
    def delete_mapping(self, request, pk=None, index=None):
        """Remove a framework mapping from a question."""
        question = self.get_object()
        
        try:
            idx = int(index)
            if idx < 0 or idx >= len(question.framework_mappings):
                raise ValueError("Index out of range")
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid mapping index"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        removed = question.framework_mappings.pop(idx)
        question.save()
        
        return Response({
            "message": "Mapping removed",
            "removed": removed,
            "mappings": question.framework_mappings,
        })
```

### Serializer

**Location**: `backend/assessments/serializers/__init__.py`

```python
class AssessmentQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentQuestion
        fields = [
            "id",
            "text",
            "order",
            "category",
            "framework_mappings",  # Included in question payload
            # ... other fields ...
        ]
```

---

## RBAC & Permissions

### Who Can Map Frameworks?

| Role | Can View Mappings | Can Add/Remove Mappings |
|------|------------------|-------------------------|
| **SUPERADMIN** (Consultancy Platform Admin) | ✓ | ✓ |
| **ORG ADMIN** (Client) | ✓ | ✗ |
| **SITE MANAGER** | ✓ | ✗ |
| **VIEWER** | ✓ | ✗ |

**Implementation**:
- Badges show `canEdit={user.role === 'SUPERADMIN'}`
- Backend validates permissions via organization-scoped viewsets
- Mapping endpoints inherit standard DRF permissions

---

## Reporting & Analytics

### Query Patterns

#### Get All Responses Mapped to a Framework

```python
from assessments.models import AssessmentResponse

# Find all responses where the question maps to Primary Assurance Standard
responses = AssessmentResponse.objects.filter(
    question__framework_mappings__contains=[
        {"framework_id": "550e8400-e29b-41d4-a716-446655440001"}
    ]
)
```

#### Cross-Framework Compliance Dashboard

```python
# Pseudocode for compliance aggregation
def get_framework_compliance(org_id, framework_id):
    questions = AssessmentQuestion.objects.filter(
        assessment__organization_id=org_id,
        framework_mappings__contains=[{"framework_id": framework_id}]
    )
    
    compliance_data = []
    for q in questions:
        response = AssessmentResponse.objects.filter(
            question=q, assessment__organization_id=org_id
        ).first()
        
        mapping = next(
            (m for m in q.framework_mappings if m["framework_id"] == framework_id),
            None
        )
        
        compliance_data.append({
            "provision_code": mapping["provision_code"],
            "provision_name": mapping["provision_name"],
            "status": "compliant" if response and response.answer_score > 0.7 else "gap",
            "evidence_count": len(response.evidence_files) if response else 0,
        })
    
    return compliance_data
```

---

## Future Enhancements (Backlog)

### P3: AI-Assisted Mapping

- **Auto-suggest mappings**: NLP analyzes question text, suggests relevant provisions from other frameworks
- **Confidence scoring**: AI rates mapping relevance (e.g., "95% match to Supplier Questionnaire SAQ.12")
- **Bulk mapping**: Upload framework crosswalk CSV, auto-map all questions

### P3: Response-Level Overrides

- **Framework-specific answers**: Allow sites to provide different answers per framework (rare edge case)
- **Conditional mapping**: "If answer = 'Yes', map to Framework A; if 'No', map to Framework B"

### P4: Framework Versioning

- **Track framework versions**: Primary Assurance Standard 2023 vs 2024 revisions
- **Migration workflows**: When framework updates, prompt to remap questions

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [API Reference](./API.md)
- [RBAC Permissions Matrix](./rbac-permissions-matrix.md)
- [Evidence Pipeline](../docs/veris-evidence-pipeline-pattern.md) (skill reference)

---

## Pitfalls & Gotchas

### 1. Duplicate Mappings

**Problem**: Same framework + provision code mapped twice

**Solution**: Backend validates duplicates before insert (see `add_mapping` view)

```python
# Check for duplicates
existing = next(
    (m for m in question.framework_mappings
     if m["framework_id"] == mapping["framework_id"]
     and m["provision_code"] == mapping["provision_code"]),
    None,
)
```

### 2. Framework Deletion

**Problem**: Framework deleted but mappings still reference it

**Solution**: 
- Soft delete frameworks (add `is_active` flag)
- OR: Cascade cleanup on framework deletion (future enhancement)

### 3. Frontend State Sync

**Problem**: Modal updates mappings, but questionnaire doesn't reflect changes

**Solution**: 
- Parent component tracks `currentMappings` state
- Pass `onMappingAdded`/`onMappingRemoved` callbacks to modal
- Modal calls callbacks with fresh state from API response

### 4. UUID Validation

**Problem**: Frontend sends invalid UUID format

**Solution**: Backend uses `UUID()` constructor in service layer (ApplyFlow pattern)

```python
# In service/validation layer
from uuid import UUID
try:
    UUID(framework_id)  # Validates format
except ValueError:
    raise ValidationError("Invalid framework_id format")
```

---

## Testing Checklist

- [ ] SUPERADMIN can add mapping to question
- [ ] SUPERADMIN can remove mapping from question
- [ ] ORG ADMIN can view mappings but cannot add/remove
- [ ] Duplicate mapping attempt returns 409 Conflict
- [ ] Invalid framework_id returns 404 Not Found
- [ ] Questionnaire displays badges correctly
- [ ] Modal loads frameworks for organization
- [ ] Removing last mapping shows "+ Map Framework" button
- [ ] Response inherits mappings from question
- [ ] Compliance dashboard aggregates across frameworks

---

## Migration Notes

### Adding to Existing Questions

If you have existing questions without mappings:

```python
# Migration script (backend/migrate_framework_mappings.py)
from assessments.models import AssessmentQuestion

# Example: Bulk add Supplier Questionnaire mapping to all Environmental questions
Question.objects.filter(category="Environmental").update(
    framework_mappings=[
        {
            "framework_id": "supplier-questionnaire-uuid",
            "framework_name": "Supplier Questionnaire",
            "provision_code": "ENV.1",
            "provision_name": "Environmental Management"
        }
    ]
)
```

### Schema Change

The `framework_mappings` field was added in migration:
`backend/assessments/migrations/0006_add_assessmentquestion_framework_mappings.py`

---

## Quick Start: Implementing in New Questionnaire

1. **Backend**: Ensure `AssessmentQuestion.framework_mappings` field exists
2. **Backend**: Add `FlatAssessmentQuestionViewSet` mapping actions (already implemented)
3. **Frontend**: Import `FrameworkMappingBadge` and `FrameworkMappingModal`
4. **Frontend**: Add badges to questionnaire question cards
5. **Frontend**: Add modal with state management
6. **Test**: SUPERADMIN adds mapping, ORG ADMIN views only

---

**End of Document**
