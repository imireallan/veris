import uuid

from django.db import models


class Framework(models.Model):
    """Tracks external ESG frameworks and their structure."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    version = models.CharField(max_length=50, default="")
    description = models.TextField(blank=True, default="")
    categories = models.JSONField(default=dict)
    scoring_methodology = models.JSONField(default=dict)
    reporting_period = models.CharField(max_length=100, blank=True, default="")
    last_synced = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "frameworks"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.version})"


class ESGFocusArea(models.Model):
    """
    The organizing unit for company's ESG program.
    Modeled on Major Energy Operator's 6 areas.
    """

    class Trend(models.TextChoices):
        UP = "UP", "Up"
        DOWN = "DOWN", "Down"
        STABLE = "STABLE", "Stable"
        INSUFFICIENT_DATA = "INSUFFICIENT_DATA", "Insufficient Data"

    class AIRiskLevel(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="focus_areas",
    )
    name = models.CharField(max_length=200)
    internal_label = models.CharField(max_length=100)
    owner = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_areas",
    )
    description = models.TextField(blank=True, default="")
    current_score = models.FloatField(default=0.0)
    trend = models.CharField(
        max_length=30, choices=Trend.choices, default=Trend.INSUFFICIENT_DATA
    )
    last_assessed = models.DateTimeField(null=True, blank=True)
    ai_risk_level = models.CharField(
        max_length=20, choices=AIRiskLevel.choices, default=AIRiskLevel.LOW
    )
    framework_mappings = models.JSONField(default=dict)
    ai_gaps = models.JSONField(default=dict)
    ai_recommendations = models.JSONField(default=dict, blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "esg_focus_areas"
        unique_together = ["organization", "internal_label"]
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.organization.name})"


class ExternalRating(models.Model):
    """Tracks scores from external rating agencies over time."""

    class Agency(models.TextChoices):
        MSCI = "MSCI", "MSCI"
        SUSTAINALYTICS = "SUSTAINALYTICS", "Sustainalytics"
        ISS = "ISS", "ISS"
        EQUIABLE_ORIGIN = "EQUIABLE_ORIGIN", "Equiable Origin"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="external_ratings",
    )
    agency = models.CharField(max_length=30, choices=Agency.choices)
    score = models.FloatField(null=True, blank=True)
    score_date = models.DateField()
    category_scores = models.JSONField(default=dict)
    rating_grade = models.CharField(max_length=10, blank=True, default="")
    trend_vs_previous = models.FloatField(null=True, blank=True)
    ai_analysis = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "external_ratings"
        ordering = ["-score_date"]

    def __str__(self):
        return f"{self.organization.name} - {self.get_agency_display()} ({self.score_date})"


class Assessment(models.Model):
    """Core entity for sustainability assessments."""

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        COMPLETED = "COMPLETED", "Completed"
        ARCHIVED = "ARCHIVED", "Archived"

    class RiskLevel(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="assessments",
    )
    site = models.ForeignKey(
        "assessments.Site",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assessments",
    )
    template = models.ForeignKey(
        "assessments.AssessmentTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assessments",
    )
    focus_area = models.ForeignKey(
        "assessments.ESGFocusArea",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assessments",
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )
    framework = models.ForeignKey(
        "assessments.Framework",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assessments",
    )
    start_date = models.DateTimeField()
    due_date = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    overall_score = models.FloatField(default=0.0)
    risk_level = models.CharField(
        max_length=20, choices=RiskLevel.choices, default=RiskLevel.LOW
    )
    ai_summary = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_assessments",
    )
    assigned_to = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_assessments",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "assessments"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Assessment {self.id} - {self.organization.name}"


class AssessmentTemplate(models.Model):
    """Template for assessments."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="templates"
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    framework = models.ForeignKey(
        "assessments.Framework",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="templates",
    )
    questions = models.JSONField(default=list)
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "assessment_templates"
        ordering = ["name"]
        unique_together = ["organization", "name"]

    def __str__(self):
        return self.name


