import { useFetcher, useLoaderData, useNavigate, useParams } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { RBAC } from "~/types/rbac";
import type { User } from "~/types";
import { Button, Input, Label, Card, CardContent, CardHeader, CardDescription, Alert, AlertDescription, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "~/components/ui";
import { Users, UserPlus, Mail, Shield, Trash2, MoreVertical, X } from "lucide-react";
import { useToast } from "~/hooks/use-toast";
import { useEffect, useRef, useState } from "react";

// Role hierarchy - higher number = more permissions
const ROLE_HIERARCHY: Record<string, number> = {
  SUPERADMIN: 100,
  ADMIN: 80,
  COORDINATOR: 60,
  CONSULTANT: 50,
  EXECUTIVE: 40,
  ASSESSOR: 30,
  OPERATOR: 20,
};

/**
 * Get roles that this user can invite (equal or lower in hierarchy).
 * Superusers can invite any role.
 */
function getAvailableRolesForInviter(userRole: string): string[] {
  if (userRole === "SUPERADMIN") {
    return ["ADMIN", "COORDINATOR", "ASSESSOR", "CONSULTANT", "OPERATOR", "EXECUTIVE"];
  }
  
  const inviterPriority = ROLE_HIERARCHY[userRole] || 0;
  
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, priority]) => priority <= inviterPriority)
    .map(([role, _]) => role)
    .filter(role => role !== "SUPERADMIN"); // Never allow inviting SUPERADMIN
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const orgId = params.orgId!;

  // Only ADMIN and SUPERADMIN can manage members
  if (!RBAC.canManageOrg(user, orgId)) {
    throw redirect("/");
  }

  const [membersResponse, invitationsResponse] = await Promise.all([
    api.get<any>(`/api/organizations/${orgId}/members/`, token, request).catch(() => ({})),
    api.get<any>(`/api/organizations/${orgId}/invitations/`, token, request).catch(() => ({})),
  ]);
  
  const members = Array.isArray(membersResponse) ? membersResponse : (membersResponse?.results || []);
  const invitations = Array.isArray(invitationsResponse) ? invitationsResponse : (invitationsResponse?.results || []);

  // Get roles this user can invite based on their role
  const availableInviteRoles = getAvailableRolesForInviter(user.fallbackRole || "OPERATOR");

  return { members, invitations, orgId, availableInviteRoles, userRole: user.fallbackRole || "OPERATOR" };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  const user = await requireUser(request);
  const orgId = params.orgId!;

  // Only ADMIN and SUPERADMIN can manage members
  if (!RBAC.canManageOrg(user, orgId)) {
    return data({ error: "Insufficient permissions" }, { status: 403 });
  }

  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  try {
    if (actionType === "create_invitation") {
      const email = formData.get("email") as string;
      const fallbackRole = formData.get("fallback_role") as string;

      if (!email || !fallbackRole) {
        return data(
          { error: "Email and role are required" },
          { status: 400 }
        );
      }

      // Validate user can invite this role (can't invite higher roles)
      const availableRoles = getAvailableRolesForInviter(user.fallbackRole || "OPERATOR");
      if (!availableRoles.includes(fallbackRole)) {
        return data(
          { error: `You cannot invite users with ${fallbackRole} role. Your role allows inviting: ${availableRoles.join(", ")}` },
          { status: 403 }
        );
      }

      const result = await api.post(
        `/api/organizations/${orgId}/invitations/`,
        { email, fallback_role: fallbackRole },
        token,
        request
      );
      return { success: true, message: `Invitation sent to ${email}` };
    }

    if (actionType === "update_role") {
      const membershipId = formData.get("membershipId") as string;
      const role = formData.get("role") as string;
      const fallbackRole = formData.get("fallback_role") as string;

      const payload: Record<string, any> = {};
      if (role) payload.role = role;
      if (fallbackRole) payload.fallback_role = fallbackRole;

      await api.post(
        `/api/organizations/${orgId}/members/${membershipId}/update_role/`,
        payload,
        token,
        request
      );
      return { success: true, message: "Role updated successfully" };
    }

    if (actionType === "remove_member") {
      const membershipId = formData.get("membershipId") as string;
      // Note: Backend doesn't have delete endpoint for members yet
      // This would need to be added to the backend
      return { success: false, error: "Remove member not implemented on backend" };
    }

    if (actionType === "resend_invitation") {
      const invitationId = formData.get("invitationId") as string;
      await api.post(
        `/api/organizations/${orgId}/invitations/${invitationId}/resend/`,
        {},
        token,
        request
      );
      return { success: true, message: "Invitation resent" };
    }

    if (actionType === "revoke_invitation") {
      const invitationId = formData.get("invitationId") as string;
      await api.post(
        `/api/organizations/${orgId}/invitations/${invitationId}/revoke/`,
        {},
        token,
        request
      );
      return { success: true, message: "Invitation revoked" };
    }

    return { error: "Unknown action" };
  } catch (error: any) {
    if (error.status === 401) {
      throw error;
    }
    // Log full error for debugging
    console.error("Invitation error:", error);
    return data(
      {
        success: false,
        error: error.body?.detail || error.body?.email?.[0] || error.message || "Action failed",
      },
      { status: error.status || 500 }
    );
  }
}

