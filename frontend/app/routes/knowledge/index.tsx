import { useLoaderData, redirect, Link } from "react-router";
import type { Route } from "./+types/knowledge";
import { requireUser } from "~/.server/sessions";
import { BookOpen, FileText, MessageSquare } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return {
    documents: [
      { id: 1, title: "2024 Carbon Footprint Report", type: "Report", date: "2025-01-10" },
      { id: 2, title: "EU Taxonomy Alignment Guide", type: "Guide", date: "2025-01-05" },
      { id: 3, title: "Scope 1 & 2 Emissions Calculation", type: "Workbook", date: "2024-12-20" },
      { id: 4, title: "Supplier ESG Questionnaire", type: "Form", date: "2024-12-15" },
    ],
  };
}

export default function KnowledgeRoute() {
  const { documents } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Knowledge Library</h2>
          <p className="text-muted-foreground text-sm mt-1">Browse and manage your sustainability documents.</p>
        </div>
        <Link
          to="/knowledge/chat"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <MessageSquare className="w-4 h-4" />
          Ask AI
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {documents.map((d) => (
              <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{d.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{d.type}</td>
                <td className="px-4 py-3 text-muted-foreground">{d.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
