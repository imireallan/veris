import * as React from "react";
import { useNavigate, useSubmit } from "react-router";
import {
  Briefcase,
  Building2,
  ChevronDown,
  Crown,
  LogOut,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import type { OrganizationListItem, User as UserType } from "~/types";
import { getResolvedActiveOrganization } from "~/lib/active-organization";
import { RBAC, UserRole } from "~/types/rbac";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

function getRoleBadgeVariant(
  role: UserRole | string,
): "destructive" | "default" | "secondary" | "outline" {
  const priority = RBAC.getRolePriority(role);
  if (priority >= 80) return "destructive";
  if (priority >= 60) return "default";
  if (priority >= 40) return "secondary";
  return "outline";
}

function getRoleIconComponent(role: UserRole | string): LucideIcon {
  if (role === UserRole.SUPERADMIN) return Crown;
  if (role === UserRole.ADMIN) return Shield;
  if (role === UserRole.COORDINATOR) return Users;
  if (role === UserRole.CONSULTANT) return Briefcase;
  return User;
}

interface UserDropdownProps {
  user: UserType;
  organizations: OrganizationListItem[];
  className?: string;
}

export function UserDropdown({
  user,
  organizations,
  className,
}: UserDropdownProps) {
  const navigate = useNavigate();
  const submit = useSubmit();

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  const RoleIcon = getRoleIconComponent(user.role);
  const selectedOrg = getResolvedActiveOrganization(user, organizations);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-primary/10",
          className,
        )}
      >
        <Avatar className="h-8 w-8 bg-background ring-1 ring-border">
          <AvatarFallback className="text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium leading-none">
            {user.fullName || "User"}
          </p>
          {selectedOrg ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {selectedOrg.name}
            </p>
          ) : null}
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-2 py-1.5">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-foreground">
              {user.fullName}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />

        <div className="px-2 py-1.5">
          <div className="flex flex-wrap gap-1">
            {user.role ? (
              <Badge
                variant={getRoleBadgeVariant(user.role)}
                className="h-5 gap-1 text-xs"
              >
                <RoleIcon className="h-3 w-3" />
                {RBAC.getRoleLabel(user.role)}
              </Badge>
            ) : null}
            {user.isSuperuser ? (
              <Badge variant="default" className="h-5 gap-1 text-xs">
                <Crown className="h-3 w-3" />
                Superuser
              </Badge>
            ) : null}
          </div>
        </div>

        {selectedOrg ? (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Current:</span>
                <span className="font-medium text-foreground">
                  {selectedOrg.name}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Shield className="h-2.5 w-2.5" />
                <span>
                  {RBAC.getRoleLabel(
                    user.activeMembership?.fallback_role ??
                      user.activeMembership?.role ??
                      user.role,
                  )}
                </span>
              </div>
            </div>
          </>
        ) : null}

        {organizations.length > 1 ? (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Accessible Organizations
              </p>
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {organizations.map((organization) => {
                  const isSelected = selectedOrg?.id === organization.id;
                  return (
                    <div
                      key={organization.id}
                      className={cn(
                        "flex items-center justify-between rounded-md p-1.5 text-xs transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-primary/10",
                      )}
                    >
                      <span className="truncate text-foreground">
                        {organization.name}
                      </span>
                      <Badge
                        variant={isSelected ? "default" : "outline"}
                        className="h-4 text-[10px]"
                      >
                        {RBAC.getRoleLabel(
                          organization.fallback_role ?? organization.role,
                        )}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate("/settings/profile")}>
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            submit(null, {
              action: "/logout",
              method: "post",
            })
          }
        >
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
