from django.db import transaction
from rest_framework import serializers

from assessments.models import (
    AIInsight,
    Assessment,
    AssessmentActionInstance,
    AssessmentPlan,
    AssessmentQuestion,
    AssessmentReport,
    AssessmentResponse,
    AssessmentTemplate,
    AssessmentWorkflowInstance,
    CIPCycle,
    ESGFocusArea,
    ExternalRating,
    Finding,
    Framework,
    FrameworkImportJob,
    Site,
    Task,
    WorkflowAction,
    WorkflowStep,
    WorkflowTemplate,
)
from assessments.services.workflows import user_can_complete_action_instance


class FrameworkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Framework
        fields = [
            "id",
            "name",
            "slug",
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
            "assessment",
            "source_template_question",
            "organization",
            "text",
            "order",
            "category",
            "scoring_criteria",
            "is_required",
            "performance_target_level",
            "external_question_id",
            "framework_mappings",
        ]
        read_only_fields = [
            "id",
            "template",
            "assessment",
            "source_template_question",
            "organization",
            "order",
        ]
        extra_kwargs = {
            "template": {"required": False},
            "assessment": {"required": False},
            "source_template_question": {"required": False},
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
            "template_version",
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
            "operator_answer",
            "operator_score",
            "operator_submitted",
            "operator_submitted_at",
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
        extra_kwargs = {
            "assessment": {"required": False},
        }


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


class WorkflowActionSerializer(serializers.ModelSerializer):
    step = serializers.PrimaryKeyRelatedField(read_only=True)
    step_code = serializers.CharField(source="step.code", read_only=True)
    step_title = serializers.CharField(source="step.title", read_only=True)

    class Meta:
        model = WorkflowAction
        fields = [
            "id",
            "step",
            "step_code",
            "step_title",
            "code",
            "title",
            "description",
            "order",
            "assigned_roles",
            "submit_roles",
            "required_evidence",
            "prerequisite_codes",
            "due_offset_days",
        ]
        read_only_fields = ["id", "step"]


class WorkflowStepSerializer(serializers.ModelSerializer):
    template = serializers.PrimaryKeyRelatedField(read_only=True)
    actions = WorkflowActionSerializer(many=True, required=False)

    class Meta:
        model = WorkflowStep
        fields = [
            "id",
            "template",
            "code",
            "title",
            "description",
            "order",
            "actions",
        ]
        read_only_fields = ["id", "template"]


class WorkflowTemplateSerializer(serializers.ModelSerializer):
    steps = WorkflowStepSerializer(many=True, required=False)

    class Meta:
        model = WorkflowTemplate
        fields = [
            "id",
            "name",
            "slug",
            "framework_slug",
            "description",
            "role_mapping",
            "is_active",
            "steps",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    @transaction.atomic
    def create(self, validated_data):
        steps_data = validated_data.pop("steps", [])
        template = WorkflowTemplate.objects.create(**validated_data)
        self._replace_steps(template, steps_data)
        return template

    @transaction.atomic
    def update(self, instance, validated_data):
        steps_data = validated_data.pop("steps", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if steps_data is not None:
            self._replace_steps(instance, steps_data)
        return instance

    def _replace_steps(self, template, steps_data):
        template.steps.all().delete()
        for step_order, step_data in enumerate(steps_data, start=1):
            actions_data = step_data.pop("actions", [])
            step = WorkflowStep.objects.create(
                template=template,
                order=step_data.get("order") or step_order,
                code=step_data["code"],
                title=step_data["title"],
                description=step_data.get("description", ""),
            )
            for action_order, action_data in enumerate(actions_data, start=1):
                WorkflowAction.objects.create(
                    step=step,
                    order=action_data.get("order") or action_order,
                    code=action_data["code"],
                    title=action_data["title"],
                    description=action_data.get("description", ""),
                    assigned_roles=action_data.get("assigned_roles", []),
                    submit_roles=action_data.get(
                        "submit_roles", action_data.get("assigned_roles", [])
                    ),
                    required_evidence=action_data.get("required_evidence", []),
                    prerequisite_codes=action_data.get("prerequisite_codes", []),
                    due_offset_days=action_data.get("due_offset_days"),
                )


class AssessmentActionInstanceSerializer(serializers.ModelSerializer):
    action_code = serializers.CharField(source="action.code", read_only=True)
    title = serializers.CharField(source="action.title", read_only=True)
    description = serializers.CharField(source="action.description", read_only=True)
    order = serializers.IntegerField(source="action.order", read_only=True)
    step_code = serializers.CharField(source="action.step.code", read_only=True)
    step_title = serializers.CharField(source="action.step.title", read_only=True)
    assigned_roles = serializers.JSONField(
        source="action.assigned_roles", read_only=True
    )
    submit_roles = serializers.JSONField(source="action.submit_roles", read_only=True)
    required_evidence = serializers.JSONField(
        source="action.required_evidence", read_only=True
    )
    prerequisite_codes = serializers.JSONField(
        source="action.prerequisite_codes", read_only=True
    )
    completed_by_name = serializers.CharField(
        source="completed_by.full_name", read_only=True
    )
    can_complete = serializers.SerializerMethodField()

    def get_can_complete(self, obj):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return user_can_complete_action_instance(request.user, obj)

    class Meta:
        model = AssessmentActionInstance
        fields = [
            "id",
            "workflow",
            "assessment",
            "organization",
            "action",
            "action_code",
            "step_code",
            "step_title",
            "title",
            "description",
            "order",
            "status",
            "assigned_roles",
            "submit_roles",
            "required_evidence",
            "prerequisite_codes",
            "notes",
            "completed_by",
            "completed_by_name",
            "can_complete",
            "completed_at",
            "due_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workflow",
            "assessment",
            "organization",
            "action",
            "created_at",
            "updated_at",
        ]


class AssessmentWorkflowInstanceSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source="template.name", read_only=True)
    template_slug = serializers.CharField(source="template.slug", read_only=True)
    actions = serializers.SerializerMethodField()
    steps = serializers.SerializerMethodField()
    completed_actions = serializers.SerializerMethodField()
    total_actions = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentWorkflowInstance
        fields = [
            "id",
            "assessment",
            "organization",
            "template",
            "template_name",
            "template_slug",
            "status",
            "current_step_code",
            "started_at",
            "completed_at",
            "total_actions",
            "completed_actions",
            "progress_percent",
            "steps",
            "actions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_actions(self, obj):
        instances = obj.action_instances.select_related(
            "action", "action__step", "completed_by"
        ).order_by("action__step__order", "action__order")
        return AssessmentActionInstanceSerializer(
            instances, many=True, context=self.context
        ).data

    def get_steps(self, obj):
        action_instances = list(
            obj.action_instances.select_related("action", "action__step").order_by(
                "action__step__order", "action__order"
            )
        )
        grouped = {}
        for instance in action_instances:
            step = instance.action.step
            step_data = grouped.setdefault(
                step.code,
                {
                    "id": str(step.id),
                    "code": step.code,
                    "title": step.title,
                    "description": step.description,
                    "order": step.order,
                    "actions": [],
                },
            )
            step_data["actions"].append(
                AssessmentActionInstanceSerializer(instance, context=self.context).data
            )
        return list(grouped.values())

    def get_total_actions(self, obj):
        return obj.action_instances.count()

    def get_completed_actions(self, obj):
        return obj.action_instances.filter(status="COMPLETED").count()

    def get_progress_percent(self, obj):
        total = self.get_total_actions(obj)
        if total == 0:
            return 0
        return round((self.get_completed_actions(obj) / total) * 100)


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
        read_only_fields = ["id", "organization", "created_at", "updated_at"]


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
            "due_date",
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


class FrameworkImportJobSerializer(serializers.ModelSerializer):
    """Serializer for framework import job status."""

    class Meta:
        model = FrameworkImportJob
        fields = [
            "id",
            "original_filename",
            "framework_name",
            "framework_version",
            "framework_description",
            "create_template",
            "status",
            "progress_percentage",
            "current_step",
            "total_items",
            "processed_items",
            "framework_id",
            "template_id",
            "questions_created",
            "error_message",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "progress_percentage",
            "current_step",
            "total_items",
            "processed_items",
            "framework_id",
            "template_id",
            "questions_created",
            "error_message",
            "created_at",
            "updated_at",
        ]


class FrameworkImportPreviewSerializer(serializers.Serializer):
    """Serializer for framework file preview response."""

    framework_name = serializers.CharField()
    framework_version = serializers.CharField(required=False, default="1.0.0")
    framework_description = serializers.CharField(required=False, default="")
    create_template = serializers.BooleanField(default=True)

    # Preview data
    detected_structure = serializers.JSONField()
    total_principles = serializers.IntegerField()
    total_categories = serializers.IntegerField()
    total_provisions = serializers.IntegerField()

    # File path for submit step (opaque token, not exposed to users)
    temp_file_path = serializers.CharField(required=False, default="")

    # Validation
    is_valid = serializers.BooleanField()
    validation_errors = serializers.JSONField(default=list)
