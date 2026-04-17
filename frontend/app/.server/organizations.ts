import type { OrganizationMembership, User } from "~/types";
import { api } from "~/.server/lib/api";
import { getUserToken } from "~/.server/sessions";
import {
  getSelectedOrganizationFromList,
  getSelectedOrganizationIdFromCookie,
} from "~/lib/organization-selection";

function normalizeOrganizations(result: any): OrganizationMembership[] {
  if (Array.isArray(result)) {
    return result;
  }
  if (Array.isArray(result?.results)) {
    return result.results;
  }
  return [];
}

export async function getAccessibleOrganizations(
  request: Request,
  token?: string | null,
): Promise<OrganizationMembership[]> {
  const authToken = token ?? (await getUserToken(request));
  if (!authToken) return [];

  const response = await api.get<any>("/api/organizations/accessible/", authToken, request);
  return normalizeOrganizations(response);
}

export async function getSelectedOrganizationForRequest(
  request: Request,
  user: User,
  token?: string | null,
): Promise<OrganizationMembership | null> {
  const organizations = await getAccessibleOrganizations(request, token);
  const preferredOrgId =
    getSelectedOrganizationIdFromCookie(request.headers.get("Cookie")) ??
    user.orgId ??
    user.organizations?.[0]?.id ??
    null;

  return getSelectedOrganizationFromList(organizations, preferredOrgId);
}
