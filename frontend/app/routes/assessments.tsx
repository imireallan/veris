import { useLoaderData, Link, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Filter, FileText, Plus } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { SearchBar, EmptyState, Button, Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "~/components/ui";
import { AssessmentCard } from "~/components/AssessmentCard";
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

  return { assessments, frameworks, focusAreas, organizations, selectedOrg, scope, user };
}

export default function AssessmentsListRoute() {
  const { assessments, frameworks, focusAreas, organizations, selectedOrg, scope, user } =
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

  const currentOrgName = selectedOrg?.name ?? "Current Organization";
  const canCreateInSelectedOrg = RBAC.canCreateAssessments(user);

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
            <BreadcrumbLink href="/app">Dashboard</BreadcrumbLink>
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
            {scope === "all"
              ? "Viewing assessments across all your organizations."
              : `Viewing assessments for ${currentOrgName}.`}
          </p>
        </div>
        {scope !== "all" && canCreateInSelectedOrg && (
          <Link to="/assessments/new">
            <Button>
              <Plus className="w-4 h-4" /> New Assessment
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
        placeholder="Search assessments..."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assessments yet"
          description={
            scope === "all"
              ? "No assessments found across your organizations."
              : canCreateInSelectedOrg
                ? `Get started by creating the first assessment for ${currentOrgName}.`
                : `You can view assessments in ${currentOrgName}, but you do not have permission to create them.`
          }
          action={
            scope !== "all" && canCreateInSelectedOrg ? (
              <Link to="/assessments/new">
                <Button className="mt-2">Create Assessment</Button>
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
