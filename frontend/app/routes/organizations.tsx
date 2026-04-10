import { useLoaderData, Link, Form, useOutletContext } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import type { User } from "~/types";
import { UserRole } from "~/types/rbac";
import { api } from "~/.server/lib/api";
import { Plus } from "lucide-react";
import { Button, Input } from "~/components/ui";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);

  if (user.role === UserRole.SUPERADMIN) {
    const response = await api.get<any>("/api/organizations/", token).catch(() => []);
    const orgsList = Array.isArray(response) ? response : (response?.results || []);
    return { orgs: orgsList };
  }

  if (user.orgId) {
    try {
      const org = await api.get<any>(`/api/organizations/${user.orgId}/`, token);
      return { orgs: [org] };
    } catch (error) {
      console.error(`Error fetching org ${user.orgId}:`, error);
      return { orgs: [] };
    }
  }

  return { orgs: [] };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);

  if (user.role !== UserRole.SUPERADMIN) {
    throw new Response("Forbidden", { status: 403 });
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;
  
  try {
    await api.post("/api/organizations/", { name }, token);
    return { success: true };
  } catch (err: any) {
    return { error: err.message ?? "Failed to create organization" };
  }
}

export default function OrganizationsRoute() {
  const { orgs } = useLoaderData<typeof loader>();
  const context = useOutletContext<{ user: User | null }>();
  const user = context?.user;

  if (!user) {
    return <div className="p-8 text-center">Please sign in to view your organizations.</div>;
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
        {user.role === UserRole.SUPERADMIN && (
          <Form method="post" className="flex gap-2">
            <Input 
              name="name" 
              placeholder="New Org Name" 
              className="w-64" 
              required 
            />
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Create
            </Button>
          </Form>
        )}
      </div>

      {orgs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No organizations found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org: any) => (
            <Link
              key={org.id}
              to={`/organizations/${org.id}`}
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
