import { redirect, useLoaderData, useOutletContext } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

import { api } from "~/.server/lib/api";
import { getUserToken, requireUser } from "~/.server/sessions";
import Dashboard from "~/components/Dashboard";
import type { DashboardSummary, User } from "~/types";

function emptyDashboardSummary(user: User): DashboardSummary {
  return {
    viewer: {
      role: user.role,
      scope: "organization",
      organization_id: user.orgId,
      organization_name: user.orgName ?? user.activeOrganization?.name ?? null,
    },
    kpis: {
      active_assessments: 0,
      overdue_actions: 0,
      open_findings: 0,
      pending_evidence_reviews: 0,
    },
    attention_items: [],
    upcoming_deadlines: [],
    recent_activity: [],
    assessment_status_breakdown: {
      draft: 0,
      in_progress: 0,
      under_review: 0,
      completed: 0,
      archived: 0,
    },
    findings_by_severity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
    pending_invitations: {
      pending_count: 0,
      expired_count: 0,
      invitations: [],
    },
    evidence_pipeline: {
      uploaded_this_month: 0,
      mapped: 0,
      unmapped: 0,
      awaiting_review: 0,
      ai_suggested: 0,
      ai_validated: 0,
      total_uploaded: 0,
    },
    cross_framework_reuse: {
      reusable_answers: 0,
      mapped_answers: 0,
      unmapped_answers: 0,
      reuse_opportunity_pct: 0,
      top_frameworks_by_coverage: [],
    },
    risk_trend: {
      trend: [],
      current_risk_index: 0,
      risk_level: "low",
      open_critical: 0,
      open_high: 0,
    },
    site_progress: [],
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);

  if (!token) {
    throw redirect("/login");
  }

  try {
    const summary = await api.get<DashboardSummary>(
      "/api/dashboard/summary/",
      token,
      request,
    );

    return { summary, dashboardUnavailable: false };
  } catch (err) {
    console.warn(
      "Dashboard summary unavailable; rendering safe empty dashboard:",
      err instanceof Error ? err.message : err,
    );

    return {
      summary: emptyDashboardSummary(user),
      dashboardUnavailable: true,
    };
  }
}

export default function IndexRoute() {
  const { user } = useOutletContext<{ user: User | null }>();
  const { summary, dashboardUnavailable } = useLoaderData<typeof loader>();

  if (!user) {
    return <div className="p-8 text-center">Loading user profile...</div>;
  }

  return (
    <div className="space-y-4">
      {dashboardUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          Dashboard metrics are temporarily unavailable. You can continue using the app while the backend recovers.
        </div>
      )}
      <Dashboard user={user} summary={summary} />
    </div>
  );
}
