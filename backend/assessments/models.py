import uuid

from django.db import models
from django.utils import timezone


class Framework(models.Model):
    """Tracks external ESG frameworks and their structure."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, null=True, blank=True)
    version = models.CharField(max_length=50, default="")
    description = models.TextField(blank=True, default="")
    categories = models.JSONField(default=dict)
    scoring_methodology = models.JSONField(default=dict)
    reporting_period = models.CharField(max_length=100, blank=True, default="")
    
    # EO100 and other framework-specific metadata
    metadata = models.JSONField(
        default=dict, blank=True,
        help_text="Framework-specific metadata (e.g., EO100 supplements, principle count)"
    )
    
    last_synced = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "frameworks"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.version})"

    def save(self, *args, **kwargs):
        """Auto-generate slug from name if not provided."""
        if not self.slug and self.name:
            import re

            self.slug = re.sub(r"[^a-z0-9]+", "-", self.name.lower()).strip("-")
            # Ensure uniqueness
            base_slug = self.slug
            counter = 1
            while Framework.objects.filter(slug=self.slug).exists():
                self.slug = f"{base_slug}-{counter}"
                counter += 1
        super().save(*args, **kwargs)


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

    # Template association (P0 - Template Management)
    template = models.ForeignKey(
        "assessments.AssessmentTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assessments",
        help_text="If set, this assessment was instantiated from a template.",
    )
    template_version = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Snapshot of template version at instantiation time.",
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
    """
    Master template for assessments (SUPERADMIN-managed).
    Templates can be global (is_public=True) or organization-specific.
    Published templates are immutable — must duplicate to edit.
    """

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PUBLISHED = "PUBLISHED", "Published"
        ARCHIVED = "ARCHIVED", "Archived"

    # EO100 supplement types
    class SupplementType(models.TextChoices):
        DEFAULT = "DEFAULT", "Default"
        PROCESSING = "PROCESSING", "Processing"
        PRODUCTION = "PRODUCTION", "Production"
        TRANSMISSION_STORAGE = "TRANSMISSION_STORAGE", "Transmission & Storage"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, null=True, blank=True)
    description = models.TextField(blank=True, default="")

    # Framework association
    framework = models.ForeignKey(
        "assessments.Framework",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="templates",
    )
    
    # EO100 supplement type (null for non-EO100 frameworks)
    supplement_type = models.CharField(
        max_length=50,
        choices=SupplementType.choices,
        null=True,
        blank=True,
        help_text="EO100 supplement type (null for non-EO100 frameworks)"
    )

    # Versioning
    version = models.CharField(max_length=50, default="1.0.0")
    version_notes = models.TextField(blank=True, default="")

    # Visibility & tenancy
    is_public = models.BooleanField(
        default=False,
        help_text="If True, visible to all organizations. If False, only owner_org can use.",
    )
    owner_org = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="owned_templates",
        help_text="If set, template is scoped to this organization (client-specific).",
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="assessment_templates",
        help_text="Canonical tenant organization reference.",
    )

    # Lifecycle
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    published_at = models.DateTimeField(null=True, blank=True)
    published_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="published_templates",
    )

    # Audit
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_templates",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "assessment_templates"
        ordering = ["-created_at"]
        # No unique_together - old constraint was on (organization, slug) which was removed in 0007
        # We don't declare unique_together here to avoid Django trying to alter it
        indexes = [
            models.Index(fields=["is_public", "status"]),
            models.Index(fields=["owner_org", "status"]),
        ]

    def __str__(self):
        return f"{self.name} (v{self.version})"

    def save(self, *args, **kwargs):
        if not self.organization_id and self.owner_org_id:
            self.organization_id = self.owner_org_id
        elif not self.owner_org_id and self.organization_id and not self.is_public:
            self.owner_org_id = self.organization_id
        super().save(*args, **kwargs)

    def can_edit(self):
        """Published templates are immutable."""
        return self.status == self.Status.DRAFT

    def can_delete(self):
        """Cannot delete if has instances."""
        return not self.assessments.exists()


class AssessmentQuestion(models.Model):
    """Represents a question within an assessment template."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(
        "assessments.AssessmentTemplate",
        on_delete=models.CASCADE,
        related_name="assessment_questions",
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="assessment_questions",
    )
    text = models.TextField()
    order = models.PositiveIntegerField(default=0)
    category = models.CharField(max_length=200, blank=True, default="")
    scoring_criteria = models.JSONField(default=dict)
    is_required = models.BooleanField(default=True)

    # EO100 performance target level
    performance_target_level = models.IntegerField(
        default=1,
        choices=[
            (1, "PT1 - Minimum Compliance"),
            (2, "PT2 - Good Practice"),
            (3, "PT3 - Best Practice"),
        ],
        help_text="EO100 performance target level"
    )
    
    # External question ID for legacy/migration (e.g., EO100: "100.1.1.1")
    external_question_id = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="External format: supplement.principle.objective.PT (e.g., '100.1.1.1')"
    )

    # Cross-framework mapping (P2-1)
    # Structure: [{"framework_id": "uuid", "provision_code": "P1.2.3", "provision_name": "..."}, ...]
    framework_mappings = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "assessment_questions"
        ordering = ["order"]

    def save(self, *args, **kwargs):
        if not self.organization_id and self.template_id:
            self.organization_id = (
                self.template.organization_id or self.template.owner_org_id
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return self.text[:100]


class AssessmentResponse(models.Model):
    """Answers to assessment questions with AI enrichment."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assessment = models.ForeignKey(
        "assessments.Assessment", on_delete=models.CASCADE, related_name="responses"
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="assessment_responses",
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

    # AI Validation Fields (Phase 2)
    ai_score_suggestion = models.FloatField(null=True, blank=True)
    ai_feedback = models.TextField(blank=True, default="")
    ai_validated = models.BooleanField(default=False)
    validation_status = models.CharField(
        max_length=25,
        choices=[
            ("pending", "Pending"),
            ("validated", "Validated"),
            ("flagged", "Flagged"),
            ("insufficient_evidence", "Insufficient Evidence"),
        ],
        default="pending",
    )
    confidence_score = models.FloatField(
        null=True, blank=True, help_text="AI confidence 0-1"
    )
    citations = models.JSONField(
        default=list, help_text="Referenced evidence document IDs"
    )

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

    def save(self, *args, **kwargs):
        if not self.organization_id and self.assessment_id:
            self.organization_id = self.assessment.organization_id
        super().save(*args, **kwargs)

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
# Assessment Reports & Findings (legacy-compatible)
# ─────────────────────────────────────────────────────────────


class AssessmentReport(models.Model):
    """Structured assessment report with multiple sections.
    Mirrors a legacy multi-section report model but simplified.
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
    Equivalent to a legacy assessment finding + improvement-plan finding model.
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
    due_date = models.DateTimeField(null=True, blank=True)
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
    Equivalent to a legacy improvement-plan monitoring cycle.
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
    Equivalent to a legacy assessment planning model.
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
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="uploaded_images",
    )
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


