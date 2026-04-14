import * as React from "react";
import { Link, Form } from "react-router";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  Building2,
  ChevronDown,
  Crown,
  LogOut,
  Settings,
  Shield,
  User,
  Users,
  Briefcase,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { User as UserType } from "~/types";
import { UserRole, RBAC } from "~/types/rbac";
import { getSelectedOrganization } from "~/components/OrganizationSwitcher";

function getRoleBadgeVariant(role: UserRole | string): "destructive" | "default" | "secondary" | "outline" {
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
  className?: string;
}

export function UserDropdown({ user, className }: UserDropdownProps) {
  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  const RoleIcon = getRoleIconComponent(user.role);
  const selectedOrg = getSelectedOrganization(user);

  // Validate that selectedOrg is actually in user's organizations
  const isValidSelectedOrg = selectedOrg && user.organizations?.some((org) => org.id === selectedOrg.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div
          className={cn(
            "flex items-center gap-2 rounded-full hover:bg-primary/10 p-1 pr-3 transition-colors cursor-pointer",
            className
          )}
          role="button"
          tabIndex={0}
        >
          <Avatar className="w-8 h-8 ring-1 ring-border bg-background">
            <AvatarFallback className="text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium leading-none">{user.fullName || "User"}</p>
            {isValidSelectedOrg && (
              <p className="text-xs text-muted-foreground mt-0.5">{selectedOrg.name}</p>
            )}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-2 py-1.5">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-foreground">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        
        {/* Role Badges */}
        <div className="px-2 py-1.5">
          <div className="flex flex-wrap gap-1">
            {user.role && (
              <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1 h-5 text-xs">
                <RoleIcon className="w-3 h-3" />
                {RBAC.getRoleLabel(user.role)}
              </Badge>
            )}
            {user.isSuperuser && (
              <Badge variant="default" className="gap-1 h-5 text-xs">
                <Crown className="w-3 h-3" />
                Superuser
              </Badge>
            )}
          </div>
        </div>

        {/* Selected Organization */}
        {isValidSelectedOrg && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Current:</span>
                <span className="font-medium text-foreground">{selectedOrg.name}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                <Shield className="w-2.5 h-2.5" />
                <span>{RBAC.getRoleLabel(selectedOrg.role)}</span>
              </div>
            </div>
          </>
        )}

        {/* All Organizations (compact list) */}
        {user.organizations && user.organizations.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                All Organizations
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {user.organizations.map((org) => {
                  const isSelected = isValidSelectedOrg && selectedOrg.id === org.id;
                  return (
                    <div
                      key={org.id}
                      className={cn(
                        "flex items-center justify-between p-1.5 rounded-md text-xs transition-colors",
                        isSelected ? "bg-primary/10 text-primary" : "hover:bg-primary/10"
                      )}
                    >
                      <span className="text-foreground truncate">{org.name}</span>
                      <Badge variant={isSelected ? "default" : "outline"} className="h-4 text-[10px]">
                        {RBAC.getRoleLabel(org.role)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <DropdownMenuSeparator />
        
        {/* Actions */}
        <DropdownMenuItem>
          <Link to="/settings/profile" className="flex items-center gap-2 w-full">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem>
          <Form method="post" action="/logout" className="w-full">
            <button type="submit" className="flex items-center gap-2 w-full">
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </Form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
