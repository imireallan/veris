import { useLoaderData } from "react-router";
import { requireUser } from "~/.server/sessions";
import type { User } from "~/types";
import Dashboard from "~/components/Dashboard";

export async function loader({ request }: { request: Request }) {
  const user = await requireUser(request);
  return { user };
}

export default function IndexRoute() {
  const { user } = useLoaderData<typeof loader>();
  const typedUser = {
    ...user,
    fullName: user.email ?? "",
    orgId: user.organization_id ?? "",
    id: user.id ?? "",
    email: user.email ?? "",
    role: user.role ?? "",
    organization_id: user.organization_id ?? "",
  };
  return <Dashboard user={typedUser as User} />;
}

