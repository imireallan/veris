import { useLoaderData, Link, useSearchParams, useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, FileText, Plus } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { Button, PageHeader, SearchBar, EmptyState } from "~/components/ui";
import { AssessmentCard } from "~/components/AssessmentCard";
import type { User } from "~/types";
import { RBAC } from "~/types/rbac";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const { orgId } = params;

  if (!RBAC.isOrgMember(user, orgId!)) {
    throw new Response("Access denied", { status: 403 });
  }

  const assessmentsResponse = await api.get<any>(`/api/organizations/${orgId}/assessments/`, token, request);
  
  const data = assessmentsResponse?.results || (Array.isArray(assessmentsResponse) ? assessmentsResponse : []);

  return { 
    assessments: data, 
    orgId, 
    user,
  };
}

export default function OrganizationAssessments() {
  const { assessments, orgId, user } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const search = searchParams.get("q") || "";
  const currentPage = parseInt(searchParams.get("page") || "1");
  
  const PAGE_SIZE = 5;
  
  const filteredAssessments = assessments.filter((a: any) => 
    (!search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.ai_summary?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredAssessments.length / PAGE_SIZE);
  const paginatedItems = filteredAssessments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const goToPage = (page: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", page.toString());
    setSearchParams(next);
  };

  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-muted-foreground">
        Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredAssessments.length)} to{" "}
        {Math.min(currentPage * PAGE_SIZE, filteredAssessments.length)} of {filteredAssessments.length} assessments
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
          .slice(Math.max(0, currentPage - 3), currentPage + 3)
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Organization Assessments
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Managing assessments for this organization.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/organizations/${orgId}`)}
        >
          ← Back
        </Button>
      </div>

      {RBAC.canCreateAssessments(user, orgId!) && (
        <Link to={`/assessments/new?orgId=${orgId}`}>
          <Button size="lg">
            <Plus className="w-5 h-5" /> New Assessment
          </Button>
        </Link>
      )}

      <SearchBar
        value={search}
        onChange={(v) => {
          const next = new URLSearchParams(searchParams);
          if (v) next.set("q", v);
          else next.delete("q");
          next.set("page", "1");
          setSearchParams(next);
        }}
        placeholder="Search assessments..."
      />

      {filteredAssessments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assessments found"
          description="Try adjusting your search or filter."
        />
      ) : (
        <>
          <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {paginatedItems.map((a: any) => (
              <Link 
                key={a.id} 
                to={`/assessments/${a.id}`}
                className="block transition-transform hover:scale-[1.01]"
              >
                <AssessmentCard 
                  assessment={a} 
                  orgName={undefined} 
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
