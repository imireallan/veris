import { useState, useEffect, useRef, useMemo } from "react";
import { useLoaderData, Link, Form, redirect, useNavigation, useFetcher, useActionData } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Paperclip, 
  Save,
  ShieldCheck,
  Loader2,
  ClipboardCheck,
  Layers,
  ListChecks,
  Lock,
  AlertTriangle,
  FolderTree,
  CircleDot,
} from "lucide-react";
import { 
  Card, 
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent, 
  Badge, 
  Button,
  Input,
  Textarea,
  Progress,
  Separator,
  Alert,
  AlertDescription,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "~/components/ui/pagination";
import { FrameworkMappingBadge, type FrameworkMapping } from "~/components/FrameworkMappingBadge";
import { FrameworkMappingModal } from "~/components/FrameworkMappingModal";
import { useToast } from "~/hooks/use-toast";
import { terminologyFromUser, lowerFirst } from "~/lib/terminology";
import { cn } from "~/lib/utils";
import type { User } from "~/types";

interface QuestionnaireQuestion {
  id: string;
  text: string;
  description?: string | null;
  category?: string | null;
  hierarchy?: Array<{ level?: string; code?: string | number | null; label?: string | null }>;
  scoring_criteria?: Record<string, unknown> | null;
  framework_mappings?: FrameworkMapping[];
  external_question_id?: string | null;
  performance_target_level?: number | null;
  is_required?: boolean;
}

interface QuestionnaireResponse {
  id?: string;
  question: string;
  answer_text?: string;
  operator_answer?: string;
  validation_status?: string;
  confidence_score?: number | null;
  ai_score_suggestion?: number | null;
  ai_feedback?: string | null;
  citations?: Array<unknown>;
  evidence_files?: Array<unknown>;
}

interface QuestionnaireAssessment {
  id: string;
  display_name?: string;
  framework_name?: string | null;
  template_version?: string | null;
  status?: string;
}

interface QuestionnaireReadiness {
  status: "BLOCKED" | "INCOMPLETE" | "READY" | "SUBMITTED";
  can_view: boolean;
  can_save_draft: boolean;
  can_submit: boolean;
  can_force_submit: boolean;
  required_total: number;
  required_answered: number;
  missing_required_count: number;
  workflow_action_id?: string | null;
  workflow_action_code?: string | null;
  workflow_action_title?: string | null;
  workflow_action_status?: string | null;
  workflow_action_can_complete?: boolean;
  completed_at?: string | null;
  completed_by_name?: string;
  blocking_prerequisites: Array<{ code: string; title: string }>;
}

const QUESTIONS_PER_PAGE = 6;

function getQuestionCode(question: QuestionnaireQuestion, index: number) {
  return question.external_question_id || `Q${index + 1}`;
}

type QuestionGroup = {
  key: string;
  title: string;
  subtitle?: string;
  questions: QuestionnaireQuestion[];
};

type HierarchyItem = { level?: string; code?: string | number | null; label?: string | null };

type NavigationScopeType = "all" | "principle" | "category" | "provision";

type NavigationScope = {
  type: NavigationScopeType;
  key: string;
  title: string;
  subtitle?: string;
  questionIds: string[];
};

type ProvisionNode = {
  key: string;
  title: string;
  subtitle?: string;
  questionIds: string[];
  order: number;
  sortParts: number[];
};

type CategoryNode = {
  key: string;
  title: string;
  subtitle?: string;
  questionIds: string[];
  provisions: ProvisionNode[];
  order: number;
  sortParts: number[];
};

type PrincipleNode = {
  key: string;
  title: string;
  subtitle?: string;
  questionIds: string[];
  categories: CategoryNode[];
  order: number;
  sortParts: number[];
};

type QuestionnaireNavigationTree = {
  principles: PrincipleNode[];
  allQuestionIds: string[];
};

function formatHierarchyItem(item: { code?: string | number | null; label?: string | null }) {
  const code = item.code == null ? "" : String(item.code).trim();
  const label = (item.label || "").trim();
  if (code && label) return `${code}. ${label}`;
  return label || code;
}

function findHierarchyItem(hierarchy: HierarchyItem[], level: string, fallbackIndex: number) {
  const normalizedLevel = level.toLowerCase();
  return hierarchy.find((item) => (item.level || "").toLowerCase() === normalizedLevel) || hierarchy[fallbackIndex];
}

function normalizeHierarchyPart(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getHierarchyIdentity(prefix: string, item: HierarchyItem | undefined, fallback: string) {
  const level = normalizeHierarchyPart(item?.level || prefix);
  const code = item?.code == null ? "" : String(item.code).trim();
  const label = (item?.label || "").trim();

  // Prefer level + code for identity. Labels can vary across imported rows for the
  // same legacy node; including them creates duplicate sidebar entries.
  if (code) return `${prefix}|${level}|code:${normalizeHierarchyPart(code)}`;
  if (label) return `${prefix}|${level}|label:${normalizeHierarchyPart(label)}`;
  return `${prefix}|${level}|fallback:${normalizeHierarchyPart(fallback)}`;
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

function pushUniqueQuestionId(questionIds: string[], questionId: string) {
  if (!questionIds.some((existingId) => String(existingId) === String(questionId))) {
    questionIds.push(questionId);
  }
}

function getQuestionAnsweredCount(questionIds: string[], responses: QuestionnaireResponse[]) {
  const answeredIds = new Set(
    responses
      .filter((response) => Boolean(getResponseAnswer(response).trim()))
      .map((response) => String(response.question)),
  );
  return questionIds.filter((id) => answeredIds.has(String(id))).length;
}

function getQuestionnaireNavigationTree(questions: QuestionnaireQuestion[]): QuestionnaireNavigationTree {
  const principleMap = new Map<string, PrincipleNode>();
  const categoryMaps = new Map<string, Map<string, CategoryNode>>();
  const provisionMaps = new Map<string, Map<string, ProvisionNode>>();

  questions.forEach((question, index) => {
    const hierarchy = Array.isArray(question.hierarchy) ? question.hierarchy : [];
    const fallbackCategory = question.category || "General";
    const principle = findHierarchyItem(hierarchy, "principle", 0);
    const category = findHierarchyItem(hierarchy, "category", 1);
    const provision = findHierarchyItem(hierarchy, "provision", 2);

    const principleTitle = principle ? formatHierarchyItem(principle) : fallbackCategory;
    const categoryTitle = category ? formatHierarchyItem(category) : fallbackCategory;
    const provisionTitle = provision ? formatHierarchyItem(provision) : getQuestionCode(question, index);
    const principleKey = getHierarchyIdentity("principle", principle, fallbackCategory);
    const categoryKey = `${principleKey}::${getHierarchyIdentity("category", category, fallbackCategory)}`;
    const provisionKey = `${categoryKey}::${getHierarchyIdentity("provision", provision, getQuestionCode(question, index))}`;

    if (!principleMap.has(principleKey)) {
      principleMap.set(principleKey, {
        key: principleKey,
        title: principleTitle,
        questionIds: [],
        categories: [],
        order: index,
        sortParts: parseHierarchySortParts(principle, index),
      });
      categoryMaps.set(principleKey, new Map());
    }

    const principleNode = principleMap.get(principleKey)!;
    pushUniqueQuestionId(principleNode.questionIds, question.id);

    const categoryMap = categoryMaps.get(principleKey)!;
    if (!categoryMap.has(categoryKey)) {
      categoryMap.set(categoryKey, {
        key: categoryKey,
        title: categoryTitle,
        subtitle: category && principle ? undefined : fallbackCategory,
        questionIds: [],
        provisions: [],
        order: index,
        sortParts: parseHierarchySortParts(category, index),
      });
      provisionMaps.set(categoryKey, new Map());
    }

    const categoryNode = categoryMap.get(categoryKey)!;
    pushUniqueQuestionId(categoryNode.questionIds, question.id);

    const provisionMap = provisionMaps.get(categoryKey)!;
    if (!provisionMap.has(provisionKey)) {
      provisionMap.set(provisionKey, {
        key: provisionKey,
        title: provisionTitle,
        subtitle: provision && provisionTitle !== question.text ? question.text : undefined,
        questionIds: [],
        order: index,
        sortParts: parseHierarchySortParts(provision, index),
      });
    }

    pushUniqueQuestionId(provisionMap.get(provisionKey)!.questionIds, question.id);
  });

  const compareNodes = (a: { sortParts: number[]; order: number }, b: { sortParts: number[]; order: number }) =>
    compareSortParts(a.sortParts, b.sortParts) || a.order - b.order;

  const principles = Array.from(principleMap.values()).sort(compareNodes);
  principles.forEach((principle) => {
    const categories = Array.from(categoryMaps.get(principle.key)?.values() || []).sort(compareNodes);
    categories.forEach((category) => {
      category.provisions = Array.from(provisionMaps.get(category.key)?.values() || []).sort(compareNodes);
    });
    principle.categories = categories;
  });

  return {
    principles,
    allQuestionIds: Array.from(new Set(questions.map((question) => String(question.id)))),
  };
}

function getScopeQuestions(questions: QuestionnaireQuestion[], selectedScope: NavigationScope) {
  if (selectedScope.type === "all") return questions;
  const allowedIds = new Set(selectedScope.questionIds.map(String));
  return questions.filter((question) => allowedIds.has(String(question.id)));
}

function getQuestionGroups(questions: QuestionnaireQuestion[]): QuestionGroup[] {
  const groups = new Map<string, QuestionGroup>();

  for (const question of questions) {
    const hierarchy = Array.isArray(question.hierarchy) ? question.hierarchy : [];
    const primary = hierarchy[0];
    const secondary = hierarchy[1];
    const fallbackCategory = question.category || "General";
    const title = primary ? formatHierarchyItem(primary) : fallbackCategory;
    const subtitle = secondary ? formatHierarchyItem(secondary) : undefined;
    const key = [primary?.level, primary?.code, primary?.label, secondary?.level, secondary?.code, secondary?.label, fallbackCategory]
      .filter((part) => part != null && String(part).trim() !== "")
      .join("|") || fallbackCategory;

    if (!groups.has(key)) {
      groups.set(key, { key, title, subtitle, questions: [] });
    }
    groups.get(key)!.questions.push(question);
  }

  return Array.from(groups.values());
}

type QuestionnaireInputType = "text" | "short_text" | "integer" | "number" | "date" | "select_one" | "select_multiple" | "files";

function normalizeInputType(question: QuestionnaireQuestion): QuestionnaireInputType {
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

function getQuestionChoices(question: QuestionnaireQuestion): Array<{ value: string; label: string }> {
  const criteria = question.scoring_criteria || {};
  const rawChoices = criteria.choices || criteria.options || criteria.rating_choices;
  if (!Array.isArray(rawChoices)) return [];

  return rawChoices
    .map((choice) => {
      if (choice && typeof choice === "object") {
        const item = choice as Record<string, unknown>;
        const value = item.value ?? item.id ?? item.name ?? item.label;
        const label = item.label ?? item.name ?? item.value ?? item.id;
        return value == null ? null : { value: String(value), label: String(label ?? value) };
      }
      return choice == null ? null : { value: String(choice), label: String(choice) };
    })
    .filter((choice): choice is { value: string; label: string } => Boolean(choice));
}

function getResponseAnswer(response?: QuestionnaireResponse) {
  return response?.operator_answer || response?.answer_text || "";
}

function formatStoredAnswer(answer: string) {
  if (!answer) return "";
  try {
    const parsed = JSON.parse(answer);
    if (Array.isArray(parsed)) return parsed.join(", ");
  } catch {
    // Stored as plain text.
  }
  return answer;
}

function getScoringType(question: QuestionnaireQuestion) {
  const criteria = question.scoring_criteria || {};
  const type = normalizeInputType(question);
  if (Array.isArray(criteria.rating_choices)) return "rating";
  if (type === "select_one") return "single choice";
  if (type === "select_multiple") return "multiple choice";
  if (type === "integer" || type === "number") return "score";
  if (type === "short_text") return "short text";
  return type === "text" ? "narrative" : type.replace(/_/g, " ");
}

function shouldShowPerformanceTarget(question: QuestionnaireQuestion) {
  if (!question.performance_target_level) return false;

  const hasPtHierarchy = (question.hierarchy || []).some((item) => {
    const level = (item.level || "").toLowerCase();
    return level === "pt" || level === "performance_target" || level === "performance target";
  });

  const externalId = question.external_question_id || "";
  const looksLikeEo100Id = /^\d+\.\d+\.\d+\.\d+$/.test(externalId);

  return hasPtHierarchy || looksLikeEo100Id;
}

function getFrameworkTone(frameworkName?: string | null) {
  const normalized = (frameworkName || "").toLowerCase();
  if (normalized.includes("bettercoal")) return "Bettercoal-style principle review";
  if (normalized.includes("eo100") || normalized.includes("eo 100")) return "EO100 performance target review";
  if (normalized.includes("cgwg")) return "CGWG supplier questionnaire";
  return "Framework questionnaire";
}

const QUESTIONNAIRE_WORKFLOW_ACTION_CODES = new Set([
  "supplier_questionnaire_submitted",
  "questionnaire_submitted",
  "self_assessment_submitted",
]);

function findQuestionnaireWorkflowAction(workflow: any) {
  const actions = Array.isArray(workflow?.actions)
    ? workflow.actions
    : (workflow?.steps ?? []).flatMap((step: any) => step.actions ?? []);
  return actions.find((action: any) =>
    QUESTIONNAIRE_WORKFLOW_ACTION_CODES.has(action.action_code || action.code),
  );
}

function flattenApiList<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function getApiErrorMessage(err: any, fallback: string) {
  const body = err?.body;
  if (typeof body === "string") return body;
  if (body?.detail) return String(body.detail);
  if (body?.error) return String(body.error);
  if (body && typeof body === "object") {
    const fieldErrors = Object.entries(body)
      .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
      .join("; ");
    if (fieldErrors) return fieldErrors;
  }
  return err?.message ?? fallback;
}

function getEvidenceCheckErrorMessage(err: any) {
  const rawMessage = getApiErrorMessage(err, "Evidence check failed");
  const normalizedMessage = rawMessage.toLowerCase();

  if (normalizedMessage.includes("incorrect api key") || normalizedMessage.includes("invalid_api_key")) {
    return "Evidence check is not configured correctly. The backend OpenAI API key is invalid. Update the local credentials and try again.";
  }

  if (normalizedMessage.includes("pinecone") && (normalizedMessage.includes("unauthorized") || normalizedMessage.includes("api key") || normalizedMessage.includes("authentication"))) {
    return "Evidence search is not configured correctly. Check the Pinecone credentials and try again.";
  }

  if (normalizedMessage.includes("evidence check failed:")) {
    return rawMessage.replace(/^Evidence check failed:\s*/i, "Evidence check failed. ");
  }

  return rawMessage;
}

function UploadEvidenceButton({
  responseId,
  questionId,
  assessmentId,
  orgId,
}: {
  responseId?: string;
  questionId: string;
  assessmentId: string;
  orgId: string;
}) {
  const fetcher = useFetcher();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploading = fetcher.state === "submitting";
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lastUploadedFileName, setLastUploadedFileName] = useState<string | null>(null);

  // Watch for upload completion
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if ("success" in fetcher.data && fetcher.data.success) {
        setLastUploadedFileName(selectedFile?.name ?? null);
      }

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [fetcher.state, fetcher.data, selectedFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    const formData = new FormData();
    formData.append("intent", "upload-evidence");
    formData.append("response_id", responseId || "");
    formData.append("question_id", questionId);
    formData.append("file", file, file.name);
    formData.append("assessment_id", assessmentId);
    formData.append("org_id", orgId);

    fetcher.submit(formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.csv"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading...</>
        ) : (
          "Upload"
        )}
      </Button>
      {fetcher.data && "error" in fetcher.data && fetcher.data.error && (
        <span className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {fetcher.data.error}
        </span>
      )}
      {fetcher.data && "success" in fetcher.data && fetcher.data.success && lastUploadedFileName && (
        <span className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Uploaded: {lastUploadedFileName}
        </span>
      )}
    </div>
  );
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  
  const assessmentId = params.id;
  
  // First, fetch the assessment to get its organization_id
  // This allows superadmins to still access the questionnaire
  const assessment = await api.get<any>(`/api/assessments/${assessmentId}/`, token, request);
  
  if (!assessment) {
    throw new Response("Assessment not found", { status: 404 });
  }

  const orgId = assessment.organization || assessment.organization_id;
  
  if (!orgId) {
    throw new Response("Assessment is not associated with an organization", { status: 400 });
  }

  const [questions, responses, workflowRes, readiness] = await Promise.all([
    api.get<any[]>(`/api/organizations/${orgId}/assessments/${assessmentId}/questions/`, token, request),
    api.get<any[]>(`/api/organizations/${orgId}/assessments/${assessmentId}/responses/`, token, request),
    api.get<any>(`/api/assessment-workflows/?assessment=${assessmentId}&org=${orgId}`, token, request).catch(() => null),
    api.get<QuestionnaireReadiness>(`/api/assessments/${assessmentId}/questionnaire-readiness/?org=${orgId}`, token, request).catch(() => null),
  ]);
  const workflow = flattenApiList(workflowRes)[0] ?? null;
  
  return {
    assessmentId,
    assessment,
    orgId,
    questions: flattenApiList<QuestionnaireQuestion>(questions),
    responses: flattenApiList<QuestionnaireResponse>(responses),
    workflow,
    readiness,
    user,
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const assessmentId = params.id!;

  // Get orgId for the assessment (needed for upload-evidence)
  let orgId: string | null = null;
  if (intent === "upload-evidence") {
    orgId = formData.get("org_id") as string;
    if (!orgId) {
      try {
        const assessment = await api.get<any>(`/api/assessments/${assessmentId}/`, token, request);
        orgId = assessment.organization || assessment.organization_id;
      } catch (err) {
        return { error: "Could not determine organization for this assessment" };
      }
    }
  }

  if (intent === "submit-questionnaire") {
    const orgId = formData.get("org_id") as string;
    if (!orgId) {
      return { error: "Organization ID is required to submit this questionnaire" };
    }

    try {
      const [questionsRes, responsesRes] = await Promise.all([
        api.withOrganization.get<any[]>(
          `/api/organizations/${orgId}/assessments/${assessmentId}/questions/`,
          orgId,
          token,
          request,
        ),
        api.withOrganization.get<any[]>(
          `/api/organizations/${orgId}/assessments/${assessmentId}/responses/`,
          orgId,
          token,
          request,
        ),
      ]);
      const questions = flattenApiList<QuestionnaireQuestion>(questionsRes);
      const responses = flattenApiList<QuestionnaireResponse>(responsesRes);
      const unansweredRequired = questions.filter((question) => {
        if (question.is_required === false) return false;
        return !responses.some(
          (response) =>
            String(response.question) === String(question.id) &&
            Boolean(getResponseAnswer(response).trim()),
        );
      });

      if (unansweredRequired.length > 0) {
        return {
          error: `Answer all required questions before submitting. ${unansweredRequired.length} required question${unansweredRequired.length === 1 ? "" : "s"} remaining.`,
        };
      }

      const force = formData.get("force") === "true";
      const result = await api.withOrganization.post<any>(
        `/api/assessments/${assessmentId}/submit-questionnaire/`,
        {
          notes: force
            ? "Force-completed by platform admin during questionnaire submission override."
            : "Questionnaire submitted from assessment questionnaire page.",
          force,
        },
        orgId,
        token,
        request,
      );

      if (result?.success) {
        return redirect(`/assessments/${assessmentId}`);
      }

      return {
        error: result?.error ?? "Failed to submit questionnaire",
        readiness: result?.readiness,
      };
    } catch (err: any) {
      return { error: getApiErrorMessage(err, "Failed to submit questionnaire") };
    }
  }

  if (intent === "save-response") {
    const responseId = formData.get("response_id") as string;
    const questionId = formData.get("question_id") as string;
    const answer = formData.get("answer") as string;
    const orgId = formData.get("org_id") as string;

    if (!orgId) {
      return { error: "Organization ID is required to save this response" };
    }

    try {
      let targetResponseId = responseId;

      // Keep save idempotent. If the page was stale or the user double-submitted
      // before loader data refreshed, update the existing assessment/question response
      // instead of creating duplicate answers for one question.
      if (!targetResponseId) {
        const existingResponses = await api.withOrganization.get<any[]>(
          `/api/organizations/${orgId}/assessments/${assessmentId}/responses/`,
          orgId,
          token,
          request,
        );
        const responsesList = Array.isArray(existingResponses)
          ? existingResponses
          : (existingResponses as any)?.results ?? [];
        const existingResponse = responsesList.find(
          (response: any) => String(response.question) === String(questionId),
        );
        targetResponseId = existingResponse?.id ?? "";
      }

      let savedResponse: any;
      if (targetResponseId) {
        savedResponse = await api.withOrganization.patch(
          `/api/responses/${targetResponseId}/`,
          {
            answer_text: answer,
            operator_answer: answer,
            validation_status: "pending",
            confidence_score: null,
            ai_feedback: "",
            ai_validated: false,
            citations: [],
          },
          orgId,
          token,
          request,
        );
      } else {
        savedResponse = await api.withOrganization.post(
          `/api/organizations/${orgId}/assessments/${assessmentId}/responses/`,
          {
            question: questionId,
            answer_text: answer,
            operator_answer: answer,
          },
          orgId,
          token,
          request,
        );
      }
      return {
        success: true,
        intent: "save-response",
        message: "Response saved",
        response: savedResponse,
      };
    } catch (err: any) {
      if (err instanceof Response && err.status === 302) throw err;
      return { error: getApiErrorMessage(err, "Failed to save response") };
    }
  }

  if (intent === "upload-evidence") {
    const responseId = formData.get("response_id") as string;
    const questionId = formData.get("question_id") as string;
    const file = formData.get("file") as File;

    try {
      // First upload the file
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("organization_id", orgId ?? "");
      uploadFormData.append("assessment_id", assessmentId);
      uploadFormData.append("question_id", questionId);
      uploadFormData.append("response_id", responseId || "new");
      const uploadResponse = await api.raw(
        "/api/upload-evidence/",
        {
          method: "POST",
          token,
          organizationId: orgId,
          body: uploadFormData,
        },
        undefined,
        request,
      );

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        return { error: error.error ?? "Upload failed" };
      }

      const uploadData = await uploadResponse.json();

      // Attach to response (update evidence_files array). Keep this idempotent:
      // snapshot-backed questionnaires already create blank responses, so a missing
      // response_id from stale UI should reuse the existing assessment/question row.
      if (!orgId) {
        return { error: "Organization ID is required" };
      }

      let targetResponseId = responseId;
      if (!targetResponseId) {
        const existingResponses = await api.withOrganization.get<any[]>(
          `/api/organizations/${orgId}/assessments/${assessmentId}/responses/`,
          orgId,
          token,
          request,
        );
        const responsesList = Array.isArray(existingResponses)
          ? existingResponses
          : (existingResponses as any)?.results ?? [];
        const existingResponse = responsesList.find(
          (response: any) => String(response.question) === String(questionId),
        );
        targetResponseId = existingResponse?.id ?? "";
      }

      const evidenceFile = {
        url: uploadData.url,
        file_name: uploadData.file_name,
        file_size: uploadData.file_size,
      };

      if (targetResponseId) {
        const response = await api.withOrganization.get<any>(
          `/api/responses/${targetResponseId}/`,
          orgId,
          token,
          request,
        );
        const evidenceFiles = response.evidence_files || [];
        evidenceFiles.push(evidenceFile);
        await api.withOrganization.patch(
          `/api/responses/${targetResponseId}/`,
          {
            evidence_files: evidenceFiles,
            validation_status: "pending",
            confidence_score: null,
            ai_feedback: "",
            ai_validated: false,
            citations: [],
          },
          orgId,
          token,
          request,
        );
      } else {
        await api.withOrganization.post(
          `/api/organizations/${orgId}/assessments/${assessmentId}/responses/`,
          {
            assessment: assessmentId,
            question: questionId,
            answer_text: "",
            operator_answer: "",
            evidence_files: [evidenceFile],
          },
          orgId,
          token,
          request,
        );
      }

      return redirect(`/assessments/${assessmentId}/questionnaire`);
    } catch (err: any) {
      return { error: getApiErrorMessage(err, "Upload failed") };
    }
  }

  if (intent === "validate-response") {
    const responseId = formData.get("response_id") as string;
    const orgId = formData.get("org_id") as string;

    if (!responseId) {
      return { error: "Save the answer before running an evidence check" };
    }

    if (!orgId) {
      return { error: "Organization ID is required to check evidence" };
    }

    try {
      const result = await api.withOrganization.post<any>(
        `/api/responses/${responseId}/validate/`,
        {},
        orgId,
        token,
        request,
      );
      return { 
        success: true,
        intent: "validate-response",
        response_id: responseId,
        validation_status: result.validation_status,
        confidence_score: result.confidence_score,
        citations: result.citations,
        ai_feedback: result.feedback,
        message: `Evidence check: ${result.validation_status.toUpperCase()} (${(result.confidence_score * 100).toFixed(0)}% confidence)`
      };
    } catch (err: any) {
      return {
        error: getEvidenceCheckErrorMessage(err),
        intent: "validate-response",
        response_id: responseId,
      };
    }
  }

  return { error: "Unknown intent" };
}

function QuestionnaireAnswerInput({
  question,
  value,
  onChange,
}: {
  question: QuestionnaireQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputType = normalizeInputType(question);
  const choices = getQuestionChoices(question);
  const criteria = question.scoring_criteria || {};
  const inputClassName = "w-full px-3 py-2 border rounded-lg text-sm bg-background";

  if (inputType === "select_one" && choices.length > 0) {
    return (
      <select
        name="answer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClassName}
      >
        <option value="">Select an answer...</option>
        {choices.map((choice) => (
          <option key={choice.value} value={choice.value}>{choice.label}</option>
        ))}
      </select>
    );
  }

  if (inputType === "select_multiple" && choices.length > 0) {
    let selected = new Set<string>();
    try {
      const parsed = JSON.parse(value || "[]");
      selected = new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch {
      selected = new Set(value ? value.split(",").map((item) => item.trim()).filter(Boolean) : []);
    }

    const toggleChoice = (choiceValue: string) => {
      const next = new Set(selected);
      if (next.has(choiceValue)) next.delete(choiceValue);
      else next.add(choiceValue);
      onChange(JSON.stringify(Array.from(next)));
    };

    return (
      <div className="space-y-2 rounded-lg border bg-background p-3">
        <input type="hidden" name="answer" value={value} />
        {choices.map((choice) => (
          <label key={choice.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.has(choice.value)}
              onChange={() => toggleChoice(choice.value)}
              className="h-4 w-4 rounded border-muted text-primary focus:ring-primary"
            />
            <span>{choice.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (inputType === "integer" || inputType === "number") {
    return (
      <Input
        name="answer"
        type="number"
        step={inputType === "integer" ? "1" : "any"}
        min={criteria.min != null ? String(criteria.min) : undefined}
        max={criteria.max != null ? String(criteria.max) : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter a score or number..."
      />
    );
  }

  if (inputType === "date") {
    return (
      <Input
        name="answer"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (inputType === "short_text") {
    return (
      <Input
        name="answer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Provide your answer..."
      />
    );
  }

  return (
    <Textarea
      name="answer"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
      placeholder={inputType === "files" ? "Describe the evidence you are uploading..." : "Provide your answer..."}
    />
  );
}

function QuestionCard({
  question,
  index,
  existingResponse,
  isEditing,
  onEdit,
  onSaved,
  onValidated,
  onSaveFailed,
  onOptimisticSave,
  assessmentId,
  orgId,
  onAddMapping,
  canEditResponses,
}: {
  question: QuestionnaireQuestion;
  index: number;
  existingResponse?: QuestionnaireResponse;
  isEditing: boolean;
  onEdit: () => void;
  onSaved: (response: QuestionnaireResponse) => void;
  onValidated: (response: QuestionnaireResponse) => void;
  onSaveFailed: (questionId: string, previousResponse?: QuestionnaireResponse) => void;
  onOptimisticSave: (questionId: string, answer: string, responseId?: string) => void;
  assessmentId: string;
  orgId: string;
  onAddMapping: (questionId: string) => void;
  canEditResponses: boolean;
}) {
  const hasAI = existingResponse?.ai_score_suggestion != null || existingResponse?.ai_feedback;
  const [localAnswer, setLocalAnswer] = useState(getResponseAnswer(existingResponse));
  const saveFetcher = useFetcher<typeof action>();
  const validateFetcher = useFetcher<typeof action>();
  const { success: toastSuccess, error: toastError, loading: toastLoading, dismiss: dismissToast } = useToast();
  const saveToastIdRef = useRef<string | number | null>(null);
  const validateToastIdRef = useRef<string | number | null>(null);
  const handledSaveResultRef = useRef(false);
  const handledValidateResultRef = useRef(false);
  const previousResponseRef = useRef<QuestionnaireResponse | undefined>(undefined);
  const [evidenceCheckError, setEvidenceCheckError] = useState<string | null>(null);
  const isSaving = saveFetcher.state === "submitting";
  const isValidating = validateFetcher.state === "submitting";

  useEffect(() => {
    const existingAnswer = getResponseAnswer(existingResponse);
    if (isEditing && !localAnswer && existingAnswer) {
      setLocalAnswer(existingAnswer);
    }
  }, [isEditing, existingResponse]);

  useEffect(() => {
    if (saveFetcher.state === "submitting") {
      handledSaveResultRef.current = false;
      if (!saveToastIdRef.current) {
        saveToastIdRef.current = toastLoading("Saving response...", "Your answer is being saved.");
      }
    }

    if (saveFetcher.state === "idle" && saveFetcher.data && !handledSaveResultRef.current) {
      handledSaveResultRef.current = true;

      if (saveToastIdRef.current) {
        dismissToast(saveToastIdRef.current);
        saveToastIdRef.current = null;
      }

      if ("success" in saveFetcher.data && saveFetcher.data.success) {
        const savedResponse = (saveFetcher.data as any).response as QuestionnaireResponse | undefined;
        if (savedResponse) {
          onSaved(savedResponse);
        }
        toastSuccess("Response saved", "Your answer has been saved.");
        if (isEditing) {
          onEdit();
        }
      } else if ("error" in saveFetcher.data && saveFetcher.data.error) {
        onSaveFailed(question.id, previousResponseRef.current);
        toastError("Save failed", saveFetcher.data.error as string);
      }
    }
  }, [saveFetcher.state, saveFetcher.data, toastLoading, dismissToast, toastSuccess, toastError, onSaved, onSaveFailed, onEdit, isEditing, question.id]);

  useEffect(() => {
    if (validateFetcher.state === "submitting") {
      handledValidateResultRef.current = false;
      setEvidenceCheckError(null);
      if (!validateToastIdRef.current) {
        validateToastIdRef.current = toastLoading("Checking evidence...", "Comparing this answer against uploaded evidence.");
      }
    }

    if (validateFetcher.state === "idle" && validateFetcher.data && !handledValidateResultRef.current) {
      handledValidateResultRef.current = true;

      if (validateToastIdRef.current) {
        dismissToast(validateToastIdRef.current);
        validateToastIdRef.current = null;
      }

      if ("success" in validateFetcher.data && validateFetcher.data.success) {
        const data = validateFetcher.data as any;
        onValidated({
          ...(existingResponse ?? { question: question.id }),
          id: data.response_id ?? existingResponse?.id,
          question: existingResponse?.question ?? question.id,
          validation_status: data.validation_status,
          confidence_score: data.confidence_score,
          citations: data.citations ?? existingResponse?.citations,
          ai_feedback: data.ai_feedback,
        } as QuestionnaireResponse);
        toastSuccess("Evidence check complete", data.message ?? "Evidence check completed.");
      } else if ("error" in validateFetcher.data && validateFetcher.data.error) {
        const message = String(validateFetcher.data.error);
        setEvidenceCheckError(message);
        toastError("Evidence check failed", message);
      }
    }
  }, [validateFetcher.state, validateFetcher.data, toastLoading, dismissToast, toastSuccess, toastError, onValidated, existingResponse, question.id]);

  const acceptAISuggestion = () => {
    if (existingResponse?.ai_feedback) {
      setLocalAnswer(existingResponse.ai_feedback);
    }
  };

  const validationStatusColors: Record<string, string> = {
    validated: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    flagged: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    insufficient_evidence: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    pending: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };

  const validationStatusLabels: Record<string, string> = {
    validated: "Validated",
    flagged: "Needs Review",
    insufficient_evidence: "No Evidence",
    pending: "Not Validated",
  };

  return (
    <Card className={hasAI || existingResponse?.validation_status ? "border-blue-200" : ""}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs text-muted-foreground font-mono">{getQuestionCode(question, index - 1)}</span>
              <Badge variant="outline" className="text-[10px] capitalize">
                {getScoringType(question)}
              </Badge>
              {shouldShowPerformanceTarget(question) ? (
                <Badge variant="outline" className="text-[10px]">
                  PT{question.performance_target_level}
                </Badge>
              ) : null}
              {question.category && (
                <Badge variant="secondary" className="text-[10px]">
                  {question.category}
                </Badge>
              )}
              {existingResponse && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              {existingResponse?.validation_status && (
                <Badge className={`text-[10px] ${validationStatusColors[existingResponse.validation_status]}`}>
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {validationStatusLabels[existingResponse.validation_status] || existingResponse.validation_status}
                </Badge>
              )}
              {existingResponse?.confidence_score != null && (
                <span className="text-[10px] text-muted-foreground">
                  ({(existingResponse.confidence_score * 100).toFixed(0)}% confidence)
                </span>
              )}
            </div>
            <h4 className="font-medium">{question.text}</h4>
            {question.description && (
              <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
            )}
            {/* Framework Mappings */}
            <div className="mt-2">
              <FrameworkMappingBadge
                mappings={question.framework_mappings || []}
                canEdit={true}
                onAdd={() => onAddMapping(question.id)}
                onRemove={(index) => {
                  // Handle remove via API call in parent component
                  console.log("Remove mapping at index:", index);
                }}
              />
              {question.framework_mappings && question.framework_mappings.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  This answer also satisfies: {question.framework_mappings.map((m: FrameworkMapping) => m.framework_name).join(", ")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {existingResponse && existingResponse.validation_status !== "validated" && (
              <validateFetcher.Form method="post">
                <input type="hidden" name="intent" value="validate-response" />
                <input type="hidden" name="response_id" value={existingResponse.id || ""} />
                <input type="hidden" name="org_id" value={orgId} />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                  disabled={isValidating || !getResponseAnswer(existingResponse) || !canEditResponses}
                >
                  {isValidating ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3 h-3 mr-1" />
                  )}
                  {isValidating ? "Checking..." : "Check evidence"}
                </Button>
              </validateFetcher.Form>
            )}
            {!isEditing && canEditResponses && (
              <button
                type="button"
                onClick={onEdit}
                className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md"
              >
                {existingResponse ? "Edit" : "Answer"}
              </button>
            )}
          </div>
        </div>

        {evidenceCheckError && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {evidenceCheckError}
            </AlertDescription>
          </Alert>
        )}

        {question.scoring_criteria && (
          <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
            <div className="font-medium text-muted-foreground">Scoring:</div>
            {typeof question.scoring_criteria === "object" &&
              Object.entries(question.scoring_criteria).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span>{k}</span>
                  <span className="font-mono">{String(v)}</span>
                </div>
              ))}
          </div>
        )}

        {hasAI && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                AI Suggestion
              </div>
              {isEditing && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={acceptAISuggestion}
                  className="h-6 px-2 text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Accept Suggestion
                </Button>
              )}
            </div>
            {existingResponse.ai_score_suggestion != null && (
              <div className="text-xs">
                Suggested score: <span className="font-semibold">{existingResponse.ai_score_suggestion}</span>
              </div>
            )}
            {existingResponse.ai_feedback && (
              <p className="text-xs text-muted-foreground">{existingResponse.ai_feedback}</p>
            )}
          </div>
        )}

        {/* Read-only view of saved response */}
        {getResponseAnswer(existingResponse) && !isEditing && (
          <div className="p-4 bg-muted/30 rounded-lg text-sm space-y-2 border border-muted">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Answer</span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{formatStoredAnswer(getResponseAnswer(existingResponse))}</p>
            {existingResponse?.evidence_files && existingResponse.evidence_files.length > 0 && (
              <div className="pt-2 border-t border-muted/50">
                <span className="text-xs font-medium text-muted-foreground">Evidence ({existingResponse.evidence_files.length} file{existingResponse.evidence_files.length === 1 ? "" : "s"}):</span>
                <ul className="text-xs text-muted-foreground mt-1">
                  {existingResponse.evidence_files.map((file: any, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <Paperclip className="w-3 h-3" />
                      <span className="truncate max-w-[200px]">{file.file_name || file.url}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {isEditing && (
          <saveFetcher.Form
            method="post"
            className="space-y-3"
            onSubmit={() => {
              previousResponseRef.current = existingResponse;
              onOptimisticSave(question.id, localAnswer, existingResponse?.id);
            }}
          >
            <input type="hidden" name="intent" value="save-response" />
            <input type="hidden" name="response_id" value={existingResponse?.id || ""} />
            <input type="hidden" name="question_id" value={question.id} />
            <input type="hidden" name="assessment_id" value={assessmentId} />
            <input type="hidden" name="org_id" value={orgId} />

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium mb-1 block">Answer</label>
                <QuestionnaireAnswerInput
                  question={question}
                  value={localAnswer}
                  onChange={setLocalAnswer}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Paperclip className="w-4 h-4" />
                  <span className="text-xs">Evidence attached: {existingResponse?.evidence_files?.length || 0}</span>
                </div>
                {canEditResponses && (
                  <UploadEvidenceButton
                    responseId={existingResponse?.id}
                    questionId={question.id}
                    assessmentId={assessmentId}
                    orgId={orgId}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onEdit}
                className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md"
                disabled={isSaving}
              >
                Cancel
              </button>
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1" />
                )}
                {isSaving ? "Saving..." : "Save Response"}
              </Button>
            </div>
          </saveFetcher.Form>
        )}
      </CardContent>
    </Card>
  );
}

function TreeScopeButton({
  scope,
  depth = 0,
  activeScopeKey,
  responses,
  onSelectScope,
}: {
  scope: NavigationScope;
  depth?: number;
  activeScopeKey: string;
  responses: QuestionnaireResponse[];
  onSelectScope: (scope: NavigationScope) => void;
}) {
  const isActive = activeScopeKey === scope.key;
  const answeredCount = getQuestionAnsweredCount(scope.questionIds, responses);

  return (
    <button
      type="button"
      onClick={() => onSelectScope(scope)}
      className={cn(
        "group flex w-full items-start justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
        isActive
          ? "bg-primary/10 text-primary ring-1 ring-primary/20"
          : "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
      )}
      style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
    >
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate", isActive ? "font-semibold" : "font-medium")}>{scope.title}</span>
        {scope.subtitle && (
          <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{scope.subtitle}</span>
        )}
      </span>
      <span className="shrink-0 rounded-full border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
        {answeredCount}/{scope.questionIds.length}
      </span>
    </button>
  );
}

function QuestionnaireTreeSidebar({
  tree,
  selectedScope,
  responses,
  onSelectScope,
}: {
  tree: QuestionnaireNavigationTree;
  selectedScope: NavigationScope;
  responses: QuestionnaireResponse[];
  onSelectScope: (scope: NavigationScope) => void;
}) {
  const allScope: NavigationScope = {
    type: "all",
    key: "all",
    title: "All provisions",
    subtitle: "Full questionnaire",
    questionIds: tree.allQuestionIds,
  };

  return (
    <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
      <Card className="border-primary/10">
        <CardHeader className="space-y-2 p-4">
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Question tree</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Navigate by Principle → Category → Provision.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <TreeScopeButton
            scope={allScope}
            activeScopeKey={selectedScope.key}
            responses={responses}
            onSelectScope={onSelectScope}
          />

          <Separator />

          <div className="space-y-2">
            {tree.principles.map((principle) => (
              <details key={principle.key} open className="group/principle space-y-1">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold text-foreground hover:bg-primary/5 [&::-webkit-details-marker]:hidden">
                  <CircleDot className="h-3 w-3 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{principle.title}</span>
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                    {principle.questionIds.length}
                  </Badge>
                </summary>

                <TreeScopeButton
                  scope={{
                    type: "principle",
                    key: principle.key,
                    title: `All in ${principle.title}`,
                    questionIds: principle.questionIds,
                  }}
                  depth={1}
                  activeScopeKey={selectedScope.key}
                  responses={responses}
                  onSelectScope={onSelectScope}
                />

                <div className="space-y-1 border-l border-border/70 pl-2 ml-3">
                  {principle.categories.map((category) => (
                    <details key={category.key} open className="space-y-1">
                      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-primary/5 hover:text-foreground [&::-webkit-details-marker]:hidden">
                        <span className="min-w-0 flex-1 truncate">{category.title}</span>
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                          {category.questionIds.length}
                        </Badge>
                      </summary>

                      <TreeScopeButton
                        scope={{
                          type: "category",
                          key: category.key,
                          title: `All in ${category.title}`,
                          subtitle: principle.title,
                          questionIds: category.questionIds,
                        }}
                        depth={2}
                        activeScopeKey={selectedScope.key}
                        responses={responses}
                        onSelectScope={onSelectScope}
                      />

                      <div className="space-y-1 border-l border-border/60 pl-2 ml-3">
                        {category.provisions.map((provision) => (
                          <TreeScopeButton
                            key={provision.key}
                            scope={{
                              type: "provision",
                              key: provision.key,
                              title: provision.title,
                              subtitle: provision.subtitle,
                              questionIds: provision.questionIds,
                            }}
                            depth={3}
                            activeScopeKey={selectedScope.key}
                            responses={responses}
                            onSelectScope={onSelectScope}
                          />
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

export default function QuestionnaireRoute() {
  const { assessmentId, assessment, orgId, questions, responses, workflow, readiness, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const assessmentData = assessment as QuestionnaireAssessment;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [localQuestions, setLocalQuestions] = useState<QuestionnaireQuestion[]>(questions);
  const [localResponses, setLocalResponses] = useState<QuestionnaireResponse[]>(responses);
  const [currentPage, setCurrentPage] = useState(1);
  const navigationTree = useMemo(() => getQuestionnaireNavigationTree(localQuestions), [localQuestions]);
  const [selectedScope, setSelectedScope] = useState<NavigationScope>({
    type: "all",
    key: "all",
    title: "All provisions",
    subtitle: "Full questionnaire",
    questionIds: questions.map((question: QuestionnaireQuestion) => question.id),
  });

  const terminology = terminologyFromUser(user);
  const assessmentLabel = terminology.assessment;
  const answeredCount = localQuestions.filter((question) =>
    localResponses.some((response) => String(response.question) === String(question.id) && Boolean(getResponseAnswer(response)))
  ).length;
  const requiredQuestions = localQuestions.filter((question) => question.is_required !== false);
  const unansweredRequiredCount = requiredQuestions.filter((question) =>
    !localResponses.some((response) => String(response.question) === String(question.id) && Boolean(getResponseAnswer(response).trim()))
  ).length;
  const questionnaireWorkflowAction = findQuestionnaireWorkflowAction(workflow);
  const fallbackReadiness: QuestionnaireReadiness = {
    status: questionnaireWorkflowAction?.status === "COMPLETED"
      ? "SUBMITTED"
      : unansweredRequiredCount > 0
        ? "INCOMPLETE"
        : questionnaireWorkflowAction?.status === "BLOCKED"
          ? "BLOCKED"
          : "READY",
    can_view: true,
    can_save_draft: questionnaireWorkflowAction?.status !== "COMPLETED",
    can_submit: localQuestions.length > 0 && unansweredRequiredCount === 0 && Boolean(questionnaireWorkflowAction?.can_complete),
    can_force_submit: false,
    required_total: requiredQuestions.length,
    required_answered: requiredQuestions.length - unansweredRequiredCount,
    missing_required_count: unansweredRequiredCount,
    workflow_action_id: questionnaireWorkflowAction?.id,
    workflow_action_code: questionnaireWorkflowAction?.action_code || questionnaireWorkflowAction?.code,
    workflow_action_title: questionnaireWorkflowAction?.title,
    workflow_action_status: questionnaireWorkflowAction?.status,
    workflow_action_can_complete: questionnaireWorkflowAction?.can_complete,
    completed_at: questionnaireWorkflowAction?.completed_at,
    completed_by_name: questionnaireWorkflowAction?.completed_by_name,
    blocking_prerequisites: questionnaireWorkflowAction?.status === "BLOCKED"
      ? (questionnaireWorkflowAction.prerequisite_codes || []).map((code: string) => ({ code, title: code.replace(/_/g, " ") }))
      : [],
  };
  const serverReadiness = ((actionData as any)?.readiness || readiness || fallbackReadiness) as QuestionnaireReadiness;
  const readinessState: QuestionnaireReadiness = {
    ...serverReadiness,
    required_total: requiredQuestions.length,
    required_answered: requiredQuestions.length - unansweredRequiredCount,
    missing_required_count: unansweredRequiredCount,
    status: serverReadiness.status === "SUBMITTED"
      ? "SUBMITTED"
      : serverReadiness.status === "BLOCKED"
        ? "BLOCKED"
        : unansweredRequiredCount > 0
          ? "INCOMPLETE"
          : "READY",
    can_submit: localQuestions.length > 0
      && unansweredRequiredCount === 0
      && serverReadiness.status !== "BLOCKED"
      && serverReadiness.status !== "SUBMITTED"
      && Boolean(serverReadiness.workflow_action_can_complete || serverReadiness.can_submit),
  };
  const canEditResponses = Boolean(readinessState.can_save_draft);
  const canSubmitQuestionnaire = localQuestions.length > 0 && Boolean(readinessState.can_submit);
  const isSubmittingQuestionnaire = navigation.state === "submitting" && navigation.formData?.get("intent") === "submit-questionnaire";
  const completionPercent = localQuestions.length ? Math.round((answeredCount / localQuestions.length) * 100) : 0;
  const scopedQuestions = getScopeQuestions(localQuestions, selectedScope);
  const navigationQuestionIdsKey = navigationTree.allQuestionIds.join("|");
  const totalPages = Math.max(1, Math.ceil(scopedQuestions.length / QUESTIONS_PER_PAGE));
  const pageStart = (currentPage - 1) * QUESTIONS_PER_PAGE;
  const paginatedQuestions = scopedQuestions.slice(pageStart, pageStart + QUESTIONS_PER_PAGE);
  const questionGroups = getQuestionGroups(paginatedQuestions);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (selectedScope.type === "all") {
      const isCurrent = selectedScope.questionIds.join("|") === navigationQuestionIdsKey;
      if (!isCurrent) {
        setSelectedScope((scope) => ({ ...scope, questionIds: navigationTree.allQuestionIds }));
      }
      return;
    }

    const knownQuestionIds = new Set(navigationTree.allQuestionIds.map(String));
    const scopeStillValid = selectedScope.questionIds.some((id) => knownQuestionIds.has(String(id)));
    if (!scopeStillValid) {
      setSelectedScope({
        type: "all",
        key: "all",
        title: "All provisions",
        subtitle: "Full questionnaire",
        questionIds: navigationTree.allQuestionIds,
      });
      setCurrentPage(1);
    }
  }, [navigationQuestionIdsKey, navigationTree.allQuestionIds, selectedScope]);

  const handleSelectScope = (scope: NavigationScope) => {
    setSelectedScope(scope);
    setCurrentPage(1);
    setEditingIndex(null);
  };

  const handleAddMapping = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setMappingModalOpen(true);
  };

  const handleMappingAdded = (mappings: FrameworkMapping[]) => {
    if (selectedQuestionId) {
      setLocalQuestions(localQuestions.map((q: QuestionnaireQuestion) =>
        q.id === selectedQuestionId ? { ...q, framework_mappings: mappings } : q
      ));
    }
  };

  const handleMappingRemoved = (mappings: FrameworkMapping[]) => {
    if (selectedQuestionId) {
      setLocalQuestions(localQuestions.map((q: QuestionnaireQuestion) =>
        q.id === selectedQuestionId ? { ...q, framework_mappings: mappings } : q
      ));
    }
  };

  const upsertLocalResponse = (nextResponse: QuestionnaireResponse) => {
    setLocalResponses((current) => {
      const existingIndex = current.findIndex((response) =>
        (nextResponse.id && response.id === nextResponse.id) ||
        String(response.question) === String(nextResponse.question)
      );

      if (existingIndex === -1) {
        return [...current, nextResponse];
      }

      const updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...nextResponse };
      return updated;
    });
  };

  const handleOptimisticSave = (questionId: string, answer: string, responseId?: string) => {
    upsertLocalResponse({
      id: responseId,
      question: questionId,
      answer_text: answer,
      operator_answer: answer,
    });
  };

  const handleSaveFailed = (questionId: string, previousResponse?: QuestionnaireResponse) => {
    setLocalResponses((current) => {
      if (previousResponse) {
        return current.map((response) =>
          String(response.question) === String(questionId) ? previousResponse : response
        );
      }

      return current.filter((response) => String(response.question) !== String(questionId));
    });
  };

  return (
    <div className="mx-auto max-w-7xl py-8 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/assessments/${assessmentId}`}>{assessmentLabel}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Questionnaire</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="border-primary/10 bg-gradient-to-br from-background to-muted/30">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                <span>{getFrameworkTone(assessmentData.framework_name)}</span>
              </div>
              <CardTitle className="text-3xl">{assessmentData.display_name || "Questionnaire"}</CardTitle>
              <CardDescription>
                Frozen assessment question set. Template edits after creation will not change this {lowerFirst(assessmentLabel)}.
              </CardDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {assessmentData.framework_name && <Badge variant="secondary">{assessmentData.framework_name}</Badge>}
                {assessmentData.template_version && <Badge variant="outline">Template v{assessmentData.template_version}</Badge>}
                {assessmentData.status && <Badge variant="outline">{assessmentData.status.replace(/_/g, " ")}</Badge>}
              </div>
            </div>
            <Link to={`/assessments/${assessmentId}`}>
              <Button variant="outline">Back to {assessmentLabel}</Button>
            </Link>
          </div>

          {actionData && "error" in actionData && actionData.error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{actionData.error}</span>
            </div>
          )}
          {actionData && "success" in actionData && actionData.success && "message" in actionData && actionData.message && (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{actionData.message}</span>
            </div>
          )}

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ListChecks className="h-4 w-4" /> Questions
              </div>
              <div className="mt-2 text-2xl font-semibold">{localQuestions.length}</div>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4" /> Answered
              </div>
              <div className="mt-2 text-2xl font-semibold">{answeredCount}</div>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="h-4 w-4" /> Completion
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Progress value={completionPercent} className="h-2" />
                <span className="text-sm font-medium">{completionPercent}%</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-background p-4 space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {readinessState.status === "BLOCKED" ? <Lock className="h-4 w-4 text-amber-600" /> : null}
                  {readinessState.status === "INCOMPLETE" ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : null}
                  {readinessState.status === "READY" ? <CheckCircle className="h-4 w-4 text-primary" /> : null}
                  {readinessState.status === "SUBMITTED" ? <ShieldCheck className="h-4 w-4 text-primary" /> : null}
                  Submit questionnaire
                  <Badge variant={readinessState.status === "READY" || readinessState.status === "SUBMITTED" ? "default" : "outline"}>
                    {readinessState.status.toLowerCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {readinessState.status === "BLOCKED"
                    ? "Questionnaire submission is blocked by earlier workflow milestones. Draft answers may be saved only when allowed by this framework."
                    : readinessState.status === "INCOMPLETE"
                      ? `${readinessState.missing_required_count} required question${readinessState.missing_required_count === 1 ? "" : "s"} still need answers.`
                      : readinessState.status === "SUBMITTED"
                        ? `Submitted${readinessState.completed_by_name ? ` by ${readinessState.completed_by_name}` : ""}${readinessState.completed_at ? ` on ${new Date(readinessState.completed_at).toLocaleDateString()}` : ""}. Responses are now read-only.`
                        : "All required questions are answered. Submit to advance the workflow milestone."}
                </p>
                {readinessState.blocking_prerequisites?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {readinessState.blocking_prerequisites.map((item) => (
                      <Badge key={item.code} variant="outline" className="text-[10px]">
                        Blocked by: {item.title}
                      </Badge>
                    ))}
                  </div>
                )}
                {!canEditResponses && readinessState.status !== "SUBMITTED" && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Draft saving is locked until this framework's prerequisite milestone is available.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <Form method="post">
                  <input type="hidden" name="intent" value="submit-questionnaire" />
                  <input type="hidden" name="org_id" value={orgId || ""} />
                  <input type="hidden" name="force" value="false" />
                  <Button type="submit" disabled={!canSubmitQuestionnaire || isSubmittingQuestionnaire}>
                    {isSubmittingQuestionnaire ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    {readinessState.status === "SUBMITTED" ? "Submitted" : "Submit questionnaire"}
                  </Button>
                </Form>
                {readinessState.can_force_submit && (
                  <Form method="post">
                    <input type="hidden" name="intent" value="submit-questionnaire" />
                    <input type="hidden" name="org_id" value={orgId || ""} />
                    <input type="hidden" name="force" value="true" />
                    <Button type="submit" variant="outline" disabled={isSubmittingQuestionnaire}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Force submit
                    </Button>
                  </Form>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {localQuestions.length === 0 ? (
        <div className="text-center py-12 bg-muted rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">No questions associated with this {lowerFirst(assessmentLabel)}.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <QuestionnaireTreeSidebar
            tree={navigationTree}
            selectedScope={selectedScope}
            responses={localResponses}
            onSelectScope={handleSelectScope}
          />

          <div className="min-w-0 space-y-6">
            <div className="flex flex-col gap-2 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Current scope
                </p>
                <h2 className="truncate text-lg font-semibold">{selectedScope.title}</h2>
                {selectedScope.subtitle && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{selectedScope.subtitle}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">
                  {getQuestionAnsweredCount(scopedQuestions.map((question) => question.id), localResponses)}/{scopedQuestions.length} answered
                </Badge>
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {scopedQuestions.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + QUESTIONS_PER_PAGE, scopedQuestions.length)} of {scopedQuestions.length}
              </span>
              {selectedScope.type !== "all" && (
                <Button type="button" variant="ghost" size="sm" onClick={() => handleSelectScope({
                  type: "all",
                  key: "all",
                  title: "All provisions",
                  subtitle: "Full questionnaire",
                  questionIds: navigationTree.allQuestionIds,
                })}>
                  Clear scope
                </Button>
              )}
            </div>

            {questionGroups.map((group) => (
              <section key={group.key} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.title}
                    </h3>
                    {group.subtitle && (
                      <p className="text-xs text-muted-foreground">{group.subtitle}</p>
                    )}
                  </div>
                  <Separator className="mt-3 flex-1" />
                </div>
                <div className="grid gap-4">
                  {group.questions.map((q: QuestionnaireQuestion) => {
                    const absoluteIndex = localQuestions.findIndex((question) => question.id === q.id);
                    const response = localResponses.find((r: QuestionnaireResponse) => String(r.question) === String(q.id));
                    return (
                      <QuestionCard
                        key={q.id}
                        index={absoluteIndex + 1}
                        question={q}
                        existingResponse={response}
                        isEditing={editingIndex === absoluteIndex}
                        onEdit={() => setEditingIndex(editingIndex === absoluteIndex ? null : absoluteIndex)}
                        onSaved={upsertLocalResponse}
                        onValidated={upsertLocalResponse}
                        onSaveFailed={handleSaveFailed}
                        onOptimisticSave={handleOptimisticSave}
                        assessmentId={assessmentId || ""}
                        orgId={orgId || ""}
                        onAddMapping={handleAddMapping}
                        canEditResponses={canEditResponses}
                      />
                    );
                  })}
                </div>
              </section>
            ))}

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, index) => {
                    const page = index + 1;
                    return (
                      <PaginationItem key={page}>
                        <Button
                          type="button"
                          variant={page === currentPage ? "default" : "ghost"}
                          size="icon"
                          onClick={() => setCurrentPage(page)}
                          aria-label={`Go to page ${page}`}
                        >
                          {page}
                        </Button>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    >
                      Next
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      )}

      {/* Framework Mapping Modal */}
      {selectedQuestionId && (
        <FrameworkMappingModal
          open={mappingModalOpen}
          onOpenChange={setMappingModalOpen}
          questionId={selectedQuestionId}
          organizationId={orgId || ""}
          currentMappings={localQuestions.find((q: QuestionnaireQuestion) => q.id === selectedQuestionId)?.framework_mappings || []}
          onMappingAdded={handleMappingAdded}
          onMappingRemoved={handleMappingRemoved}
        />
      )}
    </div>
  );
}
