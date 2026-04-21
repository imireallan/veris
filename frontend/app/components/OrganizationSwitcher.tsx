import * as React from "react";
import { useLocation } from "react-router";
import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";

import { useToast } from "~/hooks/use-toast";
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

const PENDING_ORG_SWITCH_KEY = "veris:pending-org-switch";

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
  const { success: toastSuccess } = useToast();
  const [switchingOrganizationId, setSwitchingOrganizationId] = React.useState<string | null>(null);

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

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const pendingSwitch = window.sessionStorage.getItem(PENDING_ORG_SWITCH_KEY);
    if (!pendingSwitch) return;

    try {
      const parsed = JSON.parse(pendingSwitch) as { orgId?: string; orgName?: string };
      if (parsed.orgId && String(parsed.orgId) === String(activeOrganizationId)) {
        toastSuccess(
          "Organization switched",
          parsed.orgName ? `Now viewing ${parsed.orgName}.` : undefined,
        );
        window.sessionStorage.removeItem(PENDING_ORG_SWITCH_KEY);
        setSwitchingOrganizationId(null);
      }
    } catch {
      window.sessionStorage.removeItem(PENDING_ORG_SWITCH_KEY);
      setSwitchingOrganizationId(null);
    }
  }, [activeOrganizationId, toastSuccess]);

  const handleSelect = React.useCallback(
    (orgId: string) => {
      if (String(orgId) === String(activeOrganizationId)) {
        return;
      }

      const redirectTo = buildRedirectPath(orgId);
      const organization = organizations.find(
        (candidate) => String(candidate.id) === String(orgId),
      );

      setSwitchingOrganizationId(orgId);

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          PENDING_ORG_SWITCH_KEY,
          JSON.stringify({ orgId, orgName: organization?.name ?? null }),
        );

        const form = document.createElement("form");
        form.method = "post";
        form.action = "/resources/organizations/select";
        form.style.display = "none";

        const organizationInput = document.createElement("input");
        organizationInput.type = "hidden";
        organizationInput.name = "organizationId";
        organizationInput.value = orgId;
        form.appendChild(organizationInput);

        const redirectInput = document.createElement("input");
        redirectInput.type = "hidden";
        redirectInput.name = "redirectTo";
        redirectInput.value = redirectTo;
        form.appendChild(redirectInput);

        document.body.appendChild(form);
        form.submit();
      }
    },
    [activeOrganizationId, buildRedirectPath, organizations],
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
          {switchingOrganizationId
            ? organizations.find((organization) => String(organization.id) === String(switchingOrganizationId))?.name ??
              selectedOrganization?.name ??
              "Switching..."
            : selectedOrganization?.name || "Select Organization"}
        </span>
        {switchingOrganizationId ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
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
          const isSwitching = String(switchingOrganizationId) === String(organization.id);
          return (
            <DropdownMenuItem
              key={organization.id}
              onClick={() => handleSelect(organization.id)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-2",
                isSelected && "bg-primary/10 text-primary",
                isSwitching && "opacity-80",
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
              {isSwitching ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
              ) : isSelected ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
