import { useLoaderData, Link, Form, redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { Plus, Save, Trash2, MessageSquare, GripVertical, CheckCircle, Layers } from "lucide-react";
import { 
  Card, 
  CardContent, 
  Button, 
  Badge,
  Input,
  Textarea,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "~/components/ui";
import { useState } from "react";
import { RBAC } from "~/types/rbac";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const { orgId, templateId } = params;

  // Check RBAC - return empty state instead of throwing
  const isMember = RBAC.isOrgMember(user, orgId!);
  if (!isMember) {
    return { template: null, questions: [], orgId, templateId, user, accessDenied: true };
  }

  // Use platform templates endpoint (not org-scoped)
  const template = await api.get<any>(`/api/templates/${templateId}/`, token, request)
    .catch(() => null);
  const questions = await api.get<any>(`/api/templates/${templateId}/questions/`, token, request)
    .then(res => Array.isArray(res) ? res : (res?.results || []))
    .catch(() => []);

  return { template, questions, orgId, templateId, user, accessDenied: false };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const { orgId, templateId } = params;

  if (intent === "publish-template") {
    try {
      await api.post(`/api/templates/${templateId}/publish/`, {}, token, request);
      return redirect(`/organizations/${orgId}/templates/${templateId}`);
    } catch (err: any) {
      if (err instanceof Response && err.status === 302) throw err;
      return { error: err.message ?? "Failed to publish template" };
    }
  }

  if (intent === "add-question") {
    const questionText = formData.get("text") as string;
    const category = formData.get("category") as string;
    const type = formData.get("type") as string;

    try {
      await api.post(`/api/organizations/${orgId}/templates/${templateId}/questions/`, {
        text: questionText,
        category: category,
        type: type,
        template: templateId
      }, token, request);
      return redirect(`/organizations/${orgId}/templates/${templateId}`);
    } catch (err: any) {
      if (err instanceof Response && err.status === 302) throw err;
      return { error: err.message ?? "Failed to add question" };
    }
  }

  if (intent === "delete-question") {
    const questionId = formData.get("question_id") as string;
    try {
      await api.delete(`/api/organizations/${orgId}/templates/${templateId}/questions/${questionId}/`, token, request);
      return redirect(`/organizations/${orgId}/templates/${templateId}`);
    } catch (err: any) {
      if (err instanceof Response && err.status === 302) throw err;
      return { error: err.message ?? "Failed to delete question" };
    }
  }

  return { error: "Unknown intent" };
}

type TemplateQuestion = {
  id: string;
  text?: string | null;
  description?: string | null;
  category?: string | null;
  order?: number | null;
  hierarchy?: Array<{ level?: string; code?: string | number | null; label?: string | null }>;
  scoring_criteria?: Record<string, unknown> | null;
  external_question_id?: string | null;
  performance_target_level?: number | null;
  is_required?: boolean;
};

type TemplateQuestionGroup = {
  key: string;
  title: string;
  subtitle?: string;
  questions: TemplateQuestion[];
  sortParts: number[];
  order: number;
};

type HierarchyItem = { level?: string; code?: string | number | null; label?: string | null };

function formatHierarchyItem(item?: HierarchyItem | null) {
  if (!item) return "";
  const code = item.code == null ? "" : String(item.code).trim();
  const label = (item.label || "").trim();
  if (code && label && code !== label) return `${code}. ${label}`;
  return label || code;
}

function normalizeHierarchyPart(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseHierarchySortParts(item: HierarchyItem | undefined, fallbackOrder: number) {
  const raw = item?.code == null ? "" : String(item.code).trim();
  const matches = raw.match(/\d+(?:\.\d+)*/g);
  if (!matches?.length) return [fallbackOrder];
  return matches[0].split(".").map((part) => Number(part));
}

function compareSortParts(a: number[], b: number[]) {
  const maxLength = Math.max(a.length, b.length);
  for (let index = 0; index < maxLength; index += 1) {
    const left = a[index] ?? -1;
    const right = b[index] ?? -1;
    if (left !== right) return left - right;
  }
  return 0;
}

function getHierarchyIdentity(prefix: string, item: HierarchyItem | undefined, fallback: string) {
  const level = normalizeHierarchyPart(item?.level || prefix);
  const code = item?.code == null ? "" : String(item.code).trim();
  const label = (item?.label || "").trim();
  if (code) return `${prefix}|${level}|code:${normalizeHierarchyPart(code)}`;
  if (label) return `${prefix}|${level}|label:${normalizeHierarchyPart(label)}`;
  return `${prefix}|${level}|fallback:${normalizeHierarchyPart(fallback)}`;
}

function getQuestionCode(question: TemplateQuestion, index: number) {
  return question.external_question_id || (question.order ? `Q${question.order}` : `Q${index + 1}`);
}

function getQuestionProvision(question: TemplateQuestion) {
  const hierarchy = Array.isArray(question.hierarchy) ? question.hierarchy : [];
  const provision =
    hierarchy.find((item) => (item.level || "").toLowerCase() === "provision") ||
    hierarchy[2];
  return provision;
}

function isWeakImportedQuestionText(text?: string | null) {
  if (!text) return true;
  const normalized = text.trim();
  return normalized === "" || /^\d+(?:\.\d+)?$/.test(normalized);
}

function getQuestionDisplayText(question: TemplateQuestion) {
  const criteria = question.scoring_criteria || {};
  const provisionCode = criteria.provision_code;
  const provision = getQuestionProvision(question);
  const provisionTitle = formatHierarchyItem(provision);

  if (!isWeakImportedQuestionText(question.text)) return question.text!.trim();
  if (typeof provisionCode === "string" && provisionCode.trim()) return provisionCode.trim();
  if (provisionTitle) return provisionTitle;
  return question.text?.trim() || "Untitled question";
}

function normalizeInputType(question: TemplateQuestion) {
  const criteria = question.scoring_criteria || {};
  const rawType = criteria.type || criteria.input_type || criteria.response_type || criteria.question_type;
  const normalized = typeof rawType === "string" ? rawType.toLowerCase().replace(/[\s-]/g, "_") : "";

  if (["select_one", "select", "choice", "yes_no", "single_choice", "select_one_checkbox"].includes(normalized)) {
    return "select_one";
  }
  if (["select_multiple", "multi_select", "multiple_choice", "checkboxes"].includes(normalized)) {
    return "select_multiple";
  }
  if (["integer", "number", "score"].includes(normalized)) return normalized === "integer" ? "integer" : "number";
  if (normalized === "date") return "date";
  if (normalized === "files" || normalized === "file") return "files";
  if (normalized === "short_text") return "short_text";
  if (Array.isArray(criteria.choices) || Array.isArray(criteria.options) || Array.isArray(criteria.rating_choices)) return "select_one";
  if (criteria.min != null || criteria.max != null) return "number";
  return "text";
}

function getScoringType(question: TemplateQuestion) {
  const criteria = question.scoring_criteria || {};
  const type = normalizeInputType(question);
  if (Array.isArray(criteria.rating_choices)) return "rating";
  if (type === "select_one") return "single choice";
  if (type === "select_multiple") return "multiple choice";
  if (type === "integer" || type === "number") return "score";
  if (type === "short_text") return "short text";
  return type === "text" ? "narrative" : type.replace(/_/g, " ");
}

function shouldShowPerformanceTarget(question: TemplateQuestion) {
  if (!question.performance_target_level) return false;

  const hasPtHierarchy = (question.hierarchy || []).some((item) => {
    const level = (item.level || "").toLowerCase();
    return level === "pt" || level === "performance_target" || level === "performance target";
  });

  const externalId = question.external_question_id || "";
  const looksLikeEo100Id = /^\d+\.\d+\.\d+\.\d+$/.test(externalId);
  return hasPtHierarchy || looksLikeEo100Id;
}

function getTemplateQuestionGroups(questions: TemplateQuestion[]): TemplateQuestionGroup[] {
  const groups = new Map<string, TemplateQuestionGroup>();

  questions.forEach((question, index) => {
    const hierarchy = Array.isArray(question.hierarchy) ? question.hierarchy : [];
    const primary = hierarchy[0];
    const fallbackCategory = question.category || "General";
    const title = formatHierarchyItem(primary) || fallbackCategory;
    const key = getHierarchyIdentity("primary", primary, fallbackCategory);

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        title,
        subtitle: undefined,
        questions: [],
        sortParts: parseHierarchySortParts(primary, index),
        order: index,
      });
    }
    groups.get(key)!.questions.push(question);
  });

  return Array.from(groups.values()).sort(
    (a, b) => compareSortParts(a.sortParts, b.sortParts) || a.order - b.order,
  );
}

