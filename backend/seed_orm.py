from assessments.models import Assessment, AssessmentTemplate, AssessmentQuestion
from organizations.models import Organization
from django.utils import timezone
import datetime

org = Organization.objects.first()
template, _ = AssessmentTemplate.objects.get_or_create(
    id=a9a3f745-e59c-414d-9056-3529487235e6,
    defaults={organization: org, name: Testing