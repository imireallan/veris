import type { OrganizationListItem, User } from "~/types";

export function getResolvedActiveOrganizationId(user: User | null | undefined): string | null {
  return user?.activeOrganization?.id ?? user?.orgId ?? null;
}

export function getResolvedActiveOrganization(
  user: User | null | undefined,
  organizations?: OrganizationListItem[] | null,
): OrganizationListItem | null {
  const activeOrganizationId = getResolvedActiveOrganizationId(user);
  const organizationList = organizations ?? user?.organizations ?? user?.recentOrganizations ?? [];

  if (!organizationList.length) {
    return user?.activeOrganization
      ? {
          id: user.activeOrganization.id,
          name: user.activeOrganization.name,
          slug: user.activeOrganization.slug,
          role: user?.activeMembership?.role ?? null,
          fallback_role: user?.activeMembership?.fallback_role,
        }
      : null;
  }

  if (activeOrganizationId) {
    const matchedOrganization = organizationList.find(
      (organization) => String(organization.id) === String(activeOrganizationId),
    );
    if (matchedOrganization) {
      return matchedOrganization;
    }
  }

  return organizationList[0] ?? null;
}
