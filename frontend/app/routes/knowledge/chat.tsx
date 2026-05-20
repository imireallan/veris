import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Link, useFetcher, useLoaderData } from "react-router";
import { useEffect, useRef, useState } from "react";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import { Send, Bot, User as UserIcon, Loader2, AlertCircle, ArrowLeft, FileText } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  confidence?: number;
}

interface Source {
  document_id: string;
  title: string;
  chunk_index: number;
  score: number;
  text_preview: string;
}

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
    : [];
  const documentList = Array.isArray(documents) ? documents : (documents as any)?.results ?? [];
  const indexedDocumentCount = documentList.filter((document: any) => document.embeddings_indexed).length;

  return {
    placeholder: "Ask about indexed policies, standards, evidence, or assessment requirements...",
    indexedDocumentCount,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const orgId = await resolveKnowledgeOrganizationId(request, token, user);
  const formData = await request.formData();
  const query = String(formData.get("query") ?? "").trim();

  if (!query) {
    return { error: "Enter a question first." };
  }

  if (!orgId) {
    return { error: "Select an organization before asking knowledge questions." };
  }

  try {
    const result = await api.withOrganization.post<{
      answer: string;
      sources: Source[];
      confidence: number;
    }>("/api/documents/chat/", { query }, orgId, token, request);

    return { success: true, query, ...result };
  } catch (err: any) {
    const message = err?.body?.error ?? err?.body?.detail ?? err.message ?? "Knowledge chat failed";
    return { error: message, query };
  }
}

export default function KnowledgeChatRoute() {
  const { placeholder, indexedDocumentCount } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Ask me about processed knowledge documents. I’ll search indexed evidence and return the strongest matching sources.",
    },
  ]);
  const [input, setInput] = useState("");
  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSubmitting]);

  useEffect(() => {
    const data = fetcher.data;
    if (fetcher.state !== "idle" || !data) return;

    if ("success" in data && data.success && "answer" in data) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
          confidence: data.confidence,
        },
      ]);
      return;
    }

    if ("error" in data && data.error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `I couldn't answer that: ${data.error}` },
      ]);
    }
  }, [fetcher.data, fetcher.state]);

  function handleSubmit(formData: FormData) {
    const query = String(formData.get("query") ?? "").trim();
    if (!query || isSubmitting) return;

    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setInput("");
    fetcher.submit(formData, { method: "post" });
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <Link to="/knowledge" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Knowledge Library
          </Link>
          <h2 className="text-2xl font-semibold text-foreground">AI Knowledge Chat</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Searches processed documents only. {indexedDocumentCount} indexed document{indexedDocumentCount === 1 ? "" : "s"} available.
          </p>
        </div>
      </div>

      {indexedDocumentCount === 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Process at least one document in the Knowledge Library before expecting useful answers.</span>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="mb-4 flex-1 space-y-4 overflow-auto rounded-xl border border-border bg-card p-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex max-w-3xl gap-2 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  message.role === "user" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {message.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
                    <div className="text-xs font-medium text-muted-foreground">
                      Sources · confidence {Math.round((message.confidence ?? 0) * 100)}%
                    </div>
                    {message.sources.map((source, sourceIndex) => (
                      <div key={`${source.document_id}-${source.chunk_index}-${sourceIndex}`} className="rounded-lg bg-background/70 p-2 text-xs">
                        <div className="mb-1 flex items-center gap-1 font-medium text-foreground">
                          <FileText className="h-3 w-3" />
                          {source.title}
                          <span className="text-muted-foreground">· score {Math.round(source.score * 100)}%</span>
                        </div>
                        <p className="text-muted-foreground">{source.text_preview}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isSubmitting && (
          <div className="flex gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching indexed evidence...
          </div>
        )}
      </div>

      <fetcher.Form
        method="post"
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit(new FormData(event.currentTarget));
        }}
      >
        <input
          name="query"
          className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder={placeholder}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !input.trim()}
          className="rounded-xl bg-primary px-5 py-3 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          aria-label="Send question"
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </fetcher.Form>
    </div>
  );
}
