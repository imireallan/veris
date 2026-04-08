import { useLoaderData, Link, Outlet } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const orgId = params.orgId;

  const org = await api.get<any>(`/api/organizations/${orgId}/`, token);

  // Check if user belongs to this organization or is admin
  if (user.role !== "ADMIN" && String(user.organization_id) !== String(orgId)) {
    throw new Response("Access denied", { status: 403 });
  }

  // Fetch assessments for this org
  const assessments = await api.get<any[]>(`/api/organizations/${orgId}/assessments/`, token)
    .catch(() => []);

  return { org, assessments: assessments || [], user };
}

export default function OrganizationDetailRoute() {
  const { org, assessments } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {org.status} · {org.subscription_tier}
          </p>
        </div>
        <Link to="/organizations" className="text-sm text-primary hover:underline">
          ← All Organizations
        </Link>
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

      <Link
        to={`/organizations/${org.id}/assessments`}
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        View Assessments →
      </Link>

      <Outlet />
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
