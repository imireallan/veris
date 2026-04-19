import { useLoaderData, Link, Outlet } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { RBAC } from "~/types/rbac";
import {
  getOrganization,
  getOrganizationAssessments,
} from "~/.server/organizations";
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

  const org = await getOrganization(orgId, request, token);

  if (!org) {
    const errorObj = new Error("Organization not found or access denied.");
    (errorObj as any).status = 404;
    (errorObj as any).statusCode = 404;
    throw errorObj;
  }

  const allAssessments = await getOrganizationAssessments(
    orgId,
    request,
    token,
  );
  const assessmentList = Array.isArray(allAssessments)
    ? allAssessments
    : allAssessments?.results || [];

  const assessments = assessmentList.filter(
    (a: any) =>
      String(a.organization) === String(orgId) ||
      String(a.organization_id) === String(orgId),
  );

  return { org, assessments, user };
}

export default function OrganizationDetailRoute() {
  const { org, assessments, user } = useLoaderData<typeof loader>();

  if (!user) {
    return <div className="p-8 text-center">Loading user profile...</div>;
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
          <p className="mt-0.5 text-sm text-muted-foreground">
            {org.status} · {org.subscription_tier}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

          {RBAC.canManageTemplates(user) && (
            <>
              <Link
                to={`/organizations/${org.id}/templates`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Manage Templates →
              </Link>

              {RBAC.canManageOrg(user) && (
                <Link
                  to={`/organizations/${org.id}/members`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Members & Invites →
                </Link>
              )}

              {RBAC.isPlatformAdmin(user) && (
                <Link
                  to={`/organizations/${org.id}/settings`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Settings →
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      <Outlet context={{ user, org, assessments }} />
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  const errorWithStatus = error as Error & {
    status?: number;
    statusCode?: number;
  };
  const status = errorWithStatus.status || errorWithStatus.statusCode;
  const isNotFound = status === 404;
  const isForbidden = status === 403;

  const errorMessage = error.message || "An unexpected error occurred.";
  const isInvalidOrg =
    errorMessage.toLowerCase().includes("organization") ||
    errorMessage.toLowerCase().includes("access") ||
    errorMessage.toLowerCase().includes("uuid") ||
    errorMessage.toLowerCase().includes("invalid");

  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="max-w-md space-y-4 text-center">
        {isNotFound || isInvalidOrg ? (
          <>
            <div className="text-6xl">🔍</div>
            <h2 className="text-2xl font-semibold">Organization Not Found</h2>
            <p className="text-muted-foreground">
              {errorMessage.toLowerCase().includes("uuid") ||
              errorMessage.toLowerCase().includes("format")
                ? "The organization ID format is invalid."
                : "This organization doesn't exist or you don't have access to it. The organization ID may be invalid or your access may have been removed."}
            </p>
          </>
        ) : isForbidden ? (
          <>
            <div className="text-6xl">🔒</div>
            <h2 className="text-2xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to view this organization. Contact your
              administrator if you believe this is an error.
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl">⚠️</div>
            <h2 className="text-2xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
          </>
        )}

        <Link
          to="/organizations"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          ← Back to Organizations
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
    </div>
  );
}
