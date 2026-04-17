import {
  Outlet,
  useLoaderData,
  redirect,
  useOutletContext,
} from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getUserToken, requireUser } from "~/.server/sessions";
import { AppLayout } from "~/components/AppLayout";
import type { User, OrganizationMembership } from "~/types";
import { RBAC } from "~/types/rbac";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await getUserToken(request);
  if (!token) throw redirect("/login");

  const user = await requireUser(request);
  const {
    getAccessibleOrganizations,
    getSelectedOrganizationForRequest,
  } = await import("~/.server/organizations");

  const organizations = await getAccessibleOrganizations(request, token);
  const selectedOrg = await getSelectedOrganizationForRequest(request, user, token);

  const navLinks: { to: string; label: string; icon: string }[] = [
    { to: "/", label: "Dashboard", icon: "LayoutDashboard" },
    { to: "/assessments", label: "Assessments", icon: "ClipboardCheck" },
    { to: "/templates", label: "Templates", icon: "FileText" },
    { to: "/organizations", label: "Organizations", icon: "Building2" },
    { to: "/knowledge", label: "Knowledge", icon: "BookOpen" },
    { to: "/knowledge/chat", label: "AI Chat", icon: "MessageSquare" },
    { to: "/data", label: "Data", icon: "Database" },
  ];

  if (selectedOrg && RBAC.canManageOrg(user, selectedOrg.id)) {
    navLinks.push({ to: "/settings/theme", label: "Theme", icon: "Paintbrush" });
  }

  return {
    navLinks,
    user,
    organizations,
    selectedOrg,
  };
}

export default function DashboardLayoutRoute() {
  const { navLinks, organizations } = useLoaderData<typeof loader>();
  const context = useOutletContext<{ user: User | null; organizations?: OrganizationMembership[] }>();
  const user = context?.user;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading user...
      </div>
    );
  }

  return (
    <AppLayout user={user} organizations={organizations} navLinks={navLinks}>
      <Outlet context={{ user, organizations }} />
    </AppLayout>
  );
}
