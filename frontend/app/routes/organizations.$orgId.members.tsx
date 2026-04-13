import { useFetcher, useLoaderData, useNavigate, useParams } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { RBAC } from "~/types/rbac";
import type { User } from "~/types";
import { Button, Input, Label, Card, CardContent, CardHeader, CardDescription, Alert, AlertDescription, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "~/components/ui";
import { Users, UserPlus, Mail, Shield, Trash2, MoreVertical } from "lucide-react";
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

  useEffect(() => {
    if (fetcher.data && !hasShownToast.current) {
      if ("success" in fetcher.data && fetcher.data.success && "message" in fetcher.data) {
        toastSuccess("Success", fetcher.data.message as string);
        hasShownToast.current = true;
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
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/organizations/${orgId}`)}
        >
          ← Back
        </Button>
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
