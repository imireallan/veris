import { useLoaderData, Link, useSearchParams } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/api";
import { Plus, Search, Clock, FileText } from "lucide-react";
import { Badge, Card, CardContent, Input, Button, Skeleton } from "~/components/ui";

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

const statusVariant = (s: string): "default" | "secondary" | "success" | "destructive" | "outline" => {
  switch (s) {
    case "COMPLETED": return "default";
    case "IN_PROGRESS": return "secondary";
    case "UNDER_REVIEW": return "outline";
    case "ARCHIVED": return "outline";
    default: return "secondary";
  }
};

const riskVariant = (r: string): "default" | "destructive" | "secondary" | "success" => {
  switch (r) {
    case "CRITICAL": return "destructive";
    case "HIGH": return "destructive";
    case "MEDIUM": return "secondary";
    case "LOW": return "success";
    default: return "secondary";
  }
};

export default function AssessmentsListRoute() {
  const { assessments, sites, frameworks, focusAreas, user } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") || "";
  const allItems = Array.isArray(assessments) ? assessments : [];
  const items = allItems.filter((a: any) => !search || a.ai_summary?.toLowerCase().includes(search.toLowerCase()));

  const siteMap = new Map((Array.isArray(sites) ? sites : []).map((s: any) => [s.id, s.name]));
  const fwMap = new Map((Array.isArray(frameworks) ? frameworks : []).map((f: any) => [f.id, f.name]));
  const faMap = new Map((Array.isArray(focusAreas) ? focusAreas : []).map((f: any) => [f.id, f.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Assessments</h2>
          <p className="text-muted-foreground text-sm mt-1">Create, track, and manage sustainability assessments.</p>
        </div>
        <Link to="/assessments/new">
          <Button>
            <Plus className="w-4 h-4" /> New Assessment
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search assessments..."
          value={search}
          onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {})}
          className="pl-10"
        />
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium">No assessments yet</h3>
            <Link to="/assessments/new">
              <Button className="mt-4">Create Assessment</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((a: any) => (
            <Link key={a.id} to={`/assessments/${a.id}`}>
              <Card className="hover:shadow-md hover:border-primary/30 transition-all group">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Clock className="w-5 h-5 text-blue-500 shrink-0" />
                    <Badge variant={riskVariant(a.risk_level)}>{a.risk_level}</Badge>
                    <Badge variant={statusVariant(a.status)}>{a.status.replace(/_/g, " ")}</Badge>
                    {a.overall_score > 0 && <span className="text-xs font-mono text-muted-foreground">Score: {a.overall_score}%</span>}
                  </div>
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    {faMap.get(a.focus_area) || fwMap.get(a.framework) || `Assessment ${a.id.slice(0, 8)}`}
                  </h3>
                  <p className="text-xs text-muted-foreground">Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : "—"}</p>
                  {a.ai_summary && <p className="text-xs text-muted-foreground line-clamp-1">{a.ai_summary}</p>}
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${a.overall_score >= 80 ? "bg-green-500" : a.overall_score >= 50 ? "bg-yellow-500" : a.overall_score >= 25 ? "bg-orange-500" : "bg-red-500"}`}
                      style={{ width: `${Math.min(a.overall_score, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
