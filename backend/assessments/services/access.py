from assessments.models import Assessment
from organizations.models import OrganizationMembership


class AssessmentAccessService:
    @staticmethod
    def get_user_organization_ids(user):
        if user.is_superuser:
            return None  # means ALL

        return list(
            OrganizationMembership.objects.filter(user=user).values_list(
                "organization_id", flat=True
            )
        )

    @staticmethod
    def get_accessible_assessments(user):
        if user.is_superuser:
            return Assessment.objects.all()

        org_ids = AssessmentAccessService.get_user_organization_ids(user)
        if not org_ids:
            return Assessment.objects.none()

        return Assessment.objects.filter(organization_id__in=org_ids)

    @staticmethod
    def can_access_assessment(user, assessment):
        if user.is_superuser:
            return True

        return OrganizationMembership.objects.filter(
            user=user, organization_id=assessment.organization_id
        ).exists()
