import { useLoaderData, Link, Form, redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { Plus, FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  Button, 
  Badge 
} from "~/components/ui";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const orgId = params.orgId;

  if (user.role !== "ADMIN" && String(user.organization_id) !== String(orgId)) {
    throw new Response("Access denied", { status: 403 });
  }

  const response = await api.get<any>(`/api/organizations/${orgId}/templates/`, token).catch(() => []);
  const templates = Array.isArray(response) ? response : (response?.results || []);

  return { templates, orgId, user };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const orgId = params.orgId;

  if (intent === "create-template") {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    try {
      await api.post(`/api/organizations/${orgId}/templates/`, { 
        name, 
        description,
        organization: orgId 
      }, token);
      return redirect(`/organizations/${orgId}/templates`);
    } catch (err: any) {
      return { error: err.message ?? "Failed to create template" };
    }
  }

  if (intent === "delete-template") {
    const templateId = formData.get("template_id") as string;
    try {
      await api.delete(`/api/organizations/${orgId}/templates/${templateId}/`, token);
      return redirect(`/organizations/${orgId}/templates`);
    } catch (err: any) {
      return { error: err.message ?? "Failed to delete template" };
    }
  }

  return { error: "Unknown intent" };
}

export default function TemplatesRoute() {
  const { templates, orgId } = useLoaderData<typeof loader>();
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Assessment Templates</h1>
          <p className="text-sm text-muted-foreground">Define your ESG criteria and question sets.</p>
        </div>
        <Button size="sm" onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-muted rounded-lg border-2 border-dashed">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No templates created yet.</p>
          </div>
        ) : (
          templates.map((template: any) => (
            <Card key={template.id}>
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.description || "No description provided."}
                    </p>
                  </div>
                  <Badge variant="secondary">{template.is_system ? "System" : "Custom"}</Badge>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <Link 
                    to={`/organizations/${orgId}/templates/${template.id}`} 
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    Edit Questions →
                  </Link>
                  <Form method="post">
                    <input type="hidden" name="intent" value="delete-template" />
                    <input type="hidden" name="template_id" value={template.id} />
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-8 w-8 p-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Form>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Create New Template</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full" 
                  onClick={() => setIsCreating(false)}
                >
                  ×
                </Button>
              </div>
              
              <Form method="post" className="space-y-4">
                <input type="hidden" name="intent" value="create-template" />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Template Name</label>
                  <input 
                    name="name" 
                    placeholder="e.g. 2026 Annual ESG Assessment" 
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <textarea 
                    name="description" 
                    placeholder="Briefly describe the purpose of this template..." 
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background min-h-[100px]" 
                  />
                </div>
                
                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Template</Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