export default function TemplateEditor() {
  const { template, questions, orgId, templateId, user, accessDenied } = useLoaderData<typeof loader>();

  if (accessDenied) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-medium">Access Denied</h2>
        <p className="text-muted-foreground">You don't have access to this template.</p>
        <Link to={`/organizations/${orgId}/templates`} className="text-primary hover:underline">
          ← Back to templates
        </Link>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-medium">Template Not Found</h2>
        <p className="text-muted-foreground">The template you're looking for doesn't exist or couldn't be loaded.</p>
        <Link to={`/organizations/${orgId}/templates`} className="text-primary hover:underline">
          ← Back to templates
        </Link>
      </div>
    );
  }

  const [isAdding, setIsAdding] = useState(false);

  const questionGroups = getTemplateQuestionGroups(questions as TemplateQuestion[]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to={`/organizations/${orgId}/templates`} 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to Templates
          </Link>
          <div className="h-4 w-[1px] bg-border" />
          <h1 className="text-2xl font-semibold tracking-tight">{template.name}</h1>
          {template.status === "DRAFT" && (
            <Badge variant="secondary" className="text-xs">Draft</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {template.status === "DRAFT" && (
            <Form method="post">
              <input type="hidden" name="intent" value="publish-template" />
              <Button 
                type="submit" 
                size="sm" 
                variant="default" 
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Publish Template
              </Button>
            </Form>
          )}
          {template.status === "PUBLISHED" && (
            <Link to={`/organizations/${orgId}/templates/${templateId}/instantiate`}>
              <Button 
                size="sm" 
                variant="default" 
                className="gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Instantiate Assessment
              </Button>
            </Link>
          )}
          <Button 
            onClick={() => setIsAdding(true)} 
            size="sm" 
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {questionGroups.length === 0 ? (
              <div className="text-center py-20 bg-muted/30 rounded-xl border-2 border-dashed">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">No questions defined for this template yet.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsAdding(true)}
                >
                  Create your first question
                </Button>
              </div>
            ) : (
              <Accordion className="space-y-4">
                {questionGroups.map((group) => (
                  <AccordionItem
                    key={group.key}
                    value={group.key}
                    className="border rounded-lg px-4 bg-card overflow-hidden"
                  >
                    <AccordionTrigger className="hover:no-underline py-4 [&>svg]:shrink-0">
                      <div className="flex w-full min-w-0 items-start gap-3 pr-3 text-left">
                        <Layers className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-sm font-semibold leading-snug break-words">
                            {group.title}
                          </p>
                          {group.subtitle && (
                            <p className="text-xs text-muted-foreground leading-relaxed break-words">
                              {group.subtitle}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {group.questions.length} Question{group.questions.length === 1 ? "" : "s"}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4">
                      {group.questions.map((q, questionIndex) => {
                        const provision = getQuestionProvision(q);
                        const provisionTitle = formatHierarchyItem(provision);
                        const displayText = getQuestionDisplayText(q);
                        const rawText = q.text?.trim() || "";
                        const hasImportedPlaceholderText = isWeakImportedQuestionText(rawText) && displayText !== rawText;

                        return (
                          <div 
                            key={q.id} 
                            className="group flex items-start gap-3 p-4 rounded-lg bg-background transition-colors border hover:border-primary/30 hover:bg-muted/30"
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground mt-1 cursor-grab" />
                            <div className="flex-1 space-y-2 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground font-mono">
                                  {getQuestionCode(q, questionIndex)}
                                </span>
                                <Badge variant="outline" className="text-[10px] capitalize">
                                  {getScoringType(q)}
                                </Badge>
                                {shouldShowPerformanceTarget(q) && (
                                  <Badge variant="outline" className="text-[10px]">
                                    PT{q.performance_target_level}
                                  </Badge>
                                )}
                                {q.is_required !== false && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              {provisionTitle && provisionTitle !== displayText && (
                                <p className="text-xs text-muted-foreground">
                                  {provisionTitle}
                                </p>
                              )}
                              <p className="text-sm font-medium leading-relaxed break-words">
                                {displayText}
                              </p>
                              {hasImportedPlaceholderText && rawText && (
                                <p className="text-xs text-muted-foreground">
                                  Imported row value: {rawText}
                                </p>
                              )}
                            </div>
                            <Form method="post">
                              <input type="hidden" name="intent" value="delete-question" />
                              <input type="hidden" name="question_id" value={q.id} />
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </Form>
                          </div>
                        );
                      })}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </CardContent>
      </Card>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add New Question</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full" 
                  onClick={() => setIsAdding(false)}
                >
                  ×
                </Button>
              </div>
              
              <Form method="post" className="space-y-4">
                <input type="hidden" name="intent" value="add-question" />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Question Text</label>
                  <Textarea 
                    name="text" 
                    placeholder="e.g. What is your current carbon emission per unit of production?" 
                    className="resize-none" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <Input 
                      name="category" 
                      placeholder="e.g. Environmental" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Response Type</label>
                    <select 
                      name="type" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="text">Text/Essay</option>
                      <option value="number">Numeric</option>
                      <option value="boolean">Yes/No</option>
                      <option value="single-choice">Single Choice</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsAdding(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="gap-2">
                    <Save className="w-4 h-4" />
                    Save Question
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
