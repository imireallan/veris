import { useLoaderData, Link, Form, useOutletContext } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { Plus } from "lucide-react";
import { Button, Input } from "~/components/ui";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await getUserToken(request);
  if (!token) return { orgs: [] };

  try {
    // We only need the user's role and org_id to decide what data to fetch.
    // To avoid a full /auth/me call, we can either:
    // 1. Trust the client context (not secure for loader)
    // 2. Call /auth/me once here to authorize the data request.
    // However, if the goal is ZERO redundant calls to /auth/me across the app:
    // We have to accept that server-side loaders NEED to verify the user for security.
    // BUT, we can optimize this by putting the user data in the session cookie 
    // or using a cached version. 
    
    // Since we are in a loader, we MUST verify identity to prevent IDOR.
    const user = await api.get<any>(`/api/auth/me/`, token);
    
    if (user.role === "SUPERADMIN") {
      const response = await api.get<any>("/api/organizations/", token).catch(() => []);
      const orgsList = Array.isArray(response) ? response : (response?.results || []);
      return { orgs: orgsList };
    }

    if (user.organization_id) {
      try {
        const org = await api.get<any>(`/api/organizations/${user.organization_id}/`, token);
        return { orgs: [org] };
      } catch {
        return { orgs: [] };
      }
    }
  } catch (error) {
    return { orgs: [] };
  }

  return { orgs: [] };
}

export async function action({ request }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  if (!token) throw new Response("Unauthorized", { status: 401 });

  try {
    const user = await api.get<any>(`/api/auth/me/`, token);
    if (user.role !== "SUPERADMIN") {
      throw new Response("Forbidden", { status: 403 });
    }
  } catch (err: any) {
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
  const context = useOutletContext<any>();
  const user = context?.user;

  if (!user) {
    return <div className="p-8 text-center">Loading user profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
        {user.role === "SUPERADMIN" && (
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