class AssessmentQuestion(models.Model):
    """Represents a question within an assessment template."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(
        "assessments.AssessmentTemplate",
        on_delete=models.CASCADE,
        related_name="assessment_questions",
    )
    text = models.TextField()
    order = models.PositiveIntegerField(default=0)
    category = models.CharField(max_length=200, blank=True, default="")
    scoring_criteria = models.JSONField(default=dict)
    is_required = models.BooleanField(default=True)

    class Meta:
        db_table = "assessment_questions"
        ordering = ["order"]

    def __str__(self):
        return self.text[:100]


class AssessmentResponse(models.Model):
    """Answers to assessment questions with AI enrichment."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assessment = models.ForeignKey(
        "assessments.Assessment", on_delete=models.CASCADE, related_name="responses"
    )
    focus_area = models.ForeignKey(
        "assessments.ESGFocusArea",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="responses",
    )
    question = models.ForeignKey(
        "assessments.AssessmentQuestion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="responses",
    )
    answer_text = models.TextField(blank=True, default="")
    answer_score = models.FloatField(default=0.0)
    evidence_files = models.JSONField(default=list)
    ai_score_suggestion = models.FloatField(null=True, blank=True)
    ai_feedback = models.TextField(blank=True, default="")
    ai_validated = models.BooleanField(default=False)
    frameworks_mapped_to = models.JSONField(default=list)
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="responses",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "assessment_responses"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Response {self.id} - Assessment {self.assessment_id}"


class AIInsight(models.Model):
    """Separates detailed AI reasoning for performance."""

    class InsightType(models.TextChoices):
        GAP_ANALYSIS = "GAP_ANALYSIS", "Gap Analysis"
        RECOMMENDATION = "RECOMMENDATION", "Recommendation"
        RISK_FLAG = "RISK_FLAG", "Risk Flag"
        CROSS_FRAMEWAY = "CROSS_FRAMEWAY", "Cross Framework"
        SUMMARY = "SUMMARY", "Summary"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="ai_insights",
    )
    assessment = models.ForeignKey(
        "assessments.Assessment", on_delete=models.CASCADE, related_name="ai_insights"
    )
    response = models.ForeignKey(
        "assessments.AssessmentResponse",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ai_insights",
    )
    focus_area = models.ForeignKey(
        "assessments.ESGFocusArea",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ai_insights",
    )
    insight_type = models.CharField(max_length=30, choices=InsightType.choices)
    insight_text = models.TextField()
    confidence_score = models.FloatField(default=0.0)
    source_documents = models.JSONField(default=list)
    action_required = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ai_insights"
        ordering = ["-created_at"]

    def __str__(self):
        return f"AI Insight ({self.insight_type}) - {self.assessment_id}"


