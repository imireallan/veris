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
  static getOrgMembership(user: User, orgId: string) {
    if (!orgId) return null;

    return user.organizations?.find((org) => String(org.id) === String(orgId)) ?? null;
  }

  static getOrgRole(user: User, orgId: string): string | null {
    if (user.fallbackRole === UserRole.SUPERADMIN || user.isSuperuser) {
      return UserRole.SUPERADMIN;
    }

    const membership = RBAC.getOrgMembership(user, orgId);
    if (membership) {
      return membership.fallback_role ?? membership.role ?? null;
    }

    if (String(user.orgId) === String(orgId)) {
      return user.fallbackRole ?? user.role ?? null;
    }

    return null;
  }

  /**
   * Global platform admin or member of the specific organization.
   */
  static isOrgMember(user: User, orgId: string): boolean {
    if (user.fallbackRole === UserRole.SUPERADMIN || user.isSuperuser) return true;

    if (String(user.orgId) === String(orgId)) return true;

    return Boolean(RBAC.getOrgMembership(user, orgId));
  }

  /**
   * Can manage organization-level settings and user access.
   * Note: Full org settings (name, slug, status, subscription) require SUPERADMIN.
   * Org ADMIN can manage members and invitations only.
   */
  static canManageOrg(user: User, orgId: string): boolean {
    const role = RBAC.getOrgRole(user, orgId);
    return role === UserRole.SUPERADMIN || role === UserRole.ADMIN || role === "OWNER";
  }

  /**
   * Can manage org settings (name, slug, status, subscription tier) - SUPERADMIN only.
   */
  static canManageOrgSettings(user: User, orgId: string): boolean {
    return RBAC.getOrgRole(user, orgId) === UserRole.SUPERADMIN;
  }

  /**
   * Can manage templates and high-level assessment configuration.
   * SUPERADMIN can manage any org's templates.
   * ADMIN, COORDINATOR can manage their org's templates.
   */
  static canManageTemplates(user: User, orgId: string): boolean {
    if (!orgId) {
      return user.fallbackRole === UserRole.SUPERADMIN || user.isSuperuser === true;
    }

    const role = RBAC.getOrgRole(user, orgId);
    return role === UserRole.SUPERADMIN || role === UserRole.ADMIN || role === "OWNER" || role === UserRole.COORDINATOR;
  }

  /**
   * Can create new assessments for the organization.
   */
  static canCreateAssessments(user: User, orgId: string): boolean {
    const role = RBAC.getOrgRole(user, orgId);
    return role === UserRole.SUPERADMIN || role === UserRole.ADMIN || role === "OWNER" || role === UserRole.COORDINATOR || role === UserRole.OPERATOR;
  }

  /**
   * Can user VIEW assessments (read-only access).
   * OPERATOR, ASSESSOR, CONSULTANT, EXECUTIVE can view but not create.
   */
  static canAccessAssessments(user: User, orgId: string): boolean {
    return RBAC.getOrgRole(user, orgId) !== null;
  }

  /**
   * Can edit assessment metadata, status, and AI summaries.
   */
  static canEditAssessment(user: User, orgId: string): boolean {
    const role = RBAC.getOrgRole(user, orgId);
    return role === UserRole.SUPERADMIN || role === UserRole.ADMIN || role === UserRole.COORDINATOR;
  }

  /**
   * Can create and edit findings.
   */
  static canManageFindings(user: User, orgId: string): boolean {
    return this.canEditAssessment(user, orgId);
  }

  /**
   * Can delete findings (High privilege).
   */
  static canDeleteFindings(user: User, orgId: string): boolean {
    const role = RBAC.getOrgRole(user, orgId);
    return role === UserRole.SUPERADMIN || role === UserRole.ADMIN;
  }

  /**
   * Can manage sites (create, edit).
   * OPERATOR can create/edit but not delete.
   */
  static canManageSites(user: User, orgId: string): boolean {
    const role = RBAC.getOrgRole(user, orgId);
    return role === UserRole.SUPERADMIN || role === UserRole.ADMIN || role === UserRole.COORDINATOR || role === UserRole.OPERATOR;
  }

  /**
   * Can delete sites (ADMIN, COORDINATOR only).
   */
  static canDeleteSites(user: User, orgId: string): boolean {
    const role = RBAC.getOrgRole(user, orgId);
    return role === UserRole.SUPERADMIN || role === UserRole.ADMIN || role === UserRole.COORDINATOR;
  }

  /**
   * Can manage tasks (create, update).
   * OPERATOR can create/update but not delete.
   */
  static canManageTasks(user: User, orgId: string): boolean {
    const role = RBAC.getOrgRole(user, orgId);
    return role === UserRole.SUPERADMIN || role === UserRole.ADMIN || role === UserRole.COORDINATOR || role === UserRole.OPERATOR;
  }

  /**
   * Can delete tasks (ADMIN, COORDINATOR only).
   */
  static canDeleteTasks(user: User, orgId: string): boolean {
    const role = RBAC.getOrgRole(user, orgId);
    return role === UserRole.SUPERADMIN || role === UserRole.ADMIN || role === UserRole.COORDINATOR;
  }

  /**
   * Can delete assessments (ADMIN, COORDINATOR only).
   */
  static canDeleteAssessments(user: User, orgId: string): boolean {
    const role = RBAC.getOrgRole(user, orgId);
    return role === UserRole.SUPERADMIN || role === UserRole.ADMIN || role === UserRole.COORDINATOR;
  }

  /**
   * Can delete templates (ADMIN, COORDINATOR only).
   */
  static canDeleteTemplates(user: User, orgId: string): boolean {
    const role = RBAC.getOrgRole(user, orgId);
    return role === UserRole.SUPERADMIN || role === UserRole.ADMIN || role === UserRole.COORDINATOR;
  }

  /**
   * Can user create new organizations?
   */
  static canCreateOrganization(user: User): boolean {
    if (user.fallbackRole === "SUPERADMIN") return true;
    if (user.fallbackRole === "ADMIN") return true;
    return user.isSuperuser === true;
  }

  /**
   * Check if user has access to a specific organization.
   */
  static hasOrgAccess(user: User, orgId: string): boolean {
    return RBAC.isOrgMember(user, orgId);
  }

  /**
   * Get display-friendly role label.
   */
  static getRoleLabel(role: UserRole | string): string {
    return role.charAt(0) + role.slice(1).toLowerCase().replace("_", " ");
  }

  /**
   * Get role priority for sorting (higher = more permissions).
   */
  static getRolePriority(role: UserRole | string): number {
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
