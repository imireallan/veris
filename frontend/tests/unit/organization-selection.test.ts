import { describe, expect, it } from "vitest";

import type { User } from "~/types";
import {
  getResolvedActiveOrganization,
  getResolvedActiveOrganizationId,
} from "~/lib/active-organization";
import {
  getSelectedOrganizationFromList,
  getSelectedOrganizationIdFromCookie,
} from "~/lib/organization-selection";

const organizations = [
  { id: "org-1", name: "Org 1", role: "ADMIN", fallback_role: "ADMIN" },
  { id: "org-2", name: "Org 2", role: "ASSESSOR", fallback_role: "ASSESSOR" },
];

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: "user-1",
  email: "user@example.com",
  fullName: "Test User",
  orgId: "org-1",
  orgName: "Org 1",
  role: "ADMIN",
  fallbackRole: "ADMIN",
  activeOrganization: { id: "org-1", name: "Org 1" },
  activeMembership: {
    role: "ADMIN",
    fallback_role: "ADMIN",
    is_default: true,
    status: "ACTIVE",
  },
  activePermissions: ["assessment:view"],
  organizations,
  recentOrganizations: organizations,
  organizationCount: organizations.length,
  isSuperuser: false,
  isStaff: false,
  ...overrides,
});

describe("organization selection helpers", () => {
  it("uses the preferred org when it is available", () => {
    expect(getSelectedOrganizationFromList(organizations, "org-2")?.name).toBe("Org 2");
  });

  it("falls back to the first org when preferred org is missing", () => {
    expect(getSelectedOrganizationFromList(organizations, "org-999")?.name).toBe("Org 1");
  });

  it("reads selected organization id from cookies", () => {
    const cookieHeader = "foo=bar; veris_selected_organization=org-2; theme=dark";
    expect(getSelectedOrganizationIdFromCookie(cookieHeader)).toBe("org-2");
  });

  it("prefers the active organization over the compatibility orgId field", () => {
    const user = makeUser({
      orgId: "org-1",
      activeOrganization: { id: "org-2", name: "Org 2" },
    });

    expect(getResolvedActiveOrganizationId(user)).toBe("org-2");
    expect(getResolvedActiveOrganization(user, organizations)?.name).toBe("Org 2");
  });
});
