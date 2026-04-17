from rest_framework import viewsets

from assessments.models import Assessment
from assessments.services.access import AssessmentAccessService


class BaseAssessmentScopedViewSet(viewsets.ModelViewSet):
    """
    Reusable filtering by ?assessment=<id>
    """

    def filter_by_assessment(self, queryset):
        assessment_id = self.request.query_params.get("assessment")
        if not assessment_id:
            return queryset.none()

        assessment = Assessment.objects.filter(id=assessment_id).first()
        if not assessment:
            return queryset.none()

        if not AssessmentAccessService.can_access_assessment(
            self.request.user, assessment
        ):
            return queryset.none()

        return queryset.filter(assessment_id=assessment_id)


class BaseOrgScopedViewSet(viewsets.ModelViewSet):
    """
    Reusable org filtering (?org= or nested org_pk)
    """

    def get_org_id(self):
        return (
            self.kwargs.get("org_pk")
            or self.request.query_params.get("org")
            or self.request.query_params.get("organization")
        )
