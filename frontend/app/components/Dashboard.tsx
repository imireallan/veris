import * as React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  ClipboardCheck,
  FileSearch,
  FolderClock,
  Mail,
  MapPin,
  PieChart,
  ShieldAlert,
  TrendingUp,
  UserCircle2,
  Zap,
} from "lucide-react";
import { Link } from "react-router";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Carousel,
  CarouselContent,
  CarouselIndicators,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Combobox,
  QuickLinks,
  SectionCard,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TimelineItem,
} from "~/components/ui";
import { terminologyFromUser } from "~/lib/terminology";
import type { TerminologyLabels } from "~/lib/terminology";
import { RBAC, UserRole } from "~/types/rbac";
import type {
  DashboardActivityItem,
  DashboardAttentionItem,
  DashboardDeadlineItem,
  DashboardSummary,
  User,
} from "~/types";

function formatDate(value?: string | null) {
  if (!value) return "No due date";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getAttentionBadge(item: DashboardAttentionItem) {
  return item.status === "overdue"
    ? { label: "Overdue", variant: "destructive" as const }
    : { label: "Due soon", variant: "secondary" as const };
}

function getAttentionMeta(item: DashboardAttentionItem, terminology: TerminologyLabels) {
  switch (item.type) {
    case "evidence_review":
      return { label: `${terminology.evidence} review`, icon: FileSearch };
    case "report_review":
      return { label: `${terminology.report} review`, icon: ClipboardCheck };
    case "report_finalize":
      return { label: `${terminology.report} finalization`, icon: ClipboardCheck };
    case "cip_cycle":
      return { label: "CIP milestone", icon: FolderClock };
    case "questionnaire":
      return { label: "Questionnaire", icon: ClipboardCheck };
    case "finding_follow_up":
      return { label: "Finding follow-up", icon: ShieldAlert };
    case "assessment":
      return { label: terminology.assessment, icon: ClipboardCheck };
    default:
      return { label: terminology.task, icon: AlertTriangle };
  }
}

function getDeadlineBadge(item: DashboardDeadlineItem) {
  return item.status === "overdue"
    ? { label: "Overdue", variant: "destructive" as const }
    : { label: "Upcoming", variant: "secondary" as const };
}

function getDeadlineMeta(item: DashboardDeadlineItem, terminology: TerminologyLabels) {
  switch (item.type) {
    case "evidence_review_due":
      return { label: `${terminology.evidence} review`, icon: FileSearch };
    case "report_due":
      return { label: `${terminology.report} deadline`, icon: ClipboardCheck };
    case "cip_due":
      return { label: "CIP deadline", icon: FolderClock };
    case "questionnaire_due":
      return { label: "Questionnaire", icon: ClipboardCheck };
    case "finding_follow_up_due":
      return { label: "Finding deadline", icon: ShieldAlert };
    case "assessment_due":
      return { label: `${terminology.assessment} deadline`, icon: ClipboardCheck };
    default:
      return { label: `${terminology.task} deadline`, icon: AlertTriangle };
  }
}

function formatPriorityLabel(priority: string) {
  return priority.replaceAll("_", " ").toLowerCase();
}

function formatTypeLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll("due", "deadline")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildTypeOptions(values: string[]) {
  return [
    { value: "all", label: "All types" },
    ...values.map((value) => ({ value, label: formatTypeLabel(value) })),
  ];
}

function getActivityBadge(item: DashboardActivityItem, terminology: TerminologyLabels) {
  switch (item.type) {
    case "document_uploaded":
      return terminology.evidence;
    case "task_created":
      return terminology.task;
    case "finding_created":
      return "Finding";
    default:
      return terminology.assessment;
  }
}

function AttentionList({
  items,
  emptyState,
  terminology,
}: {
  items: DashboardAttentionItem[];
  emptyState: string;
  terminology: TerminologyLabels;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
        {emptyState}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const badge = getAttentionBadge(item);
        const meta = getAttentionMeta(item, terminology);
        const MetaIcon = meta.icon;
        return (
          <Link
            key={item.id}
            to={item.url}
            className="group block rounded-xl border border-border bg-background px-4 py-4 transition-all hover:border-accent hover:bg-accent/5"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MetaIcon className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-medium uppercase tracking-[0.18em]">
                      {meta.label}
                    </span>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {item.organization_name}
                  {item.site_name ? ` • ${item.site_name}` : ""}
                  {item.assessment_name ? ` • ${item.assessment_name}` : ""}
                  {item.missing_required ? ` • ${item.missing_required} required answers missing` : ""}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 lg:block lg:text-right">
                <div>
                  <p className="text-[11px] font-medium capitalize tracking-[0.12em] text-muted-foreground">
                    {formatPriorityLabel(item.priority)}
                  </p>
                  <p className="mt-1 text-sm text-foreground">{formatDate(item.due_date)}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function DeadlineList({
  items,
  selectedType,
  onTypeChange,
  terminology,
}: {
  items: DashboardDeadlineItem[];
  selectedType: string;
  onTypeChange: (value: string) => void;
  terminology: TerminologyLabels;
}) {
  const typeOptions = buildTypeOptions(
    Array.from(new Set(items.map((item) => item.type))).sort()
  );
  const filteredItems =
    selectedType === "all"
      ? items
      : items.filter((item) => item.type === selectedType)

  return (
    <div className="space-y-3">
      <div className="max-w-xs">
        <Combobox
          value={selectedType}
          onValueChange={onTypeChange}
          options={typeOptions}
          placeholder="Filter deadlines by type"
        />
      </div>
      {filteredItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">No deadlines match the selected type.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const badge = getDeadlineBadge(item);
              const meta = getDeadlineMeta(item, terminology);
              const MetaIcon = meta.icon;
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      <MetaIcon className="h-3.5 w-3.5" />
                      <span>{meta.label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link to={item.url} className="block min-w-0 hover:text-accent">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.organization_name}
                        {item.missing_required ? ` • ${item.missing_required} required answers missing` : ""}
                      </p>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatDate(item.due_date)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function RecentActivityAccordion({
  items,
  selectedType,
  onTypeChange,
  terminology,
}: {
  items: DashboardActivityItem[];
  selectedType: string;
  onTypeChange: (value: string) => void;
  terminology: TerminologyLabels;
}) {
  const typeOptions = buildTypeOptions(
    Array.from(new Set(items.map((item) => item.type))).sort()
  );
  const filteredItems =
    selectedType === "all"
      ? items
      : items.filter((item) => item.type === selectedType)

  return (
    <div className="space-y-3">
      <div className="max-w-xs">
        <Combobox
          value={selectedType}
          onValueChange={onTypeChange}
          options={typeOptions}
          placeholder="Filter activity by type"
        />
      </div>
      {filteredItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity matches the selected type.</p>
      ) : (
        <Accordion defaultValue={[filteredItems[0].id]}>
          {filteredItems.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="min-w-0 pr-4 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{getActivityBadge(item, terminology)}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDateTime(item.timestamp)}</span>
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-foreground">{item.title}</p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Link to={item.url} className="block rounded-lg border border-border bg-muted/20 px-4 py-3 hover:bg-muted/40">
                  <TimelineItem
                    text={`${item.title} — ${item.description}`}
                    badge={getActivityBadge(item, terminology)}
                    className="px-0"
                    dotColor={item.type === "document_uploaded" ? "bg-accent" : "bg-primary"}
                  />
                  <div className="pt-1 text-xs text-muted-foreground">Open related record</div>
                </Link>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

type DashboardMode = "org-wide" | "assigned-only" | "consultant-aggregate" | "executive-summary";

function KpiCarousel({
  hero,
  summary,
  mode,
}: {
  hero: {
    statLabels: {
      activeAssessments: string;
      overdueActions: string;
      openFindings: string;
      pendingEvidenceReviews: string;
    };
  };
  summary: DashboardSummary;
  mode: DashboardMode;
}) {
  return (
    <div className="md:hidden">
      <Carousel>
        <CarouselContent>
          <CarouselItem>
            <StatCard
              label={hero.statLabels.activeAssessments}
              value={summary.kpis.active_assessments}
              icon={ClipboardCheck}
              trend={mode === "assigned-only" ? "Currently assigned" : "In flight"}
            />
          </CarouselItem>
          <CarouselItem>
            <StatCard
              label={hero.statLabels.overdueActions}
              value={summary.kpis.overdue_actions}
              icon={AlertTriangle}
              trend={summary.kpis.overdue_actions > 0 ? "Needs action" : "All clear"}
              change={summary.kpis.overdue_actions > 0 ? "down" : "neutral"}
            />
          </CarouselItem>
          <CarouselItem>
            <StatCard
              label={hero.statLabels.openFindings}
              value={summary.kpis.open_findings}
              icon={ShieldAlert}
              trend={summary.kpis.open_findings > 0 ? "Still unresolved" : "No blockers"}
              change={summary.kpis.open_findings > 0 ? "down" : "neutral"}
            />
          </CarouselItem>
          <CarouselItem>
            <StatCard
              label={hero.statLabels.pendingEvidenceReviews}
              value={summary.kpis.pending_evidence_reviews}
              icon={FileSearch}
              trend={summary.kpis.pending_evidence_reviews > 0 ? "Awaiting validation" : "Queue empty"}
              change={summary.kpis.pending_evidence_reviews > 0 ? "down" : "neutral"}
            />
          </CarouselItem>
        </CarouselContent>
        <div className="flex items-center justify-between">
          <CarouselPrevious />
          <CarouselIndicators />
          <CarouselNext />
        </div>
      </Carousel>
    </div>
  );
}

function DesktopKpiGrid({
  hero,
  summary,
  mode,
}: {
  hero: {
    statLabels: {
      activeAssessments: string;
      overdueActions: string;
      openFindings: string;
      pendingEvidenceReviews: string;
    };
  };
  summary: DashboardSummary;
  mode: DashboardMode;
}) {
  return (
    <section className="hidden grid-cols-1 gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={hero.statLabels.activeAssessments}
        value={summary.kpis.active_assessments}
        icon={ClipboardCheck}
        trend={mode === "assigned-only" ? "Currently assigned" : "In flight"}
      />
      <StatCard
        label={hero.statLabels.overdueActions}
        value={summary.kpis.overdue_actions}
        icon={AlertTriangle}
        trend={summary.kpis.overdue_actions > 0 ? "Needs action" : "All clear"}
        change={summary.kpis.overdue_actions > 0 ? "down" : "neutral"}
      />
      <StatCard
        label={hero.statLabels.openFindings}
        value={summary.kpis.open_findings}
        icon={ShieldAlert}
        trend={summary.kpis.open_findings > 0 ? "Still unresolved" : "No blockers"}
        change={summary.kpis.open_findings > 0 ? "down" : "neutral"}
      />
      <StatCard
        label={hero.statLabels.pendingEvidenceReviews}
        value={summary.kpis.pending_evidence_reviews}
        icon={FileSearch}
        trend={summary.kpis.pending_evidence_reviews > 0 ? "Awaiting validation" : "Queue empty"}
        change={summary.kpis.pending_evidence_reviews > 0 ? "down" : "neutral"}
      />
    </section>
  );
}

function AnalyticsSection({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SectionCard
      title={title}
      className={className}
      headerAction={
        <Icon className="h-4 w-4 text-muted-foreground" />
      }
    >
      {children}
    </SectionCard>
  );
}

function AssessmentStatusChart({
  data,
}: {
  data: DashboardSummary["assessment_status_breakdown"];
}) {
  const entries = [
    { key: "draft", label: "Draft", color: "bg-muted-foreground/30" },
    { key: "in_progress", label: "In Progress", color: "bg-primary" },
    { key: "under_review", label: "Under Review", color: "bg-warning" },
    { key: "completed", label: "Completed", color: "bg-success" },
    { key: "archived", label: "Archived", color: "bg-muted-foreground/20" },
  ] as const;

  const total = Object.values(data).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No assessments in this organization yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const value = data[entry.key as keyof typeof data];
        const pct = total ? Math.round((value / total) * 100) : 0;
        return (
          <div key={entry.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{entry.label}</span>
              <span className="text-muted-foreground">
                {value} ({pct}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${entry.color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FindingsSeverityChart({
  data,
}: {
  data: DashboardSummary["findings_by_severity"];
}) {
  const entries = [
    { key: "critical", label: "Critical", color: "bg-destructive" },
    { key: "high", label: "High", color: "bg-warning" },
    { key: "medium", label: "Medium", color: "bg-primary" },
    { key: "low", label: "Low", color: "bg-muted-foreground/40" },
  ] as const;

  const total = Object.values(data).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No findings recorded in this organization.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-24 w-24 shrink-0">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          {entries.reduce(
            (acc, entry) => {
              const value = data[entry.key as keyof typeof data];
              const pct = total ? (value / total) * 100 : 0;
              const dashArray = `${pct} ${100 - pct}`;
              const el = (
                <circle
                  key={entry.key}
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={dashArray}
                  strokeDashoffset={-acc.offset}
                  className={entry.color.replace("bg-", "text-")}
                />
              );
              return { offset: acc.offset + pct, elements: [...acc.elements, el] };
            },
            { offset: 0, elements: [] as React.ReactNode[] }
          ).elements}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-foreground">{total}</span>
        </div>
      </div>
      <div className="space-y-2">
        {entries.map((entry) => {
          const value = data[entry.key as keyof typeof data];
          return (
            <div key={entry.key} className="flex items-center gap-2 text-xs">
              <span className={`inline-block h-2 w-2 rounded-full ${entry.color}`} />
              <span className="text-muted-foreground">
                {entry.label}: <span className="font-medium text-foreground">{value}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EvidencePipelineWidget({
  data,
}: {
  data: DashboardSummary["evidence_pipeline"];
}) {
  const items = [
    { label: "This month", value: data.uploaded_this_month },
    { label: "Mapped", value: data.mapped },
    { label: "Unmapped", value: data.unmapped },
    { label: "Awaiting review", value: data.awaiting_review },
  ];
  const aiItems = [
    { label: "AI suggested", value: data.ai_suggested },
    { label: "AI validated", value: data.ai_validated },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Total uploaded</span>
        <span className="font-semibold text-foreground">{data.total_uploaded}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border bg-muted/30 px-3 py-2"
          >
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-lg font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
      {/* P2 AI stats */}
      {data.ai_suggested + data.ai_validated > 0 && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/20 px-3 py-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Zap className="h-3.5 w-3.5" />
            AI Pipeline
          </div>
          <div className="grid grid-cols-2 gap-2">
            {aiItems.map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="text-[11px] text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SiteProgressList({
  data,
}: {
  data: DashboardSummary["site_progress"];
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No site-level assessments yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((site) => (
        <Link
          key={site.site_name}
          to="#"
          className="block rounded-lg border border-border bg-background px-3 py-2 transition-colors hover:border-accent hover:bg-accent/5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {site.site_name}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {site.completed}/{site.total}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success"
                style={{ width: `${site.completion_pct}%` }}
              />
            </div>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {site.completion_pct}%
            </span>
          </div>
          <div className="mt-1 flex gap-2 text-[10px] text-muted-foreground">
            {site.in_progress > 0 && <span>{site.in_progress} in progress</span>}
            {site.draft > 0 && <span>{site.draft} draft</span>}
            {site.under_review > 0 && <span>{site.under_review} under review</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}

function CrossFrameworkReuseWidget({
  data,
}: {
  data: DashboardSummary["cross_framework_reuse"];
}) {
  if (data.mapped_answers === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No mapped evidence yet. Upload evidence and use AI mapping to see cross-framework reuse.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <p className="text-xs text-muted-foreground">Reusable answers</p>
          <p className="text-lg font-semibold text-foreground">{data.reusable_answers}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <p className="text-xs text-muted-foreground">Reuse %</p>
          <p className="text-lg font-semibold text-foreground">{data.reuse_opportunity_pct}%</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <p className="text-xs text-muted-foreground">Mapped</p>
          <p className="text-lg font-semibold text-foreground">{data.mapped_answers}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <p className="text-xs text-muted-foreground">Unmapped</p>
          <p className="text-lg font-semibold text-foreground">{data.unmapped_answers}</p>
        </div>
      </div>

      {data.top_frameworks_by_coverage.length > 0 && (
        <details className="rounded-lg border border-border bg-background">
          <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-medium text-foreground">
            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
            Top frameworks by coverage
          </summary>
          <ul className="divide-y divide-border px-3 pb-2">
            {data.top_frameworks_by_coverage.map((fw) => (
              <li key={fw.framework_id} className="py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{fw.framework_name}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {fw.mapped_answers} mapped
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function getRiskColor(level: string) {
  switch (level) {
    case "critical":
      return "text-destructive";
    case "high":
      return "text-warning";
    case "medium":
      return "text-primary";
    default:
      return "text-muted-foreground";
  }
}

function RiskTrendWidget({
  data,
}: {
  data: DashboardSummary["risk_trend"];
}) {
  const labels: Record<string, string> = {
    day_0_30: "Last 30 days",
    day_31_60: "31–60 days",
    day_61_90: "61–90 days",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <details className="group">
          <summary className="flex cursor-pointer items-center gap-2">
            <Activity className={`h-5 w-5 ${getRiskColor(data.risk_level)}`} />
            <span className="text-sm font-semibold capitalize text-foreground">
              {data.risk_level} risk
            </span>
          </summary>
          <p className="mt-1 text-xs text-muted-foreground">
            Risk index: {data.current_risk_index}/100. Based on weighted open findings.
          </p>
        </details>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Open critical / high
          </p>
          <p className="text-lg font-semibold text-foreground">
            {data.open_critical} / {data.open_high}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {data.trend.map((t, i) => (
          <div key={i} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <p className="text-[11px] font-medium text-muted-foreground">{labels[t.label] ?? t.label}</p>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1 text-sm text-foreground">
                <ArrowRight className="h-3 w-3 rotate-45 text-success" />
                +{t.created_total} created
              </span>
              <span className="flex items-center gap-1 text-sm text-foreground">
                <ArrowRight className="h-3 w-3 -rotate-45 text-primary" />
                -{t.resolved_total} resolved
              </span>
            </div>
            <div className="mt-1.5">
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                style={{
                  background: `linear-gradient(to right, ${
                    t.net_change > 0 ? "var(--color-destructive)" : "var(--color-success)"
                  } ${
                    Math.min(Math.max(Math.abs(t.net_change) * 5, 10), 100)
                  }%, var(--color-muted) ${
                    Math.min(Math.max(Math.abs(t.net_change) * 5, 10), 100)
                  }%)`,
                }}
              />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {t.net_change > 0
                ? `+${t.net_change} net increase`
                : `${t.net_change} net decrease`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingInvitationsWidget({
  data,
}: {
  data: DashboardSummary["pending_invitations"];
}) {
  if (data.pending_count === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No pending invitations. Everyone is onboarded.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Pending</span>
        <Badge variant="secondary">{data.pending_count}</Badge>
        {data.expired_count > 0 && (
          <Badge variant="destructive">{data.expired_count} expired</Badge>
        )}
      </div>
      <div className="space-y-2">
        {data.invitations.map((inv) => (
          <Link
            key={inv.id}
            to={inv.url}
            className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 transition-colors hover:border-accent hover:bg-accent/5"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm text-foreground">{inv.email}</span>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              {inv.is_expired && (
                <Badge variant="destructive" className="text-[10px]">
                  Expired
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                {inv.fallback_role}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Resolve dashboard display mode from the server-provided viewer context.
 * Falls back to role-based mapping when scope is not explicitly "assigned".
 * All enum values are exhaustively matched so new roles fail compile-time.
 */
function getDashboardMode(summary: DashboardSummary): DashboardMode {
  const scope = summary.viewer?.scope;
  const role = (summary.viewer?.role ?? "").toUpperCase() as UserRole;

  // Explicit assigned scope overrides everything
  if (scope === "assigned") return "assigned-only";

  switch (role) {
    case UserRole.SUPERADMIN:
    case UserRole.ADMIN:
    case UserRole.COORDINATOR:
      return "org-wide";
    case UserRole.ASSESSOR:
    case UserRole.OPERATOR:
      return "assigned-only";
    case UserRole.CONSULTANT:
      return "consultant-aggregate";
    case UserRole.EXECUTIVE:
      return "executive-summary";
    default:
      // Unknown/custom role: safe fallback
      return "org-wide";
  }
}

function getQuickLinks(
  mode: DashboardMode,
  user: User,
  activeOrgId?: string | null,
) {
  const orgWideLinks = [
    { label: "View assessments", href: "/assessments" },
    { label: "Review templates", href: "/templates" },
    { label: "Open knowledge base", href: "/knowledge" },
    { label: "Ask AI", href: "/knowledge/chat" },
  ];

  const assignedLinks = [
    { label: "Open my assessments", href: "/assessments" },
    { label: "Review evidence", href: "/knowledge" },
    { label: "Ask AI for context", href: "/knowledge/chat" },
    { label: "Update my profile", href: "/settings/profile" },
  ];

  const consultantLinks = [
    { label: "Cross-client assessments", href: "/assessments" },
    { label: "Review templates", href: "/templates" },
    { label: "Open knowledge base", href: "/knowledge" },
    { label: "Ask AI", href: "/knowledge/chat" },
  ];

  const executiveLinks = [
    { label: "View assessments", href: "/assessments" },
    { label: "Export reports", href: "/reports" },
    { label: "Open knowledge base", href: "/knowledge" },
  ];

  if (mode === "assigned-only") return assignedLinks;
  if (mode === "consultant-aggregate") {
    if (RBAC.canManageOrgUsers(user)) {
      consultantLinks.unshift({
        label: "Manage organization users",
        href: activeOrgId ? `/organizations/${activeOrgId}/members` : "/organizations",
      });
    }
    return consultantLinks;
  }
  if (mode === "executive-summary") return executiveLinks;

  if (RBAC.canManageOrgUsers(user)) {
    orgWideLinks.unshift({
      label: "Manage organization users",
      href: activeOrgId ? `/organizations/${activeOrgId}/members` : "/organizations",
    });
  }
  return orgWideLinks;
}

function DashboardGuideSheet() {
  return (
    <Sheet>
      <SheetTrigger>
        <Button variant="outline" size="sm">Dashboard guide</Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>How to use this dashboard</SheetTitle>
          <SheetDescription>
            Quick reference for what each section means and how to act on it.
          </SheetDescription>
        </SheetHeader>
        <div className="px-5 py-4">
          <Accordion defaultValue={["queue-guide"]}>
            <AccordionItem value="queue-guide">
              <AccordionTrigger>Priority queue</AccordionTrigger>
              <AccordionContent>
                Overdue work is ranked first, followed by evidence review, report work, CIP milestones, questionnaire gaps, and finding follow-up.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="deadline-guide">
              <AccordionTrigger>Deadline table</AccordionTrigger>
              <AccordionContent>
                Use the deadline table to scan upcoming due dates across tasks, evidence review, questionnaires, reports, CIP cycles, and findings.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="analytics-guide">
              <AccordionTrigger>Portfolio and AI tabs</AccordionTrigger>
              <AccordionContent>
                Portfolio groups operational progress views. AI &amp; risk groups evidence pipeline, reuse, and risk trend so the dashboard stays easier to scan.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="activity-guide">
              <AccordionTrigger>Recent activity</AccordionTrigger>
              <AccordionContent>
                Expand an activity row to see the full update and jump directly to the related record.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Dashboard({
  user,
  summary,
}: {
  user: User;
  summary: DashboardSummary;
}) {
  const mode = getDashboardMode(summary);
  const viewer = summary.viewer ?? {
    role: user.role,
    scope: "organization" as const,
    organization_id: user.activeOrganization?.id ?? user.orgId ?? null,
    organization_name: user.activeOrganization?.name ?? user.orgName ?? null,
  };
  const orgName =
    viewer.organization_name ??
    user.activeOrganization?.name ??
    user.orgName ??
    "your organization";
  const roleLabel = RBAC.getRoleLabel(viewer.role ?? user.role);
  const quickLinks = getQuickLinks(mode, user, viewer.organization_id);
  const terminology = terminologyFromUser(user);
  const lowerAssessments = terminology.plural.assessment.toLowerCase();
  const lowerEvidence = terminology.evidence.toLowerCase();
  const lowerTasks = terminology.plural.task.toLowerCase();

  const orgCount = user.organizationCount ?? 1;
  const hasMultipleOrgs = orgCount > 1;
  const [deadlineType, setDeadlineType] = React.useState("all");
  const [activityType, setActivityType] = React.useState("all");

  const hero =
    mode === "assigned-only"
      ? {
          eyebrow: "Assigned work only",
          title: `Your dashboard for ${orgName}`,
          description:
            "This view is filtered to the active organization and only shows work directly assigned to you.",
          attentionTitle: "My priority queue",
          attentionDescription:
            "Immediate work you own inside the currently selected organization.",
          attentionEmpty:
            hasMultipleOrgs
              ? "Nothing urgent is assigned to you right now. Use the org switcher if you need a different context."
              : "Nothing urgent is assigned to you right now. All caught up in your organization.",
          deadlineTitle: "My deadlines",
          deadlineDescription: `Deadlines tied to your assigned ${lowerAssessments} and ${lowerTasks}.`,
          activityTitle: "Recent activity on my work",
          activityDescription:
            `Latest updates connected to the ${lowerAssessments} and ${lowerEvidence} items relevant to you.`,
          statLabels: {
            activeAssessments: `My ${lowerAssessments}`,
            overdueActions: `My overdue ${lowerTasks}`,
            openFindings: "My open findings",
            pendingEvidenceReviews: `${terminology.evidence} awaiting my review`,
          },
          scopeLabel: "Assigned scope" as const,
          viewModeLabel: "Only your assigned work" as const,
        }
      : mode === "executive-summary"
        ? {
            eyebrow: "Executive overview",
            title: `${orgName} dashboard`,
            description: `High-level summary for ${orgName}. Key metrics and deadlines without operational detail.`,
            attentionTitle: "Key attention items",
            attentionDescription: "Priority items requiring executive awareness.",
            attentionEmpty: "No critical items require executive attention right now.",
            deadlineTitle: "Upcoming deadlines",
            deadlineDescription: "Major milestones and deadlines for the active organization.",
            activityTitle: "Recent highlights",
            activityDescription: "Significant updates from the active organization.",
            statLabels: {
              activeAssessments: `Active ${lowerAssessments}`,
              overdueActions: `Overdue ${lowerTasks}`,
              openFindings: "Open findings",
              pendingEvidenceReviews: `Pending ${lowerEvidence} review`,
            },
            scopeLabel: "Executive scope" as const,
            viewModeLabel: "High-level summary" as const,
          }
        : mode === "consultant-aggregate"
          ? {
              eyebrow: "Consultant overview",
              title: `${orgName} dashboard`,
              description:
                "Cross-program view for the active client organization. Access related client work from the org switcher.",
              attentionTitle: "Needs attention",
              attentionDescription:
                `Priority ${lowerTasks} and ${lowerAssessments} deadlines for the active client.`,
              attentionEmpty: "No urgent work right now. The active client organization is clear for the moment.",
              deadlineTitle: "Upcoming deadlines",
              deadlineDescription: `Closest due dates across ${lowerTasks} and ${lowerAssessments} in the active client organization.`,
              activityTitle: "Recent activity",
              activityDescription: "Latest dashboard-relevant updates from the active client organization.",
              statLabels: {
                activeAssessments: `Active ${lowerAssessments}`,
                overdueActions: `Overdue ${lowerTasks}`,
                openFindings: "Open findings",
                pendingEvidenceReviews: `Pending ${lowerEvidence} review`,
              },
              scopeLabel: "Consultant scope" as const,
              viewModeLabel: "Client-wide view" as const,
            }
          : {
              eyebrow: "Active organization overview",
              title: `${orgName} dashboard`,
              description:
                "Operational overview for the active organization. All work, assignments, and deadlines in one place.",
              attentionTitle: "Needs attention",
              attentionDescription:
                `Priority ${lowerTasks} and ${lowerAssessments} deadlines for the active organization.`,
              attentionEmpty:
                hasMultipleOrgs
                  ? "No urgent work right now. The active organization is clear for the moment."
                  : "No urgent work right now. Your organization is clear for the moment.",
              deadlineTitle: "Upcoming deadlines",
              deadlineDescription: `Closest due dates across ${lowerTasks} and ${lowerAssessments} in the active organization.`,
              activityTitle: "Recent activity",
              activityDescription: "Latest dashboard-relevant updates from the active organization.",
              statLabels: {
                activeAssessments: `Active ${lowerAssessments}`,
                overdueActions: `Overdue ${lowerTasks}`,
                openFindings: "Open findings",
                pendingEvidenceReviews: `Pending ${lowerEvidence} review`,
              },
              scopeLabel: "Organization scope" as const,
              viewModeLabel: "Org-wide operational view" as const,
            };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-8">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                <Building2 className="h-3.5 w-3.5" />
                {orgName}
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1">
                <UserCircle2 className="h-3.5 w-3.5" />
                {roleLabel}
              </Badge>
              <Badge
                variant={mode === "assigned-only" ? "default" : "outline"}
                className="px-3 py-1"
              >
                {hero.scopeLabel}
              </Badge>
              <DashboardGuideSheet />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                {hero.eyebrow}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {hero.title}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {hero.description}
              </p>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[320px]">
            {hasMultipleOrgs && (
              <div className="rounded-xl border border-border bg-background px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Active org
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">{orgName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Change organization from the switcher in the header.
                </p>
              </div>
            )}
            <div
              className={
                hasMultipleOrgs
                  ? "rounded-xl border border-border bg-background px-4 py-4"
                  : "rounded-xl border border-border bg-background px-4 py-4 sm:col-span-2"
              }
            >
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                View mode
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">{hero.viewModeLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Role-aware results keep the dashboard relevant to your permissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <KpiCarousel hero={hero} summary={summary} mode={mode} />
      <DesktopKpiGrid hero={hero} summary={summary} mode={mode} />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_360px]">
        <SectionCard
          title={hero.attentionTitle}
          description={hero.attentionDescription}
          className="min-w-0"
        >
          <AttentionList items={summary.attention_items} emptyState={hero.attentionEmpty} terminology={terminology} />
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title={hero.deadlineTitle} description={hero.deadlineDescription}>
            <DeadlineList
              items={summary.upcoming_deadlines}
              selectedType={deadlineType}
              onTypeChange={setDeadlineType}
              terminology={terminology}
            />
          </SectionCard>

          <QuickLinks
            title={mode === "assigned-only" ? "Useful shortcuts" : "Operational shortcuts"}
            links={quickLinks}
          />
        </div>
      </section>

      <SectionCard
        title={hero.activityTitle}
        description={hero.activityDescription}
        headerAction={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FolderClock className="h-4 w-4" />
            Live from server data
          </div>
        }
      >
        <RecentActivityAccordion
          items={summary.recent_activity}
          selectedType={activityType}
          onTypeChange={setActivityType}
          terminology={terminology}
        />
      </SectionCard>

      {/* P1 Analytics Section — only for org-wide viewers */}
      {summary.viewer?.scope === "organization" && (
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Portfolio snapshot
            </h2>
          </div>
          <Tabs defaultValue="portfolio" className="gap-4">
            <TabsList variant="line" className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="ai-risk">AI & risk</TabsTrigger>
              <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            </TabsList>

            <TabsContent value="portfolio">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <AnalyticsSection title={`${terminology.assessment} status`} icon={PieChart}>
                  <AssessmentStatusChart data={summary.assessment_status_breakdown} />
                </AnalyticsSection>

                <AnalyticsSection title="Findings by severity" icon={ShieldAlert}>
                  <FindingsSeverityChart data={summary.findings_by_severity} />
                </AnalyticsSection>

                <AnalyticsSection title={`${terminology.site} progress`} icon={MapPin}>
                  <SiteProgressList data={summary.site_progress} />
                </AnalyticsSection>
              </div>
            </TabsContent>

            <TabsContent value="ai-risk">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <AnalyticsSection title={`${terminology.evidence} pipeline`} icon={FileSearch}>
                  <EvidencePipelineWidget data={summary.evidence_pipeline} />
                </AnalyticsSection>

                <AnalyticsSection title="Cross-framework reuse" icon={Zap}>
                  <CrossFrameworkReuseWidget data={summary.cross_framework_reuse} />
                </AnalyticsSection>

                <AnalyticsSection title="Risk trend" icon={TrendingUp}>
                  <RiskTrendWidget data={summary.risk_trend} />
                </AnalyticsSection>
              </div>
            </TabsContent>

            <TabsContent value="onboarding">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <AnalyticsSection title="Pending invitations" icon={Mail} className="md:col-span-2 xl:col-span-1">
                  <PendingInvitationsWidget data={summary.pending_invitations} />
                </AnalyticsSection>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      )}
    </div>
  );
}
