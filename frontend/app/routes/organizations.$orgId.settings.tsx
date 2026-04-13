import { useFetcher, useLoaderData, useNavigate, useParams } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { RBAC } from "~/types/rbac";
import type { User } from "~/types";
import { Button, Input, Label, Card, CardContent, CardHeader, CardDescription, Alert, AlertDescription, Select } from "~/components/ui";
import { Save, Building2 } from "lucide-react";
import { useToast } from "~/hooks/use-toast";
import { useEffect, useRef } from "react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const orgId = params.orgId!;

  // Only ADMIN and SUPERADMIN can manage org settings
  if (!RBAC.canManageOrg(user, orgId)) {
    throw redirect("/");
  }

  const org = await api.get<any>(`/api/organizations/${orgId}/`, token, request);

  return { org, orgId };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  const user = await requireUser(request);
  const orgId = params.orgId!;

  // Only ADMIN and SUPERADMIN can manage org settings
  if (!RBAC.canManageOrg(user, orgId)) {
    return data({ error: "Insufficient permissions" }, { status: 403 });
  }

  const formData = await request.formData();
  const orgData: Record<string, any> = {};

  const name = formData.get("name");
  if (typeof name === "string" && name.trim()) {
    orgData.name = name.trim();
  }

  const slug = formData.get("slug");
  if (typeof slug === "string" && slug.trim()) {
    orgData.slug = slug.trim();
  }

  const status = formData.get("status");
  if (typeof status === "string" && status) {
    orgData.status = status;
  }

  const subscriptionTier = formData.get("subscription_tier");
  if (typeof subscriptionTier === "string" && subscriptionTier) {
    orgData.subscription_tier = subscriptionTier;
  }

  try {
    await api.patch(`/api/organizations/${orgId}/`, orgData, token, request);
    return { success: true };
  } catch (error: any) {
    if (error.status === 401) {
      throw error;
    }
    return data(
      { 
        success: false, 
        error: error.body?.detail || error.message || "Failed to update organization" 
      },
      { status: error.status || 500 }
    );
  }
}

export default function OrganizationSettingsRoute() {
  const { org } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const hasShownToast = useRef(false);

  // Show success toast when fetcher completes
  useEffect(() => {
    if (fetcher.data && !hasShownToast.current) {
      if ("success" in fetcher.data && fetcher.data.success) {
        toastSuccess("Organization updated", "Your changes have been saved successfully.");
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Organization Settings
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage organization details and subscription
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/organizations/${org.id}`)}
        >
          ← Back
        </Button>
      </div>

      {fetcher.data && "error" in fetcher.data && fetcher.data.error && (
        <Alert variant="destructive">
          <AlertDescription>{fetcher.data.error}</AlertDescription>
        </Alert>
      )}

      <fetcher.Form method="post" className="space-y-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <CardDescription>
              Update your organization's name and URL slug
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={org.name}
                placeholder="Acme Corporation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={org.slug || ""}
                placeholder="acme-corp"
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs and for custom domain mapping
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Status & Subscription</h3>
            <CardDescription>
              Manage organization status and subscription tier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                name="status"
                defaultValue={org.status}
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "TRIAL", label: "Trial" },
                  { value: "SUSPENDED", label: "Suspended" },
                ]}
              />
              <p className="text-xs text-muted-foreground">
                Suspended organizations cannot access the platform
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription_tier">Subscription Tier</Label>
              <Select
                id="subscription_tier"
                name="subscription_tier"
                defaultValue={org.subscription_tier}
                options={[
                  { value: "FREE", label: "Free" },
                  { value: "STANDARD", label: "Standard" },
                  { value: "ENTERPRISE", label: "Enterprise" },
                ]}
              />
              <p className="text-xs text-muted-foreground">
                Determines feature access and usage limits
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/organizations/${org.id}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </fetcher.Form>
    </div>
  );
}
