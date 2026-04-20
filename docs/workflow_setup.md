# Veris: End-to-End Product Workflow & Role Definitions

This document defines the full lifecycle of an assessment within the Veris platform, from initial system configuration to the final AI-enriched report.

## 1. System Architecture Overview
Veris operates on a hierarchical data model to ensure multi-tenant isolation and reusable assessment logic.
**Organization** $\rightarrow$ **Assessment Template** $\rightarrow$ **Assessment** $\rightarrow$ **Assessment Response**

---

## 2. User Roles & Responsibility Matrix

| Role | Responsibility | Key Actions | Primary Interface |
| :--- | :--- | :--- | :--- |
| **Global Admin** | Platform Governance | $\bullet$ Create/Manage Organizations<br>$\bullet$ System-wide Framework updates | Django Admin / CLI |
| **Org Admin** | ESG Program Design | $\bullet$ Build Assessment Templates<br>$\bullet$ Define Questions & Criteria<br>$\bullet$ Launch Assessments for Sites | Frontend Dashboard / Admin |
| **Respondent** | Data Provisioning | $\bullet$ Answer Questionnaire<br>$\bullet$ Upload Evidence Files<br>$\bullet$ Review AI Suggestions | Questionnaire UI |
| **AI Engine** | Technical Validation | $\bullet$ Analyze text for compliance<br>$\bullet$ Suggest scores based on criteria<br>$\bullet$ Identify evidence gaps | Backend / FastAPI |

---

## 3. The Full Operational Flow

### Phase 1: Infrastructure & Tenant Setup (Global Admin)
*Goal: Establish the organizational boundary.*
1. **Org Creation**: A new `Organization` is created.
2. **User Onboarding**: Users are created and linked to the Organization with specific roles (`OrganizationOwner`, `OrganizationMember`).
3. **Framework Mapping**: The Global Admin ensures the required ESG frameworks are synced in the system.

### Phase 2: Assessment Design (Org Admin)
*Goal: Define "What" needs to be measured.*
1. **Template Creation**: The Org Admin creates an `AssessmentTemplate`. This acts as the "blueprint."
2. **Question Definition**: The Admin adds `AssessmentQuestions` to the template. Each question includes:
   - **Text**: The actual query.
   - **Category**: (e.g., Environment, Social, Governance).
   - **Scoring Criteria**: Logic the AI will use to score the answer.
3. **Template Validation**: The template is saved and ready for reuse across different sites or years.

### Phase 3: Operational Execution (Org Admin $\rightarrow$ Respondent)
*Goal: Collect real-world data.*
1. **Assessment Launch**: The Org Admin creates an `Assessment` instance.
   - *Linkage*: This connects a specific **Organization** + **Site** + **Template**.
2. **Notification**: The Respondent is assigned to the assessment.
3. **Data Entry (Respondent)**:
   - Respondent navigates to the **Questionnaire**.
   - They provide `answer_text` and upload evidence files.
   - This creates/updates an `AssessmentResponse` record linked to the specific question.

### Phase 4: AI Enrichment & Validation (AI Engine)
*Goal: Turn raw text into actionable insights.*
1. **Trigger**: Upon answer submission, the `ai_engine` is triggered.
2. **Analysis**: The AI reads the answer and the template's scoring criteria.
3. **Scoring**: The AI populates `ai_score_suggestion` and `ai_feedback` on the `AssessmentResponse`.
4. **Feedback Loop**: The Respondent sees the AI suggestion and can refine their answer or provide better evidence.

### Phase 5: Reporting & Closing (Org Admin)
*Goal: Finalize the assessment for compliance.*
1. **Review**: The Org Admin reviews all responses and AI scores.
2. **Report Generation**: An `AssessmentReport` is generated, aggregating findings and AI insights.
3. **Completion**: The Assessment status is moved to `COMPLETED`.
4. **Action Planning**: `Tasks` are created based on gaps identified by the AI.

---

## 4. Summary Data Flow Diagram

`[Global Admin]` $\rightarrow$ Create Org $\rightarrow$ `[Org Admin]` $\rightarrow$ Design Template $\rightarrow$ Launch Assessment $\rightarrow$ `[Respondent]` $\rightarrow$ Submit Answer $\rightarrow$ `[AI Engine]` $\rightarrow$ Score/Feedback $\rightarrow$ `[Org Admin]` $\rightarrow$ Final Report.
