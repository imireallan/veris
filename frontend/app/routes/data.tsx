import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/api";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  const token = getUserToken(request);
  const [findings, sites, reports, cipCycles, plans, frameworks, orgs] =
    await Promise.all([
      api.get("/api/findings/", token).catch(() => ({ count: 0, results: [] })),
      api.get("/api/sites/", token).catch(() => ({ count: 0, results: [] })),
      api.get("/api/reports/", token).catch(() => ({ count: 0, results: [] })),
      api.get("/api/cip-cycles/", token).catch(() => ({ count: 0, results: [] })),
      api.get("/api/plans/", token).catch(() => ({ count: 0, results: [] })),
      api.get("/api/frameworks/", token).catch(() => ({ count: 0, results: [] })),
      api.get("/api/organizations/", token).catch(() => ({ count: 0, results: [] })),
    ]);

  return { findings, sites, reports, cipCycles, plans, frameworks, orgs };
}

const TABS = [
  { key: "findings", label: "Findings", icon: "⚠", color: "border-red-500" },
  { key: "sites", label: "Sites", icon: "📍", color: "border-orange-500" },
  { key: "reports", label: "Reports", icon: "📄", color: "border-blue-500" },
  { key: "cipCycles", label: "CIP Cycles", icon: "🔄", color: "border-green-500" },
  { key: "plans", label: "Assess. Plans", icon: "📅", color: "border-purple-500" },
  { key: "frameworks", label: "Frameworks", icon: "📋", color: "border-teal-500" },
  { key: "orgs", label: "Organizations", icon: "🏢", color: "border-indigo-500" },
] as const;

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800",
  HIGH: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-green-100 text-green-800",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-red-100 text-red-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-blue-100 text-blue-800",
  CLOSED: "bg-green-100 text-green-800",
  WAIVED: "bg-gray-100 text-gray-800",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB");
}

function truncate(s: string, n = 120) {
  if (!s) return "";
  // Strip HTML tags for display
  const clean = s.replace(/<[^>]*>/g, "");
  return clean.length > n ? clean.slice(0, n) + "..." : clean;
}

export default function DataRoute() {
  const data = useLoaderData<typeof loader>();
  const [tab, setTab] = useState<string>("findings");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Data Browser</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Browse all database records — seed data + Bettercoal import.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key
                ? `border-current ${t.color} text-foreground`
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon} {t.label}
            <span className="ml-2 text-xs text-muted-foreground">
              ({(data as any)[t.key]?.count ?? (data as any)[t.key]?.length ?? 0})
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {tab === "findings" && <FindingsTable data={data.findings} />}
        {tab === "sites" && <SitesTable data={data.sites} />}
        {tab === "reports" && <ReportsTable data={data.reports} />}
        {tab === "cipCycles" && <CIPTable data={data.cipCycles} />}
        {tab === "plans" && <PlansTable data={data.plans} />}
        {tab === "frameworks" && <FrameworksTable data={data.frameworks} />}
        {tab === "orgs" && <OrgsTable data={data.orgs} />}
      </div>
    </div>
  );
}

