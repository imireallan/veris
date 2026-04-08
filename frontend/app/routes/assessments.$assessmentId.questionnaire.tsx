import { useLoaderData, useActionData, Form, redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { useState } from "react";
import { FileText, CheckCircle, AlertCircle, Clock, Save } from "lucide-react";
import { Badge, Button, Card, CardContent, EmptyState, ProgressBar } from "~/components/ui";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = getUserToken(request);
  const { orgId, assessmentId } = params;

  // Fetch assessment to get template
  const assessment = await api.get<any>(`/api/assessments/${assessmentId}/?organization=${orgId}`, token)
    .catch(() => null);

  if (!assessment) {
    return { assessment: null, questions: [], responses: [], submissionStatus: null };
  }

  const templateId = assessment.template?.id;

  // Fetch questions and responses in parallel
  const [questions, responses] = await Promise.all([
    templateId
      ? api.get<any[]>(`/api/questions/?template=${templateId}&organization=${orgId}`, token).catch(() => [])
      : Promise.resolve([]),
    api.get<any[]>(`/api/responses/?assessment=${assessmentId}`, token).catch(() => []),
  ]);

  // Build a map of existing responses by question_id
  const responseMap = new Map<string, any>();
  responses.forEach((r: any) => responseMap.set(r.question, r));

  return {
    assessment,
    questions: Array.isArray(questions) ? questions : [],
    responses: Array.isArray(responses) ? responses : [],
    responseMap: Object.fromEntries(responseMap),
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = getUserToken(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const assessmentId = params.assessmentId;

  try {
    if (intent === "save-response") {
      const responseId = formData.get("response_id") as string;
      const questionId = formData.get("question_id") as string;
      const answer = formData.get("answer") as string;
      const ai_score_suggestion = formData.get("ai_score_suggestion");
      const ai_feedback = formData.get("ai_feedback");

      const body: Record<string, any> = {
        assessment: assessmentId,
        question: questionId,
        answer_text: answer,
      };
      if (ai_score_suggestion) body.ai_score_suggestion = parseFloat(ai_score_suggestion);
      if (ai_feedback) body.ai_feedback = ai_feedback;

      if (responseId) {
        await api.patch(`/api/responses/${responseId}/`, body, token);
      } else {
        await api.post(`/api/responses/`, body, token);
      }
      return redirect(`/organizations/${params.orgId}/assessments/${assessmentId}/questionnaire`);
    }

    if (intent === "submit-questionnaire") {
      // Mark assessment as having completed questionnaire
      await api.patch(`/api/assessments/${assessmentId}/`, {
        status: "COMPLETED",
      }, token);
      return redirect(`/organizations/${params.orgId}/assessments/${assessmentId}`);
    }
  } catch (err: any) {
    return { error: err.message ?? "Action failed" };
  }

  return { error: "Unknown intent" };
}

/* ────────────── Questionnaire Detail Page ────────────── */

export default function QuestionnaireDetailRoute() {
  const data = useLoaderData<typeof loader>();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingResponse, setEditingResponse] = useState<string | null>(null);
  const actionData = useActionData<typeof action>();

  if (!data.assessment) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-xl font-medium">Assessment not found</h2>
      </div>
    );
  }

  const { questions, responseMap } = data;

  // Group questions by category
  const categories = ["all", ...new Set(questions.map((q: any) => q.category || "General"))];
  const filteredQuestions = selectedCategory === "all"
    ? questions
    : questions.filter((q: any) => (q.category || "General") === selectedCategory);

  // Count answered questions
  const answeredCount = filteredQuestions.filter(
    (q: any) => responseMap[q.id]
  ).length;
  const progress = filteredQuestions.length > 0
    ? Math.round((answeredCount / filteredQuestions.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Questionnaire</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data.assessment.title || `Assessment ${data.assessment.id.slice(0, 8)}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {answeredCount}/{filteredQuestions.length} answered ({progress}%)
          </span>
          <ProgressBar value={progress} size="sm" className="w-32" />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setSelectedCategory(cat); setEditingResponse(null); }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {actionData?.error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {actionData.error}
        </div>
      )}

      {/* Questions list */}
      {filteredQuestions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No questions"
          description="No questions found for this assessment template."
        />
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q: any, idx: number) => {
            const existing = responseMap[q.id];
            const isEditing = editingResponse === q.id;
            return (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx + 1}
                existingResponse={existing}
                isEditing={isEditing}
                onEdit={() => setEditingResponse(isEditing ? null : q.id)}
                assessmentId={data.assessment.id}
              />
            );
          })}
        </div>
      )}

      {/* Submit button */}
      {answeredCount > 0 && (
        <div className="flex justify-end pt-4">
          <Form method="post">
            <input type="hidden" name="intent" value="submit-questionnaire" />
            <Button size="lg">
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit Questionnaire
            </Button>
          </Form>
        </div>
      )}
    </div>
  );
}

/* ────────────── Question Card ────────────── */

function QuestionCard({
  question,
  index,
  existingResponse,
  isEditing,
  onEdit,
  assessmentId,
}: {
  question: any;
  index: number;
  existingResponse?: any;
  isEditing: boolean;
  onEdit: () => void;
  assessmentId: string;
}) {
  const hasAI = existingResponse?.ai_score_suggestion != null || existingResponse?.ai_feedback;

  return (
    <Card className={hasAI ? "border-blue-200" : ""}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground font-mono">Q{index}</span>
              {question.category && (
                <Badge variant="secondary" className="text-[10px]">
                  {question.category}
                </Badge>
              )}
              {existingResponse && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
            <h4 className="font-medium">{question.text}</h4>
            {question.description && (
              <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
            )}
          </div>
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

        {/* Scoring criteria */}
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

        {/* AI insight */}
        {hasAI && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm space-y-1">
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              AI Suggestion
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

        {/* Response form */}
        {isEditing && (
          <Form method="post" className="space-y-3">
            <input type="hidden" name="intent" value="save-response" />
            <input type="hidden" name="response_id" value={existingResponse?.id || ""} />
            <input type="hidden" name="question_id" value={question.id} />
            <input type="hidden" name="assessment_id" value={assessmentId} />

            <div>
              <label className="text-sm font-medium mb-1 block">Answer</label>
              <textarea
                name="answer"
                defaultValue={existingResponse?.answer_text || ""}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                placeholder="Provide your answer..."
              />
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
