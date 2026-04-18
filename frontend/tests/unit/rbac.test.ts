import { describe, expect, it } from "vitest";

import type { User } from "~/types";
import { RBAC, UserRole } from "~/types/rbac";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    email: "user@example.com",
    fullName: "Test User",
    orgId: "org-1",
    orgName: "Org 1",
    role: UserRole.ADMIN,
    fallbackRole: UserRole.ADMIN,
    organizations: [
      { id: "org-1", name: "Org 1", role: UserRole.ADMIN, fallback_role: UserRole.ADMIN },
      { id: "org-2", name: "Org 2", role: UserRole.ASSESSOR, fallback_role: UserRole.ASSESSOR },
    ],
    isSuperuser: false,
    isStaff: false,
    ...overrides,
  };
}

describe("RBAC multi-org permissions", () => {
  it("uses the org-specific role when checking permissions", () => {
    const user = makeUser();

    expect(RBAC.canManageOrg(user, "org-1")).toBe(true);
    expect(RBAC.canManageOrg(user, "org-2")).toBe(false);
    expect(RBAC.canAccessAssessments(user, "org-2")).toBe(true);
  });

  it("gates assessment creation by the selected organization role", () => {
    const user = makeUser();

    expect(RBAC.canCreateAssessments(user, "org-1")).toBe(true);
    expect(RBAC.canCreateAssessments(user, "org-2")).toBe(false);
  });

  it("treats organization creation as a platform-level permission", () => {
    const adminUser = makeUser();
    const superUser = makeUser({
      fallbackRole: UserRole.SUPERADMIN,
      role: UserRole.SUPERADMIN,
      isSuperuser: true,
      organizations: [],
    });

    expect(RBAC.canCreateOrganization(adminUser)).toBe(false);
    expect(RBAC.canCreateOrganization(superUser)).toBe(true);
  });

  it("allows superusers to access all organizations", () => {
    const user = makeUser({
      fallbackRole: UserRole.SUPERADMIN,
      role: UserRole.SUPERADMIN,
      isSuperuser: true,
      organizations: [],
    });

    expect(RBAC.isOrgMember(user, "org-999")).toBe(true);
    expect(RBAC.canManageOrg(user, "org-999")).toBe(true);
    expect(RBAC.canManageOrgSettings(user, "org-999")).toBe(true);
  });

  it("falls back to the primary org role when organizations array is absent", () => {
    const user = makeUser({
      organizations: undefined,
      orgId: "org-1",
      fallbackRole: UserRole.COORDINATOR,
      role: UserRole.COORDINATOR,
    });

    expect(RBAC.getOrgRole(user, "org-1")).toBe(UserRole.COORDINATOR);
    expect(RBAC.canManageTemplates(user, "org-1")).toBe(true);
    expect(RBAC.canManageOrg(user, "org-2")).toBe(false);
  });
});
