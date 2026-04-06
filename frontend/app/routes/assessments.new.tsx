import { Form, redirect, useLoaderData, Link } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/api";
import { ArrowLeft } from "lucide-react";

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const token = getUserToken(request);
  const formData = await request.formData();
  const data: Record<string, any> = {
    status: formData.get("status") || "DRAFT",
    risk_level: formData.get("risk_level") || "LOW",
    overall_score: Number(formData.get("overall_score")) || 0,
    ai_summary: formData.get("ai_summary") || "",
  };
  const site = formData.get("site");
  const framework = formData.get("framework");
  const focusArea = formData.get("focus_area");
  if (site) data.site = site;
  if (framework) data.framework = framework;
  if (focusArea) data.focus_area = focusArea;
  const startDate = formData.get("start_date");
  const dueDate = formData.get("due_date");
  if (startDate) data.start_date = startDate;
  if (dueDate) data.due_date = dueDate;
  const result = await api.post<any>("/api/assessments/", data, token);
  if ("error" in result) return { error: (result as any).error };
  return redirect(`/assessments/${result.id}`);
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = getUserToken(request);
  const [sites, frameworks, focusAreas] = await Promise.all([
    api.get<any[]>("/api/sites/", token).catch(() => []),
    api.get<any[]>("/api/frameworks/", token).catch(() => []),
    api.get<any[]>("/api/focus-areas/", token).catch(() => []),
  ]);
  return { sites: Array.isArray(sites) ? sites : [], frameworks: Array.isArray(frameworks) ? frameworks : [], focusAreas: Array.isArray(focusAreas) ? focusAreas : [] };
}

export default function NewAssessmentRoute() {
  const { sites, frameworks, focusAreas } = useLoaderData<typeof loader>();
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/assessments" className="p-2 hover:bg-muted rounded-lg"><ArrowLeft className="w-5 h-5 text-muted-foreground" /></Link>
        <div><h2 className="text-2xl font-semibold text-foreground">New Assessment</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Create a new sustainability assessment.</p></div>
      </div>
      <Form method="post" className="bg-card border border-border rounded-xl p-6 space-y-5">
        <SelectField label="Site" name="site" options={sites.map((s: any) => ({ value: s.id, label: s.name }))} />
        <SelectField label="Framework" name="framework" options={frameworks.map((f: any) => ({ value: f.id, label: f.name }))} />
        <SelectField label="Focus Area" name="focus_area" options={focusAreas.map((f: any) => ({ value: f.id, label: f.name }))} />
        <DateField label="Start Date" name="start_date" />
        <DateField label="Due Date" name="due_date" />
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Status" name="status" options={[{value:"DRAFT",label:"Draft"},{value:"IN_PROGRESS",label:"In Progress"},{value:"UNDER_REVIEW",label:"Under Review"}]} />
          <SelectField label="Risk Level" name="risk_level" options={[{value:"LOW",label:"Low"},{value:"MEDIUM",label:"Medium"},{value:"HIGH",label:"High"},{value:"CRITICAL",label:"Critical"}]} />
        </div>
        <TextAreaField label="Summary / Notes" name="ai_summary" placeholder="What is this assessment about?" />
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Link to="/assessments" className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted">Cancel</Link>
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">Create Assessment</button>
        </div>
      </Form>
    </div>
  );
}
function SelectField({ label, name, options }: { label: string; name: string; options: { value: string; label: string }[] }) {
  return (<div><label className="text-sm font-medium text-foreground">{label}</label><select name={name} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background"><option value="">— Select —</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>);
}
function DateField({ label, name }: { label: string; name: string }) {
  return (<div><label className="text-sm font-medium text-foreground">{label}</label><input type="date" name={name} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background" /></div>);
}
function TextAreaField({ label, name, placeholder }: { label: string; name: string; placeholder?: string }) {
  return (<div><label className="text-sm font-medium text-foreground">{label}</label><textarea name={name} rows={3} placeholder={placeholder} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background resize-none" /></div>);
}
