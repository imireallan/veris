import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("data", "routes/data.tsx"),
  route("settings/theme", "routes/settings/theme.tsx"),
  route("knowledge", "routes/knowledge/index.tsx"),
  route("knowledge/chat", "routes/knowledge/chat.tsx"),
  route("assessments", "routes/assessments/index.tsx"),
] satisfies RouteConfig;