export default function OrganizationMembersRoute() {
  const { members, invitations, orgId, availableInviteRoles, userRole } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const hasShownToast = useRef(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [inviteRoleLabel, setInviteRoleLabel] = useState("");
  const lastActionType = useRef<string | null>(null);

  // Role label helper
  const getRoleLabel = (role: string) => {
    return role === "ADMIN" ? "Admin - Full org management" :
           role === "COORDINATOR" ? "Coordinator - Manage assessments" :
           role === "ASSESSOR" ? "Assessor - View and edit assessments" :
           role === "CONSULTANT" ? "Consultant - View and collaborate" :
           role === "OPERATOR" ? "Operator - Basic access" :
           "Executive - View only";
  };

  // Initialize role to first available option when modal opens
  useEffect(() => {
    if (showInviteModal && availableInviteRoles.length > 0 && !inviteRole) {
      setInviteRole(availableInviteRoles[0]);
      setInviteRoleLabel(getRoleLabel(availableInviteRoles[0]));
    }
  }, [showInviteModal, availableInviteRoles, inviteRole]);

  useEffect(() => {
    // Track when form is submitted
    if (fetcher.state === "submitting") {
      lastActionType.current = "create_invitation";
    }
    
    if (fetcher.data && !hasShownToast.current) {
      // Only show toast for the last action type
      if (lastActionType.current === "create_invitation") {
        if ("success" in fetcher.data && fetcher.data.success && "message" in fetcher.data) {
          toastSuccess("Success", fetcher.data.message as string);
          hasShownToast.current = true;
          // Close modal and reset form on successful invitation
          setShowInviteModal(false);
          setInviteEmail("");
          setInviteRole("");
          lastActionType.current = null;
        } else if ("error" in fetcher.data && fetcher.data.error) {
          toastError("Invitation Failed", fetcher.data.error as string);
          hasShownToast.current = true;
          lastActionType.current = null;
        }
      }
    }
    if (fetcher.state === "idle" && fetcher.data === null) {
      hasShownToast.current = false;
    }
  }, [fetcher.data, fetcher.state, toastSuccess, toastError]);

  const isProcessing = fetcher.state === "submitting";

  // Note: Form submission handled directly by fetcher.Form
  // actionType is set via hidden input field

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6" />
            Members & Invitations
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage team members and pending invitations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/organizations/${orgId}`)}
          >
            ← Back
          </Button>
          <Button
            type="button"
            onClick={() => setShowInviteModal(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {fetcher.data?.error && (
        <Alert variant="destructive">
          <AlertDescription>{fetcher.data.error}</AlertDescription>
        </Alert>
      )}

      {/* Members Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Members</h3>
              <CardDescription>
                Current members of your organization
              </CardDescription>
            </div>
            <Badge variant="secondary">{members.length} members</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No members yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member: any) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.user_name || "Unknown"}
                    </TableCell>
                    <TableCell>{member.user_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Shield className="w-3 h-3 mr-1" />
                        {member.role_name || member.fallback_role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled>
                            Change role
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            Remove member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invitations Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Invitations</h3>
              <CardDescription>
                Pending and processed invitations
              </CardDescription>
            </div>
            <Badge variant="secondary">{invitations.length} invitations</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No invitations sent</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation: any) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Shield className="w-3 h-3 mr-1" />
                        {invitation.role_name || invitation.fallback_role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={invitation.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {invitation.status === "PENDING" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <fetcher.Form method="post" className="w-full">
                                <input type="hidden" name="actionType" value="resend_invitation" />
                                <input type="hidden" name="invitationId" value={invitation.id} />
                                <button type="submit" disabled={isProcessing} className="flex items-center w-full">
                                  <Mail className="w-3 h-3 mr-2" />
                                  Resend
                                </button>
                              </fetcher.Form>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <fetcher.Form method="post" className="w-full">
                                <input type="hidden" name="actionType" value="revoke_invitation" />
                                <input type="hidden" name="invitationId" value={invitation.id} />
                                <button type="submit" disabled={isProcessing} className="flex items-center w-full text-destructive">
                                  <Trash2 className="w-3 h-3 mr-2" />
                                  Revoke
                                </button>
                              </fetcher.Form>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invite Member Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization. The recipient will receive an email with a link to set up their account.
            </DialogDescription>
          </DialogHeader>

          <fetcher.Form method="post" className="space-y-4">
            <input type="hidden" name="actionType" value="create_invitation" />
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="colleague@company.com"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fallback_role">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => {
                setInviteRole(v);
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue>{inviteRole ? getRoleLabel(inviteRole) : "Select a role"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {availableInviteRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {getRoleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <input type="hidden" name="fallback_role" value={inviteRole} />
              <p className="text-xs text-muted-foreground">
                You can only invite users with roles equal to or lower than your own ({userRole}).
              </p>
            </div>

            {fetcher.data?.error && (
              <Alert variant="destructive">
                <AlertDescription>{fetcher.data.error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isProcessing || !inviteEmail || !inviteRole}>
                {isProcessing ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </fetcher.Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PENDING: { label: "Pending", variant: "secondary" },
    ACCEPTED: { label: "Accepted", variant: "default" },
    DECLINED: { label: "Declined", variant: "outline" },
    EXPIRED: { label: "Expired", variant: "destructive" },
  };

  const config = statusConfig[status] || { label: status, variant: "outline" };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
