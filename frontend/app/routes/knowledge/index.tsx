import { useState, useRef } from "react";
import { useLoaderData, redirect, Link, Form, useNavigation } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { BookOpen, FileText, MessageSquare, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button, Badge, Card, CardContent } from "~/components/ui";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  const token = await getUserToken(request);
  
  const documents = await api.get<any[]>("/api/documents/", token, request).catch(() => []);
  
  return {
    documents: Array.isArray(documents) ? documents : (documents as any)?.results ?? [],
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const token = await getUserToken(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  
  if (intent === "upload-document") {
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const fileType = formData.get("fileType") as string;
    
    try {
      // First upload the file
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      
      const uploadResponse = await fetch("/api/upload-evidence/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });
      
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        return { error: `Upload failed: ${error.error}` };
      }
      
      const uploadData = await uploadResponse.json();
      
      // Then create KnowledgeDocument record
      await api.post("/api/documents/", {
        title: title || file.name,
        description: "",
        file_url: uploadData.url,
        file_type: fileType || "PDF",
        file_size: uploadData.file_size,
        category: category || "General",
        framework_tags: [],
      }, token, request);
      
      return redirect("/knowledge");
    } catch (err: any) {
      if (err instanceof Response && err.status === 302) throw err;
      return { error: err.message ?? "Upload failed" };
    }
  }
  
  if (intent === "process-document") {
    const docId = formData.get("document_id") as string;
    try {
      await api.post(`/api/documents/${docId}/process/`, {}, token, request);
      return redirect("/knowledge");
    } catch (err: any) {
      if (err instanceof Response && err.status === 302) throw err;
      return { error: err.message ?? "Processing failed" };
    }
  }
  
  return { error: "Unknown intent" };
}

function UploadDocumentForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigation = useNavigation();
  const isUploading = navigation.state === "submitting" && navigation.formData?.get("intent") === "upload-document";

  return (
    <Form method="post" encType="multipart/form-data" className="space-y-3">
      <input type="hidden" name="intent" value="upload-document" />
      
      <div className="grid gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">File</label>
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            required
            className="w-full text-sm"
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
          />
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

export default function KnowledgeRoute() {
  const { documents } = useLoaderData<typeof loader>();
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

      {documents.length === 0 ? (
        <div className="text-center py-12 bg-muted rounded-lg border-2 border-dashed">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No documents uploaded yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Upload a document to get started with AI validation.</p>
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
                      {!d.embeddings_indexed && (
                        <Form method="post">
                          <input type="hidden" name="intent" value="process-document" />
                          <input type="hidden" name="document_id" value={d.id} />
                          <Button type="submit" variant="outline" size="sm" className="h-7 px-2 text-xs">
                            <Loader2 className="w-3 h-3 mr-1" />
                            Process
                          </Button>
                        </Form>
                      )}
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