class FrameworkImportJob(models.Model):
    """
    Tracks async framework import jobs.
    Created when admin uploads Excel/CSV file.
    Polled by frontend for progress updates.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSING = "PROCESSING", "Processing"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="framework_import_jobs",
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="framework_import_jobs",
    )

    # File metadata
    original_filename = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)  # Temporary storage path

    # Framework metadata (from preview step)
    framework_name = models.CharField(max_length=200)
    framework_version = models.CharField(max_length=50, default="1.0.0")
    framework_description = models.TextField(blank=True, default="")
    create_template = models.BooleanField(default=True)

    # Progress tracking
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    progress_percentage = models.FloatField(default=0.0)
    current_step = models.CharField(max_length=100, blank=True, default="")
    total_items = models.IntegerField(default=0)
    processed_items = models.IntegerField(default=0)

    # Results
    framework_id = models.UUIDField(null=True, blank=True)
    template_id = models.UUIDField(null=True, blank=True)
    questions_created = models.IntegerField(default=0)
    error_message = models.TextField(blank=True, default="")

    # Timing
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "framework_import_jobs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Import Job {self.id} - {self.framework_name} ({self.status})"

    def update_progress(
        self, processed: int, total: int, step: str = "", status: str = None
    ):
        """Update job progress - called by async task."""
        self.processed_items = processed
        self.total_items = total
        self.progress_percentage = (processed / total * 100) if total > 0 else 0
        self.current_step = step
        if status:
            self.status = status
        self.save(
            update_fields=[
                "processed_items",
                "total_items",
                "progress_percentage",
                "current_step",
                "status",
                "updated_at",
            ]
        )

    def mark_completed(self, framework_id, template_id=None, questions_created=0):
        """Mark job as completed with results."""
        self.status = self.Status.COMPLETED
        self.framework_id = framework_id
        self.template_id = template_id
        self.questions_created = questions_created
        self.progress_percentage = 100.0
        self.completed_at = timezone.now()
        self.save(
            update_fields=[
                "status",
                "framework_id",
                "template_id",
                "questions_created",
                "progress_percentage",
                "completed_at",
                "updated_at",
            ]
        )

    def mark_failed(self, error_message: str):
        """Mark job as failed with error."""
        self.status = self.Status.FAILED
        self.error_message = error_message
        self.completed_at = timezone.now()
        self.save(
            update_fields=[
                "status",
                "error_message",
                "completed_at",
                "updated_at",
            ]
        )
