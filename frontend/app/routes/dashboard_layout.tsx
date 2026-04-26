import { Outlet, redirect, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

import { getUserToken, requireUser } from "~/.server/sessions";
import { AppLayout } from "~/components/AppLayout";
import { getAccessibleOrganizations } from "~/.server/organizations";
import { terminologyFromUser } from "~/lib/terminology";
import { RBAC } from "~/types/rbac";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await getUserToken(request);
  if (!token) throw redirect("/login");

  const user = await requireUser(request);
  const organizations = await getAccessibleOrganizations(request, token);

  const terminology = terminologyFromUser(user);
  const navLinks: { to: string; label: string; icon: string }[] = [
    { to: "/app", label: "Dashboard", icon: "LayoutDashboard" },
    { to: "/assessments", label: terminology.plural.assessment, icon: "ClipboardCheck" },
    { to: "/templates", label: `${terminology.assessment} Templates`, icon: "FileText" },
    { to: "/organizations", label: "Organizations", icon: "Building2" },
    { to: "/knowledge", label: "Knowledge", icon: "BookOpen" },
    { to: "/knowledge/chat", label: "AI Chat", icon: "MessageSquare" },
    { to: "/data", label: "Data", icon: "Database" },
  ];

  if (RBAC.canManageOrg(user)) {
    navLinks.push(
      {
        to: "/settings/theme",
        label: "Theme",
        icon: "Paintbrush",
      },
      {
        to: "/settings/terminology",
        label: "Terminology",
        icon: "Languages",
      },
    );
  }

  return {
    navLinks,
    user,
    organizations,
  };
}

export default function DashboardLayoutRoute() {
  const { navLinks, organizations, user } = useLoaderData<typeof loader>();

  return (
    <AppLayout user={user} organizations={organizations} navLinks={navLinks}>
      <Outlet context={{ user }} />
    </AppLayout>
  );
}
