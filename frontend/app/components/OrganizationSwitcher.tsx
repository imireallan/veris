/**
 * Organization Switcher Component
 * 
 * Allows users to switch between organizations they belong to.
 * Persists selection in localStorage and updates API calls.
 */

import * as React from "react";
import { useNavigate, useLocation } from "react-router";
import { Building2, Check, ChevronDown } from "lucide-react";
import { cn } from "~/lib/utils";
import type { OrganizationMembership } from "~/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useToast } from "~/hooks/use-toast";
import {
  getSelectedOrganizationFromList,
  getStoredOrganizationId,
  persistSelectedOrganizationId,
} from "~/lib/organization-selection";

interface OrganizationSwitcherProps {
  organizations: OrganizationMembership[];
  className?: string;
}

/**
 * Get the currently selected organization
 * Priority: stored (if valid) > first org > null
 * 
 * Validates that the stored org is actually in the user's organizations list.
 */
export function getSelectedOrganization(
  organizations: OrganizationMembership[],
): OrganizationMembership | null {
  return getSelectedOrganizationFromList(organizations, getStoredOrganizationId());
}

export function OrganizationSwitcher({ organizations, className }: OrganizationSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { success: toastSuccess } = useToast();
  const [selectedOrg, setSelectedOrg] = React.useState<OrganizationMembership | null>(() =>
    getSelectedOrganization(organizations)
  );

  // Update selected org when available orgs change
  React.useEffect(() => {
    const org = getSelectedOrganization(organizations);
    setSelectedOrg(org);
  }, [organizations]);

  // Handle org selection
  const handleSelect = (orgId: string) => {
    persistSelectedOrganizationId(orgId);
    const org = organizations.find((o) => o.id === orgId);
    setSelectedOrg(org || null);

    // Show feedback toast
    if (org) {
      toastSuccess(
        "Organization switched",
        `Now viewing ${org.name}`
      );
    }

    // Navigate to the selected org's dashboard
    // Preserve the current path structure if possible
    const currentPath = location.pathname;
    const orgPathPattern = /^\/organizations\/([^/]+)/;
    const match = currentPath.match(orgPathPattern);

    if (match) {
      // Replace org ID in current path
      const newPath = currentPath.replace(orgPathPattern, `/organizations/${orgId}`);
      navigate(newPath);
    } else {
      // Navigate to org dashboard
      navigate(`/organizations/${orgId}`);
    }
  };

  // Don't show switcher if user has no orgs or only one org
  if (!organizations || organizations.length === 0) {
    return null;
  }

  // For single-org users, show a simple badge instead of dropdown
  if (organizations.length === 1) {
    const org = organizations[0];
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 text-sm",
          className
        )}
      >
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">{org.name}</span>
      </div>
    );
  }

  // Multi-org user: show switcher dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-primary/10 transition-colors text-sm font-medium cursor-pointer",
          className
        )}
      >
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <span className="max-w-[150px] truncate">{selectedOrg?.name || "Select Org"}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Switch Organization ({organizations.length})
          </p>
        </div>
        <DropdownMenuSeparator />
        {organizations.length > 0 ? (
          organizations.map((org) => {
            // Safely access org properties with fallbacks
            const orgId = org.id || "";
            const orgName = org.name || "Unknown Organization";
            const isSelected = selectedOrg?.id === orgId;
            
            return (
              <DropdownMenuItem
                key={orgId}
                onClick={() => handleSelect(orgId)}
                className={cn(
                  "flex items-center justify-between gap-2 cursor-pointer",
                  isSelected && "bg-primary/10 text-primary"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2
                    className={cn(
                      "w-4 h-4 shrink-0",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span className="truncate">{orgName}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                )}
              </DropdownMenuItem>
            );
          })
        ) : (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            No organizations available
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
