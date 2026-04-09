import {  useOutletContext } from "react-router";
import type { User } from "~/types";
import Dashboard from "~/components/Dashboard";

export async function loader({ request }: { request: Request }) {
  return { hasToken: true };
}

export default function IndexRoute() {
  const context = useOutletContext<any>();
  const user = context?.user;

  if (!user) {
    return <div className="p-8 text-center">Loading user profile...</div>;
  }

  const typedUser: User = {
    id: user.id ?? "",
    email: user.email ?? "",
    fullName: user.fullName ?? user.email ?? "",
    firstName: user.firstName ?? user.email?.split("@")[0] ?? "",
    lastName: "",
    orgId: user.orgId ?? "",
    role: (user.role ?? "VIEWER") as User["role"],
    pictureUrl: user.pictureUrl,
  };

  return <Dashboard user={typedUser} />;
}
