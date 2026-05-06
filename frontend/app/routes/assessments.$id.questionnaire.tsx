import { useState, useEffect, useRef } from "react";
import { useLoaderData, Link, Form, redirect, useNavigation, useFetcher } from "react-router";
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
  Plus
} from "lucide-react";
import { 
  Card, 
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent, 
  Badge, 
  Button,
  Progress,
  Separator,
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
import type { User } from "~/types";

interface QuestionnaireQuestion {
  id: string;
  text: string;
  description?: string | null;
  category?: string | null;
  scoring_criteria?: Record<string, unknown> | null;
  framework_mappings?: FrameworkMapping[];
  external_question_id?: string | null;
  performance_target_level?: number | null;
}

interface QuestionnaireResponse {
  id?: string;
  question: string;
  answer_text?: string;
  validation_status?: string;
  confidence_score?: number | null;
  ai_score_suggestion?: number | null;
  ai_feedback?: string | null;
  evidence_files?: Array<unknown>;
}

interface QuestionnaireAssessment {
  id: string;
  display_name?: string;
  framework_name?: string | null;
  template_version?: string | null;
  status?: string;
}

const QUESTIONS_PER_PAGE = 6;

function getQuestionCode(question: QuestionnaireQuestion, index: number) {
  return question.external_question_id || `Q${index + 1}`;
}

function getScoringType(question: QuestionnaireQuestion) {
  const criteria = question.scoring_criteria || {};
  const type = criteria.type || criteria.input_type || criteria.response_type;
  if (typeof type === "string") return type.replace(/_/g, " ");
  if (Array.isArray(criteria.choices) || Array.isArray(criteria.options)) return "choice";
  if (criteria.min != null || criteria.max != null) return "score";
  return "narrative";
}

function getFrameworkTone(frameworkName?: string | null) {
  const normalized = (frameworkName || "").toLowerCase();
  if (normalized.includes("bettercoal")) return "Bettercoal-style principle review";
  if (normalized.includes("eo100") || normalized.includes("eo 100")) return "EO100 performance target review";
  if (normalized.includes("cgwg")) return "CGWG supplier questionnaire";
  return "Framework questionnaire";
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

  const [questions, responses] = await Promise.all([
    api.get<any[]>(`/api/organizations/${orgId}/assessments/${assessmentId}/questions/`, token, request),
    api.get<any[]>(`/api/organizations/${orgId}/assessments/${assessmentId}/responses/`, token, request),
  ]);
  
  return {
    assessmentId,
    assessment,
    orgId,
    questions: Array.isArray(questions) ? questions : (questions as any)?.results ?? [],
    responses: Array.isArray(responses) ? responses : (responses as any)?.results ?? [],
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
          { answer_text: answer },
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
      return { error: err?.body?.detail ?? err.message ?? "Failed to save response" };
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

      // Attach to response (update evidence_files array)
      if (responseId) {
        // Update existing response
        const response = await api.withOrganization.get<any>(
          `/api/responses/${responseId}/`,
          orgId,
          token,
          request,
        );
        const evidenceFiles = response.evidence_files || [];
        evidenceFiles.push({
          url: uploadData.url,
          file_name: uploadData.file_name,
          file_size: uploadData.file_size,
        });
        await api.withOrganization.patch(
          `/api/responses/${responseId}/`,
          { evidence_files: evidenceFiles },
          orgId,
          token,
          request,
        );
      } else {
        // Create a new response with the evidence file
        if (!orgId) {
          return { error: "Organization ID is required" };
        }
        await api.withOrganization.post(
          `/api/organizations/${orgId}/assessments/${assessmentId}/responses/`,
          {
            assessment: assessmentId,
            question: questionId,
            answer_text: "",
            evidence_files: [{
              url: uploadData.url,
              file_name: uploadData.file_name,
              file_size: uploadData.file_size,
            }],
          },
          orgId,
          token,
          request,
        );
      }

      return redirect(`/assessments/${assessmentId}/questionnaire`);
    } catch (err: any) {
      return { error: err.message ?? "Upload failed" };
    }
  }

  if (intent === "validate-response") {
    const responseId = formData.get("response_id") as string;

    try {
      const result = await api.post<any>(`/api/responses/${responseId}/validate/`, {}, token, request);
      // Return success message to be shown via loader
      return { 
        redirect: `/assessments/${assessmentId}/questionnaire`,
        message: `Validation: ${result.validation_status.toUpperCase()} (${(result.confidence_score * 100).toFixed(0)}% confidence)`
      };
    } catch (err: any) {
      return { error: err.message ?? "Validation failed" };
    }
  }

  return { error: "Unknown intent" };
}

