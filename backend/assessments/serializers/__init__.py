from rest_framework import serializers
from assessments.models import (
    ESGFocusArea,
    ExternalRating,
    Assessment,
    AssessmentTemplate,
    AssessmentQuestion,
    AssessmentResponse,
    AIInsight,
    Task,
    Site,
    Framework,
)


class FrameworkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Framework
        fields = [
            "id", "name", "version", "description",
            "categories", "scoring_methodology",
            "reporting_period", "last_synced", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ESGFocusAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ESGFocusArea
        fields = [
            "id", "organization", "name", "internal_label", "owner",
            "description", "current_score", "trend", "last_assessed",
            "ai_risk_level", "framework_mappings", "ai_gaps",
            "ai_recommendations", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ExternalRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalRating
        fields = [
            "id", "organization", "agency", "score", "score_date",
            "category_scores", "rating_grade", "trend_vs_previous",
            "ai_analysis", "created_at"
        ]
        read_only_fields = ["id", "created_at"]


class AssessmentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentTemplate
        fields = [
            "id", "organization", "name", "description", "framework",
            "questions", "is_system", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AssessmentQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentQuestion
        fields = [
            "id", "template", "text", "order", "category",
            "scoring_criteria", "is_required"
        ]


class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = [
            "id", "organization", "site", "template", "focus_area",
            "status", "framework", "start_date", "due_date",
            "completed_at", "overall_score", "risk_level", "ai_summary",
            "created_by", "assigned_to", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AssessmentResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentResponse
        fields = [
            "id", "assessment", "focus_area", "question", "answer_text",
            "answer_score", "evidence_files", "ai_score_suggestion",
            "ai_feedback", "ai_validated", "frameworks_mapped_to",
            "created_by", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AIInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIInsight
        fields = [
            "id", "organization", "assessment", "response", "focus_area",
            "insight_type", "insight_text", "confidence_score",
            "source_documents", "action_required", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            "id", "assessment", "organization", "focus_area",
            "title", "description", "priority", "status",
            "assigned_to", "due_date", "completed_at", "ai_nudged",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = [
            "id", "organization", "name", "type", "country_code",
            "region", "coordinates", "operational_status",
            "certifications", "description", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
