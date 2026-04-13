import { useLoaderData, Link, Form, useOutletContext, useNavigate, useActionData } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import type { User } from "~/types";
import { UserRole } from "~/types/rbac";
import { api } from "~/.server/lib/api";
import { Plus } from "lucide-react";
import { Button, Input, Alert } from "~/components/ui";
import { OrganizationCreationModal } from "~/components/OrganizationCreationModal";
import { useOrganizationCreationConfig } from "~/hooks/useOrganizationCreationConfig";
import { useState, useEffect } from "react";
import { useToast } from "~/hooks/use-toast";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);

  if (user.fallbackRole === "SUPERADMIN") {
    const response = await api.get<any>("/api/organizations/", token, request).catch(() => []);
    const orgsList = Array.isArray(response) ? response : (response?.results || []);
    return { orgs: orgsList, token };
  }

  if (user.orgId) {
    try {
      const org = await api.get<any>(`/api/organizations/${user.orgId}/`, token, request);
      return { orgs: [org], token };
    } catch (error) {
      console.error(`Error fetching org ${user.orgId}:`, error);
      return { orgs: [], token };
    }
  }

  return { orgs: [], token };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);

  if (user.role !== UserRole.SUPERADMIN) {
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
    
    await api.post("/api/organizations/", payload, token), request;
    return { success: true, message: "Organization created successfully!" };
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
  const navigate = useNavigate();
  const actionData = useActionData<{ success?: boolean; error?: string; message?: string }>();
  const [modalOpen, setModalOpen] = useState(false);
  const { toast, success, error } = useToast();

  const { config, loading: configLoading } = useOrganizationCreationConfig(token ?? undefined);

  // Show toast feedback from action
  useEffect(() => {
    if (actionData?.success && actionData?.message) {
      success("Success", actionData.message);
      setModalOpen(false);
    } else if (actionData?.error) {
      error("Failed to create organization", actionData.error);
    }
  }, [actionData, success, error]);

  if (!user) {
    return <div className="p-8 text-center">Please sign in to view your organizations.</div>;
  }

  const canCreate = user.fallbackRole === "SUPERADMIN" || config?.can_create;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
        {canCreate && (
          <Button 
            size="sm" 
            className="gap-1"
            onClick={() => setModalOpen(true)}
            disabled={configLoading}
          >
            <Plus className="w-4 h-4" />
            Create
          </Button>
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

      <OrganizationCreationModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            navigate(".", { replace: true });
          }
        }}
        config={config || undefined}
      />
    </div>
  );
}
