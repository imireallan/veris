import {
  Form,
  useLoaderData,
  useFetcher,
  useActionData,
  useNavigation,
} from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api, API_URL } from "~/.server/lib/api";
import { uploadFile } from "~/.server/lib/uploads";
import { useState, useRef, useEffect } from "react";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/components/ui";
import { RBAC } from "~/types/rbac";

/* ─────────────── Types ─────────────── */

interface PreviewResponse {
  framework_name: string;
  framework_version: string;
  framework_description: string;
  create_template: boolean;
  detected_structure: {
    principles: number;
    categories: number;
    provisions: number;
  };
  total_principles: number;
  total_categories: number;
  total_provisions: number;
  is_valid: boolean;
  validation_errors: string[];
  temp_file_path: string;
}

/* ─────────────── Loader ─────────────── */

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const orgId = params.orgId;

  const userRole = RBAC.getOrgRole(user, orgId!);
  const isAdmin = userRole === "ADMIN" || user.isSuperuser;

  if (!isAdmin) {
    return {
      user,
      orgId,
      accessDenied: true,
      recentJobs: [],
    };
  }

  const response = await api
    .get<any>("/api/frameworks/import/", token, request)
    .catch(() => ({ results: [] }));

  const recentJobs = Array.isArray(response) ? response : response?.results || [];

  return {
    user,
    orgId,
    accessDenied: false,
    recentJobs: recentJobs.slice(0, 5),
  };
}

/* ─────────────── Action ─────────────── */

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const orgId = params.orgId;

  if (intent === "preview-file") {
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return data({ error: "No valid file uploaded" }, { status: 400 });
    }

    try {
      const previewData = await uploadFile<PreviewResponse>(
        file,
        `${API_URL}/api/frameworks/import/preview/`,
        {
          token,
          organizationId: orgId!,
        },
      );

      return {
        success: true,
        step: 2,
        preview: previewData,
      };
    } catch (err: any) {
      return data(
        { error: err.message ?? "Failed to preview file" },
        { status: 500 },
      );
    }
  }

  if (intent === "submit-import") {
    const frameworkName = formData.get("framework_name") as string;
    const frameworkVersion = formData.get("framework_version") as string;
    const frameworkDescription = formData.get("framework_description") as string;
    const createTemplate = formData.get("create_template") === "true";
    const tempFilePath = formData.get("temp_file_path") as string;

    if (!tempFilePath) {
      return data({ error: "No file path from preview step" }, { status: 400 });
    }

    try {
      const response = await api.post<any>(
        "/api/frameworks/import/create/",
        {
          framework_name: frameworkName,
          framework_version: frameworkVersion || "1.0.0",
          framework_description: frameworkDescription,
          create_template: createTemplate,
          temp_file_path: tempFilePath,
        },
        token,
        request,
      );

      if (response.id) {
        return redirect(`/organizations/${orgId}/frameworks/import/${response.id}`);
      }

      return data({ error: "Import failed to start" }, { status: 500 });
    } catch (err: any) {
      const message =
        err.body?.error ||
        err.body?.detail ||
        err.message ||
        "Failed to submit import";

      return data({ error: message }, { status: 500 });
    }
  }

  return data({ error: "Unknown intent" }, { status: 400 });
}

/* ─────────────── Component ─────────────── */

