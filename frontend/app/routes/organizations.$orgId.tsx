import { useLoaderData, Link, Outlet } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import type { User } from "~/types";
import { RBAC } from "~/types/rbac";
import { api } from "~/.server/lib/api";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const orgId = params.orgId!;

  // Fetch organization with error handling
  let org;
  try {
    org = await api.get<any>(`/api/organizations/${orgId}/`, token, request);
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "An error occurred";
    
    const errorObj = new Error(message);
    (errorObj as any).status = status;
    (errorObj as any).statusCode = status;
    throw errorObj;
  }

  const allAssessments = await api.get<any>(`/api/assessments/`, token, request).catch(() => []);
  const assessmentList = Array.isArray(allAssessments) 
    ? allAssessments 
    : (allAssessments?.results || []);
  
  const assessments = assessmentList.filter((a: any) => a.organization === orgId || a.organization_id === orgId);

  return { org, assessments, user, accessDenied: !RBAC.isOrgMember(user, orgId) };
}

export default function OrganizationDetailRoute() {
  const { org, assessments, user, accessDenied } = useLoaderData<typeof loader>();

  if (!user) {
    return <div className="p-8 text-center">Loading user profile...</div>;
  }

  if (accessDenied) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-medium">Access Denied</h2>
        <p className="text-muted-foreground">You don't have access to this organization.</p>
        <Link to="/organizations" className="text-primary hover:underline">
          ← Back to organizations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/organizations">Organizations</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{org.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {org.status} · {org.subscription_tier}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Assessments"
          value={assessments.length}
          subtitle="Total assessments"
        />
        <StatCard
          title="Focus Areas"
          value={org.focus_area_count ?? "—"}
          subtitle="ESG focus areas"
        />
        <StatCard
          title="Sites"
          value={org.site_count ?? "—"}
          subtitle="Registered sites"
        />
      </div>

      <div className="flex items-center justify-between border-t pt-6">
        <div className="flex gap-4">
          <Link
            to={`/organizations/${org.id}/assessments`}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            View Assessments →
          </Link>
          
          {RBAC.canManageTemplates(user, org.id) && (
            <>
              <Link
                to={`/organizations/${org.id}/templates`}
                className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
              >
                Manage Templates →
              </Link>
              
              {RBAC.canManageOrg(user, org.id) && (
                <Link
                  to={`/organizations/${org.id}/members`}
                  className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
                >
                  Members & Invites →
                </Link>
              )}
              
              {user.fallbackRole === "SUPERADMIN" && (
                <Link
                  to={`/organizations/${org.id}/settings`}
                  className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
                >
                  Settings →
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      <Outlet />
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  // Check if error has status property (from loader)
  const errorWithStatus = error as Error & { status?: number; statusCode?: number };
  const status = errorWithStatus.status || errorWithStatus.statusCode;
  const isNotFound = status === 404;
  const isForbidden = status === 403;
  
  // Try to get error message
  const errorMessage = error.message || "An unexpected error occurred.";
  const isInvalidOrg = errorMessage.toLowerCase().includes("organization") || 
                       errorMessage.toLowerCase().includes("access") ||
                       errorMessage.toLowerCase().includes("uuid") ||
                       errorMessage.toLowerCase().includes("invalid");

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-md">
        {isNotFound || isInvalidOrg ? (
          <>
            <div className="text-6xl">🔍</div>
            <h2 className="text-2xl font-semibold">Organization Not Found</h2>
            <p className="text-muted-foreground">
              {errorMessage.toLowerCase().includes("uuid") || errorMessage.toLowerCase().includes("format")
                ? "The organization ID format is invalid."
                : "This organization doesn't exist or you don't have access to it. The organization ID may be invalid or your access may have been removed."}
            </p>
          </>
        ) : isForbidden ? (
          <>
            <div className="text-6xl">🔒</div>
            <h2 className="text-2xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to view this organization.
              Contact your administrator if you believe this is an error.
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl">⚠️</div>
            <h2 className="text-2xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground">
              {errorMessage}
            </p>
          </>
        )}
        <Link
          to="/organizations"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          ← Back to Organizations
        </Link>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle: string }) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
    </div>
  );
}
