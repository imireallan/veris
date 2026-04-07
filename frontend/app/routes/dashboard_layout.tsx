import { Outlet, useLoaderData, redirect } from "react-router"
import type { LoaderFunctionArgs } from "react-router"
import { requireUser } from "~/.server/sessions"
import { AppLayout } from "~/components/AppLayout"

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request)
  return {
    user,
    navLinks: [
      { to: "/", label: "Dashboard", icon: "LayoutDashboard" },
      { to: "/assessments", label: "Assessments", icon: "ClipboardCheck" },
      { to: "/knowledge", label: "Knowledge", icon: "BookOpen" },
      { to: "/knowledge/chat", label: "AI Chat", icon: "MessageSquare" },
      { to: "/data", label: "Data", icon: "Database" },
      { to: "/settings/theme", label: "Theme", icon: "Paintbrush" },
    ],
  }
}

export default function DashboardLayoutRoute() {
  const { user, navLinks } = useLoaderData<typeof loader>()
  return (
    <AppLayout user={user} navLinks={navLinks}>
      <Outlet />
    </AppLayout>
  )
}
