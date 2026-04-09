import { useLoaderData, Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const { orgId } = params;

  if (user.role !== "ADMIN" && String(user.organization_id) !== String(orgId)) {
    throw new Response("Access denied", { status: 403 });
  }

  const assessments = await api.get<any>(`/api/organizations/${orgId}/assessments/`, token)
    .then(res => Array.isArray(res) ? res : (res?.results || []))
    .catch(() => []);

  return { assessments, orgId, user };
}

export default function OrganizationAssessments() {
  const { assessments, orgId } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Organization Assessments</h1>
      </div>
      <div className="grid gap-4">
        {assessments.length === 0 ? (
          <p className="text-muted-foreground">No assessments found.</p>
        ) : (
          assessments.map((a: any) => (
            <div key={a.id} className="p-4 border rounded-lg flex justify-between items-center">
              <span>{a.name}</span>
              <Link to={`/organizations/${orgId}/assessments/${a.id}/questionnaire`} className="text-primary font-medium">
                View Questionnaire →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
