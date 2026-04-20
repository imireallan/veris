import type { User } from "~/types";

export enum UserRole {
  SUPERADMIN = "SUPERADMIN",
  ADMIN = "ADMIN",
  COORDINATOR = "COORDINATOR",
  OPERATOR = "OPERATOR",
  EXECUTIVE = "EXECUTIVE",
  ASSESSOR = "ASSESSOR",
  CONSULTANT = "CONSULTANT",
}

export class RBAC {
  /**
   * Platform-scoped only.
   * Do not use this for tenant membership checks.
   */
  static isPlatformAdmin(user: User | null): boolean {
    return !!user?.isSuperuser;
  }

  /**
   * Returns the active org id from the normalized user object.
   */
  static getActiveOrgId(user: User | null): string | null {
    return user?.orgId ?? null;
  }

  /**
   * Returns the active fallback role from the normalized user object.
   * Useful for display only, not as the primary source of authorization.
   */
  static getActiveRole(user: User | null): string | null {
    if (!user) return null;

    if (user.isSuperuser && !user.orgId) {
      return UserRole.SUPERADMIN;
    }

    return user.fallbackRole ?? user.role ?? null;
  }

  /**
   * Checks whether the user is currently inside an active tenant context.
   */
  static hasActiveOrganization(user: User | null): boolean {
    return !!user?.orgId;
  }

  /**
   * Active-org permission check.
   * This should be the primary authorization mechanism for UI logic.
   */
  static hasPermission(user: User | null, permission: string): boolean {
    if (!user) return false;
    return user.activePermissions?.includes(permission) ?? false;
  }

  /**
   * Platform-level action.
   */
  static canCreateOrganization(user: User | null): boolean {
    return this.isPlatformAdmin(user);
  }

  static isOrgMember(user: User | null, orgId: string): boolean {
    if (!user || !orgId) return false;
    if (this.isPlatformAdmin(user)) return true;
    if (String(user.orgId) === String(orgId)) return true;
    return (
      user.recentOrganizations?.some(
        (organization) => String(organization.id) === String(orgId),
      ) ?? false
    );
  }

  static getOrgRole(user: User | null, orgId: string): string | null {
    if (!user || !orgId) return null;
    if (this.isPlatformAdmin(user)) return UserRole.SUPERADMIN;
    if (String(user.orgId) === String(orgId)) {
      return this.getActiveRole(user);
    }

    const match = user.recentOrganizations?.find(
      (organization) => String(organization.id) === String(orgId),
    );
    return match?.fallback_role ?? match?.role ?? null;
  }

  /**
   * Tenant-level checks below this point.
   * These should rely on activePermissions from /me.
   */

  static canManageOrg(user: User | null, orgId?: string): boolean {
    if (this.isPlatformAdmin(user)) return true;
    if (orgId && String(user?.orgId) !== String(orgId)) return false;
    return this.hasPermission(user, "org:settings");
  }

  static canManageOrgSettings(user: User | null, orgId?: string): boolean {
    if (orgId && !this.isOrgMember(user, orgId)) return false;
    return this.canManageOrg(user);
  }

  static canManageOrgUsers(user: User | null): boolean {
    return (
      this.hasPermission(user, "user:invite") ||
      this.hasPermission(user, "user:remove") ||
      this.hasPermission(user, "role:manage")
    );
  }

  static canManageTemplates(user: User | null, orgId?: string): boolean {
    if (this.isPlatformAdmin(user)) return true;
    if (orgId && String(user?.orgId) !== String(orgId)) return false;
    return (
      this.hasPermission(user, "template:create") ||
      this.hasPermission(user, "template:edit") ||
      this.hasPermission(user, "template:delete")
    );
  }

  static canViewAssessments(user: User | null): boolean {
    return this.hasPermission(user, "assessment:view");
  }

  static canAccessAssessments(user: User | null, orgId?: string): boolean {
    if (this.isPlatformAdmin(user)) return true;
    if (orgId && String(user?.orgId) !== String(orgId)) return false;
    return this.canViewAssessments(user);
  }

  static canCreateAssessments(user: User | null, orgId?: string): boolean {
    if (this.isPlatformAdmin(user)) return true;
    if (orgId && String(user?.orgId) !== String(orgId)) return false;
    return this.hasPermission(user, "assessment:create");
  }

  static canEditAssessment(user: User | null): boolean {
    return this.hasPermission(user, "assessment:edit");
  }

  static canDeleteAssessments(user: User | null): boolean {
    return this.hasPermission(user, "assessment:delete");
  }

  static canApproveAssessments(user: User | null): boolean {
    return this.hasPermission(user, "assessment:approve");
  }

  static canManageFindings(user: User | null): boolean {
    return (
      this.hasPermission(user, "finding:edit") || this.canEditAssessment(user)
    );
  }

  static canDeleteFindings(user: User | null): boolean {
    return this.hasPermission(user, "finding:delete");
  }

  static canManageSites(user: User | null): boolean {
    return (
      this.hasPermission(user, "site:create") ||
      this.hasPermission(user, "site:edit")
    );
  }

  static canDeleteSites(user: User | null): boolean {
    return this.hasPermission(user, "site:delete");
  }

  static canManageTasks(user: User | null): boolean {
    return (
      this.hasPermission(user, "task:create") ||
      this.hasPermission(user, "task:edit")
    );
  }

  static canDeleteTasks(user: User | null): boolean {
    return this.hasPermission(user, "task:delete");
  }

  static canViewReports(user: User | null): boolean {
    return this.hasPermission(user, "report:view");
  }

  static canExportReports(user: User | null): boolean {
    return this.hasPermission(user, "report:export");
  }

  static canUploadEvidence(user: User | null): boolean {
    return this.hasPermission(user, "evidence:upload");
  }

  static canReviewEvidence(user: User | null): boolean {
    return this.hasPermission(user, "evidence:review");
  }

  static canApproveEvidence(user: User | null): boolean {
    return this.hasPermission(user, "evidence:approve");
  }

  /**
   * Display helper only.
   */
  static getRoleLabel(role: UserRole | string | null | undefined): string {
    if (!role) return "Unknown";
    return role.charAt(0) + role.slice(1).toLowerCase().replace("_", " ");
  }

  /**
   * Display/sorting helper only.
   */
  static getRolePriority(role: UserRole | string | null | undefined): number {
    if (!role) return 0;

    const priority: Record<string, number> = {
      SUPERADMIN: 100,
      ADMIN: 80,
      COORDINATOR: 60,
      CONSULTANT: 50,
      EXECUTIVE: 40,
      ASSESSOR: 30,
      OPERATOR: 20,
    };

    return priority[role] || 0;
  }
}
