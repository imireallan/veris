import {
  useLoaderData,
  NavLink,
} from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser } from "~/.server/sessions";
import Dashboard from "~/components/Dashboard";
import Sidebar from "~/components/Sidebar";
import type { User } from "~/types";

interface NavLinkItem {
  to: string;
  label: string;
  icon: string;
}

type LoaderData = {
  user: User;
  navLinks: NavLinkItem[];
};

export async function loader({ request }: LoaderFunctionArgs): Promise<LoaderData> {
  const user = await requireUser(request) as User;

  return {
    user,
    navLinks: [
      { to: "/", label: "Dashboard", icon: "LayoutDashboard" },
      { to: "/assessments", label: "Assessments", icon: "ClipboardCheck" },
      { to: "/knowledge", label: "Knowledge", icon: "BookOpen" },
      { to: "/knowledge/chat", label: "AI Chat", icon: "MessageSquare" },
      { to: "/settings/theme", label: "Theme", icon: "Paintbrush" },
    ],
  };
}

export function meta({ data }: { data: LoaderData }) {
  return [{ title: data?.user?.fullName ? `${data.user.fullName} — SustainabilityAI` : "Dashboard" }];
}

export default function IndexRoute() {
  const { user, navLinks } = useLoaderData() as LoaderData;
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar navLinks={navLinks} user={user} />
      <main className="flex-1 p-6 overflow-auto">
        <Dashboard user={user} />
      </main>
    </div>
  );
}

