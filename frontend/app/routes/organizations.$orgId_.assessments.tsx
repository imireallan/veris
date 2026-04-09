import { useState } from "react";
import { useLoaderData, Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { ChevronLeft, ChevronRight, FileText, Plus, AlertCircle } from "lucide-react";
import { Badge, EmptyState, Button } from "~/components/ui";
import { AssessmentCard } from "~/components/AssessmentCard";

import type { Assessment } from "~/types";

interface Organization {
  id: string;
  name: string;
  status: string;
}

interface LoaderData {
  org: Organization | null;
  assessments: Assessment[];
}

export async function loader({ request, params }: LoaderFunctionArgs): Promise<LoaderData> {
  await requireUser(request);
  const token = await getUserToken(request);
  const orgId = params.orgId as string;

  try {
    const [org, assessmentsResponse] = await Promise.all([
      api.get<Organization>(`/api/organizations/${orgId}/`, token),
      api.get<any>(`/api/organizations/${orgId}/assessments/`, token).catch(() => []),
    ]);

    const assessments = Array.isArray(assessmentsResponse) 
      ? assessmentsResponse 
      : (assessmentsResponse as any)?.results ?? [];

    return { 
      org, 
      assessments 
    };
  } catch (error) {
    console.error("Error loading organization assessments:", error);
    return { org: null, assessments: [] };
  }
}

export default function OrganizationAssessmentsRoute() {
  const data = useLoaderData<typeof loader>();
  
  if (!data || !data.org) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <EmptyState 
          icon={AlertCircle}
          title="Organization not found" 
          description="The requested organization could not be retrieved." 
        />
      </div>
    );
  }

  const { org, assessments } = data;
  const [currentPage, setCurrentPage] = useState(1);
  
  const PAGE_SIZE = 5;
  const items = assessments || [];
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paginatedItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
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
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
            <Badge variant="secondary">{org.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {assessments.length} assessment{assessments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/assessments/new?organization=${org.id}`}>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              New Assessment
            </Button>
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assessments yet"
          description="Create your first assessment to get started."
          action={
            <Link to={`/assessments/new?organization=${org.id}`}>
              <Button>
                <Plus className="w-4 h-4 mr-1.5" />
                Create Assessment
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 [animation-fill-mode:both] animate-fade-in">
            {paginatedItems.map((a: any) => (
              <Link to={`/assessments/${a.id}`} key={a.id} className="animate-in slide-in-from-bottom-2 duration-300 fade-in">
                <AssessmentCard
                  assessment={a}
                  orgName={org.name}
                  frameworkName={undefined} 
                  focusAreaName={undefined}
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
