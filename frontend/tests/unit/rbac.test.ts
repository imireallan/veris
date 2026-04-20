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
    activeOrganization: { id: "org-1", name: "Org 1" },
    activeMembership: {
      role: UserRole.ADMIN,
      fallback_role: UserRole.ADMIN,
      is_default: true,
      status: "ACTIVE",
    },
    activePermissions: [
      "org:settings",
      "assessment:view",
      "assessment:create",
      "template:create",
      "template:edit",
    ],
    recentOrganizations: [
      { id: "org-1", name: "Org 1", role: UserRole.ADMIN, fallback_role: UserRole.ADMIN },
      { id: "org-2", name: "Org 2", role: UserRole.ASSESSOR, fallback_role: UserRole.ASSESSOR },
    ],
    organizations: [
      { id: "org-1", name: "Org 1", role: UserRole.ADMIN, fallback_role: UserRole.ADMIN },
      { id: "org-2", name: "Org 2", role: UserRole.ASSESSOR, fallback_role: UserRole.ASSESSOR },
    ],
    organizationCount: 2,
    isSuperuser: false,
    isStaff: false,
    ...overrides,
  };
}

describe("RBAC active-org permissions", () => {
  it("uses activePermissions for tenant authorization", () => {
    const user = makeUser();

    expect(RBAC.canManageOrg(user, "org-1")).toBe(true);
    expect(RBAC.canCreateAssessments(user, "org-1")).toBe(true);
    expect(RBAC.canManageTemplates(user, "org-1")).toBe(true);
    expect(RBAC.canAccessAssessments(user, "org-1")).toBe(true);
  });

  it("denies access when the requested org is not active for non-superusers", () => {
    const user = makeUser();

    expect(RBAC.isOrgMember(user, "org-2")).toBe(true);
    expect(RBAC.canManageOrg(user, "org-2")).toBe(false);
    expect(RBAC.canCreateAssessments(user, "org-2")).toBe(false);
  });

  it("uses active organization context instead of stale compatibility orgId", () => {
    const user = makeUser({
      orgId: "org-1",
      orgName: "Org 1",
      activeOrganization: { id: "org-2", name: "Org 2" },
      activeMembership: {
        role: UserRole.ASSESSOR,
        fallback_role: UserRole.ASSESSOR,
        is_default: false,
        status: "ACTIVE",
      },
      role: UserRole.ASSESSOR,
      fallbackRole: UserRole.ASSESSOR,
      activePermissions: ["assessment:view"],
    });

    expect(RBAC.getActiveOrgId(user)).toBe("org-2");
    expect(RBAC.canAccessAssessments(user, "org-2")).toBe(true);
    expect(RBAC.canCreateAssessments(user, "org-2")).toBe(false);
    expect(RBAC.canAccessAssessments(user, "org-1")).toBe(false);
  });

  it("treats organization creation as a platform-level permission", () => {
    const adminUser = makeUser();
    const superUser = makeUser({
      orgId: null,
      orgName: undefined,
      role: UserRole.SUPERADMIN,
      fallbackRole: UserRole.SUPERADMIN,
      activeOrganization: null,
      activeMembership: null,
      activePermissions: [],
      recentOrganizations: [],
      organizations: [],
      isSuperuser: true,
    });

    expect(RBAC.canCreateOrganization(adminUser)).toBe(false);
    expect(RBAC.canCreateOrganization(superUser)).toBe(true);
  });

  it("allows superusers to access all organizations", () => {
    const user = makeUser({
      orgId: null,
      orgName: undefined,
      role: UserRole.SUPERADMIN,
      fallbackRole: UserRole.SUPERADMIN,
      activeOrganization: null,
      activeMembership: null,
      activePermissions: [],
      recentOrganizations: [],
      organizations: [],
      isSuperuser: true,
    });

    expect(RBAC.isOrgMember(user, "org-999")).toBe(true);
    expect(RBAC.canManageOrg(user, "org-999")).toBe(true);
    expect(RBAC.canManageOrgSettings(user, "org-999")).toBe(true);
  });

  it("falls back to active membership role metadata for display helpers", () => {
    const user = makeUser({
      role: UserRole.COORDINATOR,
      fallbackRole: UserRole.COORDINATOR,
      activeMembership: {
        role: UserRole.COORDINATOR,
        fallback_role: UserRole.COORDINATOR,
        is_default: true,
        status: "ACTIVE",
      },
      activePermissions: ["assessment:view", "assessment:create"],
      recentOrganizations: undefined,
      organizations: undefined,
    });

    expect(RBAC.getOrgRole(user, "org-1")).toBe(UserRole.COORDINATOR);
    expect(RBAC.canManageTemplates(user, "org-1")).toBe(false);
    expect(RBAC.canCreateAssessments(user, "org-1")).toBe(true);
  });
});
