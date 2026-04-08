import { useLoaderData, Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);

  // If user has an org, fetch it directly
  if (user.organization_id) {
    try {
      const org = await api.get<any>(`/api/organizations/${user.organization_id}/`, token);
      return { orgs: [org], user };
    } catch {
      // Fall through to list endpoint
    }
  }

  // Fallback: list all organizations
  const orgs = await api.get<any[]>("/api/organizations/", token).catch(() => []);
  return { orgs: orgs || [], user };
}

export default function OrganizationsRoute() {
  const { orgs, user } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>

      {orgs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No organizations found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org: any) => (
            <Link
              key={org.id}
              to={`/organizations/${org.id}/assessments`}
              className="p-4 border rounded-lg hover:shadow-sm transition-shadow block"
            >
              <h3 className="font-medium">{org.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {org.status} · {org.subscription_tier}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
