import * as React from "react";
import {
  Briefcase,
  Building2,
  Crown,
  Globe,
  LogOut,
  MapPin,
  Settings,
  Shield,
  User as UserIcon,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import type { OrganizationListItem, User as UserType } from "~/types";
import { RBAC, UserRole } from "~/types/rbac";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

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
  return UserIcon;
}

interface UserProfileCardProps {
  user: UserType;
  organizations?: OrganizationListItem[];
  onLogout?: () => void;
  onSettings?: () => void;
  className?: string;
}

export function UserProfileCard({
  user,
  organizations = user.recentOrganizations ?? [],
  onLogout,
  onSettings,
  className,
}: UserProfileCardProps) {
  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((name: string) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  const roleLabel =
    user.activeMembership?.fallback_role ?? user.activeMembership?.role ?? user.role;
  const RoleIcon = getRoleIconComponent(roleLabel);
  const selectedOrg =
    organizations.find((organization) => organization.id === user.orgId) ??
    user.activeOrganization ??
    null;

  return (
    <Card className={cn("w-full max-w-md border bg-card", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-border bg-muted">
              <AvatarFallback className="text-sm font-semibold text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg text-foreground">
                {user.fullName || "User"}
              </CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
          <div className="flex gap-1">
            {onSettings ? (
              <Button variant="ghost" size="icon" onClick={onSettings}>
                <Settings className="h-4 w-4" />
              </Button>
            ) : null}
            {onLogout ? (
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={getRoleBadgeVariant(roleLabel)} className="h-6 gap-1">
            <RoleIcon className="h-3.5 w-3.5" />
            {RBAC.getRoleLabel(roleLabel)}
          </Badge>
          {user.isSuperuser ? (
            <Badge variant="default" className="h-6 gap-1">
              <Crown className="h-3.5 w-3.5" />
              Superuser
            </Badge>
          ) : null}
        </div>

        {selectedOrg ? (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Active organization:</span>
            <span className="font-medium text-foreground">
              {selectedOrg.name}
            </span>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 border-t pt-2">
          {user.country ? (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{user.country}</span>
            </div>
          ) : null}
          {user.timezone ? (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{user.timezone}</span>
            </div>
          ) : null}
        </div>

        {organizations.length > 1 ? (
          <div className="border-t pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Accessible Organizations ({organizations.length})
            </p>
            <div className="space-y-1.5">
              {organizations.map((organization) => {
                const organizationRole =
                  organization.fallback_role ?? organization.role ?? "Unknown";
                const OrgRoleIcon = getRoleIconComponent(organizationRole);
                const isSelected = selectedOrg?.id === organization.id;
                return (
                  <div
                    key={organization.id}
                    className={cn(
                      "flex items-center justify-between rounded-md border p-2 text-sm",
                      isSelected
                        ? "border-primary/20 bg-primary/5"
                        : "border-border bg-muted/30",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {organization.name}
                      </span>
                    </div>
                    <Badge
                      variant={getRoleBadgeVariant(organizationRole)}
                      className="h-5 gap-1 text-xs"
                    >
                      <OrgRoleIcon className="h-3 w-3" />
                      {RBAC.getRoleLabel(organizationRole)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
