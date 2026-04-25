from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework.routers import DefaultRouter

from assessments.views import (
    AssessmentPlanViewSet,
    AssessmentQuestionViewSet,
    AssessmentReportViewSet,
    AssessmentResponseViewSet,
    AssessmentViewSet,
    CIPCycleViewSet,
    ESGFocusAreaViewSet,
    FindingViewSet,
    FrameworkViewSet,
    SiteViewSet,
    TaskViewSet,
)
from assessments.views.dashboard import DashboardSummaryView
from assessments.views.flat_views import (
    FlatAssessmentPlanViewSet,
    FlatAssessmentQuestionViewSet,
    FlatAssessmentReportViewSet,
    FlatAssessmentResponseViewSet,
    FlatAssessmentViewSet,
    FlatCIPCycleViewSet,
    FlatFindingViewSet,
    FlatSiteViewSet,
    FlatTaskViewSet,
)
from assessments.views.template_views import (
    AssessmentTemplateViewSet,
    TemplateQuestionViewSet,
)
from assessments.views.upload_evidence import upload_evidence_document
from assessments.views.upload_image import upload_image
from knowledge.views import KnowledgeDocumentViewSet

# App viewsets
from organizations.views import (
    CustomRoleViewSet,
    InvitationAcceptView,
    InvitationViewSet,
    OrganizationCreationConfigViewSet,
    OrganizationMembershipViewSet,
    OrganizationTerminologyView,
    OrganizationViewSet,
)
from themes.views import ThemeViewSet
from users.views import UserViewSet

from .health import health_check

router = DefaultRouter()
router.register(r"api/organizations", OrganizationViewSet, basename="organization")
router.register(r"api/users", UserViewSet, basename="user")
router.register(r"api/themes", ThemeViewSet, basename="theme")
router.register(r"api/frameworks", FrameworkViewSet, basename="framework")
router.register(r"api/templates", AssessmentTemplateViewSet, basename="template")
router.register(
    r"api/templates/(?P<template_pk>[^/.]+)/questions",
    TemplateQuestionViewSet,
    basename="template-question",
)
router.register(
    r"api/creation-config",
    OrganizationCreationConfigViewSet,
    basename="creation-config",
)

# Nested routes with org_pk
router.register(
    r"api/organizations/(?P<org_pk>[^/.]+)/roles",
    CustomRoleViewSet,
    basename="customrole",
)
router.register(
    r"api/organizations/(?P<org_pk>[^/.]+)/members",
    OrganizationMembershipViewSet,
    basename="organizationmembership",
)
router.register(
    r"api/organizations/(?P<org_pk>[^/.]+)/invitations",
    InvitationViewSet,
    basename="invitation",
)
router.register(
    r"api/organizations/(?P<org_pk>[^/.]+)/focus-areas",
    ESGFocusAreaViewSet,
    basename="focusarea",
)
router.register(
    r"api/organizations/(?P<org_pk>[^/.]+)/assessments",
    AssessmentViewSet,
    basename="assessment",
)
router.register(
    r"api/organizations/(?P<org_pk>[^/.]+)/assessments/(?P<assessment_pk>[^/.]+)/responses",
    AssessmentResponseViewSet,
    basename="response",
)
router.register(
    r"api/organizations/(?P<org_pk>[^/.]+)/assessments/(?P<assessment_pk>[^/.]+)/questions",
    AssessmentQuestionViewSet,
    basename="assessmentquestion",
)
router.register(
    r"api/organizations/(?P<org_pk>[^/.]+)/tasks", TaskViewSet, basename="task"
)
router.register(
    r"api/organizations/(?P<org_pk>[^/.]+)/sites", SiteViewSet, basename="site"
)

# Flat (non-nested) routes — used by frontend for assessment detail, findings, etc.
router.register(r"api/assessments", FlatAssessmentViewSet, basename="flat-assessment")
router.register(r"api/findings", FlatFindingViewSet, basename="flat-finding")
router.register(r"api/cip-cycles", FlatCIPCycleViewSet, basename="flat-cipcycle")
router.register(r"api/plans", FlatAssessmentPlanViewSet, basename="flat-plan")
router.register(r"api/tasks", FlatTaskViewSet, basename="flat-task")
router.register(r"api/reports", FlatAssessmentReportViewSet, basename="flat-report")
router.register(
    r"api/responses", FlatAssessmentResponseViewSet, basename="flat-response"
)
router.register(
    r"api/questions", FlatAssessmentQuestionViewSet, basename="flat-question"
)
router.register(r"api/sites", FlatSiteViewSet, basename="flat-site")

# Legacy non-nested routes (kept for backward compatibility)
router.register(
    r"api/documents", KnowledgeDocumentViewSet, basename="knowledge-document"
)
router.register(r"api/findings_legacy", FindingViewSet, basename="finding")
router.register(r"api/cip-cycles-legacy", CIPCycleViewSet, basename="cipcycle")
router.register(r"api/plans-legacy", AssessmentPlanViewSet, basename="plan")
router.register(r"api/reports-legacy", AssessmentReportViewSet, basename="report")

urlpatterns = [
    # schema
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    # Swagger UI
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    # Redoc UI (alternative)
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/health/", health_check, name="health-check"),
    path(
        "api/dashboard/summary/",
        DashboardSummaryView.as_view(),
        name="dashboard-summary",
    ),
    path(
        "api/organizations/<uuid:org_pk>/terminology/",
        OrganizationTerminologyView.as_view(),
        name="organization-terminology",
    ),
    path("", include("settings.urls")),
    path("api/", include("users.urls")),
    *router.urls,
    path("admin/", admin.site.urls),
    path("api/upload-image/", upload_image, name="upload-image"),
    path("api/upload-evidence/", upload_evidence_document, name="upload-evidence"),
    # Invitation acceptance (no auth required)
    path(
        "api/invitations/<str:token>/",
        InvitationAcceptView.as_view(),
        name="invitation-check",
    ),
    path(
        "api/invitations/<str:token>/<str:action>/",
        InvitationAcceptView.as_view(),
        name="invitation-action",
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
