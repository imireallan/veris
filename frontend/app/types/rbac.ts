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
   * Global platform admin or member of the specific organization.
   */
  static isOrgMember(user: User, orgId: string): boolean {
    return user.role === UserRole.SUPERADMIN || String(user.orgId) === String(orgId);
  }

  /**
   * Can manage organization-level settings and user access.
   */
  static canManageOrg(user: User, orgId: string): boolean {
    return user.role === UserRole.SUPERADMIN || 
           (user.role === UserRole.ADMIN && String(user.orgId) === String(orgId));
  }

  /**
   * Can manage templates and high-level assessment configuration.
   */
  static canManageTemplates(user: User, orgId: string): boolean {
    return this.canManageOrg(user, orgId) || 
           (user.role === UserRole.COORDINATOR && String(user.orgId) === String(orgId));
  }

  /**
   * Can create new assessments for the organization.
   */
  static canCreateAssessments(user: User, orgId: string): boolean {
    return this.canManageTemplates(user, orgId) || 
           (user.role === UserRole.OPERATOR && String(user.orgId) === String(orgId));
  }

  /**
   * Can edit assessment metadata, status, and AI summaries.
   */
  static canEditAssessment(user: User, orgId: string): boolean {
    return user.role === UserRole.SUPERADMIN || 
           user.role === UserRole.ADMIN || 
           (user.role === UserRole.COORDINATOR && String(user.orgId) === String(orgId));
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
    return user.role === UserRole.SUPERADMIN || 
           (user.role === UserRole.ADMIN && String(user.orgId) === String(orgId));
  }
}
