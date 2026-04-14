import { useFetcher, useLoaderData, Form } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import type { User } from "~/types";
import { Button, Input, Label, Card, CardContent, CardHeader, CardDescription, Alert, AlertDescription, SelectWithOptions as Select } from "~/components/ui";
import { User as UserIcon, Save, Key, Building2, Shield, Bell, Mail, Laptop, Image as ImageIcon, Clock } from "lucide-react";
import { useToast } from "~/hooks/use-toast";
import { useEffect, useRef } from "react";
import { RBAC } from "~/types/rbac";

interface Membership {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  role_name: string;
  fallback_role: string;
  is_lead_assessor: boolean;
  joined_at: string;
}

interface ProfileData {
  id: string;
  email: string;
  name: string;
  timezone: string | null;
  country: string | null;
  memberships: Membership[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);

  // Fetch user profile from backend
  const profile = await api.get<ProfileData>("/api/users/me/", token, request);

  return { profile };
}

export async function action({ request }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  const user = await requireUser(request);
  const formData = await request.formData();

  const updateData: Record<string, any> = {};

  const name = formData.get("name");
  if (typeof name === "string" && name.trim()) {
    updateData.name = name.trim();
  }

  const timezone = formData.get("timezone");
  if (typeof timezone === "string" && timezone) {
    updateData.timezone = timezone;
  }

  try {
    await api.patch(`/api/users/${user.id}/`, updateData, token, request);
    return { success: true };
  } catch (error: any) {
    if (error.status === 401) {
      throw error;
    }
    return data(
      {
        success: false,
        error: error.body?.detail || error.message || "Failed to update profile",
      },
      { status: error.status || 500 }
    );
  }
}

export default function ProfileRoute() {
  const { profile } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const { success: toastSuccess, error: toastError } = useToast();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (fetcher.data && !hasShownToast.current) {
      if ("success" in fetcher.data && fetcher.data.success) {
        toastSuccess("Profile updated", "Your changes have been saved successfully.");
        hasShownToast.current = true;
      } else if ("error" in fetcher.data && fetcher.data.error) {
        toastError("Update failed", fetcher.data.error);
        hasShownToast.current = true;
      }
    }
    if (fetcher.state === "idle" && fetcher.data === null) {
      hasShownToast.current = false;
    }
  }, [fetcher.data, fetcher.state, toastSuccess, toastError]);

  const isSaving = fetcher.state === "submitting";

  // Common timezones
  const timezoneOptions = [
    { value: "", label: "Auto (Browser Default)" },
    { value: "UTC", label: "UTC" },
    { value: "Africa/Accra", label: "West Africa Time (GMT)" },
    { value: "Africa/Lagos", label: "West Africa Time (GMT+1)" },
    { value: "Africa/Johannesburg", label: "South Africa Time (GMT+2)" },
    { value: "Europe/London", label: "London (GMT/BST)" },
    { value: "Europe/Paris", label: "Paris (CET)" },
    { value: "Europe/Berlin", label: "Berlin (CET)" },
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Asia/Singapore", label: "Singapore (SGT)" },
    { value: "Asia/Kolkata", label: "India (IST)" },
    { value: "America/New_York", label: "New York (EST/EDT)" },
    { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <UserIcon className="w-6 h-6" />
            Profile Settings
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your personal information and organization access
          </p>
        </div>
      </div>

      {/* Read-only info */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Account Information</h3>
          <CardDescription>Your login credentials and contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">
              Email is your login identifier. Contact your administrator to change it.
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Password</span>
            </div>
            <a
              href="/reset-password/request"
              className="text-sm text-primary hover:underline"
            >
              Reset Password →
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Editable profile */}
      <fetcher.Form method="post" className="space-y-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Personal Details</h3>
            <CardDescription>Update your display name and timezone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={profile.name}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                id="timezone"
                name="timezone"
                defaultValue={profile.timezone || ""}
                options={timezoneOptions}
              />
              <p className="text-xs text-muted-foreground">
                Used for timestamps and scheduled notifications
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </fetcher.Form>

      {/* Organization memberships */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Organization Access
          </h3>
          <CardDescription>
            You have access to {profile.memberships.length} organization
            {profile.memberships.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profile.memberships.map((membership) => (
              <div
                key={membership.id}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{membership.organization_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {membership.role_name !== membership.fallback_role
                        ? `${membership.role_name} (${membership.fallback_role})`
                        : membership.role_name}
                    </p>
                  </div>
                </div>
                <a
                  href={`/organizations/${membership.organization_id}`}
                  className="text-sm text-primary hover:underline"
                >
                  View →
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Features */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Coming Soon
        </h3>

        {/* Email change */}
        <Card className="opacity-60">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Change Email Address</p>
                <p className="text-xs text-muted-foreground">
                  Update your login email with verification
                </p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
              Planned
            </span>
          </CardContent>
        </Card>

        {/* In-place password change */}
        <Card className="opacity-60">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Key className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Change Password</p>
                <p className="text-xs text-muted-foreground">
                  Update password without email reset flow
                </p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
              Planned
            </span>
          </CardContent>
        </Card>

        {/* Notification preferences */}
        <Card className="opacity-60">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bell className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Notification Preferences</p>
                <p className="text-xs text-muted-foreground">
                  Email and in-app notification settings
                </p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
              Planned
            </span>
          </CardContent>
        </Card>

        {/* Profile picture */}
        <Card className="opacity-60">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Profile Picture</p>
                <p className="text-xs text-muted-foreground">
                  Upload a custom avatar
                </p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
              Planned
            </span>
          </CardContent>
        </Card>

        {/* Session management */}
        <Card className="opacity-60">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Laptop className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Active Sessions</p>
                <p className="text-xs text-muted-foreground">
                  View and manage logged-in devices
                </p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
              Planned
            </span>
          </CardContent>
        </Card>

        {/* Login history */}
        <Card className="opacity-60">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Login History</p>
                <p className="text-xs text-muted-foreground">
                  Audit trail of account access
                </p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
              Planned
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Role reference */}
      <Alert>
        <AlertDescription className="text-sm">
          <Shield className="w-4 h-4 inline mr-2" />
          <strong>Role display:</strong> Custom role names (e.g., "EO Head") are shown first,
          with the fallback role (e.g., "Admin") in parentheses. Fallback roles determine
          your actual permissions in the system.
        </AlertDescription>
      </Alert>
    </div>
  );
}
