import { Outlet, useLoaderData, redirect, useOutletContext } from "react-router"
import type { LoaderFunctionArgs } from "react-router"
import { getUserToken } from "~/.server/sessions"
import { AppLayout } from "~/components/AppLayout"
import type { User } from "~/types"

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
  const { navLinks } = useLoaderData<typeof loader>()
    const context = useOutletContext<any>();
  const user = context?.user;
  
  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading user...</div>
  }

  // Map the user return value to the User interface expected by AppLayout
  const appUser: User = {
    id: user.id ?? "",
    email: user.email ?? "",
    fullName: user.fullName ?? user.email ?? "",
    firstName: user.firstName ?? user.email?.split("@")[0] ?? "",
    lastName: "",
    orgId: user.organization_id ?? user.orgId ?? "",
    role: (user.role ?? "viewer") as "admin" | "manager" | "viewer",
    pictureUrl: user.picture_url ?? user.pictureUrl,
  }

  console.log("Rendering DashboardLayout with user:", appUser)
  
  return (
    <AppLayout user={appUser} navLinks={navLinks}>
      <Outlet />
    </AppLayout>
  )
}
