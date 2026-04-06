from django.urls import path, include
from django.contrib import admin
from rest_framework.routers import DefaultRouter

# App viewsets
from organizations.views import OrganizationViewSet
from users.views import UserViewSet
from themes.views import ThemeViewSet
from assessments.views import (
    FrameworkViewSet,
    ESGFocusAreaViewSet,
    AssessmentViewSet,
    AssessmentResponseViewSet,
    TaskViewSet,
    SiteViewSet,
    AssessmentReportViewSet,
    FindingViewSet,
    CIPCycleViewSet,
    AssessmentPlanViewSet,
)
from knowledge.views import KnowledgeDocumentViewSet
from .health import health_check

router = DefaultRouter()
router.register(r"api/organizations", OrganizationViewSet, basename="organization")
router.register(r"api/users", UserViewSet, basename="user")
router.register(r"api/themes", ThemeViewSet, basename="theme")
router.register(r"api/focus-areas", ESGFocusAreaViewSet, basename="focusarea")
router.register(r"api/frameworks", FrameworkViewSet, basename="framework")
router.register(r"api/assessments", AssessmentViewSet, basename="assessment")
router.register(r"api/responses", AssessmentResponseViewSet, basename="response")
router.register(r"api/tasks", TaskViewSet, basename="task")
router.register(r"api/sites", SiteViewSet, basename="site")
router.register(r"api/documents", KnowledgeDocumentViewSet, basename="knowledge-document")
router.register(r"api/reports", AssessmentReportViewSet, basename="report")
router.register(r"api/findings", FindingViewSet, basename="finding")
router.register(r"api/cip-cycles", CIPCycleViewSet, basename="cipcycle")
router.register(r"api/plans", AssessmentPlanViewSet, basename="plan")

urlpatterns = [
    path("api/health/", health_check, name="health-check"),
    path("", include("settings.urls")),
    path("api/", include("users.urls")),
    *router.urls,
    path("admin/", admin.site.urls),
]
