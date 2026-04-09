import { useLoaderData, Link, Form, redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { Plus, Save, Trash2, MessageSquare, GripVertical, ChevronRight } from "lucide-react";
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

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const { orgId, templateId } = params;

  if (user.role !== "ADMIN" && String(user.organization_id) !== String(orgId)) {
    throw new Response("Access denied", { status: 403 });
  }

  const template = await api.get<any>(`/api/organizations/${orgId}/templates/${templateId}/`, token);
  const questions = await api.get<any>(`/api/organizations/${orgId}/templates/${templateId}/questions/`, token)
    .then(res => Array.isArray(res) ? res : (res?.results || []))
    .catch(() => []);

  return { template, questions, orgId, templateId, user };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const { orgId, templateId } = params;

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
      }, token);
      return redirect(`/organizations/${orgId}/templates/${templateId}`);
    } catch (err: any) {
      return { error: err.message ?? "Failed to add question" };
    }
  }

  if (intent === "delete-question") {
    const questionId = formData.get("question_id") as string;
    try {
      await api.delete(`/api/organizations/${orgId}/templates/${templateId}/questions/${questionId}/`, token);
      return redirect(`/organizations/${orgId}/templates/${templateId}`);
    } catch (err: any) {
      return { error: err.message ?? "Failed to delete question" };
    }
  }

  return { error: "Unknown intent" };
}

export default function TemplateEditor() {
  const { template, questions, orgId, templateId } = useLoaderData<{
    template: any;
    questions: any[];
    orgId: string;
    templateId: string;
    user: any;
  }>();
  const [isAdding, setIsAdding] = useState(false);

  // Group questions by category
  const groupedQuestions = questions.reduce((acc: Record<string, any[]>, q: any) => {
    const cat = q.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(q);
    return acc;
  }, {});

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
        </div>
        <Button 
          onClick={() => setIsAdding(true)} 
          size="sm" 
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </Button>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {Object.keys(groupedQuestions).length === 0 ? (
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
              <Accordion type="multiple" className="space-y-4">
                {Object.entries(groupedQuestions).map(([category, qs]) => (
                  <AccordionItem 
                     key={category} 
                    value={category} 
                    className="border rounded-lg px-4 bg-card overflow-hidden"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-medium uppercase text-[10px] tracking-wider">
                          {category}
                        </Badge>
                        <span className="text-sm font-medium text-muted-foreground">
                          {qs.length} Questions
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-4">
                      {qs.map((q) => (
                        <div 
                          key={q.id} 
                          className="group flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                        >
                          <GripVertical className="w-4 h-4 text-muted-foreground mt-1 cursor-grab" />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-primary uppercase">{q.type || 'text'}</span>
                              <p className="text-sm font-medium leading-relaxed">{q.text}</p>
                            </div>
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
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Modal */}
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
