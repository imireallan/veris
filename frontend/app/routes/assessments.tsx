import { useLoaderData, Link, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Clock3, Filter, FileText, Plus } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { Badge, Button, Card, CardContent, EmptyState, Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, SearchBar } from "~/components/ui";
import { AssessmentCard } from "~/components/AssessmentCard";
import { terminologyFromUser, lowerFirst } from "~/lib/terminology";
import { RBAC } from "~/types/rbac";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") === "all" ? "all" : "current";
  const { getAccessibleOrganizations } = await import("~/.server/organizations");

  const fetchWithLog = async (path: string, label: string) => {
    try {
      const result = await api.get<any>(path, token, request);
      if (Array.isArray(result)) {
        return result;
      }
      if (Array.isArray(result?.results)) {
        return result.results;
      }
      return result ? [result] : [];
    } catch (err: any) {
      if (err.status === 403) {
        console.warn(`Permission denied for ${label}: User lacks access`);
        return [];
      }
      console.warn(`Failed to fetch ${label}:`, err.message);
      return [];
    }
  };

  const organizations = await getAccessibleOrganizations(request, token);
  const selectedOrg = user.activeOrganization ?? null;

  const assessmentsPath =
    scope === "all"
      ? "/api/assessments/aggregate/"
      : "/api/assessments/";

  const [assessments, frameworks, focusAreas] =
    await Promise.all([
      fetchWithLog(assessmentsPath, "assessments"),
      fetchWithLog("/api/frameworks/", "frameworks"),
      fetchWithLog("/api/focus-areas/", "focusAreas"),
    ]);

  const workflowsAndTasks = await Promise.all(
    assessments.map(async (assessment: any) => {
      const orgId = assessment.organization;
      if (!assessment.id || !orgId) {
        return [assessment.id, { workflow: null, tasks: [] }];
      }

      const [workflow, tasks] = await Promise.all([
        (async () => {
          try {
            const workflowRes = await api.get<any>(
              `/api/assessment-workflows/?assessment=${assessment.id}&org=${orgId}`,
              token,
              request,
            );
            return workflowRes.results?.[0] ?? (Array.isArray(workflowRes) ? workflowRes[0] : null);
          } catch (err: any) {
            console.warn(`Failed to fetch workflow for assessment ${assessment.id}:`, err.message);
            return null;
          }
        })(),
        (async () => {
          try {
            const tasksRes = await api.get<any>(
              `/api/tasks/?assessment=${assessment.id}&org=${orgId}`,
              token,
              request,
            );
            return tasksRes.results ?? (Array.isArray(tasksRes) ? tasksRes : []);
          } catch (err: any) {
            console.warn(`Failed to fetch tasks for assessment ${assessment.id}:`, err.message);
            return [];
          }
        })(),
      ]);

      return [assessment.id, { workflow, tasks }];
    }),
  );
  const workflowsByAssessmentId = Object.fromEntries(
    workflowsAndTasks.map(([assessmentId, value]: any) => [assessmentId, value.workflow]),
  );
  const tasksByAssessmentId = Object.fromEntries(
    workflowsAndTasks.map(([assessmentId, value]: any) => [assessmentId, value.tasks]),
  );

  return { assessments, frameworks, focusAreas, organizations, selectedOrg, scope, user, workflowsByAssessmentId, tasksByAssessmentId };
}

