import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { destroyTokenSession } from "~/.server/sessions";

export async function action({ request }: Route.ActionArgs) {
  return destroyTokenSession();
}
