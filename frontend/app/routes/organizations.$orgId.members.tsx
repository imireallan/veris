import { useFetcher, useLoaderData, useNavigate, useParams } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { RBAC } from "~/types/rbac";
import type { User } from "~/types";
import { Button, Input, Label, Card, CardContent, CardHeader, CardDescription, Alert, AlertDescription, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui";
import { Users, UserPlus, Mail, Shield, Trash2, MoreVertical, X } from "lucide-react";
import { useToast } from "~/hooks/use-toast";
import { useEffect, useRef, useState } from "react";

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

  return { members, invitations, orgId };
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

      await api.post(
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
    return data(
      {
        success: false,
        error: error.body?.detail || error.message || "Action failed",
      },
      { status: error.status || 500 }
    );
  }
}

export default function OrganizationMembersRoute() {
  const { members, invitations, orgId } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const hasShownToast = useRef(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const lastActionType = useRef<string | null>(null);

  useEffect(() => {
    if (fetcher.data && !hasShownToast.current) {
      if ("success" in fetcher.data && fetcher.data.success && "message" in fetcher.data) {
        toastSuccess("Success", fetcher.data.message as string);
        hasShownToast.current = true;
        // Close modal and reset form on successful invitation
        if (lastActionType.current === "create_invitation") {
          setShowInviteModal(false);
          setInviteEmail("");
          setInviteRole("");
          lastActionType.current = null;
        }
      } else if ("error" in fetcher.data && fetcher.data.error) {
        toastError("Action failed", fetcher.data.error);
        hasShownToast.current = true;
      }
    }
    if (fetcher.state === "idle" && fetcher.data === null) {
      hasShownToast.current = false;
    }
  }, [fetcher.data, fetcher.state, toastSuccess, toastError]);

  const isProcessing = fetcher.state === "submitting";

  const handleInviteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    formData.set("actionType", "create_invitation");
    lastActionType.current = "create_invitation";
    fetcher.submit(formData, { method: "post" });
  };

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

          <fetcher.Form method="post" onSubmit={handleInviteSubmit} className="space-y-4">
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
              <Select
                value={inviteRole}
                onValueChange={setInviteRole}
                name="fallback_role"
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin - Full org management</SelectItem>
                  <SelectItem value="COORDINATOR">Coordinator - Manage assessments</SelectItem>
                  <SelectItem value="ASSESSOR">Assessor - View and edit assessments</SelectItem>
                  <SelectItem value="CONSULTANT">Consultant - View and collaborate</SelectItem>
                  <SelectItem value="OPERATOR">Operator - Basic access</SelectItem>
                  <SelectItem value="EXECUTIVE">Executive - View only</SelectItem>
                </SelectContent>
              </Select>
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