export default function AssessmentsListRoute() {
  const { assessments, frameworks, focusAreas, organizations, selectedOrg, scope, user, workflowsByAssessmentId, tasksByAssessmentId } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const search = searchParams.get("q") || "";

  useEffect(() => {
    setCurrentPage(1);
  }, [search, scope, selectedOrg?.id]);

  const PAGE_SIZE = 5;
  const allItems = Array.isArray(assessments) ? assessments : [];
  const items = allItems.filter(
    (a: any) =>
      !search ||
      a.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.ai_summary?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paginatedItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const orgMap = new Map(
    (Array.isArray(organizations) ? organizations : []).map((o: any) => [
      o.id,
      o.name,
    ]),
  );
  const fwMap = new Map(
    (Array.isArray(frameworks) ? frameworks : []).map((f: any) => [
      f.id,
      f.name,
    ]),
  );
  const faMap = new Map(
    (Array.isArray(focusAreas) ? focusAreas : []).map((f: any) => [
      f.id,
      f.name,
    ]),
  );

  const terminology = terminologyFromUser(user);
  const assessmentLabel = terminology.assessment;
  const assessmentsLabel = terminology.plural.assessment;
  const currentOrgName = selectedOrg?.name ?? "Current Organization";
  const canCreateInSelectedOrg = RBAC.canCreateAssessments(user);
  const pendingByAssessmentId = buildPendingActionsByAssessment({
    assessments: allItems,
    workflowsByAssessmentId,
    tasksByAssessmentId,
    userId: user?.id,
  });
  const myPendingActions = Object.values(pendingByAssessmentId).flat();
  const visiblePendingActions = paginatedItems.flatMap((assessment: any) => pendingByAssessmentId[assessment.id] ?? []);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-muted-foreground">
        Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, items.length)} to{" "}
        {Math.min(currentPage * PAGE_SIZE, items.length)} of {items.length} {lowerFirst(assessmentsLabel)}
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
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/app">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{assessmentsLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{assessmentsLabel}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {scope === "all"
              ? `Viewing ${lowerFirst(assessmentsLabel)} across all your organizations.`
              : `Viewing ${lowerFirst(assessmentsLabel)} for ${currentOrgName}.`}
          </p>
        </div>
        {scope !== "all" && canCreateInSelectedOrg && (
          <Link to="/assessments/new">
            <Button>
              <Plus className="w-4 h-4" /> New {assessmentLabel}
            </Button>
          </Link>
        )}
      </div>

      {organizations.length > 1 && (
        <div className="flex gap-3 items-center">
          <div className="relative min-w-[240px]">
            <Select
              value={scope}
              onValueChange={(value) => {
                const next = new URLSearchParams(searchParams);
                next.delete("q");
                if (value === "all") {
                  next.set("scope", "all");
                } else {
                  next.delete("scope");
                }
                setSearchParams(next);
              }}
            >
              <SelectTrigger className="w-full pl-9">
                <SelectValue>
                  {scope === "all" ? "All My Organizations" : currentOrgName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="current">{currentOrgName}</SelectItem>
                  <SelectItem value="all">All My Organizations</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Filter className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      )}

      <SearchBar
        value={search}
        onChange={(v) => {
          const next = new URLSearchParams(searchParams);
          if (v) {
            next.set("q", v);
          } else {
            next.delete("q");
          }
          setSearchParams(next);
        }}
        placeholder={`Search ${lowerFirst(assessmentsLabel)}...`}
      />

      <MyPendingActionsPanel
        pendingActions={visiblePendingActions}
        totalPendingCount={myPendingActions.length}
        assessmentLabel={assessmentLabel}
        assessmentsLabel={assessmentsLabel}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={`No ${lowerFirst(assessmentsLabel)} yet`}
          description={
            scope === "all"
              ? `No ${lowerFirst(assessmentsLabel)} found across your organizations.`
              : canCreateInSelectedOrg
                ? `Get started by creating the first ${lowerFirst(assessmentLabel)} for ${currentOrgName}.`
                : `You can view ${lowerFirst(assessmentsLabel)} in ${currentOrgName}, but you do not have permission to create them.`
          }
          action={
            scope !== "all" && canCreateInSelectedOrg ? (
              <Link to="/assessments/new">
                <Button className="mt-2">Create {assessmentLabel}</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div
            key={currentPage}
            className="grid gap-4 [animation-fill-mode:both] animate-fade-in"
          >
            {paginatedItems.map((a: any) => (
              <Link
                key={`assessment-${a.id}-${currentPage}`}
                to={`/assessments/${a.id}`}
                className="animate-in slide-in-from-bottom-2 duration-300 fade-in"
              >
                <AssessmentCard
                  assessment={a}
                  siteName={undefined}
                  frameworkName={fwMap.get(a.framework)}
                  focusAreaName={faMap.get(a.focus_area)}
                  orgName={orgMap?.get(a.organization)}
                  user={user}
                />
              </Link>
            ))}
          </div>
          {totalPages > 1 && <PaginationControls />}
        </>
      )}
    </div>
  );
}

