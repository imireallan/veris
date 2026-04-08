import { useLoaderData, Link, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { Clock, FileText, Plus } from "lucide-react";
import { Badge, Card, CardContent, ProgressBar } from "~/components/ui";
import { PageHeader, SearchBar, EmptyState, Button } from "~/components/ui";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = getUserToken(request);

  const fetchWithLog = async (url: string, label: string) => {
    try {
      const result = await api.get<any>(url, token);
      // DRF paginated responses are { count, results }, unwrap to plain array
      return Array.isArray(result) ? result : (result?.results ?? []);
    } catch (err) {
      console.error(`[Assessments] Failed to fetch ${label}:`, err);
      return [];
    }
  };

  const [assessments, sites, frameworks, focusAreas] = await Promise.all([
    fetchWithLog("/api/assessments/", "assessments"),
    fetchWithLog("/api/sites/", "sites"),
    fetchWithLog("/api/frameworks/", "frameworks"),
    fetchWithLog("/api/focus-areas/", "focusAreas"),
  ]);

  return { assessments, sites, frameworks, focusAreas, user };
}

const statusVariant = (
  s: string,
): "default" | "secondary" | "success" | "destructive" | "outline" => {
  switch (s) {
    case "COMPLETED":
      return "default";
    case "IN_PROGRESS":
      return "secondary";
    case "UNDER_REVIEW":
      return "outline";
    case "ARCHIVED":
      return "outline";
    default:
      return "secondary";
  }
};

const riskVariant = (
  r: string,
): "default" | "destructive" | "secondary" | "success" => {
  switch (r) {
    case "CRITICAL":
      return "destructive";
    case "HIGH":
      return "destructive";
    case "MEDIUM":
      return "secondary";
    case "LOW":
      return "success";
    default:
      return "secondary";
  }
};

export default function AssessmentsListRoute() {
  const { assessments, sites, frameworks, focusAreas } =
    useLoaderData<typeof loader>();
  console.log("Loaded assessments:", sites);
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const search = searchParams.get("q") || "";

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const PAGE_SIZE = 5;
  const allItems = Array.isArray(assessments) ? assessments : [];
  const items = allItems.filter(
    (a: any) =>
      !search || a.ai_summary?.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paginatedItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
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

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-muted-foreground">
        Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, items.length)} to{" "}
        {Math.min(currentPage * PAGE_SIZE, items.length)} of {items.length}{" "}
        assessments
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
      <PageHeader
        title="Assessments"
        subtitle="Create, track, and manage sustainability assessments."
        action={
          <Link to="/assessments/new">
            <Button>
              <Plus className="w-4 h-4" /> New Assessment
            </Button>
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
                  siteName={undefined} // Could add siteMap if needed
                  frameworkName={fwMap.get(a.framework)}
                  focusAreaName={faMap.get(a.focus_area)}
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
  const name =
    focusAreaName || frameworkName || `Assessment ${assessment.id.slice(0, 8)}`;

  return (
    <Card className="hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 hover:shadow-primary/10 transition-all duration-300 group">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Clock className="w-5 h-5 text-blue-500 shrink-0" />
          <Badge variant={riskVariant(assessment.risk_level)}>
            {assessment.risk_level}
          </Badge>
          <Badge variant={statusVariant(assessment.status)}>
            {assessment.status.replace(/_/g, " ")}
          </Badge>
          {assessment.overall_score > 0 && (
            <span className="text-xs font-mono text-muted-foreground">
              Score: {assessment.overall_score}%
            </span>
          )}
        </div>

        <h3 className="font-medium group-hover:text-primary transition-colors">
          {name}
        </h3>

        <p className="text-xs text-muted-foreground">
          Due:{" "}
          {assessment.due_date
            ? new Date(assessment.due_date).toLocaleDateString()
            : "—"}
        </p>

        {assessment.ai_summary && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {assessment.ai_summary.replace(/<[^>]*>/g, "")}
          </p>
        )}

        <ProgressBar value={assessment.overall_score} size="sm" />
      </CardContent>
    </Card>
  );
}
