import { useState, useEffect, useRef } from "react";
import { useLoaderData, Link, Form, redirect, useNavigation } from "react-router";
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
  Plus
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  Badge, 
  Button,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui";
import { FrameworkMappingBadge, type FrameworkMapping } from "~/components/FrameworkMappingBadge";
import { FrameworkMappingModal } from "~/components/FrameworkMappingModal";

interface QuestionnaireQuestion {
  id: string;
  text: string;
  description?: string | null;
  category?: string | null;
  scoring_criteria?: Record<string, unknown> | null;
  framework_mappings?: FrameworkMapping[];
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

function UploadEvidenceButton({
  responseId,
}: {
  responseId?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigation = useNavigation();
  const isUploading = navigation.state === "submitting";

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.csv"
      />
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || !responseId}
      >
        {isUploading ? (
          <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading...</>
        ) : (
          "Upload"
        )}
      </Button>
    </>
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
    orgId,
    questions: Array.isArray(questions) ? questions : (questions as any)?.results ?? [],
    responses: Array.isArray(responses) ? responses : (responses as any)?.results ?? [],
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const assessmentId = params.id!;

  if (intent === "save-response") {
    const responseId = formData.get("response_id") as string;
    const questionId = formData.get("question_id") as string;
    const answer = formData.get("answer") as string;
    const orgId = formData.get("org_id") as string;

    try {
      if (responseId) {
        await api.patch(`/api/responses/${responseId}/`, { answer }, token, request);
      } else {
        await api.post("/api/responses/", {
          assessment: assessmentId,
          question: questionId,
          answer: answer,
        }, token, request);
      }
      return redirect(`/assessments/${assessmentId}/questionnaire`);
    } catch (err: any) {
      if (err instanceof Response && err.status === 302) throw err;
      return { error: err.message ?? "Failed to save response" };
    }
  }

  if (intent === "upload-evidence") {
    const responseId = formData.get("response_id") as string;
    const file = formData.get("file") as File;

    try {
      // Upload file
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const uploadResponse = await fetch("/api/upload-evidence/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        return { error: error.error ?? "Upload failed" };
      }

      const uploadData = await uploadResponse.json();

      // Attach to response (update evidence_files array)
      if (responseId) {
        const response = await api.get<any>(`/api/responses/${responseId}/`, token, request);
        const evidenceFiles = response.evidence_files || [];
        evidenceFiles.push({
          url: uploadData.url,
          file_name: uploadData.file_name,
          file_size: uploadData.file_size,
        });
        await api.patch(`/api/responses/${responseId}/`, { evidence_files: evidenceFiles }, token, request);
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
  assessmentId,
  orgId,
  onAddMapping,
}: {
  question: QuestionnaireQuestion;
  index: number;
  existingResponse?: QuestionnaireResponse;
  isEditing: boolean;
  onEdit: () => void;
  assessmentId: string;
  orgId: string;
  onAddMapping: (questionId: string) => void;
}) {
  const hasAI = existingResponse?.ai_score_suggestion != null || existingResponse?.ai_feedback;
  const [localAnswer, setLocalAnswer] = useState(existingResponse?.answer_text || "");
  const navigation = useNavigation();
  const isUploading = navigation.state === "submitting" && navigation.formData?.get("intent") === "upload-evidence";
  const isValidating = navigation.state === "submitting" && navigation.formData?.get("intent") === "validate-response";

  useEffect(() => {
    if (isEditing && !localAnswer && existingResponse?.answer_text) {
      setLocalAnswer(existingResponse.answer_text);
    }
  }, [isEditing, existingResponse]);

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
              <span className="text-xs text-muted-foreground font-mono">Q{index}</span>
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
            {existingResponse && !isEditing && (
              <button
                type="button"
                onClick={onEdit}
                className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md"
              >
                Edit
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

        {isEditing && (
          <Form method="post" className="space-y-3">
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
                <UploadEvidenceButton responseId={existingResponse?.id} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onEdit}
                className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md"
              >
                Cancel
              </button>
              <Button type="submit" size="sm">
                <Save className="w-3.5 h-3.5 mr-1" />
                Save Response
              </Button>
            </div>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

export default function QuestionnaireRoute() {
  const { assessmentId, orgId, questions, responses } = useLoaderData<typeof loader>();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [localQuestions, setLocalQuestions] = useState<QuestionnaireQuestion[]>(questions);

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

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/assessments/${assessmentId}`}>Assessment</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Questionnaire</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Questionnaire</h2>
        <Link 
          to={`/assessments/${assessmentId}`} 
          className="text-sm text-primary hover:underline"
        >
          Back to Assessment
        </Link>
      </div>

      <div className="grid gap-6">
        {localQuestions.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">No questions associated with this assessment.</p>
          </div>
        ) : (
          localQuestions.map((q: QuestionnaireQuestion, idx: number) => {
            const response = responses.find((r: QuestionnaireResponse) => r.question === q.id);
            return (
              <QuestionCard
                key={q.id}
                index={idx + 1}
                question={q}
                existingResponse={response}
                isEditing={editingIndex === idx}
                onEdit={() => setEditingIndex(editingIndex === idx ? null : idx)}
                assessmentId={assessmentId || ""}
                orgId={orgId || ""}
                onAddMapping={handleAddMapping}
              />
            );
          })
        )}
      </div>

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
