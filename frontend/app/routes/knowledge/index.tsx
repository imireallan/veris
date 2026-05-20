import { useEffect, useRef, useState } from "react";
import { useActionData, useFetcher, useLoaderData, useRevalidator, redirect, Link, Form, useNavigation } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { BookOpen, FileText, MessageSquare, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button, Badge, Card, CardContent } from "~/components/ui";

async function resolveKnowledgeOrganizationId(request: Request, token: string | null, user: Awaited<ReturnType<typeof requireUser>>) {
  const directOrgId = user.orgId ?? user.activeOrganization?.id ?? null;
  if (directOrgId) return directOrgId;

  if (!user.isSuperuser) return null;

  const { getAccessibleOrganizations } = await import("~/.server/organizations");
  const organizations = await getAccessibleOrganizations(request, token).catch(() => []);
  return organizations[0]?.id ?? null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const orgId = await resolveKnowledgeOrganizationId(request, token, user);
  
  const documents = orgId
    ? await api.withOrganization.get<any[]>("/api/documents/", orgId, token, request).catch(() => [])
    : await api.get<any[]>("/api/documents/", token, request).catch(() => []);
  
  return {
    documents: Array.isArray(documents) ? documents : (documents as any)?.results ?? [],
    orgId,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const orgId = await resolveKnowledgeOrganizationId(request, token, user);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  
  if (intent === "upload-document") {
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const fileType = formData.get("fileType") as string;

    if (!orgId) {
      return { error: "Select an organization before uploading evidence documents." };
    }
    
    try {
      // First upload the file
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      
      const uploadResponse = await api.raw(
        "/api/upload-evidence/",
        {
          method: "POST",
          token,
          organizationId: orgId,
          body: uploadFormData,
        },
        undefined,
        request,
      );
      
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        return { error: `Upload failed: ${error.error}` };
      }
      
      const uploadData = await uploadResponse.json();
      
      // Then create KnowledgeDocument record
      await api.withOrganization.post("/api/documents/", {
        title: title || file.name,
        description: "",
        file_url: uploadData.url,
        file_type: fileType || "PDF",
        file_size: uploadData.file_size,
        category: category || "General",
        framework_tags: [],
      }, orgId, token, request);
      
      return redirect("/knowledge");
    } catch (err: any) {
      if (err instanceof Response && err.status === 302) throw err;
      return { error: err.message ?? "Upload failed" };
    }
  }
  
  if (intent === "process-document") {
    const docId = formData.get("document_id") as string;
    if (!orgId) {
      return { error: "Select an organization before processing evidence documents." };
    }

    try {
      const result = await api.withOrganization.post<any>(`/api/documents/${docId}/process/`, {}, orgId, token, request);
      return {
        success: true,
        message: `Processed document (${result?.chunk_count ?? 0} chunks indexed).`,
        documentId: docId,
        chunkCount: result?.chunk_count ?? 0,
      };
    } catch (err: any) {
      if (err instanceof Response && err.status === 302) throw err;
      const message = err?.body?.error ?? err?.body?.detail ?? err.message ?? "Processing failed";
      return { error: message, documentId: docId };
    }
  }
  
  return { error: "Unknown intent" };
}

function UploadDocumentForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const navigation = useNavigation();
  const isUploading = navigation.state === "submitting" && navigation.formData?.get("intent") === "upload-document";

  return (
    <Form method="post" encType="multipart/form-data" className="space-y-3">
      <input type="hidden" name="intent" value="upload-document" />
      
      <div className="grid gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block" htmlFor="knowledge-document-file">File</label>
          <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-4 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
            <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {selectedFileName ?? "Choose a document to upload"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF, DOC, DOCX, TXT, XLS, or XLSX
            </p>
            <input
              id="knowledge-document-file"
              ref={fileInputRef}
              type="file"
              name="file"
              required
              className="sr-only"
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
              onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Select file
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <input
              type="text"
              name="title"
              placeholder="Document title"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Category</label>
            <select
              name="category"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              defaultValue="General"
            >
              <option value="General">General</option>
              <option value="Policy">Policy</option>
              <option value="Report">Report</option>
              <option value="Evidence">Evidence</option>
              <option value="Procedure">Procedure</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">File Type</label>
          <select
            name="fileType"
            className="w-full px-3 py-2 border rounded-lg text-sm"
            defaultValue="PDF"
          >
            <option value="PDF">PDF</option>
            <option value="DOCX">DOCX</option>
            <option value="XLSX">XLSX</option>
            <option value="TXT">TXT</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        
        <Button type="submit" disabled={isUploading} className="w-full">
          {isUploading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
          ) : (
            <><Upload className="w-4 h-4 mr-2" /> Upload Document</>
          )}
        </Button>
      </div>
    </Form>
  );
}

function ProcessDocumentButton({ documentId }: { documentId: string }) {
  const fetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();
  const [message, setMessage] = useState<string | null>(null);
  const isProcessing = fetcher.state !== "idle";
  const data = fetcher.data;

  useEffect(() => {
    if (fetcher.state !== "idle" || !data) return;

    if ("success" in data && data.success) {
      setMessage(data.message ?? "Document processed.");
      revalidator.revalidate();
      return;
    }

    if ("error" in data && data.error) {
      setMessage(data.error);
    }
  }, [data, fetcher.state, revalidator]);

  return (
    <div className="flex flex-col items-start gap-1">
      <fetcher.Form method="post">
        <input type="hidden" name="intent" value="process-document" />
        <input type="hidden" name="document_id" value={documentId} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={isProcessing}
          className="h-7 px-2 text-xs"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Loader2 className="w-3 h-3 mr-1" />
              Process
            </>
          )}
        </Button>
      </fetcher.Form>

      {message && (
        <span
          className={`max-w-48 text-xs ${
            data && "success" in data && data.success
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {message}
        </span>
      )}
    </div>
  );
}

export default function KnowledgeRoute() {
  const { documents } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Knowledge Library</h2>
          <p className="text-muted-foreground text-sm mt-1">Browse and manage your sustainability documents.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowUpload(!showUpload)}
          >
            <Upload className="w-4 h-4 mr-2" />
            {showUpload ? "Cancel" : "Upload"}
          </Button>
          <Link
            to="/knowledge/chat"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <MessageSquare className="w-4 h-4" />
            Ask AI
          </Link>
        </div>
      </div>

      {showUpload && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3">Upload Document</h3>
            <UploadDocumentForm />
          </CardContent>
        </Card>
      )}

      {actionData && "error" in actionData && actionData.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{actionData.error}</span>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-12 bg-muted rounded-lg border-2 border-dashed">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No documents uploaded yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Upload a document, then process it so AI evidence checks can search it.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.map((d: any) => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {d.title}
                    {d.description && (
                      <p className="text-xs text-muted-foreground font-normal mt-0.5">{d.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{d.file_type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.category}</td>
                  <td className="px-4 py-3">
                    {d.embeddings_indexed ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Indexed ({d.chunk_count} chunks)
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Not Processed
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!d.embeddings_indexed && <ProcessDocumentButton documentId={d.id} />}
                      {d.file_url && (
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
