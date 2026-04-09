import { useState, useEffect } from "react";
import { useLoaderData, Link, Form, redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Paperclip, 
  Save 
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  Badge, 
  Button 
} from "~/components/ui";

// Mock Upload button since I don't have the original component definition
function UploadEvidenceButton({ responseId }: { responseId?: string }) {
  return (
    <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
      Upload
    </Button>
  );
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  
  const assessmentId = params.id;
  
  const [questions, responses] = await Promise.all([
    api.get<any>(`/api/assessments/${assessmentId}/questions/`, token).catch(() => []),
    api.get<any>(`/api/assessments/${assessmentId}/responses/`, token).catch(() => []),
  ]);

  return {
    assessmentId,
    questions: Array.isArray(questions) ? questions : (questions?.results ?? []),
    responses: Array.isArray(responses) ? responses : (responses?.results ?? []),
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "save-response") {
    const responseId = formData.get("response_id") as string;
    const questionId = formData.get("question_id") as string;
    const answer = formData.get("answer") as string;
    const assessmentId = formData.get("assessment_id") as string;

    try {
      if (responseId) {
        await api.patch(`/api/responses/${responseId}/`, { answer }, token);
      } else {
        await api.post("/api/responses/", {
          assessment: assessmentId,
          question: questionId,
          answer: answer,
        }, token);
      }
      return redirect(`/assessments/${params.id}/questionnaire`);
    } catch (err: any) {
      return { error: err.message ?? "Failed to save response" };
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
}: {
  question: any;
  index: number;
  existingResponse?: any;
  isEditing: boolean;
  onEdit: () => void;
  assessmentId: string;
}) {
  const hasAI = existingResponse?.ai_score_suggestion != null || existingResponse?.ai_feedback;
  const [localAnswer, setLocalAnswer] = useState(existingResponse?.answer_text || "");

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
  const { assessmentId, questions, responses } = useLoaderData<typeof loader>();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
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
        {questions.map((q: any, idx: number) => {
          const response = responses.find((r: any) => r.question === q.id);
          return (
            <QuestionCard
              key={q.id}
              index={idx + 1}
              question={q}
              existingResponse={response}
              isEditing={editingIndex === idx}
              onEdit={() => setEditingIndex(editingIndex === idx ? null : idx)}
              assessmentId={assessmentId || ""}
            />
          );
        })}
      </div>
    </div>
  );
}
