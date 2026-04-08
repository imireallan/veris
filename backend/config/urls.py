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
    AssessmentQuestionViewSet,
)
from knowledge.views import KnowledgeDocumentViewSet
from assessments.views.upload_image import upload_image
from .health import health_check
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r"api/organizations", OrganizationViewSet, basename="organization")
router.register(r"api/users", UserViewSet, basename="user")
router.register(r"api/themes", ThemeViewSet, basename="theme")
router.register(r"api/frameworks", FrameworkViewSet, basename="framework")

# Nested routes with org_pk
router.register(
    r"api/organizations/(?P<org_pk>[^/.]+)/focus-areas",
    ESGFocusAreaViewSet,
    basename="focusarea"
)
router.register(
    r"api/organizations/(?P<org_pk>[^/.]+)/assessments",
    AssessmentViewSet,
    basename="assessment"
)
router.register(
    r"api/organizations/(?P<org_pk>[^/.]+)/assessments/(?P<assessment_pk>[^/.]+)/responses",
    AssessmentResponseViewSet,
    basename="response"
)
router.register(
    r"api/organizations/(?P<org_pk>[^/.]+)/assessments/(?P<assessment_pk>[^/.]+)/questions",
    AssessmentQuestionViewSet,
    basename="assessmentquestion"
)
router.register(
    r"api/organizations/(?P<org_pk>[^/.]+)/tasks",
    TaskViewSet,
    basename="task"
)
router.register(
    r"api/organizations/(?P<org_pk>[^/.]+)/sites",
    SiteViewSet,
    basename="site"
)

# Non-nested routes
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
    path("api/upload-image/", upload_image, name="upload-image"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
