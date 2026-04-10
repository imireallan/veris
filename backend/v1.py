from rest_framework import viewsets

from assessments.views import (
    AssessmentResponseViewSet,
    AssessmentViewSet,
    ESGFocusAreaViewSet,
    ExternalRatingViewSet,
    FrameworkViewSet,
    SiteViewSet,
    TaskViewSet,
)
from knowledge.views import KnowledgeDocumentViewSet
from organizations.views import OrganizationViewSet
from themes.views import ThemeViewSet
from users.views import UserViewSet

# Export all ViewSets for use in urls.py
__all__ = [
    "OrganizationViewSet",
    "ThemeViewSet",
    "UserViewSet",
    "FrameworkViewSet",
    "ESGFocusAreaViewSet",
    "ExternalRatingViewSet",
    "AssessmentViewSet",
    "AssessmentResponseViewSet",
    "TaskViewSet",
    "SiteViewSet",
    "KnowledgeDocumentViewSet",
]
