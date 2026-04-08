/** API helpers for organizations. */
import { api } from "~/.server/lib/api";

export async function getOrganizations(token: string) {
  return api.get<any[]>("/api/organizations/", token).catch(() => []);
}

export async function getOrganization(id: string, token: string) {
  return api.get<any>(`/api/organizations/${id}/`, token).catch(() => null);
}

export async function getOrganizationAssessments(orgId: string, token: string) {
  return api.get<any[]>(`/api/organizations/${orgId}/assessments/`, token).catch(() => []);
}
