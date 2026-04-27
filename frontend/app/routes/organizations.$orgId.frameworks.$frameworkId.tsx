import { useLoaderData, Link, Form } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { ArrowLeft, FileText, Layers, List, Copy, Calendar, Plus } from "lucide-react";
import { Card, CardContent, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui";
import { RBAC } from "~/types/rbac";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const { orgId, frameworkSlug } = params;

  // Check RBAC - must be org member
  const isMember = RBAC.isOrgMember(user, orgId!);
  if (!isMember) {
    return { framework: null, templates: [], orgId, frameworkId: frameworkSlug, user, accessDenied: true };
  }

  // Fetch by slug instead of ID
  const framework = await api.get<any>(`/api/frameworks/${frameworkSlug}/`, token, request)
    .catch(() => null);

  // Get templates linked to this framework
  const allTemplates = await api.get<any>(`/api/templates/`, token, request)
    .catch(() => ({ results: [] }));
  const templates = (Array.isArray(allTemplates) ? allTemplates : allTemplates?.results || [])
    .filter((t: any) => t.framework?.slug === frameworkSlug);

  return { framework, templates, orgId, frameworkId: frameworkSlug, user, accessDenied: false };
}

export default function FrameworkDetailRoute() {
  const { framework, templates, orgId, frameworkId, user, accessDenied } = useLoaderData<typeof loader>();

  if (accessDenied || !framework) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-medium">Framework Not Found</h2>
        <p className="text-muted-foreground">
          {accessDenied 
            ? "You don't have access to this framework."
            : "The framework you're looking for doesn't exist."}
        </p>
        <Link to={`/organizations/${orgId}/frameworks`} className="text-primary hover:underline">
          ← Back to frameworks
        </Link>
      </div>
    );
  }

  const canManageTemplates = RBAC.canManageTemplates(user, orgId);
  const principles = framework.categories?.principles || [];
  const categories = framework.categories?.categories || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/organizations/${orgId}/frameworks`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{framework.name}</h1>
            <Badge variant="outline" className="text-xs">
              v{framework.version || "1.0"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {framework.description || "No description provided"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Layers className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{principles.length}</p>
                <p className="text-sm text-muted-foreground">Principles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <List className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{framework.categories?.provisions_count || 0}</p>
                <p className="text-sm text-muted-foreground">Provisions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Copy className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{templates.length}</p>
                <p className="text-sm text-muted-foreground">Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="structure" className="space-y-4">
        <TabsList>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Structure Tab */}
        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Framework Hierarchy</h3>
              {principles.length === 0 ? (
                <p className="text-muted-foreground text-sm">No structure data available</p>
              ) : (
                <div className="space-y-4">
                  {principles.map((principle: any) => {
                    const principleCategories = categories.filter(
                      (c: any) => c.principle_sequence === principle.sequence
                    );
                    return (
                      <div key={principle.sequence} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-xs">
                            {principle.sequence}
                          </Badge>
                          <h4 className="font-medium">{principle.name}</h4>
                        </div>
                        {principleCategories.length > 0 && (
                          <div className="pl-4 space-y-2">
                            {principleCategories.map((category: any) => (
                              <div key={category.sequence} className="text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Badge variant="outline" className="text-[10px]">
                                    {category.sequence}
                                  </Badge>
                                  <span>{category.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Copy className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">No templates yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create a template from this framework to start assessments
                </p>
                {canManageTemplates && (
                  <Link to={`/organizations/${orgId}/templates/new`}>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Template
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {templates.map((template: any) => (
                <Card key={template.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{template.name}</h3>
                          <Badge variant={template.status === "PUBLISHED" ? "default" : "secondary"}>
                            {template.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {template.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>v{template.version}</span>
                          {template.published_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Published {new Date(template.published_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link to={`/organizations/${orgId}/templates/${template.id}`}>
                        <Button variant="outline" size="sm">
                          {template.status === "DRAFT" ? "Edit" : "View"} Template
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Framework Name</h3>
                <p className="text-base">{framework.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Version</h3>
                <p className="text-base">{framework.version || "1.0.0"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="text-base">{framework.description || "No description"}</p>
              </div>
              {framework.scoring_methodology && Object.keys(framework.scoring_methodology).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Scoring Methodology</h3>
                  <pre className="text-sm bg-muted p-3 rounded-md mt-2 overflow-auto">
                    {JSON.stringify(framework.scoring_methodology, null, 2)}
                  </pre>
                </div>
              )}
              {framework.reporting_period && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Reporting Period</h3>
                  <p className="text-base">{framework.reporting_period}</p>
                </div>
              )}
              {framework.last_synced && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Last Synced</h3>
                  <p className="text-base">{new Date(framework.last_synced).toLocaleString()}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                <p className="text-base">{new Date(framework.created_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
