     1|import { useLoaderData, redirect, useState } from "react-router";
     2|import type { Route } from "./+types/chat";
     3|import { requireUser } from "~/.server/sessions";
     4|import { Send, Bot, User as UserIcon, Loader2 } from "lucide-react";
     5|
     6|export async function loader({ request }: Route.LoaderArgs) {
     7|  await requireUser(request);
     8|  return { placeholder: "Ask a question about sustainability metrics, compliance, or reporting standards..." };
     9|}
    10|
    11|export default function KnowledgeChatRoute() {
    12|  const { placeholder } = useLoaderData();
    13|  const [messages, setMessages] = useState([
    14|    { role: "assistant" as const, content: "Hi! I can help answer questions about your sustainability data, compliance frameworks, or ESG reporting. What would you like to know?" },
    15|  ]);
    16|  const [input, setInput] = useState("");
    17|  const [loading, setLoading] = useState(false);
    18|
    19|  const send = () => {
    20|    if (!input.trim()) return;
    21|    setMessages((prev) => [...prev, { role: "user", content: input.trim() }]);
    22|    setInput("");
    23|    setLoading(true);
    24|    // Placeholder: would call AI backend here
    25|    setTimeout(() => {
    26|      setMessages((prev) => [
    27|        ...prev,
    28|        { role: "assistant", content: "This is a placeholder response. Connect the AI backend to enable real answers." },
    29|      ]);
    30|      setLoading(false);
    31|    }, 1500);
    32|  };
    33|
    34|  return (
    35|    <div className="flex flex-col h-[calc(100vh-3rem)]">
    36|      <h2 className="text-2xl font-semibold text-foreground mb-4">AI Knowledge Chat</h2>
    37|
    38|      <div className="flex-1 overflow-auto space-y-4 bg-card border border-border rounded-xl p-4 mb-4">
    39|        {messages.map((m: {role: string; content: string}, i: number) => (
    40|          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
    41|            <div className={`flex gap-2 max-w-lg ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
    42|              <div
    43|                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
    44|                  m.role === "user" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
    45|                }`}
    46|              >
    47|                {m.role === "user" ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
    48|              </div>
    49|              <div
    50|                className={`px-4 py-3 rounded-xl text-sm ${
    51|                  m.role === "user"
    52|                    ? "bg-primary text-primary-foreground"
    53|                    : "bg-muted text-foreground"
    54|                }`}
    55|              >
    56|                {m.content}
    57|              </div>
    58|            </div>
    59|          </div>
    60|        ))}
    61|        {loading && (
    62|          <div className="flex gap-2 text-muted-foreground text-sm">
    63|            <Loader2 className="w-4 h-4 animate-spin" />
    64|            Thinking...
    65|          </div>
    66|        )}
    67|      </div>
    68|
    69|      <div className="flex gap-2">
    70|        <input
    71|          className="flex-1 px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
    72|          placeholder={placeholder}
    73|          value={input}
    74|          onChange={(e) => setInput(e.target.value)}
    75|          onKeyDown={(e) => e.key === "Enter" && send()}
    76|        />
    77|        <button
    78|          onClick={send}
    79|          disabled={loading || !input.trim()}
    80|          className="px-5 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
    81|        >
    82|          <Send className="w-5 h-5" />
    83|        </button>
    84|      </div>
    85|    </div>
    86|  );
    87|}
    88|