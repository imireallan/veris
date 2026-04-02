from rest_framework import viewsets
from organizations.views import OrganizationViewSet
from themes.views import ThemeViewSet
from users.views import UserViewSet
from assessments.views import (
    FrameworkViewSet,
    ESGFocusAreaViewSet,
    ExternalRatingViewSet,
    AssessmentViewSet,
    AssessmentResponseViewSet,
    TaskViewSet,
    SiteViewSet,
)
from knowledge.views import KnowledgeDocumentViewSet


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
