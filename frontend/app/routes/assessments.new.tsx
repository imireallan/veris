import { useState, useRef, useEffect } from "react";
import {
  redirect,
  useLoaderData,
  useActionData,
  Link,
  useNavigation,
  useSubmit,
} from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireUser, getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkle,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { RichEditor } from "~/components/RichEditor";
import { useWizardForm } from "~/hooks/useWizard";

/* ──────────────────────────── SERVER ──────────────────────────── */

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const formData = await request.formData();

  // Handle site creation inline (hidden field with JSON payload)
  const siteJson = formData.get("__new_site");
  let siteId = formData.get("site") as string;

  if (siteJson) {
    try {
      const { name, type, country_code } = JSON.parse(siteJson as string);
      const site = await api.post<any>(
        "/api/sites/",
        {
          name,
          type,
          country_code,
          organization: user.orgId,
          operational_status: "ACTIVE",
          risk_profile: "MEDIUM",
          coordinates: {},
        },
        token,
      );
      siteId = site.id;
    } catch (err: any) {
      const msg =
        err?.body?.non_field_errors?.[0] ??
        err?.body?.detail ??
        err?.message ??
        "Failed to create site";
      return { error: `Site creation failed: ${msg}` };
    }
  }

  const data: Record<string, any> = {
    status: formData.get("status") || "DRAFT",
    risk_level: formData.get("risk_level") || "LOW",
    overall_score: 0,
    ai_summary: formData.get("ai_summary") || "",
  };
  if (siteId) data.site = siteId;
  const framework = formData.get("framework");
  const focusArea = formData.get("focus_area");
  if (framework) data.framework = framework;
  if (focusArea) data.focus_area = focusArea;
  const startDate = formData.get("start_date");
  const dueDate = formData.get("due_date");
  if (startDate) data.start_date = `${startDate}T00:00:00Z`;
  if (dueDate) data.due_date = `${dueDate}T23:59:59Z`;

  console.log(startDate, dueDate);

  try {
    const result = await api.post<any>("/api/assessments/", data, token);
    return redirect(`/assessments/${result.id}`);
  } catch (err: any) {
    const msg =
      err?.body?.non_field_errors?.[0] ??
      err?.body?.detail ??
      err?.body?.start_date?.[0] ??
      err?.body?.due_date?.[0] ??
      err?.message ??
      "Failed to create assessment";
    return { error: msg, success: false };
  }
}

const unwrap = (r: any) => (Array.isArray(r) ? r : (r?.results ?? []));

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await getUserToken(request);
  const [sites, frameworks, focusAreas] = await Promise.all([
    api
      .get<any>("/api/sites/", token)
      .then(unwrap)
      .catch(() => []),
    api
      .get<any>("/api/frameworks/", token)
      .then(unwrap)
      .catch(() => []),
    api
      .get<any>("/api/focus-areas/", token)
      .then(unwrap)
      .catch(() => []),
  ]);
  return { sites, frameworks, focusAreas };
}

/* ──────────────────────────── STEPS CONFIG ──────────────────────────── */

const STEPS = [
  { id: 1, label: "Basics", icon: FileText },
  { id: 2, label: "Site", icon: Building2 },
  { id: 3, label: "Framework", icon: MapPin },
  { id: 4, label: "Schedule", icon: Calendar },
  { id: 5, label: "Review", icon: Eye },
] as const;

/* ──────────────────────────── CLIENT ──────────────────────────── */

/** Collect all form state into one object for draft persistence. */
interface AssessmentForm {
  // step: number;
  site: string;
  framework: string;
  focusArea: string;
  startDate: string;
  dueDate: string;
  status: string;
  riskLevel: string;
  aiSummary: string;
  showCreateSite: boolean;
  newSiteName: string;
  newSiteType: string;
  newSiteCountry: string;
}

