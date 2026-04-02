import { useLoaderData, redirect, Link } from "react-router";
import type { Route } from "./+types/assessments";
import { requireUser } from "~/.server/sessions";
import { ClipboardCheck, ArrowRight, Clock, CheckCircle, AlertCircle } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return {
    assessments: [
      { id: 1, title: "GHG Protocol Scope 1 & 2", status: "complete", progress: 100, updated: "2025-01-10" },
      { id: 2, title: "TCFD Climate Risk Assessment", status: "in-progress", progress: 65, updated: "2025-01-12" },
      { id: 3, title: "CDP Climate Change", status: "not-started", progress: 0, updated: null },
      { id: 4, title: "GRI Standards Report", status: "draft", progress: 30, updated: "2025-01-08" },
    ],
  };
}

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  complete: CheckCircle,
  "in-progress": Clock,
  "not-started": AlertCircle,
  draft: ClipboardCheck,
};

const STATUS_COLORS: Record<string, string> = {
  complete: "text-success",
  "in-progress": "text-secondary",
  "not-started": "text-destructive",
  draft: "text-accent",
};

export default function AssessmentsRoute() {
  const { assessments } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Assessments</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Track progress on ESG assessments and reporting frameworks.
        </p>
      </div>

      <div className="grid gap-4">
        {assessments.map((a) => {
          const StatusIcon = STATUS_ICONS[a.status];
          return (
            <div key={a.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className={`w-5 h-5 ${STATUS_COLORS[a.status]}`} />
                  <div>
                    <div className="text-base font-medium text-foreground">{a.title}</div>
                    <div className="text-xs text-muted-foreground capitalize">{a.status.replace("-", " ")}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {a.updated && (
                    <span className="text-xs text-muted-foreground">{a.updated}</span>
                  )}
                  <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${a.progress === 100 ? "bg-success" : "bg-primary"}`}
                      style={{ width: `${a.progress}%` }}
                    />
                  </div>
                  <Link to={`/assessments/${a.id}`} className="text-primary hover:underline text-sm flex items-center gap-1">
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
