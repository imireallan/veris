import {
  AlertTriangle,
  ArrowRight,
  Building2,
  ClipboardCheck,
  FileSearch,
  FolderClock,
  ShieldAlert,
  UserCircle2,
} from "lucide-react";
import { Link } from "react-router";

import {
  Badge,
  QuickLinks,
  SectionCard,
  StatCard,
  TimelineItem,
} from "~/components/ui";
import { RBAC } from "~/types/rbac";
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

function getDeadlineBadge(item: DashboardDeadlineItem) {
  return item.status === "overdue"
    ? { label: "Overdue", variant: "destructive" as const }
    : { label: "Upcoming", variant: "secondary" as const };
}

function getActivityBadge(item: DashboardActivityItem) {
  switch (item.type) {
    case "document_uploaded":
      return "Evidence";
    case "task_created":
      return "Action";
    case "finding_created":
      return "Finding";
    default:
      return "Assessment";
  }
}

function AttentionList({
  items,
  emptyState,
}: {
  items: DashboardAttentionItem[];
  emptyState: string;
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
        return (
          <Link
            key={item.id}
            to={item.url}
            className="group block rounded-xl border border-border bg-background px-4 py-4 transition-all hover:border-accent hover:bg-accent/5"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  {item.organization_name}
                  {item.site_name ? ` • ${item.site_name}` : ""}
                  {item.assessment_name ? ` • ${item.assessment_name}` : ""}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 lg:block lg:text-right">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {item.priority.replaceAll("_", " ")}
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

function DeadlineList({ items }: { items: DashboardDeadlineItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No upcoming deadlines in the active organization.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const badge = getDeadlineBadge(item);
        return (
          <Link
            key={item.id}
            to={item.url}
            className="flex items-start justify-between gap-3 rounded-xl border border-border px-3 py-3 transition-colors hover:border-accent hover:bg-accent/5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.organization_name}</p>
            </div>
            <div className="shrink-0 text-right">
              <Badge variant={badge.variant}>{badge.label}</Badge>
              <p className="mt-2 text-xs text-muted-foreground">{formatDate(item.due_date)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function getDashboardMode(summary: DashboardSummary) {
  return summary.viewer?.scope === "assigned" ? "assessor" : "admin";
}

function getQuickLinks(mode: "admin" | "assessor", user: User, activeOrgId?: string | null) {
  if (mode === "assessor") {
    return [
      { label: "Open my assessments", href: "/assessments" },
      { label: "Review evidence", href: "/knowledge" },
      { label: "Ask AI for context", href: "/knowledge/chat" },
      { label: "Update my profile", href: "/settings/profile" },
    ];
  }

  const links = [
    { label: "View assessments", href: "/assessments" },
    { label: "Review templates", href: "/templates" },
    { label: "Open knowledge base", href: "/knowledge" },
    { label: "Ask AI", href: "/knowledge/chat" },
  ];

  if (RBAC.canManageOrgUsers(user)) {
    links.unshift({
      label: "Manage organization users",
      href: activeOrgId ? `/organizations/${activeOrgId}/members` : "/organizations",
    });
  }

  return links;
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

  const hero =
    mode === "assessor"
      ? {
          eyebrow: "Assigned work only",
          title: `Your dashboard for ${orgName}`,
          description:
            "This view is filtered to the active organization and only shows work directly assigned to you.",
          attentionTitle: "My priority queue",
          attentionDescription:
            "Immediate work you own inside the currently selected organization.",
          attentionEmpty:
            "Nothing urgent is assigned to you right now. Use the org switcher if you need a different context.",
          deadlineTitle: "My deadlines",
          deadlineDescription: "Deadlines tied to your assigned assessments and actions.",
          activityTitle: "Recent activity on my work",
          activityDescription:
            "Latest updates connected to the assessments and evidence items relevant to you.",
          statLabels: {
            activeAssessments: "My assessments",
            overdueActions: "My overdue actions",
            openFindings: "My open findings",
            pendingEvidenceReviews: "Evidence awaiting my review",
          },
        }
      : {
          eyebrow: "Active organization overview",
          title: `${orgName} dashboard`,
          description:
            "This dashboard follows the active organization from the header switcher and surfaces the most important org-wide work first.",
          attentionTitle: "Needs attention",
          attentionDescription:
            "Priority actions and assessment deadlines for the active organization.",
          attentionEmpty:
            "No urgent work right now. The active organization is clear for the moment.",
          deadlineTitle: "Upcoming deadlines",
          deadlineDescription: "Closest due dates across actions and assessments in the active organization.",
          activityTitle: "Recent activity",
          activityDescription:
            "Latest dashboard-relevant updates from the active organization.",
          statLabels: {
            activeAssessments: "Active assessments",
            overdueActions: "Overdue actions",
            openFindings: "Open findings",
            pendingEvidenceReviews: "Pending evidence review",
          },
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
                variant={mode === "assessor" ? "default" : "outline"}
                className="px-3 py-1"
              >
                {mode === "assessor" ? "Assigned scope" : "Organization scope"}
              </Badge>
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
            <div className="rounded-xl border border-border bg-background px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Active org
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">{orgName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Change this from the organization switcher in the header.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                View mode
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {mode === "assessor" ? "Only your assigned work" : "Org-wide operational view"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Role-aware results keep the dashboard relevant to your permissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={hero.statLabels.activeAssessments}
          value={summary.kpis.active_assessments}
          icon={ClipboardCheck}
          trend={mode === "assessor" ? "Currently assigned" : "In flight"}
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

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_360px]">
        <SectionCard
          title={hero.attentionTitle}
          description={hero.attentionDescription}
          className="min-w-0"
        >
          <AttentionList items={summary.attention_items} emptyState={hero.attentionEmpty} />
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title={hero.deadlineTitle} description={hero.deadlineDescription}>
            <DeadlineList items={summary.upcoming_deadlines} />
          </SectionCard>

          <QuickLinks
            title={mode === "assessor" ? "Useful shortcuts" : "Operational shortcuts"}
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
        {summary.recent_activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {summary.recent_activity.map((item) => (
              <li key={item.id}>
                <Link to={item.url} className="block rounded-lg hover:bg-muted/40">
                  <TimelineItem
                    text={`${item.title} — ${item.description}`}
                    badge={getActivityBadge(item)}
                    className="px-2"
                    dotColor={item.type === "document_uploaded" ? "bg-accent" : "bg-primary"}
                  />
                  <div className="pb-3 pl-9 text-xs text-muted-foreground">
                    {formatDateTime(item.timestamp)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
