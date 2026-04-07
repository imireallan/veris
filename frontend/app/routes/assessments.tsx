import { useLoaderData, Link, useSearchParams } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/api";
import { Clock, FileText, Plus } from "lucide-react";
import { Badge, Card, CardContent, ProgressBar } from "~/components/ui";
import {
  PageHeader,
  SearchBar,
  EmptyState,
  Button,
} from "~/components/ui";

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
  const { assessments, sites, frameworks, focusAreas } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") || "";
  const allItems = Array.isArray(assessments) ? assessments : [];
  const items = allItems.filter((a: any) => !search || a.ai_summary?.toLowerCase().includes(search.toLowerCase()));

  const fwMap = new Map((Array.isArray(frameworks) ? frameworks : []).map((f: any) => [f.id, f.name]));
  const faMap = new Map((Array.isArray(focusAreas) ? focusAreas : []).map((f: any) => [f.id, f.name]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        subtitle="Create, track, and manage sustainability assessments."
        action={
          <Link to="/assessments/new">
            <Button><Plus className="w-4 h-4" /> New Assessment</Button>
          </Link>
        }
      />

      <SearchBar
        value={search}
        onChange={(v) => setSearchParams(v ? { q: v } : {})}
        placeholder="Search assessments..."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assessments yet"
          description="Get started by creating your first assessment."
          actionLabel="Create Assessment"
          actionHref="/assessments/new"
        />
      ) : (
        <div className="grid gap-4">
          {items.map((a: any) => (
            <Link key={a.id} to={`/assessments/${a.id}`}>
              <AssessmentCard
                assessment={a}
                siteName={undefined}  // Could add siteMap if needed
                frameworkName={fwMap.get(a.framework)}
                focusAreaName={faMap.get(a.focus_area)}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Reusable assessment card — keeps the display logic in one place. */
function AssessmentCard({
  assessment,
  focusAreaName,
  frameworkName,
  siteName,
}: {
  assessment: any;
  focusAreaName?: string;
  frameworkName?: string;
  siteName?: string;
}) {
  const name = focusAreaName || frameworkName || `Assessment ${assessment.id.slice(0, 8)}`;

  return (
    <Card className="hover:shadow-md hover:border-primary/30 transition-all group">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Clock className="w-5 h-5 text-blue-500 shrink-0" />
          <Badge variant={riskVariant(assessment.risk_level)}>{assessment.risk_level}</Badge>
          <Badge variant={statusVariant(assessment.status)}>{assessment.status.replace(/_/g, " ")}</Badge>
          {assessment.overall_score > 0 && (
            <span className="text-xs font-mono text-muted-foreground">
              Score: {assessment.overall_score}%
            </span>
          )}
        </div>

        <h3 className="font-medium group-hover:text-primary transition-colors">{name}</h3>

        <p className="text-xs text-muted-foreground">
          Due: {assessment.due_date ? new Date(assessment.due_date).toLocaleDateString() : "—"}
        </p>

        {assessment.ai_summary && (
          <p className="text-xs text-muted-foreground line-clamp-1">{assessment.ai_summary}</p>
        )}

        <ProgressBar value={assessment.overall_score} size="sm" />
      </CardContent>
    </Card>
  );
}
