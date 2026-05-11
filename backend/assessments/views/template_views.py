"""
ViewSets for Assessment Template Management.

Templates are SUPERADMIN-managed master blueprints that can be:
- Global (is_public=True) or organization-specific (owner_org set)
- Draft (editable) or Published (immutable)
- Instantiated into Assessment instances by ORG_ADMINs
"""

from datetime import timedelta

from django.db import transaction
from django.db.models import Max, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from assessments.models import Assessment, AssessmentQuestion, AssessmentTemplate
from assessments.serializers import (
    AssessmentQuestionSerializer,
    AssessmentTemplateDetailSerializer,
    AssessmentTemplateSerializer,
)
from assessments.services.questionnaires import (
    ensure_assessment_questionnaire_snapshots,
)
from users.permissions import CanManageTemplates


def parse_assessment_datetime(value, fallback=None, end_of_day=False):
    """Accept ISO datetimes or HTML date inputs for direct model creation."""
    if not value:
        return fallback
    if hasattr(value, "tzinfo"):
        return value

    parsed = parse_datetime(str(value))
    if parsed is None:
        parsed_date = parse_date(str(value))
        if parsed_date is None:
            return fallback
        time_value = (
            timezone.datetime.max.time() if end_of_day else timezone.datetime.min.time()
        )
        parsed = timezone.datetime.combine(parsed_date, time_value)

    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed


