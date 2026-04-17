import { useEffect, useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { ArrowLeft, Save, X, Plus, Trash2, Lock, CheckCircle } from "lucide-react";
import { Card, CardContent, Button, Input, Label, Badge } from "~/components/ui";
import { useToast } from "~/hooks/use-toast";
import { useFetcherToast } from "~/hooks/use-fetcher-toast";
import { RBAC } from "~/types/rbac";
import { FrameworkMappingBadge } from "~/components/FrameworkMappingBadge";
import { FrameworkMappingModal } from "~/components/FrameworkMappingModal";
import { ConfirmDialog } from "~/components/ConfirmDialog";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const { id } = params;

  // Check RBAC - SUPERADMIN can view all, others only if canManageTemplates
  if (!RBAC.canManageTemplates(user, "")) {
    return { 
      template: null, 
      questions: [], 
      user, 
      templateId: id,
      accessDenied: true 
    };
  }

  const template = await api.get<any>(`/api/templates/${id}/`, token, request)
    .catch(() => null);
  
  const questions = await api.get<any>(`/api/templates/${id}/questions/`, token, request)
    .then(res => Array.isArray(res) ? res : (res?.results || []))
    .catch(() => []);

  return { 
    template, 
    questions, 
    user, 
    templateId: id,
    accessDenied: !template 
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const { id } = params;

  if (intent === "update-template") {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const version = formData.get("version") as string;

    try {
      await api.patch(
        `/api/templates/${id}/`,
        { name, description, version },
        token,
        request
      );
      return { success: true, message: "Template updated", intent };
    } catch (err: any) {
      return { error: err.message ?? "Failed to update template" };
    }
  }

  if (intent === "publish-template") {
    try {
      await api.post(`/api/templates/${id}/publish/`, {}, token, request);
      return { success: true, message: "Template published successfully", intent };
    } catch (err: any) {
      return { error: err.message ?? "Failed to publish template" };
    }
  }

  if (intent === "add-question") {
    const text = formData.get("text") as string;
    const category = formData.get("category") as string;
    const isRequired = formData.get("is_required") === "on";

    try {
      await api.post(
        `/api/templates/${id}/questions/`,
        { text, category, is_required: isRequired, framework_mappings: [] },
        token,
        request
      );
      return { success: true, message: "Question added", intent };
    } catch (err: any) {
      return { error: err.message ?? "Failed to add question" };
    }
  }

  if (intent === "delete-question") {
    const questionId = formData.get("question_id") as string;
    try {
      await api.delete(`/api/templates/${id}/questions/${questionId}/`, token, request);
      return { success: true, message: "Question deleted", intent };
    } catch (err: any) {
      return { error: err.message ?? "Failed to delete question" };
    }
  }

  if (intent === "add-mapping") {
    const questionId = formData.get("question_id") as string;
    const frameworkId = formData.get("framework_id") as string;
    const provisionCode = formData.get("provision_code") as string;
    const provisionName = formData.get("provision_name") as string;

    try {
      const result = await api.post(
        `/api/questions/${questionId}/mappings/`,
        {
          framework_id: frameworkId,
          provision_code: provisionCode,
          provision_name: provisionName,
        },
        token,
        request
      );
      return { 
        success: true, 
        message: "Mapping added",
        intent,
        questionId,
        mappings: (result as any).mappings || [],
      };
    } catch (err: any) {
      return { error: err.message ?? "Failed to add mapping" };
    }
  }

  if (intent === "remove-mapping") {
    const questionId = formData.get("question_id") as string;
    const mappingIndex = formData.get("mapping_index") as string;

    try {
      const result = await api.delete(
        `/api/questions/${questionId}/mappings/${mappingIndex}/`,
        token,
        request
      );
      return { 
        success: true, 
        message: "Mapping removed",
        intent,
        questionId,
        mappings: (result as any).mappings || [],
      };
    } catch (err: any) {
      return { error: err.message ?? "Failed to remove mapping" };
    }
  }

  return { error: "Unknown intent" };
}

interface Question {
  id: string;
  text: string;
  order: number;
  category: string;
  is_required: boolean;
  framework_mappings?: any[];
}

export default function TemplateDetailRoute() {
  const { template, questions, user, templateId, accessDenied } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const { success: toastSuccess, error: toastError } = useToast();
  const { handleFetcherResult } = useFetcherToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<{ id: string; text: string } | null>(null);

  // Handle fetcher results with automatic toast and state management
  useEffect(() => {
    handleFetcherResult(fetcher, {
      success: (data) => {
        toastSuccess("Success", data.message);
        // Reset adding question state after successful add/delete
        if (data.intent === "add-question" || data.intent === "delete-question") {
          setIsAddingQuestion(false);
        }
      },
      error: (data) => {
        toastError("Failed", data.error);
      },
    });
  }, [fetcher, toastSuccess, toastError]);

  if (accessDenied || !template) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to view this template.
          </p>
          <Button onClick={() => window.history.back()}>
            ← Go Back
          </Button>
        </div>
      </div>
    );
  }

  const canEdit = template.status === "DRAFT";
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  const handleMappingAdded = (questionId: string, newMappings: any[]) => {
    // Mappings are now updated via fetcher action
    // The page will reload with updated data
    setMappingModalOpen(false);
    toastSuccess("Mapping added", "Framework mapping updated");
  };

  const handleDeleteQuestion = (question: { id: string; text: string }) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteQuestion = () => {
    if (questionToDelete) {
      fetcher.submit(
        { intent: "delete-question", question_id: questionToDelete.id },
        { method: "post" }
      );
      setQuestionToDelete(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{template.name}</h1>
            <Badge variant="secondary">v{template.version}</Badge>
            <Badge className={
              template.status === "PUBLISHED" 
                ? "bg-green-100 text-green-800" 
                : "bg-yellow-100 text-yellow-800"
            }>
              {template.status === "PUBLISHED" ? (
                <><CheckCircle className="w-3 h-3 mr-1" /> Published</>
              ) : (
                <><Lock className="w-3 h-3 mr-1" /> Draft</>
              )}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{template.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel" : "Edit Details"}
              </Button>
              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="publish-template" />
                <Button type="submit" variant="default">
                  Publish Template
                </Button>
              </fetcher.Form>
            </>
          )}
          {!canEdit && (
            <Badge variant="outline" className="px-3 py-1">
              <Lock className="w-3 h-3 mr-2" />
              Published (Immutable)
            </Badge>
          )}
        </div>
      </div>

      {/* Edit Template Details */}
      {isEditing && canEdit && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Edit Template Details</h3>
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="update-template" />
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={template.name}
                    placeholder="Template name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    defaultValue={template.description}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    name="version"
                    defaultValue={template.version}
                    placeholder="e.g., 1.0.0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </fetcher.Form>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Questions ({questions.length})
            </h3>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingQuestion(!isAddingQuestion)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            )}
          </div>

          {/* Add Question Form */}
          {isAddingQuestion && canEdit && (
            <fetcher.Form method="post" className="p-4 border rounded-lg space-y-3 bg-muted/50">
              <input type="hidden" name="intent" value="add-question" />
              
              <div className="space-y-2">
                <Label htmlFor="question-text">Question Text *</Label>
                <textarea
                  id="question-text"
                  name="text"
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="Enter the question..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    placeholder="e.g., Environmental"
                  />
                </div>

                <div className="space-y-2 flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_required"
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Required</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingQuestion(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Add Question
                </Button>
              </div>
            </fetcher.Form>
          )}

          {/* Questions */}
          <div className="space-y-3">
            {sortedQuestions.map((question: Question, index: number) => (
              <div
                key={question.id}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        Q{question.order}
                      </Badge>
                      {question.category && (
                        <Badge variant="outline" className="text-xs">
                          {question.category}
                        </Badge>
                      )}
                      {question.is_required && (
                        <Badge variant="outline" className="text-xs text-red-600">
                          Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{question.text}</p>
                    
                    {/* Framework Mappings */}
                    {question.framework_mappings && question.framework_mappings.length > 0 && (
                      <div className="mt-2">
                        <FrameworkMappingBadge
                          mappings={question.framework_mappings}
                          canEdit={canEdit}
                          onAdd={() => {
                            setSelectedQuestion(question);
                            setMappingModalOpen(true);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteQuestion({ id: question.id, text: question.text })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {questions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No questions yet.</p>
                {canEdit && (
                  <Button
                    variant="link"
                    onClick={() => setIsAddingQuestion(true)}
                  >
                    Add your first question
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mapping Modal */}
      {selectedQuestion && (
        <FrameworkMappingModal
          open={mappingModalOpen}
          onOpenChange={setMappingModalOpen}
          questionId={selectedQuestion.id}
          organizationId=""
          currentMappings={selectedQuestion.framework_mappings || []}
          onMappingAdded={(mappings) => handleMappingAdded(selectedQuestion.id, mappings)}
          onMappingRemoved={(mappings) => handleMappingAdded(selectedQuestion.id, mappings)}
        />
      )}

      {/* Delete Question Confirmation Dialog */}
      {questionToDelete && (
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Question"
          description={`Are you sure you want to delete "${questionToDelete.text.substring(0, 100)}${questionToDelete.text.length > 100 ? "..." : ""}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
          onConfirm={confirmDeleteQuestion}
        />
      )}
    </div>
  );
}