class Task(models.Model):
    """Tracks improvement actions from assessments."""

    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assessment = models.ForeignKey(
        "assessments.Assessment", on_delete=models.CASCADE, related_name="tasks"
    )
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="tasks"
    )
    focus_area = models.ForeignKey(
        "assessments.ESGFocusArea",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
    )
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True, default="")
    priority = models.CharField(
        max_length=20, choices=Priority.choices, default=Priority.MEDIUM
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    assigned_to = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    ai_nudged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tasks"
        ordering = ["priority", "due_date"]

    def __str__(self):
        return self.title


class Site(models.Model):
    """Physical locations being assessed — works across all industries."""

    class SiteType(models.TextChoices):
        MINE = "MINE", "Mine"
        OPERATION = "OPERATION", "Oil/Gas Operation"
        WELL = "WELL", "Well Pad / Well Site"
        FACILITY = "FACILITY", "Processing Facility"
        REFINERY = "REFINERY", "Refinery"
        PORT = "PORT", "Port / Storage Facility"
        OFFICE = "OFFICE", "Regional Office"
        TRANSPORT = "TRANSPORT", "Transport Infrastructure"
        FARM = "FARM", "Farm / Plantation"
        FACTORY = "FACTORY", "Factory / Manufacturing"
        WAREHOUSE = "WAREHOUSE", "Warehouse"
        RETAIL = "RETAIL", "Retail Location"

    class OperationalStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        DECOMMISSIONED = "DECOMMISSIONED", "Decommissioned"
        PLANNED = "PLANNED", "Planned"
        UNDER_CONSTRUCTION = "UNDER_CONSTRUCTION", "Under Construction"

    class RiskProfile(models.TextChoices):
        LOW = "LOW", "Low Risk"
        MEDIUM = "MEDIUM", "Medium Risk"
        HIGH = "HIGH", "High Risk"
        CRITICAL = "CRITICAL", "Critical Risk"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="sites"
    )
    name = models.CharField(max_length=300)
    type = models.CharField(max_length=20, choices=SiteType.choices)
    operational_status = models.CharField(
        max_length=20,
        choices=OperationalStatus.choices,
        default=OperationalStatus.ACTIVE,
    )
    risk_profile = models.CharField(
        max_length=20, choices=RiskProfile.choices, default=RiskProfile.MEDIUM
    )

    # Location
    country_code = models.CharField(max_length=3)
    region = models.CharField(max_length=200, blank=True, default="")
    coordinates = models.JSONField(
        default=dict, help_text="{'lat': float, 'lng': float}"
    )

    # Industry-specific fields (stored as JSON for flexibility across industries)
    industry_data = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            "Flexible industry-specific fields. Examples:\n"
            "  Coal: type_of_coal, type_of_mine, certifications, contractors, fatalities, etc.\n"
            "  Oil/Gas: well_type, production_rate, pipeline_connections, etc.\n"
            "  Agriculture: crop_type, hectares, irrigation, etc.\n"
            "  Manufacturing: production_lines, capacity, waste_management, etc."
        ),
    )

    # Common operational metrics
    employee_count = models.PositiveIntegerField(default=0, blank=True)
    contractor_count = models.PositiveIntegerField(default=0, blank=True)
    operational_since = models.PositiveIntegerField(
        null=True, blank=True, help_text="Year operations started"
    )
    estimated_lifetime_years = models.PositiveIntegerField(
        null=True, blank=True, help_text="Remaining operational lifetime"
    )
    expansion_plan = models.TextField(blank=True, default="")

    # Compliance
    certifications = models.JSONField(default=list)
    other_certifications = models.TextField(blank=True, default="")
    is_in_indigenous_territory = models.BooleanField(default=False)
    is_in_conflict_zone = models.BooleanField(
        default=False, help_text="CAHRA or similar"
    )

    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sites"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.organization.name})"


# ─────────────────────────────────────────────────────────────
# Assessment Reports & Findings (Bettercoal-compatible)
# ─────────────────────────────────────────────────────────────


class AssessmentReport(models.Model):
    """Structured assessment report with multiple sections.
    Mirrors Bettercoal's multi-section report model but simplified.
    """

    class ReportStatus(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        COMPLETED = "COMPLETED", "Completed"
        ARCHIVED = "ARCHIVED", "Archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="assessment_reports",
    )
    assessment = models.OneToOneField(
        "assessments.Assessment", on_delete=models.CASCADE, related_name="report"
    )
    title = models.CharField(max_length=500, default="Assessment Report")
    status = models.CharField(
        max_length=20, choices=ReportStatus.choices, default=ReportStatus.DRAFT
    )

    # Report sections stored as JSON for flexibility
    executive_summary = models.TextField(blank=True, default="")
    methodology = models.TextField(blank=True, default="")
    scope = models.TextField(blank=True, default="")
    country_context = models.TextField(blank=True, default="")
    conclusion = models.TextField(blank=True, default="")

    # Meeting participants (opening/closing)
    meeting_participants = models.JSONField(default=list, blank=True)
    stakeholder_meetings = models.JSONField(default=list, blank=True)

    # Limitations and disclaimers
    limitations = models.JSONField(default=list, blank=True)
    disclaimer = models.TextField(blank=True, default="")

    # Assessment metadata
    assessment_start_date = models.DateField(null=True, blank=True)
    assessment_end_date = models.DateField(null=True, blank=True)
    report_published_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "assessment_reports"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report: {self.title} - {self.assessment}"


