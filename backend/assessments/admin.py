from django.contrib import admin
from assessments.models import (
    Framework,
    ESGFocusArea,
    ExternalRating,
    Assessment,
    AssessmentTemplate,
    AssessmentQuestion,
    AssessmentResponse,
    AIInsight,
    Task,
    Site,
    AssessmentReport,
    Finding,
    CIPCycle,
    AssessmentPlan,
)


@admin.register(Framework)
class FrameworkAdmin(admin.ModelAdmin):
    list_display = ("name", "version", "reporting_period", "created_at")
    search_fields = ("name", "description")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(ESGFocusArea)
class ESGFocusAreaAdmin(admin.ModelAdmin):
    list_display = ("name", "internal_label", "organization", "current_score", "trend", "ai_risk_level")
    list_filter = ("trend", "ai_risk_level", "is_active")
    search_fields = ("name", "internal_label", "description")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("organization__name", "name")


@admin.register(ExternalRating)
class ExternalRatingAdmin(admin.ModelAdmin):
    list_display = ("organization", "agency", "rating_grade", "score", "score_date", "trend_vs_previous")
    list_filter = ("agency",)
    search_fields = ("organization__name", "ai_analysis")
    readonly_fields = ("id", "created_at")
    ordering = ("-score_date",)


class AssessmentResponseInline(admin.TabularInline):
    model = AssessmentResponse
    extra = 0
    readonly_fields = ("id", "created_at", "updated_at")


class AssessmentTaskInline(admin.TabularInline):
    model = Task
    extra = 0
    readonly_fields = ("id", "created_at", "updated_at")


class AIInsightInline(admin.TabularInline):
    model = AIInsight
    extra = 0
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ("id", "organization", "status", "overall_score", "risk_level", "due_date")
    list_filter = ("status", "risk_level", "framework")
    search_fields = ("organization__name",)
    readonly_fields = ("id", "created_at", "updated_at", "completed_at")
    inlines = [AssessmentResponseInline, AssessmentTaskInline, AIInsightInline]


@admin.register(AssessmentTemplate)
class AssessmentTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "framework", "is_system", "created_at")
    list_filter = ("is_system", "framework")
    search_fields = ("name", "description")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(AssessmentQuestion)
class AssessmentQuestionAdmin(admin.ModelAdmin):
    list_display = ("text", "template", "category", "order", "is_required")
    list_filter = ("category", "is_required")
    search_fields = ("text",)


@admin.register(AssessmentResponse)
class AssessmentResponseAdmin(admin.ModelAdmin):
    list_display = ("id", "assessment", "focus_area", "answer_score", "ai_score_suggestion", "ai_validated")
    list_filter = ("ai_validated",)
    search_fields = ("answer_text",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(AIInsight)
class AIInsightAdmin(admin.ModelAdmin):
    list_display = ("id", "insight_type", "organization", "assessment", "confidence_score", "action_required")
    list_filter = ("insight_type", "action_required")
    search_fields = ("insight_text",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "organization", "priority", "status", "assigned_to", "due_date")
    list_filter = ("priority", "status", "ai_nudged")
    search_fields = ("title", "description")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "organization", "country_code", "operational_status")
    list_filter = ("type", "operational_status", "country_code")
    search_fields = ("name", "description", "region")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("organization__name", "name")


@admin.register(AssessmentReport)
class AssessmentReportAdmin(admin.ModelAdmin):
    list_display = ("title", "assessment", "organization", "status", "report_published_date")
    list_filter = ("status",)
    search_fields = ("title",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(Finding)
class FindingAdmin(admin.ModelAdmin):
    list_display = ("topic", "severity", "status", "assessment", "responsible_party")
    list_filter = ("severity", "status")
    search_fields = ("topic", "summary", "recommended_actions")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-severity", "-created_at")


@admin.register(CIPCycle)
class CIPCycleAdmin(admin.ModelAdmin):
    list_display = ("label", "assessment", "organization", "status", "start_date", "deadline_period_months")
    list_filter = ("status",)
    search_fields = ("label",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(AssessmentPlan)
class AssessmentPlanAdmin(admin.ModelAdmin):
    list_display = ("assessment", "site_assessment_start", "site_assessment_end", "draft_report_deadline")
    search_fields = ("notes",)
    readonly_fields = ("id", "created_at", "updated_at")
