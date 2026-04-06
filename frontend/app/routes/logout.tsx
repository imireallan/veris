import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { destroyTokenSession } from "~/.server/sessions";

export async function action({ request }: ActionFunctionArgs) {
  return destroyTokenSession();
}
