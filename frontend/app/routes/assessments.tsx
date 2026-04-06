import { useLoaderData, Link, useSearchParams } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/api";
import { Plus, Search, Clock, FileText, AlertTriangle } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = getUserToken(request);
  const [assessments, sites, frameworks, focusAreas] = await Promise.all([
    api.get<any[]>("/api/assessments/", token).catch(() => []),
    api.get<any[]>("/api/sites/", token).catch(() => []),
    api.get<any[]>("/api/frameworks/", token).catch(() => []),
    api.get<any[]>("/api/focus-areas/", token).catch(() => []),
  ]);
  return { assessments, sites, frameworks, focusAreas, user };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-gray-50 text-gray-400",
};

const RISK_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

export default function AssessmentsListRoute() {
  const { assessments, sites, frameworks, focusAreas, user } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") || "";
  const allItems = Array.isArray(assessments) ? assessments : assessments?.results ?? [];
  const items = allItems.filter((a: any) => !search || a.ai_summary?.toLowerCase().includes(search.toLowerCase()));

  const siteMap = new Map((Array.isArray(sites) ? sites : []).map((s: any) => [s.id, s.name]));
  const fwMap = new Map((Array.isArray(frameworks) ? frameworks : []).map((f: any) => [f.id, f.name]));
  const faMap = new Map((Array.isArray(focusAreas) ? focusAreas : []).map((f: any) => [f.id, f.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Assessments</h2>
          <p className="text-muted-foreground text-sm mt-1">Create, track, and manage sustainability assessments.</p>
        </div>
        <Link to="/assessments/new" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 text-sm">
          <Plus className="w-4 h-4" /> New Assessment
        </Link>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search assessments..." value={search}
          onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {})}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground text-sm"
        />
      </div>
      {items.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium text-foreground">No assessments yet</h3>
          <Link to="/assessments/new" className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Create Assessment</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((a: any) => (
            <Link key={a.id} to={`/assessments/${a.id}`} className="block bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 group">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[a.risk_level]}`}>{a.risk_level}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status]}`}>{a.status.replace(/_/g, " ")}</span>
                {a.overall_score > 0 && <span className="text-xs font-mono text-muted-foreground">Score: {a.overall_score}%</span>}
              </div>
              <h3 className="font-medium text-foreground">{faMap.get(a.focus_area) || fwMap.get(a.framework) || `Assessment ${a.id.slice(0, 8)}`}</h3>
              <p className="text-xs text-muted-foreground mt-1">Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : "—"}</p>
              {a.ai_summary && <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{a.ai_summary}</p>}
              <div className="mt-3 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${a.overall_score >= 80 ? "bg-green-500" : a.overall_score >= 50 ? "bg-yellow-500" : a.overall_score >= 25 ? "bg-orange-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(a.overall_score, 100)}%` }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
