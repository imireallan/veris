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
    if (user.fallbackRole === "SUPERADMIN") return true;
    
    // Check if this is the user's primary org
    if (String(user.orgId) === String(orgId)) return true;
    
    // For multi-org users, check the organizations array
    if (user.organizations) {
      return user.organizations.some((org) => org.id === orgId);
    }
    
    return false;
  }

  /**
   * Can manage organization-level settings and user access.
   * Note: Full org settings (name, slug, status, subscription) require SUPERADMIN.
   * Org ADMIN can manage members and invitations only.
   */
  static canManageOrg(user: User, orgId: string): boolean {
    if (user.fallbackRole === "SUPERADMIN") return true;
    
    // Check if user belongs to this org
    if (String(user.orgId) !== String(orgId)) return false;
    
    // Use fallback_role for durable permission checks
    // Custom role names are display-only; fallback_role is the stable enum
    return user.fallbackRole === "ADMIN" || user.fallbackRole === "OWNER";
  }

  /**
   * Can manage org settings (name, slug, status, subscription tier) - SUPERADMIN only.
   */
  static canManageOrgSettings(user: User, orgId: string): boolean {
    if (user.fallbackRole === "SUPERADMIN") return true;
    return false;
  }

  /**
   * Can manage templates and high-level assessment configuration.
   */
  static canManageTemplates(user: User, orgId: string): boolean {
    // SUPERADMIN can manage any org's templates
    if (user.fallbackRole === "SUPERADMIN") return true;
    
    // Check if user belongs to this org
    if (String(user.orgId) !== String(orgId)) return false;
    
    return user.fallbackRole === "ADMIN" || 
           user.fallbackRole === "OWNER" || 
           user.fallbackRole === "COORDINATOR";
  }

  /**
   * Can create new assessments for the organization.
   */
  static canCreateAssessments(user: User, orgId: string): boolean {
    // SUPERADMIN cannot create assessments unless they're a member of the org
    if (user.fallbackRole === "SUPERADMIN") {
      return String(user.orgId) === String(orgId);
    }
    
    // For regular users, check if they belong to this org and have the right role
    if (String(user.orgId) !== String(orgId)) return false;
    
    return user.fallbackRole === "ADMIN" || 
           user.fallbackRole === "OWNER" || 
           user.fallbackRole === "COORDINATOR" ||
           user.fallbackRole === "OPERATOR";
  }

  /**
   * Can edit assessment metadata, status, and AI summaries.
   */
  static canEditAssessment(user: User, orgId: string): boolean {
    if (user.fallbackRole === "SUPERADMIN") return true;
    if (user.fallbackRole === "ADMIN") return true;
    return user.fallbackRole === "COORDINATOR" && String(user.orgId) === String(orgId);
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
    if (user.fallbackRole === "SUPERADMIN") return true;
    return user.fallbackRole === "ADMIN" && String(user.orgId) === String(orgId);
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
    if (user.isSuperuser || user.fallbackRole === "SUPERADMIN") {
      return true;
    }
    
    if (user.orgId === orgId) {
      return true;
    }
    
    if (user.organizations) {
      return user.organizations.some((org) => org.id === orgId);
    }
    
    return false;
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
