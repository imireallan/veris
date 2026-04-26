import { useEffect, useMemo, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { Languages, RotateCcw, Save } from "lucide-react";

import { Alert, AlertDescription, Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "~/components/ui";
import { useFetcherToast } from "~/hooks/use-fetcher-toast";
import { useToast } from "~/hooks/use-toast";
import { DEFAULT_TERMINOLOGY } from "~/lib/terminology";
import type { OrganizationTerminology } from "~/types";
import { RBAC } from "~/types/rbac";

type TerminologyLabelKey =
  | "assessment_label"
  | "site_label"
  | "task_label"
  | "evidence_label"
  | "report_label";

const TERMINOLOGY_FIELDS: Array<{
  name: TerminologyLabelKey;
  label: string;
  description: string;
  placeholder: string;
}> = [
  {
    name: "assessment_label",
    label: "Assessment label",
    description: "Primary assessment/audit/review object.",
    placeholder: "Assessment",
  },
  {
    name: "site_label",
    label: "Site label",
    description: "Operating location, facility, supplier site, or mine.",
    placeholder: "Site",
  },
  {
    name: "task_label",
    label: "Task label",
    description: "Follow-up work item or corrective action.",
    placeholder: "Task",
  },
  {
    name: "evidence_label",
    label: "Evidence label",
    description: "Supporting documents, files, or proof uploaded by users.",
    placeholder: "Evidence",
  },
  {
    name: "report_label",
    label: "Report label",
    description: "Generated output, scorecard, or findings report.",
    placeholder: "Report",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireUser, getUserToken } = await import("~/.server/sessions");
  const { api } = await import("~/.server/lib/api");

  const user = await requireUser(request);
  const token = await getUserToken(request);
  const selectedOrg = user.activeOrganization ?? null;

  if (!selectedOrg) {
    throw redirect("/organizations");
  }

  if (!RBAC.canManageOrg(user, selectedOrg.id)) {
    throw redirect("/app");
  }

  try {
    const terminology = await api.withOrganization.get<OrganizationTerminology>(
      `/api/organizations/${selectedOrg.id}/terminology`,
      selectedOrg.id,
      token,
      request,
    );

    return data({
      terminology: { ...DEFAULT_TERMINOLOGY, ...terminology },
      orgId: selectedOrg.id,
      orgName: selectedOrg.name,
    });
  } catch {
    return data({
      terminology: DEFAULT_TERMINOLOGY,
      orgId: selectedOrg.id,
      orgName: selectedOrg.name,
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireUser, getUserToken } = await import("~/.server/sessions");
  const { api } = await import("~/.server/lib/api");

  const token = await getUserToken(request);
  const user = await requireUser(request);
  const selectedOrg = user.activeOrganization ?? null;

  if (!selectedOrg) {
    return data({ success: false, error: "Organization required" }, { status: 400 });
  }

  if (!RBAC.canManageOrg(user, selectedOrg.id)) {
    return data({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const formData = await request.formData();
  const terminologyData: Partial<OrganizationTerminology> = {};

  for (const field of TERMINOLOGY_FIELDS) {
    const value = formData.get(field.name);
    if (typeof value === "string") {
      terminologyData[field.name] = value.trim() || DEFAULT_TERMINOLOGY[field.name];
    }
  }

  try {
    const terminology = await api.withOrganization.put<OrganizationTerminology>(
      `/api/organizations/${selectedOrg.id}/terminology`,
      terminologyData,
      selectedOrg.id,
      token,
      request,
    );

    return {
      success: true,
      message: "Terminology updated",
      terminology,
    };
  } catch (error: any) {
    if (error.status === 401 || error instanceof Response) {
      throw error;
    }
    return {
      success: false,
      error: error.message || "Failed to save terminology",
    };
  }
}

export default function TerminologySettingsRoute() {
  const { terminology, orgName } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const { success, error } = useToast();
  const { handleFetcherResult } = useFetcherToast();
  const [draft, setDraft] = useState<OrganizationTerminology>(terminology);

  useEffect(() => {
    if (fetcher.data && "terminology" in fetcher.data && fetcher.data.terminology) {
      setDraft({ ...DEFAULT_TERMINOLOGY, ...fetcher.data.terminology });
    }
  }, [fetcher.data]);

  useEffect(() => {
    handleFetcherResult(fetcher, {
      success: (result: any) => success("Terminology saved", result.message),
      error: (result: any) => error("Save failed", result.error),
    });
  }, [fetcher, handleFetcherResult, success, error]);

  const preview = useMemo(() => {
    const value = { ...DEFAULT_TERMINOLOGY, ...draft };
    return [
      `${value.assessment_label} dashboard`,
      `${value.site_label} overview`,
      `${value.task_label} list`,
      `${value.evidence_label} uploads`,
      `${value.report_label} exports`,
    ];
  }, [draft]);

  const isSubmitting = fetcher.state !== "idle";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Languages className="h-4 w-4" />
            Organization settings
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Terminology</h1>
          <p className="text-sm text-muted-foreground">
            Customize the product vocabulary for {orgName}. These labels are stored per organization.
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          This controls tenant-specific UI language. Keep labels short and singular; the app can compose them into navigation,
          forms, and dashboard copy.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Labels</CardTitle>
          </CardHeader>
          <CardContent>
            <fetcher.Form method="post" className="space-y-5">
              {TERMINOLOGY_FIELDS.map((field) => (
                <div key={field.name} className="grid gap-2">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={draft[field.name] ?? ""}
                    placeholder={field.placeholder}
                    maxLength={100}
                    onChange={(event) => {
                      setDraft((current) => ({
                        ...current,
                        [field.name]: event.target.value,
                      }));
                    }}
                  />
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                </div>
              ))}

              <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraft(DEFAULT_TERMINOLOGY)}
                  disabled={isSubmitting}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset defaults
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Saving…" : "Save terminology"}
                </Button>
              </div>
            </fetcher.Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {preview.map((item) => (
              <div key={item} className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
