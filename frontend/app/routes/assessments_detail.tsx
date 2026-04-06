import { useLoaderData, Link, Form, redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/api";
import { useState } from "react";
import { ArrowLeft, AlertTriangle, Plus, Trash2, Edit3, Save, X } from "lucide-react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = getUserToken(request);
  const assessment = await api.get<any>(`/api/assessments/${params.id}/`, token).catch(() => null);
  const [findings, cipCycles, plan, tasks, report] = await Promise.all([
    api.get<any[]>(`/api/findings/?assessment=${params.id}`, token).catch(() => []),
    api.get<any[]>(`/api/cip-cycles/?assessment=${params.id}`, token).catch(() => []),
    api.get<any[]>(`/api/plans/?assessment=${params.id}`, token).catch(() => []),
    api.get<any[]>(`/api/tasks/?assessment=${params.id}`, token).catch(() => []),
    api.get<any[]>(`/api/reports/?assessment=${params.id}`, token).catch(() => []),
  ]);
  return {
    assessment: assessment ?? null,
    findings: Array.isArray(findings) ? findings : [],
    cipCycles: Array.isArray(cipCycles) ? cipCycles : [],
    plan: Array.isArray(plan) ? (plan[0] ?? null) : null,
    tasks: Array.isArray(tasks) ? tasks : [],
    report: Array.isArray(report) ? (report[0] ?? null) : null,
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = getUserToken(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    if (intent === "save-assessment") {
      await api.patch(`/api/assessments/${params.id}/`, {
        status: formData.get("status"),
        risk_level: formData.get("risk_level"),
        overall_score: Number(formData.get("overall_score")) || 0,
        ai_summary: formData.get("ai_summary") ?? "",
      }, token);
      return redirect(`${formData.get("return_to") || `/assessments/${params.id}`}`);
    }

    if (intent === "create-finding") {
      await api.post("/api/findings/", {
        assessment: params.id,
        topic: "New Finding",
        summary: "",
        severity: "MEDIUM",
        status: "OPEN",
      }, token);
      return redirect(`/assessments/${params.id}`);
    }

    if (intent === "save-finding") {
      const id = formData.get("finding_id");
      await api.patch(`/api/findings/${id}/`, {
        topic: formData.get("topic"),
        summary: formData.get("summary"),
        recommended_actions: formData.get("recommended_actions"),
        severity: formData.get("severity"),
        status: formData.get("status"),
        responsible_party: formData.get("responsible_party"),
      }, token);
      return redirect(`/assessments/${params.id}`);
    }

    if (intent === "delete-finding") {
      const id = formData.get("finding_id");
      await api.delete(`/api/findings/${id}/`, token);
      return redirect(`/assessments/${params.id}`);
    }
  } catch (err: any) {
    return { error: err.message ?? "Action failed" };
  }

  return { error: "Unknown intent" };
}

const SEVERITY_COLORS: Record<string, string> = { LOW:"bg-green-100 text-green-700", MEDIUM:"bg-yellow-100 text-yellow-700", HIGH:"bg-orange-100 text-orange-700", CRITICAL:"bg-red-100 text-red-700" };
const STATUS_COLORS: Record<string, string> = { OPEN:"bg-red-100 text-red-700", IN_PROGRESS:"bg-blue-100 text-blue-700", RESOLVED:"bg-green-100 text-green-700", CLOSED:"bg-gray-100 text-gray-700" };
const RISK_COLORS: Record<string, string> = { LOW:"bg-green-100 text-green-700", MEDIUM:"bg-yellow-100 text-yellow-700", HIGH:"bg-orange-100 text-orange-700", CRITICAL:"bg-red-100 text-red-700" };

export default function AssessmentDetailRoute() {
  const data = useLoaderData<typeof loader>();
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "findings" | "plan" | "cip" | "tasks">("overview");
  const [formData, setFormData] = useState({
    status: data.assessment?.status ?? "DRAFT",
    risk_level: data.assessment?.risk_level ?? "MEDIUM",
    overall_score: data.assessment?.overall_score ?? 0,
    ai_summary: data.assessment?.ai_summary ?? "",
  });
  const [editingFinding, setEditingFinding] = useState<string | null>(null);

  if (!data.assessment) return (<div className="text-center py-12"><h2 className="text-xl font-medium text-foreground">Assessment not found</h2><Link to="/assessments" className="text-primary hover:underline mt-4 inline-block">← Back to assessments</Link></div>);

  const a = data.assessment;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/assessments" className="p-2 hover:bg-muted rounded-lg"><ArrowLeft className="w-5 h-5 text-muted-foreground" /></Link>
          <div><h2 className="text-2xl font-semibold text-foreground">Assessment {a.id.slice(0, 8)}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Created {new Date(a.created_at).toLocaleDateString()}</p></div>
        </div>
        <div className="flex items-center gap-2">
          {!editMode ? <button type="button" onClick={() => setEditMode(true)} className="inline-flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm"><Edit3 className="w-3.5 h-3.5" /> Edit</button> :
          <>
            <Form method="post" className="inline">
              <input type="hidden" name="intent" value="save-assessment" />
              <input type="hidden" name="status" value={formData.status} />
              <input type="hidden" name="risk_level" value={formData.risk_level} />
              <input type="hidden" name="overall_score" value={String(formData.overall_score)} />
              <input type="hidden" name="ai_summary" value={formData.ai_summary} />
              <button type="submit" className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm"><Save className="w-3.5 h-3.5" /> Save</button>
            </Form>
            <button type="button" onClick={() => setEditMode(false)} className="inline-flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm"><X className="w-3.5 h-3.5" /> Cancel</button>
          </>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 p-4 bg-card border border-border rounded-xl">
        <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Status:</span>
          {editMode ? <select value={formData.status} onChange={e => setFormData(d => ({...d, status: e.target.value}))} className="px-2 py-1 border border-border rounded-lg text-sm bg-background">{["DRAFT","IN_PROGRESS","UNDER_REVIEW","COMPLETED","ARCHIVED"].map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}</select> :
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{a.status.replace(/_/g," ")}</span>}
        </div>
        <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Risk:</span>
          {editMode ? <select value={formData.risk_level} onChange={e => setFormData(d => ({...d, risk_level: e.target.value}))} className="px-2 py-1 border border-border rounded-lg text-sm bg-background">
            {["LOW","MEDIUM","HIGH","CRITICAL"].map(s => <option key={s} value={s}>{s}</option>)}</select> :
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${RISK_COLORS[a.risk_level]}`}>{a.risk_level}</span>}
        </div>
        <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Score:</span>
          {editMode ? <input type="number" min={0} max={100} value={formData.overall_score} onChange={e => setFormData(d => ({...d, overall_score: Number(e.target.value)}))} className="px-2 py-1 border border-border rounded-lg text-sm bg-background w-20" /> :
          <span className="text-sm font-medium">{a.overall_score}%</span>}
        </div>
        <div className="ml-auto text-xs text-muted-foreground">{a.start_date ? "Start: " + new Date(a.start_date).toLocaleDateString() : ""} {a.due_date ? "| Due: " + new Date(a.due_date).toLocaleDateString() : ""}</div>
      </div>
      {a.overall_score >= 0 && <div className="w-full h-2 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${a.overall_score >= 80 ? "bg-green-500" : a.overall_score >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${a.overall_score}%` }} /></div>}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {[
          {key: "overview", label: "Overview", count: 0},
          {key: "findings", label: "Findings", count: data.findings.length},
          {key: "plan", label: "Plan", count: 0},
          {key: "cip", label: "CIP", count: data.cipCycles.length},
          {key: "tasks", label: "Tasks", count: data.tasks.length},
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? "border-current text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab.label}{(tab.count as number) > 0 ? ` (${tab.count})` : ""}
          </button>
        ))}
      </div>
      {activeTab === "overview" && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3 text-sm">
          <div><div className="text-xs text-muted-foreground">Summary</div><div className="mt-0.5">{a.ai_summary || "—"}</div></div>
          {editMode && <textarea value={formData.ai_summary} onChange={e => setFormData(d => ({...d, ai_summary: e.target.value}))} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background" rows={3} />}
        </div>
      )}
      {activeTab === "findings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">Findings</h3>
            <Form method="post" className="inline">
              <input type="hidden" name="intent" value="create-finding" />
              <button type="submit" className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm"><Plus className="w-3.5 h-3.5" /> Add Finding</button>
            </Form>
          </div>
          {data.findings.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No findings yet.</p> :
            data.findings.map((f: any) => (
              <div key={f.id} className="bg-card border border-border rounded-xl p-5">
                {editingFinding === f.id ? (
                  <Form method="post">
                    <input type="hidden" name="intent" value="save-finding" />
                    <input type="hidden" name="finding_id" value={f.id} />
                    <div className="space-y-3">
                      <input name="topic" defaultValue={f.topic} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" placeholder="Topic" />
                      <textarea name="summary" defaultValue={f.summary} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background min-h-[80px]" placeholder="Summary" />
                      <textarea name="recommended_actions" defaultValue={f.recommended_actions} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" placeholder="Recommended actions" />
                      <div className="flex items-center gap-3">
                        <select name="severity" defaultValue={f.severity} className="px-2 py-1 border border-border rounded-lg text-sm bg-background">{Object.keys(SEVERITY_COLORS).map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <select name="status" defaultValue={f.status} className="px-2 py-1 border border-border rounded-lg text-sm bg-background">{Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}</select>
                        <input name="responsible_party" defaultValue={f.responsible_party} className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background" placeholder="Responsible party" />
                      </div>
                      <div className="flex gap-2"><button type="submit" className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium">Save</button><button type="button" onClick={() => setEditingFinding(null)} className="px-3 py-1.5 border border-border rounded text-sm">Cancel</button></div>
                    </div>
                  </Form>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /><h4 className="font-medium text-foreground">{f.topic || "Untitled"}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[f.severity]}`}>{f.severity}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[f.status]}`}>{f.status}</span></div>
                      {f.summary && <p className="text-sm text-muted-foreground mt-2">{f.summary}</p>}
                      {f.recommended_actions && <p className="text-xs text-muted-foreground mt-1"><b>Actions:</b> {f.recommended_actions}</p>}
                      {f.responsible_party && <p className="text-xs text-muted-foreground mt-1"><b>Responsible:</b> {f.responsible_party}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setEditingFinding(f.id)} className="p-1.5 hover:bg-muted rounded-md"><Edit3 className="w-4 h-4 text-muted-foreground" /></button>
                      <Form method="post">
                        <input type="hidden" name="intent" value="delete-finding" />
                        <input type="hidden" name="finding_id" value={f.id} />
                        <button type="submit" className="p-1.5 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4 text-red-500" /></button>
                      </Form>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
      {activeTab === "plan" && (
        <div className="bg-card border border-border rounded-xl p-5">
          {data.plan ? (<>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><div className="text-xs text-muted-foreground">Site Visit Start</div><div className="font-medium">{data.plan.site_assessment_start ? new Date(data.plan.site_assessment_start).toLocaleDateString() : "—"}</div></div>
              <div><div className="text-xs text-muted-foreground">Site Visit End</div><div className="font-medium">{data.plan.site_assessment_end ? new Date(data.plan.site_assessment_end).toLocaleDateString() : "—"}</div></div>
              <div><div className="text-xs text-muted-foreground">Draft Report</div><div className="font-medium">{data.plan.draft_report_deadline ? new Date(data.plan.draft_report_deadline).toLocaleDateString() : "—"}</div></div>
              <div><div className="text-xs text-muted-foreground">Final Report</div><div className="font-medium">{data.plan.final_report_deadline ? new Date(data.plan.final_report_deadline).toLocaleDateString() : "—"}</div></div>
            </div>
            {data.plan.notes && <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border">{data.plan.notes}</p>}
          </>) : <p className="text-sm text-muted-foreground text-center py-4">No assessment plan created yet.</p>}
        </div>
      )}
      {activeTab === "cip" && (
        <div className="space-y-3">
          {data.cipCycles.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No CIP cycles configured.</p> :
            data.cipCycles.map((c: any) => (
              <div key={c.id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between"><h4 className="font-medium text-foreground">{c.label}</h4>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{c.status}</span></div>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm"><div><div className="text-xs text-muted-foreground">Period</div><div className="font-medium">{c.deadline_period_months} months</div></div><div><div className="text-xs text-muted-foreground">Start Date</div><div className="font-medium">{c.start_date ? new Date(c.start_date).toLocaleDateString() : "—"}</div></div></div>
              </div>
            ))}
        </div>
      )}
      {activeTab === "tasks" && (
        <div className="space-y-3">
          {data.tasks.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No tasks yet.</p> :
            data.tasks.map((t: any) => (
              <div key={t.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div><h4 className="font-medium text-foreground">{t.title}</h4>{t.description && <p className="text-sm text-muted-foreground mt-1">{t.description}</p>}</div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.priority === "HIGH" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{t.priority}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700`}>{t.status.replace(/_/g," ")}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