class Finding(models.Model):
    """Assessment finding linked to a framework provision.
    Equivalent to Bettercoal's assessment_report_finding + cip_cipfinding.
    """

    class Severity(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        RESOLVED = "RESOLVED", "Resolved"
        CLOSED = "CLOSED", "Closed"
        WAIVED = "WAIVED", "Waived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="findings"
    )
    report = models.ForeignKey(
        "assessments.AssessmentReport",
        on_delete=models.CASCADE,
        related_name="findings",
        null=True,
        blank=True,
    )
    assessment = models.ForeignKey(
        "assessments.Assessment",
        on_delete=models.CASCADE,
        related_name="findings",
    )
    site = models.ForeignKey(
        "assessments.Site",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="findings",
    )
    provision = models.ForeignKey(
        "assessments.Framework",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="The framework provision this finding relates to",
    )
    topic = models.CharField(max_length=300, blank=True, default="")
    summary = models.TextField(blank=True, default="")
    recommended_actions = models.TextField(blank=True, default="")
    severity = models.CharField(
        max_length=20, choices=Severity.choices, default=Severity.MEDIUM
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.OPEN
    )
    responsible_party = models.CharField(max_length=255, blank=True, default="")
    supplier_response = models.TextField(blank=True, default="")
    assessor_comments = models.TextField(blank=True, default="")
    marked_as_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "findings"
        ordering = ["-severity", "-created_at"]

    def __str__(self):
        return f"Finding: {self.topic} ({self.status})"


class CIPCycle(models.Model):
    """Continuous Improvement Plan monitoring cycle.
    Equivalent to Bettercoal's cip_cipmonitoringcycle.
    Tracks recurring compliance checks over time.
    """

    class CycleStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        COMPLETED = "COMPLETED", "Completed"
        OVERDUE = "OVERDUE", "Overdue"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="cip_cycles",
    )
    assessment = models.ForeignKey(
        "assessments.Assessment",
        on_delete=models.CASCADE,
        related_name="cip_cycles",
    )
    label = models.CharField(
        max_length=100, help_text="e.g. '12 Month Review', 'Phase 2'"
    )
    deadline_period_months = models.PositiveIntegerField(
        default=12, help_text="Monitoring period in months"
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=CycleStatus.choices,
        default=CycleStatus.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cip_cycles"
        ordering = ["-start_date"]

    def __str__(self):
        return f"CIP Cycle: {self.label} ({self.assessment})"


class AssessmentPlan(models.Model):
    """Assessment planning — schedules, deadlines, site visit windows.
    Equivalent to Bettercoal's assessment_planning_assessmentplan.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="assessment_plans",
    )
    assessment = models.OneToOneField(
        "assessments.Assessment",
        on_delete=models.CASCADE,
        related_name="plan",
    )
    site_assessment_start = models.DateField()
    site_assessment_end = models.DateField()
    draft_report_deadline = models.DateField()
    final_report_deadline = models.DateField(null=True, blank=True)
    opening_meeting_date = models.DateField(null=True, blank=True)
    closing_meeting_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "assessment_plans"
        ordering = ["site_assessment_start"]

    def __str__(self):
        return f"Plan: {self.assessment}"


class UploadedImage(models.Model):
    """Images uploaded via the rich-text editor for assessments."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ImageField(upload_to="assessment_images/")
    uploaded_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_images",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "assessment_uploaded_images"

    def __str__(self):
        return f"Image {self.id} ({self.file.name})"
