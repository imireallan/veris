import { Outlet, useLoaderData, redirect } from "react-router"
import type { LoaderFunctionArgs } from "react-router"
import { requireUser } from "~/.server/sessions"
import { AppLayout } from "~/components/AppLayout"
import type { User } from "~/types"

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request)
  return {
    user,
    navLinks: [
      { to: "/", label: "Dashboard", icon: "LayoutDashboard" },
      { to: "/assessments", label: "Assessments", icon: "ClipboardCheck" },
      { to: "/organizations", label: "Organizations", icon: "Building2" },
      { to: "/knowledge", label: "Knowledge", icon: "BookOpen" },
      { to: "/knowledge/chat", label: "AI Chat", icon: "MessageSquare" },
      { to: "/data", label: "Data", icon: "Database" },
      { to: "/settings/theme", label: "Theme", icon: "Paintbrush" },
    ],
  }
}

export default function DashboardLayoutRoute() {
  const { user, navLinks } = useLoaderData<typeof loader>()
  
  // Map the requireUser return value to the User interface expected by AppLayout
  const appUser: User = {
    id: user.id ?? "",
    email: user.email ?? "",
    fullName: user.email ?? "",
    firstName: user.email?.split("@")[0] ?? "",
    lastName: "",
    orgId: user.organization_id ?? "",
    role: (user.role ?? "viewer") as "admin" | "manager" | "viewer",
    pictureUrl: undefined,
  }
  
  return (
    <AppLayout user={appUser} navLinks={navLinks}>
      <Outlet />
    </AppLayout>
  )
}