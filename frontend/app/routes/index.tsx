import { useOutletContext } from "react-router";
import type { User } from "~/types";
import Dashboard from "~/components/Dashboard";

export default function IndexRoute() {
  const { user } = useOutletContext<{ user: User | null }>();

  if (!user) {
    return <div className="p-8 text-center">Loading user profile...</div>;
  }

  return <Dashboard user={user} />;
}