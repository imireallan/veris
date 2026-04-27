import { useLoaderData, Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { useEffect, useState } from "react";
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
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  FileText, 
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { RBAC } from "~/types/rbac";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const orgId = params.orgId;
  const jobId = params.jobId;

  // Check permission
  const isAdmin = RBAC.hasRole(user, orgId!, "ADMIN");
  if (!isAdmin && !user.is_superuser) {
    return { 
      user, 
      orgId, 
      jobId,
      accessDenied: true,
      job: null 
    };
  }

  // Fetch job status
  const response = await api.get<any>(
    `/api/frameworks/import/${jobId}/status/`,
    token,
    request
  ).catch(() => null);

  return { 
    user, 
    orgId, 
    jobId,
    accessDenied: false,
    job: response 
  };
}

export default function FrameworkImportJobStatusRoute() {
  const { user, orgId, jobId, accessDenied, job } = useLoaderData<typeof loader>();
  const [jobStatus, setJobStatus] = useState(job);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-poll every 3 seconds if job is still processing
  useEffect(() => {
    if (!jobStatus || jobStatus.status === "COMPLETED" || jobStatus.status === "FAILED") {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const token = await getToken();
        const response = await fetch(`/api/frameworks/import/${jobId}/status/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Organization-ID": orgId!,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setJobStatus(data);
        }
      } catch (err) {
        console.error("Polling failed:", err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [jobStatus, jobId, orgId]);

  // Helper to get token (simplified - in real app, use proper auth context)
  const getToken = async () => {
    // This is a placeholder - in React Router v7, you'd use the proper auth pattern
    return "";
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  if (accessDenied) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-medium">Access Denied</h2>
        <p className="text-muted-foreground">
          Only organization administrators can view import jobs.
        </p>
        <a href={`/organizations/${orgId}`} className="text-primary hover:underline">
          ← Back to organization
        </a>
      </div>
    );
  }

  if (!jobStatus) {
    return (
      <div className="p-8 text-center space-y-4">
        <Loader2 className="w-8 h-8 mx-auto animate-spin" />
        <p>Loading job status...</p>
      </div>
    );
  }

  const isCompleted = jobStatus.status === "COMPLETED";
  const isFailed = jobStatus.status === "FAILED";
  const isProcessing = ["PENDING", "PROCESSING"].includes(jobStatus.status);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Import Status</h1>
          <p className="text-muted-foreground">
            {jobStatus.framework_name} • Started {new Date(jobStatus.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <a
            href={`/organizations/${orgId}`}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Back to organization
          </a>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                {isCompleted && <CheckCircle className="w-5 h-5 mr-2 text-green-600" />}
                {isFailed && <XCircle className="w-5 h-5 mr-2 text-red-600" />}
                {isProcessing && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                {jobStatus.status}
              </CardTitle>
              <CardDescription>
                {jobStatus.current_step || "Waiting to start..."}
              </CardDescription>
            </div>
            <Badge
              variant={
                isCompleted
                  ? "default"
                  : isFailed
                  ? "destructive"
                  : "secondary"
              }
              className="text-sm px-3 py-1"
            >
              {jobStatus.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {jobStatus.processed_items} / {jobStatus.total_items} (
                  {jobStatus.progress_percentage.toFixed(1)}%)
                </span>
              </div>
              <Progress
                value={jobStatus.progress_percentage}
                className="h-2"
              />
            </div>
          )}

          {/* File Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Original File</p>
              <p className="font-medium flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                {jobStatus.original_filename}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Framework</p>
              <p className="font-medium">{jobStatus.framework_name} v{jobStatus.framework_version}</p>
            </div>
          </div>

          {/* Results */}
          {isCompleted && (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Import Complete!</AlertTitle>
                <AlertDescription className="text-green-700">
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Framework created: {jobStatus.framework_name}</li>
                    {jobStatus.template_id && (
                      <li>• Template created with {jobStatus.questions_created} questions</li>
                    )}
                    <li>• Total provisions imported: {jobStatus.questions_created}</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-4 pt-4">
                {jobStatus.template_id && (
                  <a href={`/organizations/${orgId}/templates/${jobStatus.template_id}`}>
                    <Button>
                      View Template <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                )}
                <a href={`/organizations/${orgId}/frameworks/import`}>
                  <Button variant="outline">Import Another Framework</Button>
                </a>
              </div>
            </div>
          )}

          {/* Error */}
          {isFailed && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Import Failed</AlertTitle>
              <AlertDescription className="mt-2">
                <code className="block p-3 bg-muted rounded-md text-sm overflow-auto">
                  {jobStatus.error_message}
                </code>
              </AlertDescription>
              <div className="mt-4">
                <a href={`/organizations/${orgId}/frameworks/import`}>
                  <Button variant="outline">Try Again</Button>
                </a>
              </div>
            </Alert>
          )}

          {/* Processing Steps */}
          {isProcessing && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-medium">Processing Steps</h3>
              <div className="space-y-2 text-sm">
                <StepItem 
                  done={jobStatus.progress_percentage > 10} 
                  label="Parse Excel/CSV file" 
                />
                <StepItem 
                  done={jobStatus.progress_percentage > 30} 
                  label="Create Framework record" 
                />
                <StepItem 
                  done={jobStatus.progress_percentage > 50} 
                  label="Create AssessmentTemplate" 
                />
                <StepItem 
                  done={jobStatus.progress_percentage > 70} 
                  label={`Import provisions as questions (${jobStatus.processed_items}/${jobStatus.total_items})`}
                />
                <StepItem 
                  done={jobStatus.progress_percentage > 90} 
                  label="Generate framework mappings" 
                />
                <StepItem 
                  done={jobStatus.progress_percentage >= 100} 
                  label="Validate hierarchy" 
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StepItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
          done ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
        }`}
      >
        {done ? <CheckCircle className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-current" />}
      </div>
      <span className={done ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}