function QuestionCard({
  question,
  index,
  existingResponse,
  isEditing,
  onEdit,
  onSaved,
  onSaveFailed,
  onOptimisticSave,
  assessmentId,
  orgId,
  onAddMapping,
}: {
  question: QuestionnaireQuestion;
  index: number;
  existingResponse?: QuestionnaireResponse;
  isEditing: boolean;
  onEdit: () => void;
  onSaved: (response: QuestionnaireResponse) => void;
  onSaveFailed: (questionId: string, previousResponse?: QuestionnaireResponse) => void;
  onOptimisticSave: (questionId: string, answer: string, responseId?: string) => void;
  assessmentId: string;
  orgId: string;
  onAddMapping: (questionId: string) => void;
}) {
  const hasAI = existingResponse?.ai_score_suggestion != null || existingResponse?.ai_feedback;
  const [localAnswer, setLocalAnswer] = useState(existingResponse?.answer_text || "");
  const saveFetcher = useFetcher<typeof action>();
  const navigation = useNavigation();
  const { success: toastSuccess, error: toastError, loading: toastLoading, dismiss: dismissToast } = useToast();
  const saveToastIdRef = useRef<string | number | null>(null);
  const handledSaveResultRef = useRef(false);
  const previousResponseRef = useRef<QuestionnaireResponse | undefined>(undefined);
  const isSaving = saveFetcher.state === "submitting";
  const isValidating = navigation.state === "submitting" && navigation.formData?.get("intent") === "validate-response";

  useEffect(() => {
    if (isEditing && !localAnswer && existingResponse?.answer_text) {
      setLocalAnswer(existingResponse.answer_text);
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
              {question.performance_target_level ? (
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
              <Form method="post">
                <input type="hidden" name="intent" value="validate-response" />
                <input type="hidden" name="response_id" value={existingResponse.id || ""} />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                  disabled={isValidating || !existingResponse.answer_text}
                >
                  {isValidating ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3 h-3 mr-1" />
                  )}
                  {isValidating ? "Validating..." : "Validate"}
                </Button>
              </Form>
            )}
            {!isEditing && (
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
        {existingResponse?.answer_text && !isEditing && (
          <div className="p-4 bg-muted/30 rounded-lg text-sm space-y-2 border border-muted">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Answer</span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{existingResponse.answer_text}</p>
            {existingResponse.evidence_files && existingResponse.evidence_files.length > 0 && (
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
                <textarea
                  name="answer"
                  value={localAnswer}
                  onChange={(e) => setLocalAnswer(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                  placeholder="Provide your answer..."
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Paperclip className="w-4 h-4" />
                  <span className="text-xs">Evidence attached: {existingResponse?.evidence_files?.length || 0}</span>
                </div>
                <UploadEvidenceButton
                  responseId={existingResponse?.id}
                  questionId={question.id}
                  assessmentId={assessmentId}
                  orgId={orgId}
                />
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

export default function QuestionnaireRoute() {
  const { assessmentId, assessment, orgId, questions, responses, user } = useLoaderData<typeof loader>();
  const assessmentData = assessment as QuestionnaireAssessment;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [localQuestions, setLocalQuestions] = useState<QuestionnaireQuestion[]>(questions);
  const [localResponses, setLocalResponses] = useState<QuestionnaireResponse[]>(responses);
  const [currentPage, setCurrentPage] = useState(1);

  const terminology = terminologyFromUser(user);
  const assessmentLabel = terminology.assessment;
  const answeredCount = localQuestions.filter((question) =>
    localResponses.some((response) => String(response.question) === String(question.id) && Boolean(response.answer_text))
  ).length;
  const completionPercent = localQuestions.length ? Math.round((answeredCount / localQuestions.length) * 100) : 0;
  const totalPages = Math.max(1, Math.ceil(localQuestions.length / QUESTIONS_PER_PAGE));
  const pageStart = (currentPage - 1) * QUESTIONS_PER_PAGE;
  const paginatedQuestions = localQuestions.slice(pageStart, pageStart + QUESTIONS_PER_PAGE);
  const questionsByCategory = paginatedQuestions.reduce<Record<string, QuestionnaireQuestion[]>>((acc, question) => {
    const category = question.category || "General";
    acc[category] = acc[category] || [];
    acc[category].push(question);
    return acc;
  }, {});

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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
    <div className="max-w-6xl mx-auto py-8 space-y-6">
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
        </CardHeader>
      </Card>

      {localQuestions.length === 0 ? (
        <div className="text-center py-12 bg-muted rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">No questions associated with this {lowerFirst(assessmentLabel)}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {pageStart + 1}-{Math.min(pageStart + QUESTIONS_PER_PAGE, localQuestions.length)} of {localQuestions.length}
            </span>
            <span>Page {currentPage} of {totalPages}</span>
          </div>

          {Object.entries(questionsByCategory).map(([category, categoryQuestions]) => (
            <section key={category} className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{category}</h3>
                <Separator className="flex-1" />
              </div>
              <div className="grid gap-4">
                {categoryQuestions.map((q: QuestionnaireQuestion) => {
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
                      onSaveFailed={handleSaveFailed}
                      onOptimisticSave={handleOptimisticSave}
                      assessmentId={assessmentId || ""}
                      orgId={orgId || ""}
                      onAddMapping={handleAddMapping}
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
