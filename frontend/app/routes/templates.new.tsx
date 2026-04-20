import { useState, useEffect } from "react";
import { useLoaderData, Form, redirect, useNavigate, useFetcher,useActionData } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { ArrowLeft, Save, X } from "lucide-react";
import { Card, CardContent, Button, Input, Label, Badge } from "~/components/ui";
import { useToast } from "~/hooks/use-toast";
import { useFetcherToast } from "~/hooks/use-fetcher-toast";
import { RBAC } from "~/types/rbac";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  // Use RBAC pattern for permission check
  if (!RBAC.canManageTemplates(user, "")) {
    // Return accessDenied flag instead of throwing 403
    return { 
      frameworks: [], 
      user, 
      accessDenied: true 
    };
  }

  const token = await getUserToken(request);
  const frameworks = await api.get<any[]>("/api/frameworks/", token, request);

  return {
    frameworks: Array.isArray(frameworks) ? frameworks : [],
    user,
    accessDenied: false,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "create-template") {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const framework = formData.get("framework") as string;
    const isPublic = formData.get("is_public") === "on";
    const ownerOrg = formData.get("owner_org") as string;

    try {
      const template = await api.post<any>(
        "/api/templates/",
        {
          name,
          description,
          framework: framework || null,
          is_public: isPublic,
          owner_org: ownerOrg || null,
          version: "1.0.0",
        },
        token,
        request
      );

      return redirect(`/templates/${template.id}`);
    } catch (err: any) {
      return { error: err.message ?? "Failed to create template" };
    }
  }

  return { error: "Unknown intent" };
}

export default function NewTemplateRoute() {
  const { frameworks, user, accessDenied } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Show toast for action errors
  useEffect(() => {
    if (actionData?.error) {
      toastError("Failed to Create Template", actionData.error);
    }
  }, [actionData, toastError]);

  // Render access denied UI if user doesn't have permission
  if (accessDenied) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to create templates. Contact your administrator.
          </p>
          <Button onClick={() => navigate("/templates")}>
            ← Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  const validate = () => {
    const errors: Record<string, string> = {};
    
    const name = (document.getElementById("name") as HTMLInputElement)?.value;
    if (!name || name.trim().length < 3) {
      errors.name = "Name must be at least 3 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (!validate()) {
      toastError("Validation Error", "Please fix the form errors");
      e.preventDefault();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/templates")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Template</h1>
          <p className="text-muted-foreground">
            Define a master assessment template
          </p>
        </div>
      </div>

      <Form method="post" onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="intent" value="create-template" />

        {/* Basic Info */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Supplier Due Diligence 2026"
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="Describe the purpose and scope of this template..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="framework">Framework (Optional)</Label>
              <select
                id="framework"
                name="framework"
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">No framework</option>
                {frameworks.map((fw: any) => (
                  <option key={fw.id} value={fw.id}>
                    {fw.name} {fw.version && `(${fw.version})`}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Visibility */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Visibility & Tenancy</h3>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <input
                type="checkbox"
                id="is_public"
                name="is_public"
                className="w-4 h-4"
              />
              <div className="flex-1">
                <Label htmlFor="is_public" className="font-medium">
                  Public Template
                </Label>
                <p className="text-sm text-muted-foreground">
                  If checked, all organizations can see and instantiate this template.
                  If unchecked, only the owner organization can use it.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_org">Owner Organization (Optional)</Label>
              <Input
                id="owner_org"
                name="owner_org"
                placeholder="Organization UUID (leave blank for global)"
                type="text"
              />
              <p className="text-sm text-muted-foreground">
                If set, this template is scoped to a specific client organization.
                Leave blank for global templates.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/templates")}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </Form>
    </div>
  );
}
