import { useLoaderData, Form, redirect, useNavigation, useActionData } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { useState, useRef, useEffect } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, ArrowRight, Download } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Button, 
  Badge,
  Progress,
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/components/ui";
import { RBAC } from "~/types/rbac";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const orgId = params.orgId;

  // Check RBAC - only ADMIN can import frameworks
  const isAdmin = RBAC.hasRole(user, orgId!, "ADMIN");
  if (!isAdmin && !user.is_superuser) {
    return { 
      user, 
      orgId, 
      accessDenied: true,
      recentJobs: []
    };
  }

  // Fetch recent import jobs
  const response = await api.get<any>(
    `/api/frameworks/import/`,
    token,
    request
  ).catch(() => ({ results: [] }));
  
  const recentJobs = Array.isArray(response) ? response : (response?.results || []);

  return { 
    user, 
    orgId, 
    accessDenied: false,
    recentJobs: recentJobs.slice(0, 5) // Last 5 jobs
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const orgId = params.orgId;

  if (intent === "preview-file") {
    const file = formData.get("file") as File;
    if (!file) {
      return { error: "No file uploaded" };
    }

    try {
      // Upload file for preview
      const previewFormData = new FormData();
      previewFormData.append("file", file);
      
      const response = await fetch(`${process.env.BACKEND_URL || "http://localhost:8000"}/api/frameworks/import/preview/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Organization-ID": orgId!,
        },
        body: previewFormData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Upload failed" }));
        return { error: error.error || "Failed to preview file" };
      }

      const previewData = await response.json();
      return { 
        success: true, 
        step: 2, 
        preview: previewData,
        tempFilePath: previewData.temp_file_path 
      };
    } catch (err: any) {
      return { error: err.message ?? "Failed to preview file" };
    }
  }

  if (intent === "submit-import") {
    const importData = JSON.parse(formData.get("import_data") as string);
    
    try {
      const response = await api.post(
        `/api/frameworks/import/`,
        importData,
        token,
        request
      );

      if (response.id) {
        return redirect(`/organizations/${orgId}/frameworks/import/${response.id}`);
      }

      return { error: "Import failed to start" };
    } catch (err: any) {
      return { error: err.message ?? "Failed to submit import" };
    }
  }

  return { error: "Unknown intent" };
}

export default function FrameworkImportRoute() {
  const { user, orgId, accessDenied, recentJobs } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [importConfig, setImportConfig] = useState({
    framework_name: "",
    framework_version: "1.0.0",
    framework_description: "",
    create_template: true,
  });
  const [error, setError] = useState<string | null>(null);

  // Handle action results
  useEffect(() => {
    if (actionData) {
      if ("error" in actionData && actionData.error) {
        setError(actionData.error);
      }
      if ("success" in actionData && actionData.success) {
        setStep(actionData.step);
        if (actionData.preview) {
          setPreview(actionData.preview);
          setImportConfig(prev => ({
            ...prev,
            framework_name: actionData.preview.framework_name,
            framework_description: actionData.preview.framework_description,
          }));
        }
        setError(null);
      }
    }
  }, [actionData]);

  if (accessDenied) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-medium">Access Denied</h2>
        <p className="text-muted-foreground">
          Only organization administrators can import frameworks.
        </p>
        <a href={`/organizations/${orgId}`} className="text-primary hover:underline">
          ← Back to organization
        </a>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setError(null);
    }
  };

  const handleUpload = () => {
    if (!uploadedFile || !fileInputRef.current) return;
    
    const formData = new FormData();
    formData.append("intent", "preview-file");
    formData.append("file", uploadedFile);
    
    // Submit via form to trigger action
    fileInputRef.current.form?.requestSubmit();
  };

  const handleSubmitImport = () => {
    const formData = new FormData();
    formData.append("intent", "submit-import");
    formData.append(
      "import_data",
      JSON.stringify({
        temp_file_path: preview.temp_file_path,
        framework_name: importConfig.framework_name,
        framework_version: importConfig.framework_version,
        framework_description: importConfig.framework_description,
        create_template: importConfig.create_template,
      })
    );
    
    // Create a temporary form to submit
    const tempForm = document.createElement("form");
    tempForm.method = "post";
    tempForm.appendChild(formData);
    document.body.appendChild(tempForm);
    tempForm.submit();
  };

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
          ← Back to organization
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
                step >= s.num ? "text-foreground font-medium" : "text-muted-foreground"
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
              Drag & drop or select an Excel/CSV file with your framework structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className="border-2 border-dashed border-primary/50 rounded-lg p-12 text-center bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto text-primary mb-4" />
              <p className="text-lg font-medium mb-2">
                {uploadedFile ? uploadedFile.name : "Drop file here or click to browse"}
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
                disabled={!uploadedFile || navigation.state === "submitting"}
              >
                {navigation.state === "submitting" ? "Uploading..." : "Next: Preview"}
              </Button>
            </div>

            {/* Recent Jobs */}
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
                        <p className="text-sm font-medium">{job.framework_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(job.created_at).toLocaleDateString()} •{" "}
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
            <CardTitle>Step 2: Preview & Configure</CardTitle>
            <CardDescription>
              Review detected structure and configure import settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preview Summary */}
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
                <p className="text-sm text-muted-foreground">Provisions/Questions</p>
              </div>
            </div>

            {/* Configuration Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Framework Name
                </label>
                <input
                  type="text"
                  value={importConfig.framework_name}
                  onChange={(e) =>
                    setImportConfig({ ...importConfig, framework_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Version</label>
                  <input
                    type="text"
                    value={importConfig.framework_version}
                    onChange={(e) =>
                      setImportConfig({ ...importConfig, framework_version: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
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
                    setImportConfig({ ...importConfig, create_template: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="create_template" className="text-sm">
                  Create assessment template from this framework
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button onClick={handleSubmitImport} disabled={navigation.state === "submitting"}>
                Start Import <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Processing (redirects to job status page) */}
      {step === 3 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-lg font-medium">Processing import...</p>
            <p className="text-muted-foreground">This may take a few minutes for large files</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