type PendingAction = {
  id: string;
  assessmentId: string;
  assessmentName: string;
  title: string;
  source: "workflow" | "task";
  stepTitle?: string;
  status?: string;
  dueDate?: string | null;
};

function buildPendingActionsByAssessment({
  assessments,
  workflowsByAssessmentId,
  tasksByAssessmentId,
  userId,
}: {
  assessments: any[];
  workflowsByAssessmentId: Record<string, any>;
  tasksByAssessmentId: Record<string, any[]>;
  userId?: string;
}) {
  return Object.fromEntries(
    assessments.map((assessment: any) => {
      const workflow = workflowsByAssessmentId?.[assessment.id];
      const workflowActions: PendingAction[] = (workflow?.actions ?? [])
        .filter((action: any) => action.can_complete && ["AVAILABLE", "IN_PROGRESS"].includes(action.status))
        .map((action: any) => ({
          id: action.id,
          assessmentId: assessment.id,
          assessmentName: assessment.display_name || `Assessment ${assessment.id.slice(0, 8)}`,
          title: action.title,
          source: "workflow" as const,
          stepTitle: action.step_title,
          status: action.status,
          dueDate: action.due_date,
        }));

      const taskActions: PendingAction[] = (tasksByAssessmentId?.[assessment.id] ?? [])
        .filter((task: any) => {
          const isAssignedToMe = userId && String(task.assigned_to) === String(userId);
          return isAssignedToMe && !["COMPLETED", "CANCELLED", "DONE"].includes(task.status);
        })
        .map((task: any) => ({
          id: task.id,
          assessmentId: assessment.id,
          assessmentName: assessment.display_name || `Assessment ${assessment.id.slice(0, 8)}`,
          title: task.title,
          source: "task" as const,
          status: task.status,
          dueDate: task.due_date,
        }));

      return [assessment.id, [...workflowActions, ...taskActions]];
    }),
  );
}

function MyPendingActionsPanel({
  pendingActions,
  totalPendingCount,
  assessmentLabel,
  assessmentsLabel,
}: {
  pendingActions: PendingAction[];
  totalPendingCount: number;
  assessmentLabel: string;
  assessmentsLabel: string;
}) {
  const visibleCount = pendingActions.length;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">My pending actions</h2>
              <Badge variant={totalPendingCount > 0 ? "default" : "secondary"}>{totalPendingCount}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Role-specific workflow actions you can complete now. Workflow actions are framework milestones; tasks are ad hoc follow-ups assigned to a person.
            </p>
          </div>
          {totalPendingCount === 0 && (
            <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Nothing is waiting on your role.
            </div>
          )}
        </div>

        {visibleCount > 0 && (
          <div className="mt-4 grid gap-2 lg:grid-cols-2">
            {pendingActions.slice(0, 6).map((action) => (
              <Link
                key={`${action.source}-${action.id}`}
                to={`/assessments/${action.assessmentId}`}
                className="rounded-lg border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={action.source === "workflow" ? "default" : "secondary"} className="text-[10px]">
                        {action.source === "workflow" ? "Workflow" : "Task"}
                      </Badge>
                      {action.stepTitle && <span className="text-xs text-muted-foreground">{action.stepTitle}</span>}
                    </div>
                    <div className="truncate text-sm font-medium">{action.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {action.assessmentName || `${assessmentLabel} ${action.assessmentId.slice(0, 8)}`}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {action.dueDate ? (
                      <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" /> {new Date(action.dueDate).toLocaleDateString()}</span>
                    ) : (
                      "Open"
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPendingCount > visibleCount && (
          <p className="mt-3 text-xs text-muted-foreground">
            {totalPendingCount - visibleCount} more pending action(s) are attached to {lowerFirst(assessmentsLabel)} outside this page/filter.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
