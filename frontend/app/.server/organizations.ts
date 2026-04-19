import type { OrganizationListItem } from "~/types";
import { api, ApiError } from "~/.server/lib/api";
import { getSelectedOrganizationId, getUserToken } from "~/.server/sessions";

function normalizeOrganizations(result: any): OrganizationListItem[] {
  if (Array.isArray(result)) {
    return result;
  }
  if (Array.isArray(result?.results)) {
    return result.results;
  }
  return [];
}

async function requireAuthToken(
  request: Request,
  token?: string | null,
): Promise<string> {
  const authToken = token ?? (await getUserToken(request));
  if (!authToken) {
    throw new ApiError("Authentication required", 401);
  }
  return authToken;
}

/**
 * Fetch organizations accessible to the current authenticated user.
 * Used for org switchers, dropdowns, and filters.
 */
export async function getAccessibleOrganizations(
  request: Request,
  token?: string | null,
): Promise<OrganizationListItem[]> {
  const authToken = await requireAuthToken(request, token);

  try {
    const response = await api.get<any>(
      "/api/organizations/accessible/",
      authToken,
      request,
    );
    return normalizeOrganizations(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "Unexpected error fetching accessible organizations",
      500,
    );
  }
}

/**
 * Resolve the selected organization from the session-backed active org id.
 * Convenience helper for loaders/UI, not core auth resolution.
 */
export async function getSelectedOrganizationFromAccessibleList(
  request: Request,
  token?: string | null,
): Promise<OrganizationListItem | null> {
  const authToken = await requireAuthToken(request, token);
  const selectedOrganizationId = await getSelectedOrganizationId(request);

  if (!selectedOrganizationId) {
    return null;
  }

  const organizations = await getAccessibleOrganizations(request, authToken);

  return (
    organizations.find(
      (org) => String(org.id) === String(selectedOrganizationId),
    ) ?? null
  );
}

/**
 * Fetch all organizations visible to the current user.
 * SUPERADMIN may receive all organizations depending on backend behavior.
 */
export async function getOrganizations(
  request: Request,
  token?: string | null,
) {
  const authToken = await requireAuthToken(request, token);

  try {
    return await api.get<any[]>("/api/organizations/", authToken, request);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Unexpected error fetching organizations", 500);
  }
}

/**
 * Fetch a single organization by id.
 * Preserves backend 403/404/500 errors for route error boundaries.
 */
export async function getOrganization(
  id: string,
  request: Request,
  token?: string | null,
) {
  const authToken = await requireAuthToken(request, token);

  try {
    return await api.get<any>(`/api/organizations/${id}/`, authToken, request);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Unexpected error fetching organization", 500);
  }
}

/**
 * Fetch assessments for an organization.
 * Preserves backend errors instead of swallowing them.
 */
export async function getOrganizationAssessments(
  orgId: string,
  request: Request,
  token?: string | null,
) {
  const authToken = await requireAuthToken(request, token);

  try {
    return await api.get<any[]>(
      `/api/organizations/${orgId}/assessments/`,
      authToken,
      request,
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "Unexpected error fetching organization assessments",
      500,
    );
  }
}
