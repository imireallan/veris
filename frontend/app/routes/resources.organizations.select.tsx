import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";

import {
  getUserToken,
  requireUser,
  setSelectedOrganizationId,
} from "~/.server/sessions";
import { getAccessibleOrganizations } from "~/.server/organizations";

export async function action({ request }: ActionFunctionArgs) {
  await requireUser(request);
  const token = await getUserToken(request);
  const formData = await request.formData();
  const organizationId = formData.get("organizationId");
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  if (!organizationId || typeof organizationId !== "string") {
    return redirect(redirectTo);
  }

  const organizations = await getAccessibleOrganizations(request, token);
  const hasAccess = organizations.some(
    (organization) => String(organization.id) === String(organizationId),
  );

  if (!hasAccess) {
    return redirect(redirectTo);
  }

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await setSelectedOrganizationId(request, organizationId),
    },
  });
}
