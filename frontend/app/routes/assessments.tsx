import { useLoaderData, Link, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Filter, FileText, Plus, X } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { PageHeader, SearchBar, EmptyState, Button, Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "~/components/ui";
import { AssessmentCard } from "~/components/AssessmentCard";
import { UserRole } from "~/types/rbac";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const url = new URL(request.url);
  const orgFilter = (url.searchParams.get("org") || url.searchParams.get("organization") || "").replace(/\/$/, "");

  const fetchWithLog = async (path: string, label: string) => {
    try {
      const result = await api.get<any>(path, token, request);
      return Array.isArray(result) ? result : (result?.results ?? []);
    } catch (err: any) {
      // Handle 403 permission errors gracefully - return empty array
      if (err.status === 403) {
        console.warn(`Permission denied for ${label}: User lacks access`);
        return [];
      }
      console.warn(`Failed to fetch ${label}:`, err.message);
      return [];
    }
  };

  // Non-admin users are server-side scoped to their own org by default.
  // For admins, optionally pass ?org= to filter.
  const isSuperAdmin = user.fallbackRole === UserRole.SUPERADMIN;

  const assessmentsPath = isSuperAdmin && orgFilter
    ? `/api/assessments?organization=${orgFilter}`
    : "/api/assessments/";

  const orgPath = orgFilter
    ? `/api/organizations?organization=${orgFilter}`
    : `/api/organizations/`;

  console.log({ assessmentsPath })

  const [assessments, sites, frameworks, focusAreas, organizations] =
    await Promise.all([
      fetchWithLog(assessmentsPath, "assessments"),
      fetchWithLog("/api/sites/", "sites"),
      fetchWithLog("/api/frameworks/", "frameworks"),
      fetchWithLog("/api/focus-areas/", "focusAreas"),
      fetchWithLog(orgPath, "organizations"),
    ]);

  return { assessments, sites, frameworks, focusAreas, organizations, orgFilter, user };
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
  const { assessments, sites, frameworks, focusAreas, organizations, orgFilter, user } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const search = searchParams.get("q") || "";
  const activeOrg = (searchParams.get("org") || searchParams.get("organization") || "").replace(/\/$/, "");

  const isSuperAdmin = user.fallbackRole === UserRole.SUPERADMIN;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeOrg]);

  const PAGE_SIZE = 5;
  const allItems = Array.isArray(assessments) ? assessments : [];
  const items = allItems.filter(
    (a: any) =>
      (!search || 
        a.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.ai_summary?.toLowerCase().includes(search.toLowerCase())) &&
      (!activeOrg || a.organization === activeOrg)
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

  const activeOrgName = activeOrg ? orgMap.get(activeOrg) : null;
  const displayValue = activeOrg ? (activeOrgName || activeOrg) : "all";

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-muted-foreground">
        Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, items.length)} to{" "}
        {Math.min(currentPage * PAGE_SIZE, items.length)} of {items.length} assessments
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
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Assessments</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assessments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, track, and manage sustainability assessments.
          </p>
        </div>
        <Link to="/assessments/new">
          <Button>
            <Plus className="w-4 h-4" /> New Assessment
          </Button>
        </Link>
      </div>

      {isSuperAdmin && (
        <div className="flex gap-3 items-center">
          <div className="relative min-w-[200px]">
            <Select
              value={displayValue}
              onValueChange={(v) => {
                const next = new URLSearchParams(searchParams);
                if (v && v !== "all") {
                  next.set("org", v);
                } else {
                  next.delete("org");
                }
                next.delete("q");
                setSearchParams(next);
              }}
            >
              <SelectTrigger className="w-full pl-9">
                <SelectValue>
                  {activeOrgName || "All Organizations"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {Array.isArray(organizations) &&
                    organizations.map((o: any) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Filter className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          {activeOrg && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete("org");
                setSearchParams(next);
              }}
              className="text-xs h-8"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      )}

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
                  siteName={undefined}
                  frameworkName={fwMap.get(a.framework)}
                  focusAreaName={faMap.get(a.focus_area)}
                  orgName={orgMap?.get(a.organization)}
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
