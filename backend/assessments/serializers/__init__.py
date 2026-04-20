from rest_framework import serializers

from assessments.models import (
    AIInsight,
    Assessment,
    AssessmentPlan,
    AssessmentQuestion,
    AssessmentReport,
    AssessmentResponse,
    AssessmentTemplate,
    CIPCycle,
    ESGFocusArea,
    ExternalRating,
    Finding,
    Framework,
    Site,
    Task,
)


class FrameworkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Framework
        fields = [
            "id",
            "name",
            "version",
            "description",
            "categories",
            "scoring_methodology",
            "reporting_period",
            "last_synced",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ESGFocusAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ESGFocusArea
        fields = [
            "id",
            "organization",
            "name",
            "internal_label",
            "owner",
            "description",
            "current_score",
            "trend",
            "last_assessed",
            "ai_risk_level",
            "framework_mappings",
            "ai_gaps",
            "ai_recommendations",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ExternalRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalRating
        fields = [
            "id",
            "organization",
            "agency",
            "score",
            "score_date",
            "category_scores",
            "rating_grade",
            "trend_vs_previous",
            "ai_analysis",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class AssessmentTemplateSerializer(serializers.ModelSerializer):
    """
    List/create serializer for AssessmentTemplate.
    Includes basic fields for list view.
    """

    question_count = serializers.SerializerMethodField()
    framework_name = serializers.CharField(source="framework.name", read_only=True)
    created_by_name = serializers.CharField(
        source="created_by.full_name", read_only=True
    )

    class Meta:
        model = AssessmentTemplate
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "framework",
            "framework_name",
            "version",
            "status",
            "is_public",
            "organization",
            "owner_org",
            "question_count",
            "version_notes",
            "published_at",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at", "published_at"]

    def get_question_count(self, obj):
        return obj.assessment_questions.count()


class AssessmentTemplateDetailSerializer(serializers.ModelSerializer):
    """
    Detail serializer for AssessmentTemplate.
    Includes nested questions for detail view.
    """

    questions = serializers.SerializerMethodField()
    framework_name = serializers.CharField(source="framework.name", read_only=True)
    created_by_name = serializers.CharField(
        source="created_by.full_name", read_only=True
    )
    published_by_name = serializers.CharField(
        source="published_by.full_name", read_only=True
    )
    instance_count = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentTemplate
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "framework",
            "framework_name",
            "version",
            "version_notes",
            "status",
            "is_public",
            "organization",
            "owner_org",
            "questions",
            "instance_count",
            "published_at",
            "published_by",
            "published_by_name",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at", "published_at"]

    def get_questions(self, obj):
        questions = obj.assessment_questions.all().order_by("order")
        return AssessmentQuestionSerializer(questions, many=True).data

    def get_instance_count(self, obj):
        return obj.assessments.count()


class AssessmentQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentQuestion
        fields = [
            "id",
            "template",
            "organization",
            "text",
            "order",
            "category",
            "scoring_criteria",
            "is_required",
            "framework_mappings",
        ]
        read_only_fields = ["id", "template", "organization", "order"]
        extra_kwargs = {
            "template": {"required": False},
            "organization": {"required": False},
            "order": {"required": False},
        }


class AssessmentSerializer(serializers.ModelSerializer):
    site_name = serializers.CharField(source="site.name", read_only=True)
    framework_name = serializers.CharField(source="framework.name", read_only=True)
    focus_area_name = serializers.CharField(source="focus_area.name", read_only=True)
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Assessment
        fields = [
            "id",
            "organization",
            "site",
            "site_name",
            "template",
            "focus_area",
            "focus_area_name",
            "framework",
            "framework_name",
            "status",
            "start_date",
            "due_date",
            "completed_at",
            "overall_score",
            "risk_level",
            "ai_summary",
            "created_by",
            "assigned_to",
            "created_at",
            "updated_at",
            "display_name",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "display_name"]
        extra_kwargs = {
            "start_date": {"required": False, "allow_null": True},
            "due_date": {"required": False, "allow_null": True},
            "organization": {"required": False},
        }

    def get_display_name(self, obj) -> str:
        """Generate a human-readable name for the assessment."""
        parts = []

        # Add framework name if available
        if obj.framework:
            parts.append(obj.framework.name)

        # Add site name if available
        if obj.site:
            parts.append(obj.site.name)

        # Add focus area if available
        if obj.focus_area:
            parts.append(obj.focus_area.name)

        # If we have meaningful parts, join them
        if parts:
            return " - ".join(parts)

        # Fallback to date-based name
        if obj.created_at:
            return f"Assessment {obj.created_at.strftime('%b %Y')}"

        # Last resort: use ID
        return f"Assessment {str(obj.id)[:8]}"

    def create(self, validated_data):
        """Auto-set organization from request context if not provided."""
        request = self.context.get("request")
        organization = getattr(request, "organization", None) if request else None

        if not validated_data.get("organization") and organization is not None:
            validated_data["organization"] = organization

        return super().create(validated_data)


class AssessmentResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentResponse
        fields = [
            "id",
            "assessment",
            "organization",
            "focus_area",
            "question",
            "answer_text",
            "answer_score",
            "evidence_files",
            "ai_score_suggestion",
            "ai_feedback",
            "ai_validated",
            "validation_status",
            "confidence_score",
            "citations",
            "frameworks_mapped_to",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "created_at", "updated_at"]


class AIInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIInsight
        fields = [
            "id",
            "organization",
            "assessment",
            "response",
            "focus_area",
            "insight_type",
            "insight_text",
            "confidence_score",
            "source_documents",
            "action_required",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            "id",
            "assessment",
            "organization",
            "focus_area",
            "title",
            "description",
            "priority",
            "status",
            "assigned_to",
            "due_date",
            "completed_at",
            "ai_nudged",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = [
            "id",
            "organization",
            "name",
            "type",
            "country_code",
            "region",
            "coordinates",
            "operational_status",
            "risk_profile",
            "industry_data",
            "employee_count",
            "contractor_count",
            "operational_since",
            "estimated_lifetime_years",
            "expansion_plan",
            "certifications",
            "other_certifications",
            "is_in_indigenous_territory",
            "is_in_conflict_zone",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AssessmentReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentReport
        fields = [
            "id",
            "organization",
            "assessment",
            "title",
            "status",
            "executive_summary",
            "methodology",
            "scope",
            "country_context",
            "conclusion",
            "meeting_participants",
            "stakeholder_meetings",
            "limitations",
            "disclaimer",
            "assessment_start_date",
            "assessment_end_date",
            "report_published_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class FindingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Finding
        fields = [
            "id",
            "organization",
            "report",
            "assessment",
            "site",
            "provision",
            "topic",
            "summary",
            "recommended_actions",
            "severity",
            "status",
            "responsible_party",
            "supplier_response",
            "assessor_comments",
            "marked_as_completed",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CIPCycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CIPCycle
        fields = [
            "id",
            "organization",
            "assessment",
            "label",
            "deadline_period_months",
            "start_date",
            "end_date",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AssessmentPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentPlan
        fields = [
            "id",
            "organization",
            "assessment",
            "site_assessment_start",
            "site_assessment_end",
            "draft_report_deadline",
            "final_report_deadline",
            "opening_meeting_date",
            "closing_meeting_date",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