export default function FrameworkImportRoute() {
  const { orgId, accessDenied, recentJobs } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const previewFetcher = useFetcher();

  const [step, setStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [importConfig, setImportConfig] = useState({
    framework_name: "",
    framework_version: "1.0.0",
    framework_description: "",
    create_template: true,
  });
  const [previewError, setPreviewError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (previewFetcher.data && previewFetcher.state === "idle") {
      if ("error" in previewFetcher.data && previewFetcher.data.error) {
        setPreviewError(previewFetcher.data.error);
        return;
      }

      if ("success" in previewFetcher.data && previewFetcher.data.success) {
        const previewData = previewFetcher.data.preview;

        setPreview(previewData);
        setStep(2);
        setImportConfig((prev) => ({
          ...prev,
          framework_name: previewData.framework_name,
          framework_description: previewData.framework_description,
          create_template: previewData.create_template ?? true,
        }));
        setPreviewError(null);
      }
    }
  }, [previewFetcher.data, previewFetcher.state]);

  if (accessDenied) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-medium">Access Denied</h2>
        <p className="text-muted-foreground">
          Only organization administrators can import frameworks.
        </p>
        <a
          href={`/organizations/${orgId}`}
          className="text-primary hover:underline"
        >
          &larr; Back to organization
        </a>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setUploadedFile(file);
      setPreviewError(null);
    }
  };

  const handleUpload = () => {
    if (!uploadedFile) return;

    const formData = new FormData();
    formData.append("intent", "preview-file");
    formData.append("file", uploadedFile, uploadedFile.name);

    previewFetcher.submit(formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  };

  const isUploading =
    previewFetcher.state === "submitting" || previewFetcher.state === "loading";

  const isImporting =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "submit-import";

  const error =
    previewError ||
    (actionData && "error" in actionData ? actionData.error : null);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Import Framework</h1>
          <p className="text-muted-foreground">
            Upload Excel/CSV to create a new framework with questions
          </p>
        </div>

        <a
          href={`/organizations/${orgId}`}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          &larr; Back to organization
        </a>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        {[
          { num: 1, label: "Upload" },
          { num: 2, label: "Preview" },
          { num: 3, label: "Import" },
        ].map((s) => (
          <div key={s.num} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                step >= s.num
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
            </div>

            <span
              className={`ml-2 text-sm ${
                step >= s.num
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>

            {s.num < 3 && (
              <div
                className={`w-16 h-0.5 mx-4 ${
                  step > s.num ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Upload Framework File</CardTitle>
            <CardDescription>
              Drag &amp; drop or select an Excel/CSV file with your framework
              structure
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div
              className="border-2 border-dashed border-primary/50 rounded-lg p-12 text-center bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto text-primary mb-4" />

              <p className="text-lg font-medium mb-2">
                {uploadedFile
                  ? uploadedFile.name
                  : "Drop file here or click to browse"}
              </p>

              <p className="text-sm text-muted-foreground">
                Supported: .xlsx, .xls, .csv (max 10MB)
              </p>

              <input
                ref={fileInputRef}
                type="file"
                name="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="flex items-center justify-between">
              <a
                href="/templates/framework-import-template.xlsx"
                className="text-sm text-primary hover:underline flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download template format
              </a>

              <Button
                onClick={handleUpload}
                disabled={!uploadedFile || isUploading}
              >
                {isUploading ? "Uploading..." : "Next: Preview"}
              </Button>
            </div>

            {recentJobs && recentJobs.length > 0 && (
              <div className="pt-6 border-t">
                <h3 className="text-sm font-medium mb-3">Recent Imports</h3>

                <div className="space-y-2">
                  {recentJobs.map((job: any) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {job.framework_name}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {new Date(job.created_at).toLocaleDateString()} &bull;{" "}
                          {job.questions_created} questions
                        </p>
                      </div>

                      <Badge
                        variant={
                          job.status === "COMPLETED"
                            ? "default"
                            : job.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview & Configure */}
      {step === 2 && preview && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Preview &amp; Configure</CardTitle>
            <CardDescription>
              Review detected structure and configure import settings
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-primary/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">
                  {preview.total_principles}
                </p>
                <p className="text-sm text-muted-foreground">Principles</p>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">
                  {preview.total_categories}
                </p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">
                  {preview.total_provisions}
                </p>
                <p className="text-sm text-muted-foreground">
                  Provisions/Questions
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Framework Name
                </label>
                <input
                  type="text"
                  value={importConfig.framework_name}
                  onChange={(e) =>
                    setImportConfig({
                      ...importConfig,
                      framework_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Version
                  </label>
                  <input
                    type="text"
                    value={importConfig.framework_version}
                    onChange={(e) =>
                      setImportConfig({
                        ...importConfig,
                        framework_version: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={importConfig.framework_description}
                  onChange={(e) =>
                    setImportConfig({
                      ...importConfig,
                      framework_description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="create_template"
                  checked={importConfig.create_template}
                  onChange={(e) =>
                    setImportConfig({
                      ...importConfig,
                      create_template: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="create_template" className="text-sm">
                  Create assessment template from this framework
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(1)}>
                &larr; Back
              </Button>

              <Form method="post">
                <input type="hidden" name="intent" value="submit-import" />
                <input
                  type="hidden"
                  name="framework_name"
                  value={importConfig.framework_name}
                />
                <input
                  type="hidden"
                  name="framework_version"
                  value={importConfig.framework_version}
                />
                <input
                  type="hidden"
                  name="framework_description"
                  value={importConfig.framework_description}
                />
                <input
                  type="hidden"
                  name="create_template"
                  value={String(importConfig.create_template)}
                />
                <input
                  type="hidden"
                  name="temp_file_path"
                  value={preview.temp_file_path}
                />

                <Button type="submit" disabled={isImporting}>
                  {isImporting ? "Importing..." : "Start Import"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Form>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}