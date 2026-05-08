import { useActionData, useLoaderData, Link, Form, redirect, useFetcher } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { ApiError, api } from "~/.server/lib/api";
import { useState, useRef } from "react";
import { ArrowLeft, AlertTriangle, Plus, Trash2, Edit3, Save, X, FileText, Download, ChevronLeft, ChevronRight, CheckCircle2, CircleDot, Clock3, Info, Lock, Users } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  ProgressBar,
  SectionCard,
  EmptyState,
  TabsSection,
  EditableField,
  EditModeToolbar,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Alert,
  AlertDescription,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui";
import { terminologyFromUser, lowerFirst } from "~/lib/terminology";
import type { TerminologyLabels } from "~/lib/terminology";
import type { AssessmentReport, User } from "~/types";
import { RBAC } from "~/types/rbac";

export function getReportExportUiState({
  user,
  hasReport,
  generatingReport,
  reportLabel,
  assessmentLabel,
}: {
  user: User | null;
  hasReport: boolean;
  generatingReport: boolean;
  reportLabel: string;
  assessmentLabel: string;
}) {
  const canExportReport = RBAC.canExportReports(user);

  if (generatingReport) {
    return {
      canClick: false,
      disabled: true,
      tooltip: `Generating PDF ${reportLabel.toLowerCase()}...`,
    };
  }

  if (!hasReport) {
    return {
      canClick: false,
      disabled: true,
      tooltip: `No ${reportLabel.toLowerCase()} generated yet. Complete the ${assessmentLabel.toLowerCase()} and create a ${reportLabel.toLowerCase()} first.`,
    };
  }

  if (!canExportReport) {
    return {
      canClick: false,
      disabled: true,
      tooltip: `You don't have permission to export ${reportLabel.toLowerCase()}s. Contact your organization admin.`,
    };
  }

  return {
    canClick: true,
    disabled: false,
    tooltip: `Download PDF ${reportLabel.toLowerCase()}`,
  };
}

export function getReportViewUiState({
  user,
  hasReport,
  reportLabel,
  assessmentLabel,
}: {
  user: User | null;
  hasReport: boolean;
  reportLabel: string;
  assessmentLabel: string;
}) {
  const canViewReport = RBAC.canViewReports(user);

  if (!hasReport) {
    return {
      canView: canViewReport,
      showTab: canViewReport,
      state: "empty" as const,
      message: `No ${reportLabel.toLowerCase()} has been generated for this ${assessmentLabel.toLowerCase()} yet.`,
    };
  }

  if (!canViewReport) {
    return {
      canView: false,
      showTab: true,
      state: "denied" as const,
      message: `You don't have permission to view this ${reportLabel.toLowerCase()}.`,
    };
  }

  return {
    canView: true,
    showTab: true,
    state: "content" as const,
    message: "",
  };
}

type LoaderWarning = {
  key: string;
  label: string;
  message: string;
};

