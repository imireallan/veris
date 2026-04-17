import * as React from "react";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { 
  Building2, 
  Crown, 
  Globe, 
  Mail, 
  MapPin, 
  Shield, 
  User as UserIcon, 
  Users,
  Briefcase,
  LogOut,
  Settings,
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
  return UserIcon;
}

function getRoleLabel(role: UserRole | string): string {
  return RBAC.getRoleLabel(role);
}

interface UserProfileCardProps {
  user: UserType;
  organizations?: UserType["organizations"];
  onLogout?: () => void;
  onSettings?: () => void;
  className?: string;
}

export function UserProfileCard({
  user,
  organizations = user.organizations,
  onLogout,
  onSettings,
  className,
}: UserProfileCardProps) {
  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  const RoleIcon = getRoleIconComponent(user.role);
  const selectedOrg = getSelectedOrganization(organizations || []);
  const isValidSelectedOrg = selectedOrg && organizations?.some((org) => org.id === selectedOrg.id);

  return (
    <Card className={cn("w-full max-w-md border bg-card", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border border-border bg-muted">
              <AvatarFallback className="text-sm font-semibold text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg text-foreground">{user.fullName || "User"}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1">
            {onSettings && (
              <Button variant="ghost" size="icon" onClick={onSettings}>
                <Settings className="w-4 h-4" />
              </Button>
            )}
            {onLogout && (
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Role Badge */}
        {user.role && (
          <div className="flex items-center gap-2">
            <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1 h-6">
              <RoleIcon className="w-3.5 h-3.5" />
              {getRoleLabel(user.role)}
            </Badge>
            {user.isSuperuser && (
              <Badge variant="outline" className="gap-1 h-6 border-amber-500 text-amber-700 dark:text-amber-400">
                <Crown className="w-3.5 h-3.5" />
                Superuser
              </Badge>
            )}
          </div>
        )}

        {/* Primary Organization */}
        {user.orgName && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Primary:</span>
            <span className="font-medium text-foreground">{user.orgName}</span>
          </div>
        )}

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          {user.country && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{user.country}</span>
            </div>
          )}
          {user.timezone && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{user.timezone}</span>
            </div>
          )}
        </div>

        {/* Organizations List */}
        {organizations && organizations.length > 1 && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              All Organizations ({organizations.length})
            </p>
            <div className="space-y-1.5">
              {organizations.map((org) => {
                const OrgRoleIcon = getRoleIconComponent(org.role);
                const isSelected = isValidSelectedOrg && selectedOrg.id === org.id;
                return (
                  <div
                    key={org.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md text-sm border",
                      isSelected
                        ? "bg-primary/5 border-primary/20"
                        : "bg-muted/30 border-border"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground">{org.name}</span>
                    </div>
                    <Badge variant={getRoleBadgeVariant(org.role)} className="h-5 text-xs">
                      <OrgRoleIcon className="w-3 h-3" />
                      {getRoleLabel(org.role)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