function FindingsTable({ data }: { data: any }) {
  const items = data?.results ?? data ?? [];
  if (!items.length) return <p className="text-muted-foreground">No findings.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Topic</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Severity</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Summary</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Responsible</th>
          </tr>
        </thead>
        <tbody>
          {items.map((f: any) => (
            <tr key={f.id} className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-2 px-3 font-medium text-foreground">{f.topic || "—"}</td>
              <td className="py-2 px-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[f.severity] || ""}`}>
                  {f.severity}
                </span>
              </td>
              <td className="py-2 px-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[f.status] || ""}`}>
                  {f.status}
                </span>
              </td>
              <td className="py-2 px-3 text-muted-foreground max-w-xs">{truncate(f.summary, 100)}</td>
              <td className="py-2 px-3 text-muted-foreground">{f.responsible_party || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground mt-2">Total: {items.length} findings</p>
    </div>
  );
}

function SitesTable({ data }: { data: any }) {
  const items = data?.results ?? data ?? [];
  if (!items.length) return <p className="text-muted-foreground">No sites.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Name</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Country</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Risk</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Employees</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Contractors</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Industry Data</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s: any) => (
            <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-2 px-3 font-medium text-foreground">{s.name}</td>
              <td className="py-2 px-3">{s.type}</td>
              <td className="py-2 px-3">{s.country_code}</td>
              <td className="py-2 px-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  s.risk_profile === "CRITICAL" ? "bg-red-100 text-red-800" :
                  s.risk_profile === "HIGH" ? "bg-orange-100 text-orange-800" :
                  "bg-green-100 text-green-800"
                }`}>
                  {s.risk_profile || "—"}
                </span>
              </td>
              <td className="py-2 px-3">{s.employee_count ?? 0}</td>
              <td className="py-2 px-3">{s.contractor_count ?? 0}</td>
              <td className="py-2 px-3 text-muted-foreground max-w-[200px]">
                {s.industry_data ? JSON.stringify(s.industry_data).slice(0, 80) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground mt-2">Total: {items.length} sites</p>
    </div>
  );
}

function ReportsTable({ data }: { data: any }) {
  const items = data?.results ?? data ?? [];
  if (!items.length) return <p className="text-muted-foreground">No reports.</p>;
  return (
    <div className="space-y-4">
      {items.map((r: any) => (
        <div key={r.id} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{r.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">Status: {r.status}</p>
            </div>
            <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
          </div>
          {r.executive_summary && (
            <p className="text-sm text-muted-foreground mt-3">{truncate(r.executive_summary, 200)}</p>
          )}
          {r.methodology && (
            <p className="text-sm text-muted-foreground mt-2"><b>Methodology:</b> {truncate(r.methodology, 150)}</p>
          )}
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Total: {items.length} reports</p>
    </div>
  );
}

function CIPTable({ data }: { data: any }) {
  const items = data?.results ?? data ?? [];
  if (!items.length) return <p className="text-muted-foreground">No CIP cycles.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Label</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Assessment</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Period (months)</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Start</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c: any) => (
            <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-2 px-3 font-medium text-foreground">{c.label}</td>
              <td className="py-2 px-3 text-xs text-muted-foreground">{c.assessment?.slice(0, 8)}...</td>
              <td className="py-2 px-3">{c.deadline_period_months}</td>
              <td className="py-2 px-3">{formatDate(c.start_date)}</td>
              <td className="py-2 px-3">{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground mt-2">Total: {items.length} CIP cycles</p>
    </div>
  );
}

function PlansTable({ data }: { data: any }) {
  const items = data?.results ?? data ?? [];
  if (!items.length) return <p className="text-muted-foreground">No assessment plans.</p>;
  return (
    <div className="space-y-3">
      {items.map((p: any) => (
        <div key={p.id} className="bg-card border border-border rounded-xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><div className="text-xs text-muted-foreground">Site Visit Start</div><div className="font-medium">{formatDate(p.site_assessment_start)}</div></div>
            <div><div className="text-xs text-muted-foreground">Site Visit End</div><div className="font-medium">{formatDate(p.site_assessment_end)}</div></div>
            <div><div className="text-xs text-muted-foreground">Draft Report</div><div className="font-medium">{formatDate(p.draft_report_deadline)}</div></div>
            <div><div className="text-xs text-muted-foreground">Final Report</div><div className="font-medium">{formatDate(p.final_report_deadline)}</div></div>
          </div>
          {p.notes && <p className="text-xs text-muted-foreground mt-3">{p.notes}</p>}
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Total: {items.length} plans</p>
    </div>
  );
}

function FrameworksTable({ data }: { data: any }) {
  const items = data?.results ?? data ?? [];
  if (!items.length) return <p className="text-muted-foreground">No frameworks.</p>;
  // Group by org
  const grouped: Record<string, any[]> = {};
  items.forEach((fw: any) => {
    const orgId = fw.organization || "global";
    if (!grouped[orgId]) grouped[orgId] = [];
    grouped[orgId].push(fw);
  });
  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([orgId, fws]) => (
        <div key={orgId}>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Organization: {orgId.slice(0, 8)}...</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {fws.map((fw: any) => (
              <div key={fw.id} className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-foreground">{fw.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">v{fw.version || "?"}</p>
                {fw.description && (
                  <p className="text-sm text-muted-foreground mt-2">{truncate(fw.description, 120)}</p>
                )}
                {fw.categories && Object.keys(fw.categories).length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">
                      {Object.keys(fw.categories).length} categories
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Total: {items.length} frameworks</p>
    </div>
  );
}

function OrgsTable({ data }: { data: any }) {
  const items = data?.results ?? data ?? [];
  if (!items.length) return <p className="text-muted-foreground">No organizations.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Name</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Slug</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Tier</th>
          </tr>
        </thead>
        <tbody>
          {items.map((o: any) => (
            <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-2 px-3 font-medium text-foreground">{o.name}</td>
              <td className="py-2 px-3 font-mono text-xs">{o.slug}</td>
              <td className="py-2 px-3">{o.status}</td>
              <td className="py-2 px-3">{o.subscription_tier || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground mt-2">Total: {items.length} organizations</p>
    </div>
  );
}
