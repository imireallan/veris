import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { destroySession } from "~/.server/sessions";

export async function action({ request }: ActionFunctionArgs) {
  return destroySession(request);
}
