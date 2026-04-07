import { useLoaderData } from "react-router";
import type { Route } from "./+types/index";
import { requireUser } from "~/.server/sessions";
import Dashboard from "~/components/Dashboard";
import type { User } from "~/types";

export async function loader({ request }: { request: Request }) {
  const user = await requireUser(request) as User;
  return { user };
}

export default function IndexRoute() {
  const { user } = useLoaderData<Route.ComponentProps["loaderData"]>();
  return <Dashboard user={user} />;
}

