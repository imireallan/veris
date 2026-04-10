import datetime

from django.utils import timezone

from assessments.models import Assessment, AssessmentQuestion, AssessmentTemplate
from organizations.models import Organization

org = Organization.objects.first()
template, _ = AssessmentTemplate.objects.get_or_create(
    id=a9a3f745-e59c-414d-9056-3529487235e6,
    defaults={organization: org, name: Testing