export default function NewAssessmentRoute() {
  const { sites, frameworks, focusAreas } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string; success?: boolean }>();
  const submitRemix = useSubmit();
  const navigation = useNavigation();
  const isSubmittingRemix = navigation.state === "submitting";

  const STORAGE_KEY = "veris:draft:assessment-new";

  const {
    data: form,
    step,
    update,
    next,
    back,
    goTo,
    submit,
    isLastStep,
    submitting: isHookSubmitting,
  } = useWizardForm<AssessmentForm>({
    persistKey: STORAGE_KEY,
    totalSteps: 5,
    initialData: {
      site: "",
      framework: "",
      focusArea: "",
      startDate: "",
      dueDate: "",
      status: "DRAFT",
      riskLevel: "LOW",
      aiSummary: "",
      showCreateSite: false,
      newSiteName: "",
      newSiteType: "",
      newSiteCountry: "",
    },
    onSubmit: async (values) => {
      const formData = new FormData();

      // Define a mapping for keys that differ between Client and Server/API
      const keyMap: Record<string, string> = {
        startDate: "start_date",
        dueDate: "due_date",
        riskLevel: "risk_level",
        focusArea: "focus_area",
        aiSummary: "ai_summary",
      };

      Object.entries(values).forEach(([key, value]) => {
        if (key === "showCreateSite") return;

        // Use the mapped key if it exists, otherwise use the original key
        const targetKey = keyMap[key] || key;
        formData.append(targetKey, String(value));
      });

      // Special handling for new site
      if (values.showCreateSite && values.newSiteName) {
        formData.append(
          "__new_site",
          JSON.stringify({
            name: values.newSiteName,
            type: values.newSiteType,
            country_code: values.newSiteCountry,
          }),
        );
      }

      submitRemix(formData, { method: "post" });
    },
  });

  const {
    site,
    framework,
    focusArea,
    startDate,
    dueDate,
    status,
    riskLevel,
    aiSummary,
    showCreateSite,
    newSiteName,
    newSiteType,
    newSiteCountry,
  } = form;

  const siteList = Array.isArray(sites) ? sites : [];
  const fwList = Array.isArray(frameworks) ? frameworks : [];
  const faList = Array.isArray(focusAreas) ? focusAreas : [];

  const canNext = () => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return (
          site !== "" ||
          (showCreateSite && !!newSiteName && !!newSiteType && !!newSiteCountry)
        );
      case 3:
        return true;
      case 4:
        return !!startDate && !!dueDate;
      default:
        return true;
    }
  };

  const fw = fwList.find((f: any) => f.id === framework);
  const fa = faList.find((f: any) => f.id === focusArea);
  const s = siteList.find((s: any) => s.id === site);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/assessments" className="p-2 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            New Assessment
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Set up a new sustainability assessment in 5 steps.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-card border rounded-xl p-4">
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => goTo(s.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1",
                  step > s.id && "text-primary bg-primary/5",
                  step === s.id &&
                    "text-primary bg-primary/10 ring-1 ring-primary/30",
                  step < s.id && "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0",
                    step > s.id
                      ? "bg-primary text-primary-foreground"
                      : step === s.id
                        ? "bg-primary/20 text-primary"
                        : "border border-border",
                  )}
                >
                  {step > s.id ? <Check className="w-3 h-3" /> : s.id}
                </span>
                <span className="hidden sm:inline truncate">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 mx-1",
                    step > s.id ? "bg-primary/40" : "bg-border",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {actionData?.error && (
        <div className="px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {actionData.error}
        </div>
      )}

      <div className="bg-card border rounded-xl p-6">
        <div className="space-y-5">
          {/* STEP 1: BASICS */}
          {step === 1 && (
            <StepWrapper title="Basic Details">
              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) => update("status")(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                </select>
              </Field>
              <Field label="Risk Level">
                <div className="grid grid-cols-4 gap-2">
                  {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => update("riskLevel")(r)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                        riskLevel === r
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Summary / Notes">
                <RichEditor value={aiSummary} onChange={update("aiSummary")} />
              </Field>
            </StepWrapper>
          )}

          {/* STEP 2: SITE */}
          {step === 2 && (
            <StepWrapper title="Site Selection">
              {!showCreateSite ? (
                <div className="space-y-4">
                  <Field label="Site" required>
                    <select
                      value={site}
                      onChange={(e) => update("site")(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">— Select a site —</option>
                      {siteList.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <button
                    type="button"
                    onClick={() => update("showCreateSite")(true)}
                    className="text-sm text-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Create a new site
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      update("showCreateSite")(false);
                      update("newSiteName")(""); // Clear new site data when going back
                    }}
                    className="text-sm text-muted-foreground flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Use existing site
                  </button>
                  <Field label="Site Name">
                    <input
                      value={newSiteName}
                      onChange={(e) => update("newSiteName")(e.target.value)}
                      className="w-full border p-2 rounded"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Type">
                      <select
                        value={newSiteType}
                        onChange={(e) => update("newSiteType")(e.target.value)}
                        className="w-full border p-2 rounded"
                      >
                        <option value="">Select</option>
                        {/* Add your siteTypeOptions.map here */}
                      </select>
                    </Field>
                    <Field label="Country Code">
                      <input
                        value={newSiteCountry}
                        onChange={(e) =>
                          update("newSiteCountry")(e.target.value.toUpperCase())
                        }
                        className="w-full border p-2 rounded"
                      />
                    </Field>
                  </div>
                </div>
              )}
            </StepWrapper>
          )}

          {/* STEP 3: FRAMEWORK */}
          {step === 3 && (
            <StepWrapper title="Framework & Focus Area">
              <Field label="Framework">
                <select
                  value={framework}
                  onChange={(e) => update("framework")(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">— Select framework —</option>
                  {fwList.map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Focus Area">
                <select
                  value={focusArea}
                  onChange={(e) => update("focusArea")(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">— Select focus area —</option>
                  {faList.map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </Field>
            </StepWrapper>
          )}

          {/* STEP 4: SCHEDULE */}
          {step === 4 && (
            <StepWrapper title="Timeline">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Start Date" required>
                  <DatePickerInput
                    value={startDate}
                    onChange={update("startDate")}
                    minDate={new Date().toISOString().split("T")[0]}
                  />
                </Field>
                <Field label="Due Date" required>
                  <DatePickerInput
                    value={dueDate}
                    onChange={update("dueDate")}
                    minDate={
                      startDate || new Date().toISOString().split("T")[0]
                    }
                  />
                </Field>
              </div>
            </StepWrapper>
          )}

          {step === 5 && (
            <StepWrapper title="Review & Create">
              <div className="space-y-4">
                <ReviewSection title="Basic Details" icon={FileText}>
                  <ReviewRow label="Status" value={status.replace(/_/g, " ")} />
                  <ReviewRow
                    label="Risk Level"
                    value={riskLevel}
                    badge
                    badgeColor={
                      riskLevel === "CRITICAL"
                        ? "destructive"
                        : riskLevel === "HIGH"
                          ? "destructive"
                          : riskLevel === "MEDIUM"
                            ? "secondary"
                            : "success"
                    }
                  />
                  {aiSummary && (
                    <div className="text-sm">
                      <span className="text-muted-foreground block mb-1">
                        Summary
                      </span>
                      <div
                        className="prose prose-sm max-w-none text-foreground"
                        dangerouslySetInnerHTML={{ __html: aiSummary }}
                      />
                    </div>
                  )}
                </ReviewSection>

                <ReviewSection title="Site" icon={Building2}>
                  {site && s ? (
                    <ReviewRow
                      label="Site"
                      value={`${s.name} (${s.country_code})`}
                    />
                  ) : showCreateSite ? (
                    <div className="text-sm">
                      <span className="text-muted-foreground">New site — </span>
                      <span className="text-foreground font-medium">
                        {newSiteName}
                      </span>
                      {newSiteType && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {newSiteType}
                        </span>
                      )}
                      {newSiteCountry && (
                        <span className="text-muted-foreground">
                          {" "}
                          ({newSiteCountry})
                        </span>
                      )}
                    </div>
                  ) : (
                    <ReviewRow label="Site" value="—" />
                  )}
                </ReviewSection>

                <ReviewSection title="Framework & Focus Area" icon={MapPin}>
                  <ReviewRow
                    label="Framework"
                    value={
                      fw
                        ? `${fw.name}${fw.version ? ` (${fw.version})` : ""}`
                        : "Not selected"
                    }
                  />
                  <ReviewRow
                    label="Focus Area"
                    value={fa ? fa.name : "Not selected"}
                  />
                </ReviewSection>

                <ReviewSection title="Schedule" icon={Calendar}>
                  <ReviewRow
                    label="Start Date"
                    value={
                      startDate
                        ? new Date(startDate + "T00:00:00").toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        : "—"
                    }
                  />
                  <ReviewRow
                    label="Due Date"
                    value={
                      dueDate
                        ? new Date(dueDate + "T00:00:00").toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        : "—"
                    }
                  />
                  {startDate && dueDate && (
                    <ReviewRow
                      label="Duration"
                      value={`${Math.ceil((new Date(dueDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days`}
                    />
                  )}
                </ReviewSection>
              </div>
            </StepWrapper>
          )}

          {/* Navigation Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <button
              type="button"
              onClick={back}
              className={cn(
                "px-4 py-2 border rounded-lg",
                step === 1 && "invisible",
              )}
            >
              Back
            </button>
            {!isLastStep ? (
              <button
                type="button"
                onClick={next}
                disabled={!canNext()}
                className={cn(
                  "px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  // 2. Add conditional styling based on canNext()
                  canNext()
                    ? "bg-primary text-white hover:opacity-90 shadow-sm"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50 grayscale-[0.5]",
                )}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={isSubmittingRemix || isHookSubmitting}
                className="px-6 py-2 bg-primary text-white rounded-lg"
              >
                {isSubmittingRemix ? "Creating..." : "Create Assessment"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── SUB-COMPONENTS ──────────────────────────── */

function StepWrapper({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function ReviewSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 border rounded-lg space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        {title}
      </div>
      {children}
    </div>
  );
}

function ReviewRow({
  label,
  value,
  badge,
  badgeColor,
}: {
  label: string;
  value: string;
  badge?: boolean;
  badgeColor?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {badge ? (
        <span
          className={cn(
            "px-2 py-0.5 rounded text-xs font-medium",
            badgeColor === "destructive" &&
              "bg-destructive/10 text-destructive",
            badgeColor === "success" &&
              "bg-green-500/10 text-green-600 dark:text-green-400",
            badgeColor === "secondary" &&
              "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
          )}
        >
          {value}
        </span>
      ) : (
        <span className="font-medium text-foreground">{value}</span>
      )}
    </div>
  );
}

/* ──────────────────────────── DATE PICKER (avoids broken native popup) ──────────────────────────── */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface DatePickerInputProps {
  value: string;
  onChange: (v: string) => void;
  minDate?: string;
}

function DatePickerInput({ value, onChange, minDate }: DatePickerInputProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const d = new Date(value);
      return { year: d.getFullYear(), month: d.getMonth() };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // If value changes externally (e.g. going back and forward), sync viewDate
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setViewDate({ year: d.getFullYear(), month: d.getMonth() });
    }
  }, [value]);

  const firstDay = new Date(viewDate.year, viewDate.month, 1).getDay();
  const totalDays = daysInMonth(viewDate.year, viewDate.month);
  const prevMonthDays =
    viewDate.month === 0
      ? daysInMonth(viewDate.year - 1, 11)
      : daysInMonth(viewDate.year, viewDate.month - 1);

  const prevMonth = () =>
    setViewDate((v) => {
      if (v.month === 0) return { year: v.year - 1, month: 11 };
      return { ...v, month: v.month - 1 };
    });
  const nextMonth = () =>
    setViewDate((v) => {
      if (v.month === 11) return { year: v.year + 1, month: 0 };
      return { ...v, month: v.month + 1 };
    });

  const isDisabled = (day: number, month: number, year: number) => {
    if (!minDate) return false;
    const d = new Date(year, month, day);
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d < min;
  };

  const isSelected = (day: number, month: number, year: number) => {
    if (!value) return false;
    const parts = value.split("-");
    return +parts[2] === day && +parts[1] - 1 === month && +parts[0] === year;
  };

  // Build grid cells: previous month trailing days + current month + next month leading
  const cells: {
    day: number;
    current: boolean;
    disabled: boolean;
    selected: boolean;
    year: number;
    month: number;
  }[] = [];

  // Trailing days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = viewDate.month === 0 ? 11 : viewDate.month - 1;
    const y = viewDate.month === 0 ? viewDate.year - 1 : viewDate.year;
    cells.push({
      day: d,
      current: false,
      disabled: isDisabled(d, m, y),
      selected: isSelected(d, m, y),
      year: y,
      month: m,
    });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    cells.push({
      day: d,
      current: true,
      disabled: isDisabled(d, viewDate.month, viewDate.year),
      selected: isSelected(d, viewDate.month, viewDate.year),
      year: viewDate.year,
      month: viewDate.month,
    });
  }

  // Leading days from next month
  const remaining = 42 - cells.length; // 6 rows * 7 cols
  for (let d = 1; d <= remaining; d++) {
    const m = viewDate.month === 11 ? 0 : viewDate.month + 1;
    const y = viewDate.month === 11 ? viewDate.year + 1 : viewDate.year;
    cells.push({
      day: d,
      current: false,
      disabled: isDisabled(d, m, y),
      selected: isSelected(d, m, y),
      year: y,
      month: m,
    });
  }

  const displayValue = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Select date...";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 border border-border rounded-lg text-sm bg-background text-left focus:ring-2 focus:ring-primary/20 outline-none hover:bg-muted/30 transition-colors"
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {displayValue}
        </span>
        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold">
              {MONTHS[viewDate.month]} {viewDate.year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-medium text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell, i) => (
              <button
                key={i}
                type="button"
                disabled={cell.disabled}
                onClick={() => {
                  onChange(formatDate(cell.year, cell.month, cell.day));
                  setOpen(false);
                }}
                className={cn(
                  "w-8 h-8 rounded-md text-xs font-medium flex items-center justify-center transition-colors",
                  cell.selected && "bg-primary text-primary-foreground",
                  !cell.selected &&
                    cell.current &&
                    !cell.disabled &&
                    "hover:bg-muted text-foreground",
                  !cell.selected && !cell.current && "text-muted-foreground/40",
                  cell.disabled &&
                    !cell.selected &&
                    "text-muted-foreground/20 cursor-not-allowed",
                )}
              >
                {cell.day}
              </button>
            ))}
          </div>

          {/* Clear button */}
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="w-full mt-3 text-xs text-muted-foreground hover:text-destructive transition-colors py-1"
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  );
}
