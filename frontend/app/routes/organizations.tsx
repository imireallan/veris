import { useLoaderData, Link, useSearchParams, Outlet } from "react-router";
import { useState, useEffect } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import type { User, OrganizationListItem } from "~/types";
import { api } from "~/.server/lib/api";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, Button, SearchBar, Skeleton } from "~/components/ui";
import { RBAC } from "~/types/rbac";

type OrganizationRecord = {
  id: string;
  name: string;
  slug?: string;
  status?: string;
  subscription_tier?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);

  if (!token) {
    throw new Response("Unauthorized", { status: 401 });
  }

  let orgs: OrganizationRecord[] = [];

  // SUPERADMIN: fetch all organizations from API
  if (user.isSuperuser) {
    const response = await api
      .get<any>("/api/organizations/", token, request)
      .catch(() => []);

    orgs = Array.isArray(response) ? response : (response?.results ?? []);
  } else {
    // Regular users: fetch org details from recentOrganizations / organizations if available
    const accessibleOrganizations: OrganizationListItem[] =
      user.organizations ?? user.recentOrganizations ?? [];

    if (accessibleOrganizations.length > 0) {
      const orgDetails = await Promise.all(
        accessibleOrganizations.map(async (org) => {
          try {
            const detail = await api.get<any>(
              `/api/organizations/${org.id}/`,
              token,
              request,
            );
            return detail;
          } catch (error) {
            console.error(`Error fetching org ${org.id}:`, error);
            return null;
          }
        }),
      );

      orgs = orgDetails.filter(Boolean);
    }
  }

  return {
    orgs,
    user,
    selectedOrgId: user.orgId ?? null,
    organizationOptions: user.organizations ?? user.recentOrganizations ?? [],
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);

  if (!RBAC.canCreateOrganization(user)) {
    throw new Response("Forbidden", { status: 403 });
  }

  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries());

  try {
    const payload: any = {
      name: data.name as string,
      slug: (data.slug as string) || undefined,
    };

    if (data.framework) payload.framework = data.framework;
    if (data.sector) payload.sector = data.sector;
    if (data.clientEmail) payload.client_email = data.clientEmail;

    const result = await api.post(
      "/api/organizations/",
      payload,
      token,
      request,
    );

    return {
      success: true,
      message: "Organization created successfully!",
      data: result,
    };
  } catch (err: any) {
    console.error("Create org error:", err);
    const validationErrors = err.body;

    return {
      error:
        validationErrors?.detail ||
        err.message ||
        "Failed to create organization",
      body: validationErrors,
      success: false,
    };
  }
}

export default function OrganizationsRoute() {
  const { orgs, selectedOrgId, user, organizationOptions } =
    useLoaderData<typeof loader>();

  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const search = searchParams.get("q") || "";

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [orgs]);

  const PAGE_SIZE = 5;
  const allItems = Array.isArray(orgs) ? orgs : [];
  const items = allItems.filter(
    (o) => !search || o.name.toLowerCase().includes(search.toLowerCase()),
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
    <div className="mt-6 flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, items.length)} to{" "}
        {Math.min(currentPage * PAGE_SIZE, items.length)} of {items.length}{" "}
        organizations
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 hover:ring-primary/30 active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .slice(-5)
          .map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => goToPage(page)}
              className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 hover:ring-primary/30 active:scale-95"
            >
              {page}
            </Button>
          ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 hover:ring-primary/30 active:scale-95"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="p-8 text-center">
        Please sign in to view your organizations.
      </div>
    );
  }

  const canCreate = RBAC.canCreateOrganization(user);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>

        {canCreate && (
          <Link to="/organizations/new">
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              New Organization
            </Button>
          </Link>
        )}
      </div>

      <SearchBar
        value={search}
        onChange={(value) => {
          const next = new URLSearchParams(searchParams);
          if (value) {
            next.set("q", value);
          } else {
            next.delete("q");
          }
          setSearchParams(next);
        }}
        placeholder="Search organizations..."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            {search
              ? `No organizations found matching "${search}"`
              : "No organizations found."}
          </p>
        </div>
      ) : (
        <>
          <div
            key={currentPage}
            className="grid grid-cols-1 gap-4 [animation-fill-mode:both] animate-fade-in md:grid-cols-2 lg:grid-cols-3"
          >
            {paginatedItems.map((org) => {
              const membership = organizationOptions?.find(
                (item) => String(item.id) === String(org.id),
              );

              const membershipRole =
                membership?.fallback_role || membership?.role || null;

              const isSelectedOrg = String(selectedOrgId) === String(org.id);

              return (
                <Link
                  key={`org-${org.id}-${currentPage}`}
                  to={`/organizations/${org.id}`}
                  className={[
                    "block rounded-lg border p-4 transition-shadow animate-in slide-in-from-bottom-2 fade-in duration-300 hover:shadow-sm",
                    isSelectedOrg
                      ? "border-primary/40 bg-primary/5 ring-2 ring-primary/30"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{org.name}</h3>
                        {isSelectedOrg && (
                          <Badge variant="default">Current</Badge>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {org.status ?? "UNKNOWN"}
                        {org.subscription_tier
                          ? ` · ${org.subscription_tier}`
                          : ""}
                      </p>
                    </div>

                    {membershipRole && (
                      <Badge variant="outline">{membershipRole}</Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && <PaginationControls />}
        </>
      )}

      <Outlet />
    </div>
  );
}
