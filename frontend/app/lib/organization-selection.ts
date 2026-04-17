import type { OrganizationMembership } from "~/types";

export const ORG_STORAGE_KEY = "veris:selected-organization";
export const ORG_COOKIE_KEY = "veris_selected_organization";

export function getStoredOrganizationId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ORG_STORAGE_KEY);
}

export function persistSelectedOrganizationId(orgId: string): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(ORG_STORAGE_KEY, orgId);
  document.cookie = `${ORG_COOKIE_KEY}=${encodeURIComponent(orgId)}; path=/; max-age=31536000; samesite=lax`;
}

export function getSelectedOrganizationIdFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [rawKey, ...rest] = cookie.trim().split("=");
    if (rawKey === ORG_COOKIE_KEY) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

export function getSelectedOrganizationFromList(
  organizations: OrganizationMembership[],
  preferredOrgId?: string | null,
): OrganizationMembership | null {
  if (!organizations.length) return null;

  if (preferredOrgId) {
    const selected = organizations.find((org) => String(org.id) === String(preferredOrgId));
    if (selected) return selected;
  }

  return organizations[0] ?? null;
}
