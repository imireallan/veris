import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/landing.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("demo/veris-workflow", "routes/demo.veris-workflow.tsx"),
  // Authenticated routes with sidebar layout
  route("", "routes/dashboard_layout.tsx", [
    route("app", "routes/index.tsx"),
    route("assessments", "routes/assessments.tsx"),
    route("assessments/new", "routes/assessments.new.tsx"),
    route("assessments/:id", "routes/assessments_detail.tsx"),
    route("assessments/:id/questionnaire", "routes/assessments.$id.questionnaire.tsx"),
    route("templates", "routes/templates.tsx"),
    route("templates/new", "routes/templates.new.tsx"),
    route("templates/:id", "routes/templates.$id.tsx"),
    route("data", "routes/data.tsx"),
    route("settings/theme", "routes/settings/theme.tsx"),
    route("settings/terminology", "routes/settings/terminology.tsx"),
    route("settings/profile", "routes/settings.profile.tsx"),
    route("knowledge", "routes/knowledge/index.tsx"),
    route("knowledge/chat", "routes/knowledge/chat.tsx"),
    // Organization routes
    route("organizations", "routes/organizations.tsx"),
    route("organizations/new", "routes/organizations.new.tsx"),
    route("organizations/:orgId", "routes/organizations.$orgId.tsx"),
    route("organizations/:orgId/assessments", "routes/organizations.$orgId_.assessments.tsx"),
    route("organizations/:orgId/templates", "routes/organizations.$orgId.templates.tsx"),
    route("organizations/:orgId/templates/:templateId", "routes/organizations.$orgId.templates.$templateId.tsx"),
    route("organizations/:orgId/frameworks/import", "routes/organizations.$orgId.frameworks.import.tsx"),
    route("organizations/:orgId/frameworks/import/:jobId", "routes/organizations.$orgId.frameworks.import.$jobId.tsx"),
    route("organizations/:orgId/members", "routes/organizations.$orgId.members.tsx"),
    route("organizations/:orgId/settings", "routes/organizations.$orgId.settings.tsx"),
  ]),
  route(
    "resources/organizations/select",
    "routes/resources.organizations.select.tsx",
  ),
  // Resource routes (outside layout - no auth required)
  route("resources/reports/:id/pdf", "routes/resources.reports.$id.pdf.tsx"),
  // Public routes (no auth/layout required)
  route("invitations/:token", "routes/invitations.$token.tsx"),
  route("onboarding/set-password/:token", "routes/onboarding.set-password.$token.tsx"),
  route("reset-password", "routes/reset-password.request.tsx"),
  route("reset-password/:uid/:token", "routes/reset-password.$uid.$token.tsx"),
] satisfies RouteConfig;
