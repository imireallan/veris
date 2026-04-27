import { useLoaderData, Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { FileText, Upload, Plus, Eye, Edit } from "lucide-react";
import { Card, CardContent, Button, Badge } from "~/components/ui";
import { RBAC } from "~/types/rbac";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const orgId = params.orgId;

  // Check RBAC - must be org member
  const isMember = RBAC.isOrgMember(user, orgId!);
  if (!isMember) {
    return { frameworks: [], orgId, user, accessDenied: true };
  }

  const response = await api.get<any>(`/api/frameworks/`, token, request)
    .catch(() => []);
  const frameworks = Array.isArray(response) ? response : response?.results || [];

  return { frameworks, orgId, user, accessDenied: false };
}

export default function FrameworksRoute() {
  const { frameworks, orgId, user, accessDenied } = useLoaderData<typeof loader>();

  if (accessDenied) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-medium">Access Denied</h2>
        <p className="text-muted-foreground">You don't have access to this organization's frameworks.</p>
        <Link to="/organizations" className="text-primary hover:underline">
          ← Back to organizations
        </Link>
      </div>
    );
  }

  const canManageTemplates = RBAC.canManageTemplates(user, orgId);
  const canImportFrameworks = RBAC.hasPermission(user, "template:create") || user.isSuperuser;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Frameworks</h1>
          <p className="text-muted-foreground">
            External ESG standards and compliance frameworks
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canImportFrameworks && (
            <Link to={`/organizations/${orgId}/frameworks/import`}>
              <Button size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                Import Framework
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{frameworks.length}</p>
                <p className="text-sm text-muted-foreground">Total Frameworks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Framework List */}
      <div className="grid gap-4">
        {frameworks.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No frameworks yet</h3>
            <p className="text-muted-foreground mb-4">
              Import a framework to get started with standardized assessments
            </p>
            {canImportFrameworks && (
              <Link to={`/organizations/${orgId}/frameworks/import`}>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Framework
                </Button>
              </Link>
            )}
          </div>
        ) : (
          frameworks.map((framework: any) => (
            <Card key={framework.id} className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{framework.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        v{framework.version || "1.0"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {framework.description || "No description provided"}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {framework.categories?.principles?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {framework.categories.principles.length} Principles
                        </span>
                      )}
                      {framework.categories?.provisions_count && (
                        <span>
                          {framework.categories.provisions_count} Provisions
                        </span>
                      )}
                      {framework.last_synced && (
                        <span>
                          Last synced: {new Date(framework.last_synced).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to={`/organizations/${orgId}/frameworks/${framework.slug || framework.id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </Link>
                    {canManageTemplates && framework.templates?.length > 0 && (
                      <Link to={`/organizations/${orgId}/templates`} className="inline-flex">
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Edit className="w-4 h-4" />
                          Edit Template
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
