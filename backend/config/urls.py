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
from assessments.views.upload_evidence import upload_evidence_document
from assessments.views.flat_views import (
    FlatAssessmentViewSet,
    FlatFindingViewSet,
    FlatCIPCycleViewSet,
    FlatAssessmentPlanViewSet,
    FlatTaskViewSet,
    FlatAssessmentReportViewSet,
    FlatAssessmentResponseViewSet,
    FlatAssessmentQuestionViewSet,
    FlatSiteViewSet,
)
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

# Flat (non-nested) routes — used by frontend for assessment detail, findings, etc.
router.register(r"api/assessments", FlatAssessmentViewSet, basename="flat-assessment")
router.register(r"api/findings", FlatFindingViewSet, basename="flat-finding")
router.register(r"api/cip-cycles", FlatCIPCycleViewSet, basename="flat-cipcycle")
router.register(r"api/plans", FlatAssessmentPlanViewSet, basename="flat-plan")
router.register(r"api/tasks", FlatTaskViewSet, basename="flat-task")
router.register(r"api/reports", FlatAssessmentReportViewSet, basename="flat-report")
router.register(r"api/responses", FlatAssessmentResponseViewSet, basename="flat-response")
router.register(r"api/questions", FlatAssessmentQuestionViewSet, basename="flat-question")
router.register(r"api/sites", FlatSiteViewSet, basename="flat-site")

# Legacy non-nested routes (kept for backward compatibility)
router.register(r"api/documents", KnowledgeDocumentViewSet, basename="knowledge-document")
router.register(r"api/findings_legacy", FindingViewSet, basename="finding")
router.register(r"api/cip-cycles-legacy", CIPCycleViewSet, basename="cipcycle")
router.register(r"api/plans-legacy", AssessmentPlanViewSet, basename="plan")
router.register(r"api/reports-legacy", AssessmentReportViewSet, basename="report")

urlpatterns = [
    path("api/health/", health_check, name="health-check"),
    path("", include("settings.urls")),
    path("api/", include("users.urls")),
    *router.urls,
    path("admin/", admin.site.urls),
    path("api/upload-image/", upload_image, name="upload-image"),
    path("api/upload-evidence/", upload_evidence_document, name="upload-evidence"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
