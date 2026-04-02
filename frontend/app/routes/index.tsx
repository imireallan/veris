     1|import {
     2|  Outlet,
     3|  redirect,
     4|  useLoaderData,
     5|  NavLink,
     6|} from "react-router";
     7|import type { Route } from "./+types/index";
     8|import { requireUser } from "~/.server/sessions";
     9|import Dashboard from "~/components/Dashboard";
    10|import Sidebar from "~/components/Sidebar";
    11|import type { User } from "~/types";
    12|
    13|export async function loader({ request }: Route.LoaderArgs) {
    14|  const user = await requireUser(request);
    15|
    16|  return {
    17|    user,
    18|    navLinks: [
    19|      { to: "/", label: "Dashboard", icon: "LayoutDashboard" as const },
    20|      { to: "/assessments", label: "Assessments", icon: "ClipboardCheck" as const },
    21|      { to: "/knowledge", label: "Knowledge", icon: "BookOpen" as const },
    22|      { to: "/knowledge/chat", label: "AI Chat", icon: "MessageSquare" as const },
    23|      { to: "/settings/theme", label: "Theme", icon: "Paintbrush" as const },
    24|    ],
    25|  };
    26|}
    27|
    28|export function meta({ data }: Route.MetaFunction) {
    29|  return [{ title: data?.user?.fullName ? `${data.user.fullName} — SustainabilityAI` : "Dashboard" }];
    30|}
    31|
    32|export default function IndexRoute() {
    33|  const { user, navLinks } = useLoaderData<typeof loader>();
    34|  return (
    35|    <div className="flex min-h-screen bg-background">
    36|      <Sidebar navLinks={navLinks} user={user} />
    37|      <main className="flex-1 p-6 overflow-auto">
    38|        <Dashboard user={user} />
    39|      </main>
    40|    </div>
    41|  );
    42|}
    43|