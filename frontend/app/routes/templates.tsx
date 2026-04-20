import { useState, useEffect } from "react";
import { useLoaderData, Link, Form, redirect, useFetcher, useActionData } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { Plus, FileText, Lock, Users, Copy, Sparkles } from "lucide-react";
import { Card, CardContent, Button, Badge, Input, Label } from "~/components/ui";
import { TemplateCard } from "~/components/TemplateCard";
import { useToast } from "~/hooks/use-toast";
import { useFetcherToast } from "~/hooks/use-fetcher-toast";
import { RBAC } from "~/types/rbac";
import { ConfirmDialog } from "~/components/ConfirmDialog";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);

  // Platform-level template management remains superuser-only.
  const templates = await api.get<any[]>(
    user.isSuperuser ? "/api/templates/" : "/api/templates/public/",
    token,
    request,
  );

  return {
    templates: Array.isArray(templates) ? templates : (templates as any)?.results ?? [],
    user,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "duplicate-template") {
    const templateId = formData.get("template_id") as string;
    const version = formData.get("version") as string || "2.0.0";
    const versionNotes = formData.get("version_notes") as string;

    try {
      const result = await api.post<any>(
        `/api/templates/${templateId}/duplicate/`,
        { version, version_notes: versionNotes },
        token,
        request
      );

      return {
        success: true,
        message: `Template duplicated as v${version}`,
        intent,
        newTemplateId: result.new_template_id,
      };
    } catch (err: any) {
      return { error: err.message ?? "Failed to duplicate template" };
    }
  }

  if (intent === "publish-template") {
    const templateId = formData.get("template_id") as string;

    try {
      await api.post<any>(
        `/api/templates/${templateId}/publish/`,
        {},
        token,
        request
      );

      return {
        success: true,
        message: "Template published successfully",
        intent,
      };
    } catch (err: any) {
      return { error: err.message ?? "Failed to publish template" };
    }
  }

  if (intent === "delete-template") {
    const templateId = formData.get("template_id") as string;

    try {
      await api.delete(
        `/api/templates/${templateId}/`,
        token,
        request
      );

      return {
        success: true,
        message: "Template deleted successfully",
        intent,
      };
    } catch (err: any) {
      return { error: err.message ?? "Failed to delete template" };
    }
  }

  return { error: "Unknown intent" };
}

export default function TemplatesRoute() {
  const { templates, user } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const { success: toastSuccess, error: toastError } = useToast();
  const { handleFetcherResult } = useFetcherToast();
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [templateToPublish, setTemplateToPublish] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);

  // Handle fetcher results with automatic toast
  useEffect(() => {
    handleFetcherResult(fetcher, {
      success: (data) => {
        toastSuccess("Success", data.message);
        // Refresh the page to show updated status after publish
        if (data.intent === "publish-template") {
          window.location.reload();
        }
      },
      error: (data) => {
        toastError("Failed", data.error);
      },
    });
  }, [fetcher, toastSuccess, toastError]);

  const handleDuplicate = (template: any) => {
    setSelectedTemplate(template);
    setDuplicateModalOpen(true);
  };

  const handlePublishClick = (template: any) => {
    setTemplateToPublish(template);
    setPublishModalOpen(true);
  };

  const confirmPublish = () => {
    if (templateToPublish) {
      fetcher.submit(
        { intent: "publish-template", template_id: templateToPublish.id },
        { method: "post" }
      );
      setPublishModalOpen(false);
      setTemplateToPublish(null);
    }
  };

  const handlePublish = (templateId: string) => {
    fetcher.submit(
      { intent: "publish-template", template_id: templateId },
      { method: "post" }
    );
  };

  const handleEdit = (template: any) => {
    // Navigate to edit page
    window.location.href = `/templates/${template.id}`;
  };

  const handleDelete = (template: any) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      fetcher.submit(
        { intent: "delete-template", template_id: templateToDelete.id },
        { method: "post" }
      );
      setTemplateToDelete(null);
    }
  };

  const canManageTemplates = RBAC.canManageTemplates(user);

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assessment Templates</h1>
          <p className="text-muted-foreground mt-1">
            {canManageTemplates
              ? "Create and manage master assessment templates" 
              : "Browse available assessment templates"}
          </p>
        </div>
        {canManageTemplates && (
          <Link to="/templates/new" className="inline-flex">
            <Button variant="default">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{templates.length}</p>
                <p className="text-sm text-muted-foreground">Total Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Lock className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {templates.filter((t: any) => t.status === "PUBLISHED").length}
                </p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {templates.filter((t: any) => t.is_public).length}
                </p>
                <p className="text-sm text-muted-foreground">Public Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template List */}
      <div className="grid gap-4">
        {templates.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-lg border-2 border-dashed">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No templates yet</h3>
            <p className="text-muted-foreground mb-4">
              {canManageTemplates
                ? "Create your first assessment template"
                : "No public templates available"}
            </p>
            {canManageTemplates && (
              <Link to="/templates/new" className="inline-flex">
                <Button>Create Template</Button>
              </Link>
            )}
          </div>
        ) : (
          templates.map((template: any) => (
            <TemplateCard
              key={template.id}
              template={template}
              canEdit={canManageTemplates}
              onDuplicate={() => handleDuplicate(template)}
              onPublish={() => handlePublishClick(template)}
              onEdit={() => handleEdit(template)}
              onDelete={() => handleDelete(template)}
            />
          ))
        )}
      </div>

      {/* Duplicate Modal */}
      {duplicateModalOpen && selectedTemplate && (
        <fetcher.Form method="post" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Duplicate Template</h3>
              <p className="text-sm text-muted-foreground">
                Creating a copy of "{selectedTemplate.name}"
              </p>

              <div className="space-y-2">
                <Label htmlFor="version">New Version</Label>
                <Input
                  id="version"
                  name="version"
                  defaultValue="2.0.0"
                  placeholder="e.g., 2.0.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="version_notes">Version Notes</Label>
                <textarea
                  id="version_notes"
                  name="version_notes"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="What changed in this version?"
                />
              </div>

              <input
                type="hidden"
                name="intent"
                value="duplicate-template"
              />
              <input
                type="hidden"
                name="template_id"
                value={selectedTemplate.id}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDuplicateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={fetcher.state === "submitting"}>
                  {fetcher.state === "submitting" ? "Duplicating..." : "Duplicate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </fetcher.Form>
      )}

      {/* Publish Confirmation Modal */}
      {publishModalOpen && templateToPublish && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Publish Template</h3>
              <p className="text-sm text-muted-foreground">
                Publishing "{templateToPublish.name}" will make it immutable. 
                You will not be able to edit it after publishing.
              </p>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPublishModalOpen(false);
                    setTemplateToPublish(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={confirmPublish}
                  disabled={fetcher.state === "submitting"}
                >
                  {fetcher.state === "submitting" ? "Publishing..." : "Publish"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Template Confirmation Dialog */}
      {templateToDelete && (
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Template"
          description={`Are you sure you want to delete "${templateToDelete.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
