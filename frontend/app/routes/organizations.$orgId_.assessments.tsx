import { useLoaderData, Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { Badge, Card, CardContent, EmptyState, Button } from "~/components/ui";
import { FileText, Plus } from "lucide-react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = getUserToken(request);
  const orgId = params.orgId;

  const [org, assessments] = await Promise.all([
    api.get<any>(`/api/organizations/${orgId}/`, token),
    api.get<any[]>(`/api/organizations/${orgId}/assessments/`, token).catch(() => []),
  ]);

  return { org, assessments: assessments || [] };
}

export default function OrganizationAssessmentsRoute() {
  const { org, assessments } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
            <Badge variant="secondary">{org.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {assessments.length} assessment{assessments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/assessments/new?organization=${org.id}`}>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              New Assessment
            </Button>
          </Link>
        </div>
      </div>

      {assessments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assessments yet"
          description="Create your first assessment to get started."
          action={
            <Link to={`/assessments/new?organization=${org.id}`}>
              <Button>
                <Plus className="w-4 h-4 mr-1.5" />
                Create Assessment
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {assessments.map((a: any) => (
            <Link to={`/assessments/${a.id}`} key={a.id}>
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {a.title || `Assessment ${a.id?.slice(0, 8) ?? ""}`}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {a.start_date
                          ? `Started ${new Date(a.start_date).toLocaleDateString()}`
                          : "No start date set"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {a.overall_score != null && (
                        <span className="text-sm font-medium">{a.overall_score}%</span>
                      )}
                      <Badge
                        variant={
                          a.status === "COMPLETED"
                            ? "default"
                            : a.status === "IN_PROGRESS"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {a.status?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
