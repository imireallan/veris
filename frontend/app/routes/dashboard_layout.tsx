import {
  Outlet,
  useLoaderData,
  redirect,
  useOutletContext,
} from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getUserToken } from "~/.server/sessions";
import { AppLayout } from "~/components/AppLayout";
import type { User } from "~/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await getUserToken(request);
  if (!token) throw redirect("/login");

  return {
    navLinks: [
      { to: "/", label: "Dashboard", icon: "LayoutDashboard" },
      { to: "/assessments", label: "Assessments", icon: "ClipboardCheck" },
      { to: "/organizations", label: "Organizations", icon: "Building2" },
      { to: "/knowledge", label: "Knowledge", icon: "BookOpen" },
      { to: "/knowledge/chat", label: "AI Chat", icon: "MessageSquare" },
      { to: "/data", label: "Data", icon: "Database" },
      { to: "/settings/theme", label: "Theme", icon: "Paintbrush" },
    ],
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
