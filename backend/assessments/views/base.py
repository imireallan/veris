from rest_framework import viewsets

from assessments.models import Assessment


class BaseAssessmentScopedViewSet(viewsets.ModelViewSet):
    """Reusable assessment filtering scoped through the active organization context."""

    def filter_by_assessment(self, queryset):
        assessment_id = self.request.query_params.get("assessment")
        if not assessment_id:
            return queryset.none()

        organization = getattr(self.request, "organization", None)
        header_org_id = getattr(self.request, "META", {}).get("HTTP_X_ORGANIZATION_ID")
        query_org_id = self.request.query_params.get("organization") or self.request.query_params.get("org")
        assessment = Assessment.objects.filter(id=assessment_id).first()
        if not assessment:
            return queryset.none()

        if self.request.user.is_superuser:
            return queryset.filter(assessment_id=assessment_id)

        active_org_id = (
            str(organization.id)
            if organization
            else str(header_org_id)
            if header_org_id
            else str(query_org_id)
            if query_org_id
            else None
        )
        if not active_org_id or str(assessment.organization_id) != active_org_id:
            return queryset.none()

        return queryset.filter(assessment_id=assessment_id)


class BaseOrgScopedViewSet(viewsets.ModelViewSet):
    """Reusable org filtering resolved by middleware."""

    def get_org_id(self):
        organization = getattr(self.request, "organization", None)
        if organization:
            return str(organization.id)

        if self.kwargs.get("org_pk"):
            return str(self.kwargs.get("org_pk"))

        if hasattr(self.request, "query_params"):
            return self.request.query_params.get(
                "org"
            ) or self.request.query_params.get("organization")

        return None
