import {
  Outlet,
  useLoaderData,
  redirect,
  useOutletContext,
} from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getUserToken, requireUser } from "~/.server/sessions";
import { AppLayout } from "~/components/AppLayout";
import type { User } from "~/types";
import { RBAC } from "~/types/rbac";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await getUserToken(request);
  if (!token) throw redirect("/login");

  const user = await requireUser(request);

  // Build nav links dynamically based on user permissions
  const navLinks: { to: string; label: string; icon: string }[] = [
    { to: "/", label: "Dashboard", icon: "LayoutDashboard" },
    { to: "/assessments", label: "Assessments", icon: "ClipboardCheck" },
    { to: "/organizations", label: "Organizations", icon: "Building2" },
    { to: "/knowledge", label: "Knowledge", icon: "BookOpen" },
    { to: "/knowledge/chat", label: "AI Chat", icon: "MessageSquare" },
    { to: "/data", label: "Data", icon: "Database" },
  ];

  // Only show Theme settings to users who can manage org (ADMIN or SUPERADMIN)
  if (user.orgId && RBAC.canManageOrg(user, user.orgId)) {
    navLinks.push({ to: "/settings/theme", label: "Theme", icon: "Paintbrush" });
  }

  return {
    navLinks,
    user,
  };
}

export default function DashboardLayoutRoute() {
  const { navLinks } = useLoaderData<typeof loader>();
  const context = useOutletContext<{ user: User | null }>();
  const user = context?.user;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading user...
      </div>
    );
  }

  return (
    <AppLayout user={user} navLinks={navLinks}>
      <Outlet context={{ user }} />
    </AppLayout>
  );
}
