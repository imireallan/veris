import { useLoaderData, Form, redirect, Link } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { ArrowLeft, Calendar, CheckCircle, Building2 } from "lucide-react";
import { Card, CardContent, Button, Input, Label, Badge } from "~/components/ui";
import { RBAC } from "~/types/rbac";
import { useState } from "react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const { orgId, templateId } = params;

  // Check RBAC - must be org member with assessment creation permission
  const isMember = RBAC.isOrgMember(user, orgId!);
  const canCreate = RBAC.canCreateAssessments(user, orgId);
  
  if (!isMember || !canCreate) {
    return { 
      template: null, 
      sites: [], 
      orgId, 
      templateId, 
      user, 
      accessDenied: true 
    };
  }

  const template = await api.get<any>(`/api/templates/${templateId}/`, token, request)
    .catch(() => null);

  if (!template) {
    return { 
      template: null, 
      sites: [], 
      orgId, 
      templateId, 
      user, 
      accessDenied: false,
      notFound: true 
    };
  }

  // Only published templates can be instantiated
  if (template.status !== "PUBLISHED") {
    return { 
      template, 
      sites: [], 
      orgId, 
      templateId, 
      user, 
      accessDenied: false,
      notPublished: true 
    };
  }

  // Get sites for optional site selection
  const sitesResponse = await api.get<any>(`/api/organizations/${orgId}/sites/`, token, request)
    .catch(() => ({ results: [] }));
  const sites = Array.isArray(sitesResponse) ? sitesResponse : sitesResponse?.results || [];

  return { template, sites, orgId, templateId, user, accessDenied: false };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  const formData = await request.formData();
  const { orgId, templateId } = params;

  const startDate = formData.get("start_date") as string;
  const dueDate = formData.get("due_date") as string;
  const siteId = formData.get("site_id") as string || undefined;
  const assessmentName = formData.get("assessment_name") as string;

  try {
    const result = await api.post<any>(
      `/api/templates/${templateId}/instantiate/`,
      {
        organization_id: orgId,
        site_id: siteId,
        start_date: startDate || new Date().toISOString(),
        due_date: dueDate || undefined,
        name: assessmentName || undefined,
      },
      token,
      request
    );

    // Redirect to assessments list
    return redirect(`/organizations/${orgId}/assessments`);
  } catch (err: any) {
    return { error: err.message ?? "Failed to create assessment" };
  }
}

export default function InstantiateAssessmentRoute() {
  const { template, sites, orgId, templateId, user, accessDenied, notFound, notPublished } = useLoaderData<typeof loader>();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  if (accessDenied) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-medium">Access Denied</h2>
        <p className="text-muted-foreground">
          You don't have permission to create assessments.
        </p>
        <Link to={`/organizations/${orgId}/templates`} className="text-primary hover:underline">
          ← Back to templates
        </Link>
      </div>
    );
  }

  if (notFound || !template) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-medium">Template Not Found</h2>
        <p className="text-muted-foreground">
          The template you're looking for doesn't exist.
        </p>
        <Link to={`/organizations/${orgId}/templates`} className="text-primary hover:underline">
          ← Back to templates
        </Link>
      </div>
    );
  }

  if (notPublished) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-medium">Template Not Published</h2>
        <p className="text-muted-foreground">
          Only published templates can be instantiated. Please publish the template first.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Link to={`/organizations/${orgId}/templates/${templateId}`}>
            <Button>Edit Template</Button>
          </Link>
          <Link to={`/organizations/${orgId}/templates`}>
            <Button variant="outline">Back to Templates</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/organizations/${orgId}/templates`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Assessment</h1>
          <p className="text-muted-foreground">
            Instantiate from template: {template.name}
          </p>
        </div>
      </div>

      <Form method="post" className="space-y-6">
        {/* Template Info */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Template Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Template Name</Label>
                <p className="font-medium">{template.name}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Version</Label>
                <p className="font-medium">{template.version}</p>
              </div>
              {template.framework && (
                <div>
                  <Label className="text-sm text-muted-foreground">Framework</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{template.framework.name}</Badge>
                  </div>
                </div>
              )}
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <Badge variant={template.status === "PUBLISHED" ? "default" : "secondary"}>
                  {template.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Details */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Assessment Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="assessment_name">Assessment Name (Optional)</Label>
              <Input
                id="assessment_name"
                name="assessment_name"
                placeholder={`e.g. ${template.name} - 2026`}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to auto-generate from template name
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date (Optional)</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                />
              </div>
            </div>

            {sites.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="site_id">Site (Optional)</Label>
                <select
                  id="site_id"
                  name="site_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">No specific site (Organization-level)</option>
                  {sites.map((site: any) => (
                    <option key={site.id} value={site.id}>
                      {site.name} {site.code && `(${site.code})`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Select a site if this assessment is site-specific
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Template: <strong>{template.name}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Organization: <strong>{user.activeOrganization?.name || "Selected Org"}</strong></span>
              </div>
              {template.framework && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Framework: <strong>{template.framework.name}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Questions: <strong>{template.question_count || "Auto-populated from template"}</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <Link to={`/organizations/${orgId}/templates`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" className="gap-2">
            <Calendar className="w-4 h-4" />
            Create Assessment
          </Button>
        </div>
      </Form>
    </div>
  );
}
