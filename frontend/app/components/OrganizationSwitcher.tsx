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
import type { User, OrganizationMembership } from "~/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Badge } from "~/components/ui/badge";
import { useToast } from "~/hooks/use-toast";

interface OrganizationSwitcherProps {
  user: User;
  className?: string;
}

const ORG_STORAGE_KEY = "veris:selected-organization";

/**
 * Get stored organization ID from localStorage
 */
function getStoredOrgId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ORG_STORAGE_KEY);
}

/**
 * Store organization ID in localStorage
 */
function storeOrgId(orgId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORG_STORAGE_KEY, orgId);
}

/**
 * Get the currently selected organization
 * Priority: stored (if valid) > first org > null
 * 
 * Validates that the stored org is actually in the user's organizations list.
 */
export function getSelectedOrganization(user: User): OrganizationMembership | null {
  if (!user.organizations || user.organizations.length === 0) {
    return null;
  }

  // If user has only one org, return it
  if (user.organizations.length === 1) {
    return user.organizations[0];
  }

  // Try to get stored org
  const storedId = getStoredOrgId();
  if (storedId) {
    const storedOrg = user.organizations.find((org) => org.id === storedId);
    if (storedOrg) {
      return storedOrg;
    }
    // Stored org is invalid (not in user's org list) - clear it
    if (typeof window !== "undefined") {
      localStorage.removeItem(ORG_STORAGE_KEY);
    }
  }

  // Fallback to first org
  return user.organizations[0];
}

export function OrganizationSwitcher({ user, className }: OrganizationSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { success: toastSuccess } = useToast();
  const [selectedOrg, setSelectedOrg] = React.useState<OrganizationMembership | null>(() =>
    getSelectedOrganization(user)
  );

  // Update selected org when user changes
  React.useEffect(() => {
    const org = getSelectedOrganization(user);
    setSelectedOrg(org);
  }, [user]);

  // Handle org selection
  const handleSelect = (orgId: string) => {
    storeOrgId(orgId);
    const org = user.organizations?.find((o) => o.id === orgId);
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
  if (!user.organizations || user.organizations.length === 0) {
    return null;
  }

  // For single-org users, show a simple badge instead of dropdown
  if (user.organizations.length === 1) {
    const org = user.organizations[0];
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
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-primary/10 transition-colors text-sm font-medium cursor-pointer",
            className
          )}
        >
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="max-w-[150px] truncate">{selectedOrg?.name || "Select Org"}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Switch Organization ({user.organizations?.length || 0})
          </p>
        </div>
        <DropdownMenuSeparator />
        {user.organizations && user.organizations.length > 0 ? (
          user.organizations.map((org) => {
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
