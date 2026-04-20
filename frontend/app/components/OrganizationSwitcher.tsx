import * as React from "react";
import { useLocation, useSubmit } from "react-router";
import { Building2, Check, ChevronDown } from "lucide-react";

import { cn } from "~/lib/utils";
import type { OrganizationListItem } from "~/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface OrganizationSwitcherProps {
  organizations: OrganizationListItem[];
  activeOrganizationId?: string | null;
  className?: string;
}

export function getSelectedOrganization(
  organizations: OrganizationListItem[],
  activeOrganizationId?: string | null,
): OrganizationListItem | null {
  if (!organizations.length) return null;

  if (activeOrganizationId) {
    const selected = organizations.find(
      (organization) => String(organization.id) === String(activeOrganizationId),
    );
    if (selected) return selected;
  }

  return organizations[0] ?? null;
}

export function OrganizationSwitcher({
  organizations,
  activeOrganizationId,
  className,
}: OrganizationSwitcherProps) {
  const location = useLocation();
  const submit = useSubmit();

  const selectedOrganization = React.useMemo(
    () => getSelectedOrganization(organizations, activeOrganizationId),
    [organizations, activeOrganizationId],
  );

  const buildRedirectPath = React.useCallback(
    (orgId: string) => {
      const currentPath = location.pathname;
      const orgPathPattern = /^\/organizations\/([^/]+)/;

      if (orgPathPattern.test(currentPath)) {
        return currentPath.replace(orgPathPattern, `/organizations/${orgId}`);
      }

      return currentPath === "/organizations"
        ? `/organizations/${orgId}`
        : currentPath;
    },
    [location.pathname],
  );

  const handleSelect = React.useCallback(
    (orgId: string) => {
      const redirectTo = buildRedirectPath(orgId);
      submit(
        {
          organizationId: orgId,
          redirectTo,
        },
        {
          action: "/resources/organizations/select",
          method: "post",
        },
      );
    },
    [buildRedirectPath, submit],
  );

  if (!organizations.length) {
    return null;
  }

  if (organizations.length === 1) {
    const organization = organizations[0];
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-sm",
          className,
        )}
      >
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{organization.name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary/10",
          className,
        )}
      >
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="max-w-[150px] truncate">
          {selectedOrganization?.name || "Select Organization"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Switch Organization ({organizations.length})
          </p>
        </div>
        <DropdownMenuSeparator />
        {organizations.map((organization) => {
          const isSelected = selectedOrganization?.id === organization.id;
          return (
            <DropdownMenuItem
              key={organization.id}
              onClick={() => handleSelect(organization.id)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-2",
                isSelected && "bg-primary/10 text-primary",
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Building2
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isSelected ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="truncate">{organization.name}</span>
              </div>
              {isSelected ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
