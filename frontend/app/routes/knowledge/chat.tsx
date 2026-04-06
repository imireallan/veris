import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { useState } from "react";
import { requireUser } from "~/.server/sessions";
import { Send, Bot, User as UserIcon, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  return { placeholder: "Ask a question about sustainability metrics, compliance, or reporting standards..." };
}

export default function KnowledgeChatRoute() {
  const { placeholder } = useLoaderData<typeof loader>();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I can help answer questions about your sustainability data, compliance frameworks, or ESG reporting. What would you like to know?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input.trim() }]);
    setInput("");
    setLoading(true);
    // Placeholder: would call AI backend here
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "This is a placeholder response. Connect the AI backend to enable real answers." },
      ]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <h2 className="text-2xl font-semibold text-foreground mb-4">AI Knowledge Chat</h2>

      <div className="flex-1 overflow-auto space-y-4 bg-card border border-border rounded-xl p-4 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-2 max-w-lg ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.role === "user" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                }`}
              >
                {m.role === "user" ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`px-4 py-3 rounded-xl text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Thinking...
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-5 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

