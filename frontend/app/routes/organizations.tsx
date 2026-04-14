import { useLoaderData, Link, useOutletContext, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import type { User } from "~/types";
import { api } from "~/.server/lib/api";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, SearchBar, Skeleton } from "~/components/ui";
import { useOrganizationCreationConfig } from "~/hooks/useOrganizationCreationConfig";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);

  // SUPERADMIN: fetch all orgs from API
  if (user.fallbackRole === "SUPERADMIN") {
    const response = await api.get<any>("/api/organizations/", token, request).catch(() => []);
    const orgsList = Array.isArray(response) ? response : (response?.results || []);
    return { orgs: orgsList, token };
  }

  // Regular users: show all orgs they belong to (from user.organizations)
  if (user.organizations && user.organizations.length > 0) {
    // Fetch details for each org the user belongs to
    const orgDetails = await Promise.all(
      user.organizations.map(async (org) => {
        try {
          const detail = await api.get<any>(`/api/organizations/${org.id}/`, token, request);
          return detail;
        } catch (error) {
          console.error(`Error fetching org ${org.id}:`, error);
          return null;
        }
      })
    );
    return { orgs: orgDetails.filter(Boolean), token };
  }

  return { orgs: [], token };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);

  if (user.fallbackRole !== "SUPERADMIN") {
    throw new Response("Forbidden", { status: 403 });
  }

  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries());
  
  try {
    const payload: any = {
      name: data.name as string,
      slug: (data.slug as string) || undefined,
    };
    
    // Only include optional fields if they have values
    if (data.framework) payload.framework = data.framework;
    if (data.sector) payload.sector = data.sector;
    if (data.clientEmail) payload.client_email = data.clientEmail;
    
    const result = await api.post("/api/organizations/", payload, token, request);
    return { 
      success: true, 
      message: "Organization created successfully!",
      data: result
    };
  } catch (err: any) {
    console.error("Create org error:", err);
    // Backend returns validation errors as { field: ['error message'] }
    const validationErrors = err.body;
    return { 
      error: validationErrors?.detail || err.message || "Failed to create organization",
      body: validationErrors,
      success: false 
    };
  }
}

export default function OrganizationsRoute() {
  const { orgs, token } = useLoaderData<typeof loader>();
  const context = useOutletContext<{ user: User | null }>();
  const user = context?.user;
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const search = searchParams.get("q") || "";
  const [isLoading, setIsLoading] = useState(true);

  const { config, loading: configLoading } = useOrganizationCreationConfig(token ?? undefined);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Simulate loading state for skeleton display
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [orgs]);

  const PAGE_SIZE = 5;
  const allItems = Array.isArray(orgs) ? orgs : [];
  const items = allItems.filter(
    (o: any) => !search || o.name.toLowerCase().includes(search.toLowerCase())
  );
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
        {Math.min(currentPage * PAGE_SIZE, items.length)} of {items.length} organizations
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

  if (!user) {
    return <div className="p-8 text-center">Please sign in to view your organizations.</div>;
  }

  const canCreate = user.fallbackRole === "SUPERADMIN" || config?.can_create;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
        {canCreate && (
          <Link to="/organizations/new">
            <Button className="gap-1">
              <Plus className="w-4 h-4" /> New Organization
            </Button>
          </Link>
        )}
      </div>

      <SearchBar
        value={search}
        onChange={(v) => setSearchParams(v ? { q: v } : {})}
        placeholder="Search organizations..."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {search ? `No organizations found matching "${search}"` : "No organizations found."}
          </p>
        </div>
      ) : (
        <>
          <div
            key={currentPage}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 [animation-fill-mode:both] animate-fade-in"
          >
            {paginatedItems.map((org: any) => (
              <Link
                key={`org-${org.id}-${currentPage}`}
                to={`/organizations/${org.id}`}
                className="p-4 border rounded-lg hover:shadow-sm transition-shadow block animate-in slide-in-from-bottom-2 duration-300 fade-in"
              >
                <h3 className="font-medium">{org.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {org.status} · {org.subscription_tier}
                </p>
              </Link>
            ))}
          </div>
          {totalPages > 1 && <PaginationControls />}
        </>
      )}
    </div>
  );
}
