/** API helpers for assessments. */
import { api } from "~/.server/lib/api";

export async function getAssessments(orgId: string, token: string) {
  return api.get<any[]>(`/api/organizations/${orgId}/assessments/`, token).catch(() => []);
}

export async function getAssessment(orgId: string, id: string, token: string) {
  return api.get<any>(`/api/organizations/${orgId}/assessments/${id}/`, token).catch(() => null);
}

export async function createAssessment(orgId: string, data: unknown, token: string) {
  return api.post<any>(`/api/organizations/${orgId}/assessments/`, data, token);
}

export async function getQuestions(orgId: string, token: string) {
  return api.get<any[]>(`/api/organizations/${orgId}/questions/`, token).catch(() => []);
}

export async function getResponses(assessmentId: string, token: string) {
  return api.get<any[]>(`/api/responses/?assessment=${assessmentId}`, token).catch(() => []);
}