class AssessmentTemplateViewSet(viewsets.ModelViewSet):
    """
    CRUD for Assessment Templates.

    - SUPERADMIN: Full CRUD + publish/duplicate
    - ORG_ADMIN: Read-only access to public templates + instantiate
    """

    queryset = AssessmentTemplate.objects.all()
    permission_classes = [permissions.IsAuthenticated, CanManageTemplates]

    def get_serializer_class(self):
        if self.action in ["list", "create", "update", "partial_update"]:
            return AssessmentTemplateSerializer
        return AssessmentTemplateDetailSerializer

    def get_queryset(self):
        """
        Filter templates based on active tenant context.
        - SUPERADMIN: all templates
        - Org users: public published templates + org-owned templates (any status)
        """
        user = self.request.user
        organization = getattr(self.request, "organization", None)

        if user.is_superuser:
            return AssessmentTemplate.objects.all().select_related(
                "framework", "owner_org", "created_by", "published_by"
            )

        if not organization:
            return AssessmentTemplate.objects.filter(
                is_public=True,
                status=AssessmentTemplate.Status.PUBLISHED,
            ).select_related("framework", "owner_org")

        # Org users can see:
        # 1. Public published templates
        # 2. Templates owned by their org (any status - including drafts)
        return AssessmentTemplate.objects.filter(
            Q(is_public=True, status=AssessmentTemplate.Status.PUBLISHED)
            | Q(owner_org=organization),
        ).select_related("framework", "owner_org")

    def perform_create(self, serializer):
        """SUPERADMIN creates template."""
        if not self.request.user.is_superuser:
            raise PermissionDenied("Only SUPERADMIN can create templates")

        # Auto-generate slug from name if not provided
        if not serializer.validated_data.get("slug"):
            import re

            name = serializer.validated_data.get("name", "")
            slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
            # Ensure uniqueness
            base_slug = slug
            counter = 1
            while AssessmentTemplate.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            serializer.validated_data["slug"] = slug

        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        """
        Publish a template (makes it immutable).
        POST /api/templates/:id/publish/
        """
        template = self.get_object()

        if template.status == AssessmentTemplate.Status.PUBLISHED:
            return Response(
                {"error": "Template is already published"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not template.assessment_questions.exists():
            return Response(
                {"error": "Cannot publish template without questions"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        template.status = AssessmentTemplate.Status.PUBLISHED
        template.published_at = timezone.now()
        template.published_by = request.user
        template.save()

        return Response(
            {
                "message": "Template published successfully",
                "status": template.status,
                "published_at": template.published_at,
            }
        )

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        """
        Duplicate a template (creates new version).
        POST /api/templates/:id/duplicate/
        Body: {"version": "2.0.0", "version_notes": "..."}
        """
        source = self.get_object()
        data = request.data

        # Create new template
        with transaction.atomic():
            new_template = AssessmentTemplate.objects.create(
                name=f"{source.name} (Copy)",
                slug=f"{source.slug}-v{source.version.replace('.', '-')}-copy",
                description=source.description,
                framework=source.framework,
                version=data.get("version", f"{source.version}.1"),
                version_notes=data.get("version_notes", ""),
                is_public=source.is_public,
                owner_org=source.owner_org,
                status=AssessmentTemplate.Status.DRAFT,  # Start as draft
                created_by=request.user,
            )

            # Copy questions
            for question in source.assessment_questions.all():
                AssessmentQuestion.objects.create(
                    template=new_template,
                    organization=new_template.organization or new_template.owner_org,
                    text=question.text,
                    order=question.order,
                    category=question.category,
                    hierarchy=question.hierarchy,
                    scoring_criteria=question.scoring_criteria,
                    is_required=question.is_required,
                    framework_mappings=question.framework_mappings,
                )

        return Response(
            {
                "message": "Template duplicated successfully",
                "new_template_id": str(new_template.id),
                "new_template_slug": new_template.slug,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def instantiate(self, request, pk=None):
        """
        Create an assessment instance from this template.
        POST /api/templates/:id/instantiate/
        Body: {"organization_id": "uuid", "site_id": "uuid" (optional), ...}

        Available to:
        - SUPERADMIN: For any organization
        - ORG_ADMIN: For their own organization only
        """
        template = self.get_object()

        if template.status != AssessmentTemplate.Status.PUBLISHED:
            return Response(
                {"error": "Can only instantiate published templates"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        org_id = request.data.get("organization_id")
        active_organization = getattr(request, "organization", None)

        if request.user.is_superuser:
            if not org_id:
                return Response(
                    {"error": "organization_id is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            if not active_organization:
                return Response(
                    {"error": "Active organization context is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            org_id = str(active_organization.id)

        # Validate organization access
        from organizations.models import Organization

        org = get_object_or_404(Organization, id=org_id)

        if not request.user.is_superuser and str(org.id) != str(active_organization.id):
            raise PermissionDenied(
                "Cannot instantiate template for other organizations"
            )

        # Create assessment instance
        with transaction.atomic():
            start_date = parse_assessment_datetime(
                request.data.get("start_date"), fallback=timezone.now()
            )
            due_date = parse_assessment_datetime(
                request.data.get("due_date"),
                fallback=start_date + timedelta(days=30),
                end_of_day=True,
            )

            assessment = Assessment.objects.create(
                organization=org,
                template=template,
                template_version=template.version,
                # Name is auto-generated by model's display_name property
                framework=template.framework,
                start_date=start_date,
                due_date=due_date,
                created_by=request.user,
                # Site can be passed optionally
                site_id=request.data.get("site_id"),
            )

            ensure_assessment_questionnaire_snapshots(
                assessment,
                created_by=request.user,
            )

        return Response(
            {
                "message": "Assessment created from template",
                "assessment_id": str(assessment.id),
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"])
    def public(self, request):
        """
        List templates available for assessment instantiation.

        This includes globally public published templates plus published
        templates owned by the active organization. Framework imports create
        private org-owned templates, so using only is_public=True hides them
        from the assessment creation "Start from Template" list.
        """
        organization = getattr(request, "organization", None)
        queryset = AssessmentTemplate.objects.filter(
            status=AssessmentTemplate.Status.PUBLISHED,
        )

        if organization:
            queryset = queryset.filter(Q(is_public=True) | Q(owner_org=organization))
        else:
            queryset = queryset.filter(is_public=True)

        queryset = queryset.select_related("framework", "owner_org")

        serializer = AssessmentTemplateSerializer(queryset, many=True)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        """
        Prevent deletion of templates that have instances.
        """
        if instance.assessments.exists():
            raise ValidationError(
                "Cannot delete template with existing assessment instances. "
                "Archive the template instead."
            )
        instance.delete()


class TemplateQuestionViewSet(viewsets.ModelViewSet):
    """
    CRUD for Template Questions.
    Only users with CanManageTemplates permission can manage questions.
    """

    serializer_class = AssessmentQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        template_id = self.kwargs.get("template_pk")
        return AssessmentQuestion.objects.filter(template_id=template_id).order_by(
            "order"
        )

    def get_permissions(self):
        """
        Use CanManageTemplates for write operations, allow read for all authenticated users.
        """
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), CanManageTemplates()]

    def perform_create(self, serializer):
        template_id = self.kwargs.get("template_pk")
        template = get_object_or_404(AssessmentTemplate, id=template_id)

        if not template.can_edit():
            raise PermissionDenied("Cannot add questions to published template")

        # Auto-increment order
        max_order = (
            template.assessment_questions.aggregate(Max("order"))["order__max"] or 0
        )

        serializer.save(
            template=template,
            organization=template.organization or template.owner_org,
            order=max_order + 1,
        )

    def perform_update(self, serializer):
        if not serializer.instance.template.can_edit():
            raise PermissionDenied("Cannot edit questions on published template")

        serializer.save()

    def perform_destroy(self, instance):
        if not instance.template.can_edit():
            raise PermissionDenied("Cannot delete questions from published template")

        instance.delete()
