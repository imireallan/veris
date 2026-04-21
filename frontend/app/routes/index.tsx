import { redirect, useLoaderData, useOutletContext } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

import { api } from "~/.server/lib/api";
import { getUserToken, requireUser } from "~/.server/sessions";
import Dashboard from "~/components/Dashboard";
import type { DashboardSummary, User } from "~/types";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  const token = await getUserToken(request);

  if (!token) {
    throw redirect("/login");
  }

  const summary = await api.get<DashboardSummary>(
    "/api/dashboard/summary/",
    token,
    request,
  );

  return { summary };
}

export default function IndexRoute() {
  const { user } = useOutletContext<{ user: User | null }>();
  const { summary } = useLoaderData<typeof loader>();

  if (!user) {
    return <div className="p-8 text-center">Loading user profile...</div>;
  }

  return <Dashboard user={user} summary={summary} />;
}
