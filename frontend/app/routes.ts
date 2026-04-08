import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  // Authenticated routes with sidebar layout
  route("", "routes/dashboard_layout.tsx", [
    index("routes/index.tsx"),
    route("assessments", "routes/assessments.tsx"),
    route("assessments/new", "routes/assessments.new.tsx"),
    route("assessments/:id", "routes/assessments_detail.tsx"),
    route("assessments/:id/questionnaire", "routes/assessments.$id.questionnaire.tsx"),
    route("data", "routes/data.tsx"),
    route("settings/theme", "routes/settings/theme.tsx"),
    route("knowledge", "routes/knowledge/index.tsx"),
    route("knowledge/chat", "routes/knowledge/chat.tsx"),
    // Organization routes
    route("organizations", "routes/organizations.tsx"),
    route("organizations/:orgId", "routes/organizations.$orgId.tsx"),
    route("organizations/:orgId/assessments", "routes/organizations.$orgId_.assessments.tsx"),
  ]),
] satisfies RouteConfig;
