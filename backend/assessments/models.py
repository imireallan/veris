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
        "organizations.Organization", on_delete=models.CASCADE, related_name="focus_areas"
    )
    name = models.CharField(max_length=200)
    internal_label = models.CharField(max_length=100)
    owner = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="owned_areas"
    )
    description = models.TextField(blank=True, default="")
    current_score = models.FloatField(default=0.0)
    trend = models.CharField(max_length=30, choices=Trend.choices, default=Trend.INSUFFICIENT_DATA)
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
        "organizations.Organization", on_delete=models.CASCADE, related_name="external_ratings"
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
        "organizations.Organization", on_delete=models.CASCADE, related_name="assessments"
    )
    site = models.ForeignKey(
        "assessments.Site", on_delete=models.SET_NULL, null=True, blank=True, related_name="assessments"
    )
    template = models.ForeignKey(
        "assessments.AssessmentTemplate", on_delete=models.SET_NULL, null=True, blank=True, related_name="assessments"
    )
    focus_area = models.ForeignKey(
        "assessments.ESGFocusArea", on_delete=models.SET_NULL, null=True, blank=True, related_name="assessments"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    framework = models.ForeignKey(
        "assessments.Framework", on_delete=models.SET_NULL, null=True, blank=True, related_name="assessments"
    )
    start_date = models.DateTimeField()
    due_date = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    overall_score = models.FloatField(default=0.0)
    risk_level = models.CharField(max_length=20, choices=RiskLevel.choices, default=RiskLevel.LOW)
    ai_summary = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="created_assessments"
    )
    assigned_to = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_assessments"
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
        "assessments.Framework", on_delete=models.SET_NULL, null=True, blank=True, related_name="templates"
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
        "assessments.AssessmentTemplate", on_delete=models.CASCADE, related_name="questions"
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
        "assessments.ESGFocusArea", on_delete=models.SET_NULL, null=True, blank=True, related_name="responses"
    )
    question = models.ForeignKey(
        "assessments.AssessmentQuestion", on_delete=models.SET_NULL, null=True, blank=True, related_name="responses"
    )
    answer_text = models.TextField(blank=True, default="")
    answer_score = models.FloatField(default=0.0)
    evidence_files = models.JSONField(default=list)
    ai_score_suggestion = models.FloatField(null=True, blank=True)
    ai_feedback = models.TextField(blank=True, default="")
    ai_validated = models.BooleanField(default=False)
    frameworks_mapped_to = models.JSONField(default=list)
    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="responses"
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
        "organizations.Organization", on_delete=models.CASCADE, related_name="ai_insights"
    )
    assessment = models.ForeignKey(
        "assessments.Assessment", on_delete=models.CASCADE, related_name="ai_insights"
    )
    response = models.ForeignKey(
        "assessments.AssessmentResponse", on_delete=models.SET_NULL, null=True, blank=True, related_name="ai_insights"
    )
    focus_area = models.ForeignKey(
        "assessments.ESGFocusArea", on_delete=models.SET_NULL, null=True, blank=True, related_name="ai_insights"
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
        "assessments.ESGFocusArea", on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks"
    )
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True, default="")
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    assigned_to = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_tasks"
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
    """
    Physical locations being assessed.
    """

    class SiteType(models.TextChoices):
        OPERATION = "OPERATION", "Operation"
        MINE = "MINE", "Mine"
        OFFICE = "OFFICE", "Office"
        FACILITY = "FACILITY", "Facility"

    class OperationalStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        DECOMMISSIONED = "DECOMMISSIONED", "Decommissioned"
        PLANNED = "PLANNED", "Planned"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="sites"
    )
    name = models.CharField(max_length=300)
    type = models.CharField(max_length=20, choices=SiteType.choices)
    country_code = models.CharField(max_length=3)
    region = models.CharField(max_length=200, blank=True, default="")
    coordinates = models.JSONField(default=dict, help_text="{'lat': float, 'lng': float}")
    operational_status = models.CharField(
        max_length=20, choices=OperationalStatus.choices, default=OperationalStatus.ACTIVE
    )
    certifications = models.JSONField(default=list)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sites"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.organization.name})"