function getApiErrorMessage(err: unknown, fallback = "The backend returned an error.") {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

function emptyPaginatedResponse() {
  return { results: [] };
}

async function safeLoadResource<T>(
  label: string,
  requestFn: () => Promise<T>,
  warnings: LoaderWarning[],
  fallback: T,
): Promise<T> {
  try {
    return await requestFn();
  } catch (err) {
    console.warn(`Failed to fetch ${label}:`, getApiErrorMessage(err));
    warnings.push({
      key: label.toLowerCase().replace(/\s+/g, "-"),
      label,
      message: `${label} could not be loaded right now. The rest of the assessment is still available.`,
    });
    return fallback;
  }
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const warnings: LoaderWarning[] = [];
  
  // We need to resolve the assessment first to get its organization context
  // since the route /assessments/:id doesn't explicitly have orgId in the URL
  let assessment: any | null = null;
  let loadError: string | null = null;

  try {
    assessment = await api.get<any>(`/api/assessments/${params.id}/`, token, request);
  } catch (err: any) {
    if (err.status === 403) {
      console.warn("Permission denied: User cannot access this assessment");
      loadError = "permission_denied";
    } else if (err.status === 404) {
      console.warn("Assessment not found");
      loadError = "not_found";
    } else {
      console.warn("Failed to fetch assessment:", getApiErrorMessage(err));
      loadError = "backend_error";
    }
  }
  
  if (!assessment) {
    return {
      assessment: null,
      findings: [],
      cipCycles: [],
      tasks: [],
      workflow: null,
      report: null,
      user,
      error: loadError ?? "backend_error",
      warnings,
    };
  }

  const orgId = assessment.organization;

  const [findingsRes, cipCyclesRes, tasksRes, workflowRes, reportRes] = await Promise.all([
    safeLoadResource("Findings", () => api.get<any>(`/api/findings/?assessment=${params.id}&org=${orgId}`, token, request), warnings, emptyPaginatedResponse()),
    safeLoadResource("CIP cycles", () => api.get<any>(`/api/cip-cycles/?assessment=${params.id}&org=${orgId}`, token, request), warnings, emptyPaginatedResponse()),
    safeLoadResource("Tasks", () => api.get<any>(`/api/tasks/?assessment=${params.id}&org=${orgId}`, token, request), warnings, emptyPaginatedResponse()),
    safeLoadResource("Workflow", () => api.get<any>(`/api/assessment-workflows/?assessment=${params.id}&org=${orgId}`, token, request), warnings, emptyPaginatedResponse()),
    safeLoadResource("Reports", () => api.get<any>(`/api/reports/?assessment=${params.id}&org=${orgId}`, token, request), warnings, emptyPaginatedResponse()),
  ]);

  // Handle paginated responses (results array) or direct arrays
  const findings = findingsRes.results || (Array.isArray(findingsRes) ? findingsRes : []);
  const cipCycles = cipCyclesRes.results || (Array.isArray(cipCyclesRes) ? cipCyclesRes : []);
  const tasks = tasksRes.results || (Array.isArray(tasksRes) ? tasksRes : []);
  const workflow = workflowRes.results?.[0] ?? (Array.isArray(workflowRes) ? workflowRes[0] : null);
  const report = reportRes.results?.[0] ?? (Array.isArray(reportRes) ? reportRes[0] : null);

  return {
    assessment: assessment,
    findings: findings,
    cipCycles: cipCycles,
    tasks: tasks,
    workflow: workflow,
    report: report,
    user,
    warnings,
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    if (intent === "save-assessment") {
      await api.patch(`/api/assessments/${params.id}/`, {
        status: formData.get("status"),
        risk_level: formData.get("risk_level"),
        overall_score: Number(formData.get("overall_score")) || 0,
        ai_summary: formData.get("ai_summary") ?? "",
      }, token, request);
      return redirect(`/assessments/${params.id}`);
    }

    if (intent === "create-finding") {
      await api.post("/api/findings/", {
        assessment: params.id,
        topic: "New Finding",
        summary: "",
        severity: "MEDIUM",
        status: "OPEN",
      }, token, request);
      return redirect(`/assessments/${params.id}`);
    }

    if (intent === "save-finding") {
      const id = formData.get("finding_id");
      await api.patch(`/api/findings/${id}/`, {
        topic: formData.get("topic"),
        summary: formData.get("summary"),
        recommended_actions: formData.get("recommended_actions"),
        severity: formData.get("severity"),
        status: formData.get("status"),
        responsible_party: formData.get("responsible_party"),
      }, token, request);
      return redirect(`/assessments/${params.id}`);
    }

    if (intent === "delete-finding") {
      const id = formData.get("finding_id");
      await api.delete(`/api/findings/${id}/`, token, request);
      return redirect(`/assessments/${params.id}`);
    }

    if (intent === "complete-workflow-action") {
      const id = formData.get("action_instance_id");
      await api.post(`/api/assessment-actions/${id}/complete/`, {
        notes: formData.get("notes") ?? "",
      }, token, request);
      return redirect(`/assessments/${params.id}`);
    }
  } catch (err: any) {
    console.warn(`Assessment action failed (${intent}):`, getApiErrorMessage(err));
    return {
      error: getApiErrorMessage(err, "That action could not be completed right now."),
    };
  }

  return { error: "Unknown intent" };
}

export default function AssessmentDetailRoute() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [formData, setFormData] = useState({
    status: data.assessment?.status ?? "DRAFT",
    risk_level: data.assessment?.risk_level ?? "MEDIUM",
    overall_score: data.assessment?.overall_score ?? 0,
    ai_summary: data.assessment?.ai_summary ?? "",
  });
  const [editingFinding, setEditingFinding] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const terminology = terminologyFromUser(data.user);
  const assessmentLabel = terminology.assessment;
  const assessmentsLabel = terminology.plural.assessment;
  const tasksLabel = terminology.plural.task;
  const reportLabel = terminology.report;

  // Handle inaccessible or temporarily unavailable assessment data
  if (data.error || !data.assessment) {
    const isBackendError = data.error === "backend_error";
    const isNotFound = data.error === "not_found";

    return (
      <div className="text-center py-12 space-y-4">
        <AlertTriangle className={`w-12 h-12 mx-auto ${isBackendError ? "text-destructive" : "text-orange-500"}`} />
        <h2 className="text-xl font-medium">
          {isBackendError ? `${assessmentLabel} temporarily unavailable` : isNotFound ? `${assessmentLabel} not found` : "Access Denied"}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {isBackendError
            ? `The backend could not load this ${lowerFirst(assessmentLabel)} right now. Try refreshing in a moment.`
            : isNotFound
              ? `This ${lowerFirst(assessmentLabel)} could not be found.`
              : `You don't have permission to view this ${lowerFirst(assessmentLabel)}. Contact your organization admin if you believe this is an error.`}
        </p>
        <Link to="/assessments" className="text-primary hover:underline">
          ← Back to {lowerFirst(assessmentsLabel)}
        </Link>
      </div>
    );
  }

  const a = data.assessment;
  const reportExportUiState = getReportExportUiState({
    user: data.user,
    hasReport: Boolean(data.report),
    generatingReport,
    reportLabel,
    assessmentLabel,
  });
  const reportViewUiState = getReportViewUiState({
    user: data.user,
    hasReport: Boolean(data.report),
    reportLabel,
    assessmentLabel,
  });

  const handleSave = () => {
    formRef.current?.submit();
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/assessments">{assessmentsLabel}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <div className="inline-block" title={a.display_name || `${assessmentLabel} ${a.id.slice(0, 8)}`}>
              <BreadcrumbPage>
                {a.display_name || `${assessmentLabel} ${a.id.slice(0, 8)}`}
              </BreadcrumbPage>
            </div>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3">
        <Link to="/assessments" className="p-2 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <div className="inline-block" title={a.display_name || `${assessmentLabel} ${a.id.slice(0, 8)}`}>
            <h2 className="text-2xl font-semibold tracking-tight">
              {a.display_name || `${assessmentLabel} ${a.id.slice(0, 8)}`}
            </h2>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Created {new Date(a.created_at).toLocaleDateString()}
          </p>
        </div>
        {/* Download Report Button */}
        <Tooltip>
          <TooltipTrigger>
            <span tabIndex={0} className="inline-flex">
              <Button
                variant={data.report && reportExportUiState.canClick ? "default" : "outline"}
                size="sm"
                disabled={reportExportUiState.disabled}
                className="gap-2"
                aria-label={reportExportUiState.tooltip}
                onClick={async (e) => {
                  e.preventDefault();
                  if (!data.report || !reportExportUiState.canClick) return;
                  setGeneratingReport(true);
                  try {
                    window.open(`/resources/reports/${data.report.id}/pdf`, "_blank");
                    setTimeout(() => setGeneratingReport(false), 2000);
                  } catch (error) {
                    console.error("PDF download failed:", error);
                    setGeneratingReport(false);
                  }
                }}
              >
                {generatingReport ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download {reportLabel}
                  </>
                )}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" align="center" sideOffset={8}>
            {reportExportUiState.tooltip}
          </TooltipContent>
        </Tooltip>
        <EditModeToolbar
          editMode={editMode}
          onEdit={() => setEditMode(true)}
          onSave={handleSave}
          onCancel={() => setEditMode(false)}
        />
      </div>

      <Form method="post" ref={formRef} className={editMode ? "inline" : "hidden"}>
        <input type="hidden" name="intent" value="save-assessment" />
        <input type="hidden" name="status" value={formData.status} />
        <input type="hidden" name="risk_level" value={formData.risk_level} />
        <input type="hidden" name="overall_score" value={String(formData.overall_score)} />
        <input type="hidden" name="ai_summary" value={formData.ai_summary} />
      </Form>

      {actionData?.error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{actionData.error}</span>
        </div>
      )}

      {data.warnings?.length > 0 && (
        <div className="space-y-2">
          {data.warnings.map((warning) => (
            <div key={warning.key} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            <FieldRow label="Status">
              {editMode ? (
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((d) => ({ ...d, status: e.target.value }))}
                  className="px-2 py-1 border rounded-lg text-sm bg-background"
                >
                  {["DRAFT", "IN_PROGRESS", "UNDER_REVIEW", "COMPLETED", "ARCHIVED"].map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              ) : (
                <Badge>{a.status.replace(/_/g, " ")}</Badge>
              )}
            </FieldRow>

            <FieldRow label="Risk">
              {editMode ? (
                <select
                  value={formData.risk_level}
                  onChange={(e) => setFormData((d) => ({ ...d, risk_level: e.target.value }))}
                  className="px-2 py-1 border rounded-lg text-sm bg-background"
                >
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <Badge variant={riskBadgeVariant(a.risk_level)}>{a.risk_level}</Badge>
              )}
            </FieldRow>

            <FieldRow label="Score">
              {editMode ? (
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.overall_score}
                  onChange={(e) =>
                    setFormData((d) => ({
                      ...d,
                      overall_score: Number(e.target.value),
                    }))
                  }
                  className="px-2 py-1 border rounded-lg text-sm bg-background w-20"
                />
              ) : (
                <span className="text-sm font-medium">{a.overall_score}%</span>
              )}
            </FieldRow>

            <div className="ml-auto text-xs text-muted-foreground">
              {a.start_date ? `Start: ${new Date(a.start_date).toLocaleDateString()}` : ""}
              {a.due_date ? ` | Due: ${new Date(a.due_date).toLocaleDateString()}` : ""}
            </div>
          </div>
        </CardContent>
      </Card>

      {a.overall_score >= 0 && (
        <ProgressBar value={a.overall_score} size="md" />
      )}

      <TabsSection
        tabs={[
          { key: "overview", label: "Overview" },
          { key: "development-steps", label: "Workflow", count: data.workflow?.total_actions ?? 0 },
          { key: "questionnaire", label: "Questionnaire" },
          { key: "findings-cip", label: "Findings & CIP", count: data.findings.length + data.cipCycles.length },
          { key: "tasks", label: tasksLabel, count: data.tasks.length },
          ...(reportViewUiState.showTab ? [{ key: "report", label: reportLabel }] : []),
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {activeTab === "overview" && (
        <SectionCard title={`${assessmentLabel} summary`} padding="compact">
          {a.ai_summary ? (
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: a.ai_summary }}
            />
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          )}
          {editMode && (
            <EditableField
              label="Summary"
              value={formData.ai_summary}
              onChange={(v) => setFormData((d) => ({ ...d, ai_summary: v }))}
              multiline
            />
          )}
        </SectionCard>
      )}

      {activeTab === "development-steps" && (
        <DevelopmentStepsTab workflow={data.workflow} />
      )}

      {activeTab === "questionnaire" && (
        <QuestionnaireTab assessmentId={a.id} assessmentLabel={assessmentLabel} />
      )}

      {activeTab === "findings-cip" && (
        <FindingsAndCipTab
          findings={data.findings}
          cipCycles={data.cipCycles}
          editingFinding={editingFinding}
          setEditingFinding={setEditingFinding}
        />
      )}

      {activeTab === "tasks" && (
        <div className="space-y-3">
          {data.tasks.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={`No ${lowerFirst(tasksLabel)} yet`}
              description={`${tasksLabel} will appear here when assigned.`}
            />
          ) : (
            data.tasks.map((t: any) => (
              <Card key={t.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{t.title}</h4>
                    <div className="flex gap-1.5">
                      <Badge variant={taskPriorityVariant(t.priority)} className="text-[10px]">
                        {t.priority}
                      </Badge>
                      <Badge variant={taskStatusVariant(t.status)} className="text-[10px]">
                        {t.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                  {t.description && (
                    <p className="text-sm text-muted-foreground">{t.description}</p>
                  )}
                  {t.due_date && (
                    <div className="text-xs text-muted-foreground">
                      Due: {new Date(t.due_date).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "report" && (
        <ReportTab report={data.report} viewState={reportViewUiState} terminology={terminology} />
      )}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}:</span>
      {children}
    </div>
  );
}

function DevelopmentStepsTab({ workflow }: { workflow: any | null }) {
  if (!workflow) {
    return (
      <EmptyState
        icon={FileText}
        title="No workflow configured"
        description="Workflow milestones will appear once a workflow is attached to this assessment."
      />
    );
  }

  const actions = workflow.actions ?? [];
  const myPendingActions = actions.filter((action: any) => action.can_complete && ["AVAILABLE", "IN_PROGRESS"].includes(action.status));
  const blockedCount = actions.filter((action: any) => action.status === "BLOCKED").length;
  const completedCount = workflow.completed_actions ?? 0;
  const totalCount = workflow.total_actions ?? actions.length;
  const currentStepTitle = (workflow.steps ?? []).find((step: any) => step.code === workflow.current_step_code)?.title;

  return (
    <div className="space-y-4">
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription>
          Workflow milestones are reusable framework gates with prerequisite unlocking and role-based completion. Tasks are ad hoc operational follow-ups assigned to a specific person. Use this tab for assurance progress; use Tasks for one-off work.
        </AlertDescription>
      </Alert>

      <div className="grid gap-3 md:grid-cols-4">
        <WorkflowMetric label="Progress" value={`${Math.round(workflow.progress_percent ?? 0)}%`} helper={`${completedCount}/${totalCount} complete`} />
        <WorkflowMetric label="Current milestone" value={currentStepTitle || formatDisplayLabel(workflow.current_step_code)} helper="Unlocked by prerequisites" />
        <WorkflowMetric label="Waiting on my role" value={String(myPendingActions.length)} helper="Available now" emphasized={myPendingActions.length > 0} />
        <WorkflowMetric label="Blocked" value={String(blockedCount)} helper="Needs earlier milestones" />
      </div>

      <SectionCard
        title={workflow.template_name || "Assessment workflow"}
        description="Role-specific actions unlock as prerequisites are completed."
        padding="compact"
      >
        <Progress value={workflow.progress_percent ?? 0} />
      </SectionCard>

      {myPendingActions.length > 0 && (
        <SectionCard title="My next actions" description="Actions currently available to your role." padding="compact">
          <div className="grid gap-2 lg:grid-cols-2">
            {myPendingActions.map((action: any) => (
              <WorkflowActionCard key={action.id} action={action} compact />
            ))}
          </div>
        </SectionCard>
      )}

      <Accordion className="space-y-3" defaultValue={workflow.current_step_code ? [workflow.current_step_code] : undefined}>
        {(workflow.steps ?? []).map((step: any, index: number) => {
          const stepActions = step.actions ?? [];
          const completed = stepActions.filter((action: any) => action.status === "COMPLETED").length;
          const isCurrent = workflow.current_step_code === step.code;
          const available = stepActions.filter((action: any) => ["AVAILABLE", "IN_PROGRESS"].includes(action.status)).length;

          return (
            <AccordionItem key={step.code} value={step.code} className={`rounded-xl border bg-card px-4 ${isCurrent ? "border-primary/50 shadow-sm" : ""}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex w-full items-start justify-between gap-4 pr-3">
                  <div className="flex items-start gap-3 text-left">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${isCurrent ? "bg-primary text-primary-foreground" : completed === stepActions.length ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {completed === stepActions.length ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{step.title}</h3>
                        {isCurrent && <Badge>Current</Badge>}
                        {available > 0 && <Badge variant="secondary">{available} available</Badge>}
                      </div>
                      {step.description && (
                        <p className="mt-1 text-sm font-normal text-muted-foreground">{step.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={completed === stepActions.length ? "default" : "secondary"}>
                    {completed}/{stepActions.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead className="text-right">Next step</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stepActions.map((action: any) => (
                        <WorkflowActionRow key={action.id} action={action} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function WorkflowMetric({ label, value, helper, emphasized = false }: { label: string; value: string; helper: string; emphasized?: boolean }) {
  return (
    <Card className={emphasized ? "border-primary/40 bg-primary/5" : ""}>
      <CardContent className="p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
      </CardContent>
    </Card>
  );
}

function WorkflowActionCard({ action, compact = false }: { action: any; compact?: boolean }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={workflowStatusVariant(action.status)} className="text-[10px]">
              {formatDisplayLabel(action.status)}
            </Badge>
            {action.step_title && <span className="text-xs text-muted-foreground">{action.step_title}</span>}
          </div>
          <h4 className="text-sm font-medium">{action.title}</h4>
          {!compact && action.description && <p className="text-sm text-muted-foreground">{action.description}</p>}
        </div>
        <CompleteWorkflowActionButton action={action} />
      </div>
    </div>
  );
}

function WorkflowActionRow({ action }: { action: any }) {
  const roles = (action.submit_roles?.length ? action.submit_roles : action.assigned_roles ?? []).map(formatDisplayLabel).join(", ");
  const blockedBy = action.prerequisite_codes?.length ? action.prerequisite_codes.map(formatDisplayLabel).join(", ") : "Earlier actions";

  return (
    <TableRow>
      <TableCell className="align-top">
        <div className="space-y-1">
          <div className="font-medium">{action.title}</div>
          {action.description && <div className="text-sm text-muted-foreground">{action.description}</div>}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {action.required_evidence?.length > 0 && <span>Evidence: {action.required_evidence.join(", ")}</span>}
            {action.completed_at && <span>Completed {new Date(action.completed_at).toLocaleDateString()}</span>}
          </div>
        </div>
      </TableCell>
      <TableCell className="align-top">
        <Badge variant={workflowStatusVariant(action.status)} className="text-[10px]">
          {formatDisplayLabel(action.status)}
        </Badge>
      </TableCell>
      <TableCell className="align-top text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{roles || "Any permitted role"}</span>
      </TableCell>
      <TableCell className="align-top text-right">
        {action.can_complete ? (
          <CompleteWorkflowActionButton action={action} />
        ) : action.status === "COMPLETED" ? (
          <span className="inline-flex items-center gap-1 text-sm text-primary"><CheckCircle2 className="h-4 w-4" />Done</span>
        ) : action.status === "BLOCKED" ? (
          <Tooltip>
            <TooltipTrigger>
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Lock className="h-4 w-4" />Blocked</span>
            </TooltipTrigger>
            <TooltipContent>{blockedBy}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><CircleDot className="h-4 w-4" />Not assigned to you</span>
        )}
      </TableCell>
    </TableRow>
  );
}

function getWorkflowActionCode(action: any) {
  return action.action_code || action.code || "";
}

function getWorkflowActionCta(action: any) {
  const code = getWorkflowActionCode(action);
  if (["supplier_questionnaire_submitted", "questionnaire_submitted", "self_assessment_submitted"].includes(code)) {
    return {
      kind: "link" as const,
      label: "Open questionnaire",
      to: `/assessments/${action.assessment}/questionnaire`,
    };
  }
  if (["evidence_uploaded", "evidence_submitted", "due_diligence_document_uploaded"].includes(code)) {
    return {
      kind: "link" as const,
      label: "Upload evidence",
      to: `/assessments/${action.assessment}/questionnaire`,
    };
  }
  return {
    kind: "complete" as const,
    label: "Complete action",
  };
}

function CompleteWorkflowActionButton({ action }: { action: any }) {
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== "idle";
  const cta = getWorkflowActionCta(action);

  if (cta.kind === "link") {
    return (
      <Link to={cta.to} className="shrink-0">
        <Button size="sm" variant="default" className="gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          {cta.label}
        </Button>
      </Link>
    );
  }

  return (
    <fetcher.Form method="post" className="shrink-0">
      <input type="hidden" name="intent" value="complete-workflow-action" />
      <input type="hidden" name="action_instance_id" value={action.id} />
      <Button type="submit" size="sm" variant="default" className="gap-1.5" disabled={isSubmitting}>
        {isSubmitting ? <Clock3 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        {isSubmitting ? "Completing..." : cta.label}
      </Button>
    </fetcher.Form>
  );
}

function workflowStatusVariant(status: string) {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "AVAILABLE":
    case "IN_PROGRESS":
      return "secondary";
    case "BLOCKED":
      return "outline";
    default:
      return "outline";
  }
}

function ReportTab({
  report,
  viewState,
  terminology,
}: {
  report: AssessmentReport | null;
  viewState: ReturnType<typeof getReportViewUiState>;
  terminology: TerminologyLabels;
}) {
  const reportLabel = terminology.report;
  const assessmentLabel = terminology.assessment;

  if (!report) {
    return (
      <EmptyState
        icon={FileText}
        title={`No ${lowerFirst(reportLabel)} yet`}
        description={viewState.message}
      />
    );
  }

  if (!viewState.canView) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={`${reportLabel} access restricted`}
        description={viewState.message}
      />
    );
  }

  return (
    <div className="space-y-4">
      <SectionCard title={`${reportLabel} overview`} description={`Read-only ${lowerFirst(assessmentLabel)} ${lowerFirst(reportLabel)} content.`}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ReportMetaItem label="Title" value={report.title || "—"} />
          <ReportMetaItem label="Status" value={formatDisplayLabel(report.status)} />
          <ReportMetaItem label={`${assessmentLabel} start`} value={formatDateValue(report.assessment_start_date)} />
          <ReportMetaItem label={`${assessmentLabel} end`} value={formatDateValue(report.assessment_end_date)} />
          <ReportMetaItem label="Published" value={formatDateValue(report.report_published_date)} />
          <ReportMetaItem label="Created" value={formatDateValue(report.created_at)} />
          <ReportMetaItem label="Last updated" value={formatDateValue(report.updated_at)} />
        </div>
      </SectionCard>

      <SectionCard title="Executive summary" padding="compact">
        <ReportTextBlock value={report.executive_summary} emptyValue="No executive summary provided." />
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Methodology" padding="compact">
          <ReportTextBlock value={report.methodology} emptyValue="No methodology provided." />
        </SectionCard>
        <SectionCard title="Scope" padding="compact">
          <ReportTextBlock value={report.scope} emptyValue="No scope provided." />
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Country context" padding="compact">
          <ReportTextBlock value={report.country_context} emptyValue="No country context provided." />
        </SectionCard>
        <SectionCard title="Conclusion" padding="compact">
          <ReportTextBlock value={report.conclusion} emptyValue="No conclusion provided." />
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Meeting participants" padding="compact">
          <ReportListBlock
            items={report.meeting_participants}
            emptyValue="No meeting participants recorded."
          />
        </SectionCard>
        <SectionCard title="Stakeholder meetings" padding="compact">
          <ReportListBlock
            items={report.stakeholder_meetings}
            emptyValue="No stakeholder meetings recorded."
          />
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Limitations" padding="compact">
          <ReportListBlock items={report.limitations} emptyValue="No limitations recorded." />
        </SectionCard>
        <SectionCard title="Disclaimer" padding="compact">
          <ReportTextBlock value={report.disclaimer} emptyValue="No disclaimer provided." renderHtml />
        </SectionCard>
      </div>
    </div>
  );
}

function ReportMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function ReportTextBlock({ value, emptyValue, renderHtml = false }: { value?: string | null; emptyValue: string; renderHtml?: boolean }) {
  const content = value?.trim();

  if (!content) {
    return <p className="text-sm text-muted-foreground">{emptyValue}</p>;
  }

  if (renderHtml) {
    return (
      <div
        className="text-sm leading-6 text-foreground [&>h1]:text-lg [&>h1]:font-semibold [&>h1]:mt-4 [&>h1]:mb-2 [&>h2]:text-base [&>h2]:font-semibold [&>h2]:mt-3 [&>h2]:mb-1 [&>p]:my-1 [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{content}</p>;
}

function ReportListBlock({
  items,
  emptyValue,
}: {
  items?: unknown[] | null;
  emptyValue: string;
}) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyValue}</p>;
  }

  return (
    <ul className="space-y-2 text-sm text-foreground">
      {items.map((item, index) => (
        <li key={`${formatReportListItem(item)}-${index}`} className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
          {formatReportListItem(item)}
        </li>
      ))}
    </ul>
  );
}

function formatReportListItem(item: unknown): string {
  if (typeof item === "string") {
    return item;
  }

  try {
    return JSON.stringify(item, null, 2);
  } catch {
    return String(item);
  }
}

function formatDateValue(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function formatDisplayLabel(value?: string | null): string {
  if (!value) {
    return "—";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const riskBadgeVariant = (r: string) => {
  switch (r) {
    case "CRITICAL":
    case "HIGH":
      return "destructive";
    case "MEDIUM":
      return "secondary";
    case "LOW":
      return "default";
    default:
      return "secondary";
  }
};

const taskPriorityVariant = (p: string) => {
  if (p === "HIGH" || p === "CRITICAL") return "destructive";
  if (p === "MEDIUM") return "secondary";
  return "default";
};

const taskStatusVariant = (s: string) => {
  switch (s) {
    case "COMPLETED":
      return "default";
    case "IN_PROGRESS":
      return "secondary";
    default:
      return "outline";
  }
};

function QuestionnaireTab({
  assessmentId,
  assessmentLabel,
}: {
  assessmentId: string;
  assessmentLabel: string;
}) {
  return (
    <SectionCard
      title="Questionnaire"
      description={`Open the structured ${lowerFirst(assessmentLabel)} questionnaire workspace to collect and submit responses.`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="font-medium">Supplier questionnaire</h3>
          <p className="text-sm text-muted-foreground">
            Workflow uses the questionnaire submission as a milestone; answers still live in the dedicated questionnaire workspace.
          </p>
        </div>
        <Link
          to={`/assessments/${assessmentId}/questionnaire`}
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <FileText className="h-4 w-4" />
          Open Questionnaire
        </Link>
      </div>
    </SectionCard>
  );
}

function FindingsAndCipTab({
  findings,
  cipCycles,
  editingFinding,
  setEditingFinding,
}: {
  findings: any[];
  cipCycles: any[];
  editingFinding: string | null;
  setEditingFinding: (id: string | null) => void;
}) {
  return (
    <div className="space-y-6">
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription>
          Findings drive the improvement plan: create findings, agree deadlines and owners, then track CIP cycles and evidence reviews from the workflow.
        </AlertDescription>
      </Alert>

      <FindingsTab
        findings={findings}
        editingFinding={editingFinding}
        setEditingFinding={setEditingFinding}
      />

      <SectionCard title="Continuous Improvement Plan" description="CIP cycles connected to findings and corrective actions.">
        {cipCycles.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No CIP cycles configured"
            description="Continuous Improvement cycles will appear here once findings move into corrective action tracking."
          />
        ) : (
          <div className="space-y-3">
            {cipCycles.map((c: any) => (
              <Card key={c.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{c.label}</h4>
                    <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>
                      {c.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Period</div>
                      <div className="font-medium">{c.deadline_period_months} months</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Start Date</div>
                      <div className="font-medium">
                        {c.start_date ? new Date(c.start_date).toLocaleDateString() : "—"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function FindingsTab({
  findings,
  editingFinding,
  setEditingFinding,
}: {
  findings: any[];
  editingFinding: string | null;
  setEditingFinding: (id: string | null) => void;
}) {
  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(findings.length / PAGE_SIZE);
  const paginatedFindings = findings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-muted-foreground">
        Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, findings.length)} to{" "}
        {Math.min(currentPage * PAGE_SIZE, findings.length)} of {findings.length} findings
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0 hover:scale-105 active:scale-95 hover:ring-primary/30 transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .slice(-5)
          .map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => goToPage(page)}
              className="h-8 w-8 p-0 hover:scale-105 active:scale-95 hover:ring-primary/30 transition-all duration-200"
            >
              {page}
            </Button>
          ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0 hover:scale-105 active:scale-95 hover:ring-primary/30 transition-all duration-200"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Findings</h3>
        <Form method="post" className="inline">
          <input type="hidden" name="intent" value="create-finding" />
          <Button size="sm">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Finding
          </Button>
        </Form>
      </div>

      {findings.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No findings yet"
          description="Add your first finding to begin tracking issues."
        />
      ) : (
        <>
          <div className="space-y-3">
            {paginatedFindings.map((f: any) =>
              editingFinding === f.id ? (
                <EditFindingForm key={f.id} finding={f} onCancel={() => setEditingFinding(null)} />
              ) : (
                <Card key={f.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                          <h4 className="font-medium">{f.topic || "Untitled"}</h4>
                          <Badge variant={severityBadgeVariant(f.severity)}>{f.severity}</Badge>
                          <Badge variant={findingStatusVariant(f.status)}>{f.status}</Badge>
                        </div>
                        {f.summary && (
                          <p className="text-sm text-muted-foreground">{f.summary}</p>
                        )}
                        {f.recommended_actions && (
                          <p className="text-xs text-muted-foreground">
                            <b>Actions:</b> {f.recommended_actions}
                          </p>
                        )}
                        {f.responsible_party && (
                          <p className="text-xs text-muted-foreground">
                            <b>Responsible:</b> {f.responsible_party}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingFinding(f.id)}
                          className="p-1.5 hover:bg-muted rounded-md"
                        >
                          <Edit3 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <Form method="post">
                          <input type="hidden" name="intent" value="delete-finding" />
                          <input type="hidden" name="finding_id" value={f.id} />
                          <button
                            type="submit"
                            className="p-1.5 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </Form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
          {totalPages > 1 && <PaginationControls />}
        </>
      )}
    </div>
  );
}

function EditFindingForm({
  finding,
  onCancel,
}: {
  finding: any;
  onCancel: () => void;
}) {
  return (
    <Form method="post">
      <input type="hidden" name="intent" value="save-finding" />
      <input type="hidden" name="finding_id" value={finding.id} />
      <Card className="border-primary/50">
        <CardContent className="p-5 space-y-3">
          <EditableField>
            <input
              name="topic"
              defaultValue={finding.topic}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Topic"
            />
          </EditableField>
          <EditableField>
            <textarea
              name="summary"
              defaultValue={finding.summary}
              className="w-full px-3 py-2 border rounded-lg text-sm min-h-[80px]"
              placeholder="Summary"
            />
          </EditableField>
          <EditableField>
            <textarea
              name="recommended_actions"
              defaultValue={finding.recommended_actions}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Recommended actions"
            />
          </EditableField>
          <div className="flex items-center gap-3">
            <select
              name="severity"
              defaultValue={finding.severity}
              className="px-2 py-1 border rounded-lg text-sm"
            >
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={finding.status}
              className="px-2 py-1 border rounded-lg text-sm"
            >
              {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "WAIVED"].map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
            <input
              name="responsible_party"
              defaultValue={finding.responsible_party}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              placeholder="Responsible party"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              <Save className="w-3.5 h-3.5 mr-1" /> Save
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              <X className="w-3.5 h-3.5 mr-1" /> Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </Form>
  );
}

const severityBadgeVariant = (s: string) => {
  switch (s) {
    case "CRITICAL":
    case "HIGH":
      return "destructive";
    case "MEDIUM":
      return "secondary";
    case "LOW":
      return "default";
    default:
      return "secondary";
  }
};

const findingStatusVariant = (s: string) => {
  switch (s) {
    case "OPEN":
      return "destructive";
    case "IN_PROGRESS":
      return "secondary";
    case "RESOLVED":
      return "default";
    default:
      return "outline";
  }
};
