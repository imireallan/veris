import { useMemo, useRef, useState, useEffect } from "react";
import {
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Layers3,
} from "lucide-react";
import { requireUser, getUserToken } from "~/.server/sessions";
import { ApiError, api } from "~/.server/lib/api";
import { cn } from "~/lib/utils";
import { useWizardForm } from "~/hooks/useWizard";
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui";
import { RBAC } from "~/types/rbac";

const STEPS = [
  { id: 1, label: "Details", icon: FileText },
  { id: 2, label: "Site", icon: Building2 },
  { id: 3, label: "Schedule", icon: Calendar },
  { id: 4, label: "Review", icon: Eye },
] as const;

type InstantiateForm = {
  assessmentName: string;
  siteId: string;
  startDate: string;
  dueDate: string;
};

const unwrap = (response: any) =>
  Array.isArray(response) ? response : (response?.results ?? []);

function todayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

function getApiErrorMessage(
  err: unknown,
  fallback = "Failed to create assessment from template",
) {
  if (err instanceof ApiError) {
    const body = err.body as Record<string, any> | undefined;
    if (body) {
      if (typeof body.detail === "string") return body.detail;
      if (typeof body.error === "string") return body.error;
      if (Array.isArray(body.non_field_errors) && body.non_field_errors[0]) {
        return String(body.non_field_errors[0]);
      }
      for (const [field, value] of Object.entries(body)) {
        if (Array.isArray(value) && value[0]) return `${field}: ${String(value[0])}`;
        if (typeof value === "string") return `${field}: ${value}`;
      }
    }
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

function getOrganizationName(user: any, orgId?: string) {
  if (!orgId) return "Selected organization";
  if (String(user?.activeOrganization?.id) === String(orgId)) {
    return user.activeOrganization.name;
  }
  const recent = user?.recentOrganizations?.find(
    (organization: any) => String(organization.id) === String(orgId),
  );
  return recent?.name ?? "Selected organization";
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);
  const { orgId, templateId } = params;

  if (!orgId || !templateId) {
    throw new Response("Missing organization or template id", { status: 400 });
  }

  const canCreate = RBAC.canCreateAssessments(user, orgId);
  if (!canCreate) {
    return {
      template: null,
      sites: [],
      orgId,
      templateId,
      organizationName: getOrganizationName(user, orgId),
      accessDenied: true,
    };
  }

  const [organization, template] = await Promise.all([
    api.withOrganization
      .get<any>(`/api/organizations/${orgId}/`, orgId, token, request)
      .catch(() => null),
    api.withOrganization
      .get<any>(`/api/templates/${templateId}/`, orgId, token, request)
      .catch(() => null),
  ]);
  const organizationName = organization?.name ?? getOrganizationName(user, orgId);

  if (!template) {
    return {
      template: null,
      sites: [],
      orgId,
      templateId,
      organizationName,
      accessDenied: false,
      notFound: true,
    };
  }

  if (template.status !== "PUBLISHED") {
    return {
      template,
      sites: [],
      orgId,
      templateId,
      organizationName,
      accessDenied: false,
      notPublished: true,
    };
  }

  const sites = await api.withOrganization
    .get<any>("/api/sites/", orgId, token, request)
    .then(unwrap)
    .catch(() => []);

  return {
    template,
    sites,
    orgId,
    templateId,
    organizationName,
    accessDenied: false,
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireUser(request);
  const token = await getUserToken(request);
  const formData = await request.formData();
  const { orgId, templateId } = params;

  if (!orgId || !templateId) {
    return { error: "Missing organization or template id", success: false };
  }

  const assessmentName = (formData.get("assessment_name") || "").toString().trim();
  const siteId = (formData.get("site_id") || "").toString().trim();
  const startDate = (formData.get("start_date") || "").toString().trim();
  const dueDate = (formData.get("due_date") || "").toString().trim();

  const payload: Record<string, any> = {
    organization_id: orgId,
    start_date: startDate ? `${startDate}T00:00:00Z` : `${todayIsoDate()}T00:00:00Z`,
  };
  if (assessmentName) payload.name = assessmentName;
  if (siteId) payload.site_id = siteId;
  if (dueDate) payload.due_date = `${dueDate}T23:59:59Z`;

  try {
    const result = await api.withOrganization.post<any>(
      `/api/templates/${templateId}/instantiate/`,
      payload,
      orgId,
      token,
      request,
    );
    const assessmentId = result.assessment_id || result.id;
    if (!assessmentId) {
      return {
        error: "Template instantiation succeeded but no assessment id was returned.",
        success: false,
      };
    }
    return redirect(`/assessments/${assessmentId}`);
  } catch (err: unknown) {
    return { error: getApiErrorMessage(err), success: false };
  }
}

export default function InstantiateAssessmentRoute() {
  const {
    template,
    sites,
    orgId,
    templateId,
    organizationName,
    accessDenied,
    notFound,
    notPublished,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string; success?: boolean }>();
  const submitRemix = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const siteList = Array.isArray(sites) ? sites : [];
  const siteMap = useMemo(
    () => new Map(siteList.map((site: any) => [site.id, site.name])),
    [siteList],
  );

  const {
    data: form,
    step,
    update,
    next,
    back,
    goTo,
    submit,
    isLastStep,
  } = useWizardForm<InstantiateForm>({
    persistKey: `veris:draft:template-instantiate:${orgId}:${templateId}`,
    totalSteps: 4,
    initialData: {
      assessmentName: "",
      siteId: "",
      startDate: todayIsoDate(),
      dueDate: "",
    },
    onSubmit: async (values) => {
      const formData = new FormData();
      formData.append("assessment_name", values.assessmentName);
      formData.append("site_id", values.siteId);
      formData.append("start_date", values.startDate);
      formData.append("due_date", values.dueDate);
      submitRemix(formData, { method: "post" });
    },
  });

  if (accessDenied) {
    return (
      <StatePage
        title="Access Denied"
        message="You do not have permission to create assessments in this organization."
        backTo={`/organizations/${orgId}/templates`}
        backLabel="Back to templates"
      />
    );
  }

  if (notFound || !template) {
    return (
      <StatePage
        title="Template Not Found"
        message="The template you're looking for doesn't exist."
        backTo={`/organizations/${orgId}/templates`}
        backLabel="Back to templates"
      />
    );
  }

  if (notPublished) {
    return (
      <StatePage
        title="Template Not Published"
        message="Only published templates can be used to create assessments. Publish the template first."
        backTo={`/organizations/${orgId}/templates/${templateId}`}
        backLabel="Back to template"
      />
    );
  }

  const selectedSiteName = form.siteId ? siteMap.get(form.siteId) || form.siteId : "Organization-level";
  const frameworkName = getFrameworkName(template);
  const questionCount = template.question_count ?? template.questions_count ?? template.questions?.length;

  const canNext = () => {
    if (step === 3) return !!form.startDate;
    return true;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/organizations/${orgId}/assessments`}>
              Assessments
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/organizations/${orgId}/templates`}>
              Templates
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New Assessment</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3">
        <Link
          to={`/organizations/${orgId}/templates/${templateId}`}
          className="p-2 hover:bg-muted rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">New Assessment</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Create an assessment from a published template.
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-4">
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((stepItem, index) => (
            <div key={stepItem.id} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => goTo(stepItem.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1",
                  step > stepItem.id && "text-primary bg-primary/5",
                  step === stepItem.id && "text-primary bg-primary/10 ring-1 ring-primary/30",
                  step < stepItem.id && "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0",
                    step > stepItem.id
                      ? "bg-primary text-primary-foreground"
                      : step === stepItem.id
                        ? "bg-primary/20 text-primary"
                        : "border border-border",
                  )}
                >
                  {step > stepItem.id ? <Check className="w-3 h-3" /> : stepItem.id}
                </span>
                <span className="hidden sm:inline truncate">{stepItem.label}</span>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 mx-1",
                    step > stepItem.id ? "bg-primary/40" : "bg-border",
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
          {step === 1 && (
            <StepWrapper
              title="Template Details"
              description="Confirm the template and optionally name this assessment."
            >
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <ReviewRow label="Template" value={template.name} />
                <ReviewRow label="Version" value={template.version || "—"} />
                <ReviewRow label="Framework" value={frameworkName || "—"} />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge>{template.status}</Badge>
                </div>
              </div>

              <Field label="Assessment Name">
                <input
                  type="text"
                  value={form.assessmentName}
                  onChange={(event) => update("assessmentName")(event.target.value)}
                  placeholder={`e.g., ${template.name} - ${new Date().getFullYear()}`}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Leave blank to auto-generate from the template name.
                </p>
              </Field>
            </StepWrapper>
          )}

          {step === 2 && (
            <StepWrapper
              title="Site Selection"
              description="Attach this assessment to a site, or keep it at organization level."
            >
              <Field label="Site">
                <Select
                  value={form.siteId || "none"}
                  onValueChange={(value) => update("siteId")(value === "none" ? "" : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{selectedSiteName}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">Organization-level assessment</SelectItem>
                      {siteList.map((site: any) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}{site.code ? ` (${site.code})` : ""}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </StepWrapper>
          )}

          {step === 3 && (
            <StepWrapper title="Timeline">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Start Date" required>
                  <DatePickerInput
                    value={form.startDate}
                    onChange={update("startDate")}
                    minDate={todayIsoDate()}
                  />
                </Field>
                <Field label="Due Date">
                  <DatePickerInput
                    value={form.dueDate}
                    onChange={update("dueDate")}
                    minDate={form.startDate || todayIsoDate()}
                  />
                </Field>
              </div>
            </StepWrapper>
          )}

          {step === 4 && (
            <StepWrapper title="Review & Create">
              <div className="space-y-4">
                <ReviewSection title="Template" icon={Layers3}>
                  <ReviewRow label="Template" value={template.name} />
                  <ReviewRow label="Framework" value={frameworkName || "—"} />
                  <ReviewRow
                    label="Questions"
                    value={questionCount ? `${questionCount} copied from template` : "Auto-populated from template"}
                  />
                </ReviewSection>
                <ReviewSection title="Organization" icon={Building2}>
                  <ReviewRow label="Organization" value={organizationName || "Selected organization"} />
                  <ReviewRow label="Site" value={selectedSiteName} />
                </ReviewSection>
                <ReviewSection title="Schedule" icon={Calendar}>
                  <ReviewRow label="Start Date" value={formatDisplayDate(form.startDate)} />
                  <ReviewRow label="Due Date" value={form.dueDate ? formatDisplayDate(form.dueDate) : "—"} />
                </ReviewSection>
              </div>
            </StepWrapper>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <button
              type="button"
              onClick={back}
              className={cn("px-4 py-2 border rounded-lg", step === 1 && "invisible")}
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
                  canNext()
                    ? "bg-primary text-white hover:opacity-90 shadow-sm"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50 grayscale-[0.5]",
                )}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary text-white rounded-lg disabled:opacity-60"
              >
                {isSubmitting ? "Creating..." : "Create Assessment"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatePage({
  title,
  message,
  backTo,
  backLabel,
}: {
  title: string;
  message: string;
  backTo: string;
  backLabel: string;
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-2">{message}</p>
        <div className="mt-4">
          <Link to={backTo}>
            <Button variant="outline">{backLabel}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

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

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-foreground text-right min-w-0 break-words">{value}</span>
    </div>
  );
}

function getFrameworkName(template: any) {
  if (!template?.framework) return "";
  if (typeof template.framework === "string") return template.framework_name || template.framework;
  return template.framework.name || template.framework.title || "";
}

function formatDisplayDate(value: string) {
  if (!value) return "—";
  return new Date(value + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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

function DatePickerInput({
  value,
  onChange,
  minDate,
}: {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const date = new Date(value);
      return { year: date.getFullYear(), month: date.getMonth() };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!value) return;
    const date = new Date(value);
    setViewDate({ year: date.getFullYear(), month: date.getMonth() });
  }, [value]);

  const firstDay = new Date(viewDate.year, viewDate.month, 1).getDay();
  const totalDays = daysInMonth(viewDate.year, viewDate.month);
  const prevMonthDays =
    viewDate.month === 0
      ? daysInMonth(viewDate.year - 1, 11)
      : daysInMonth(viewDate.year, viewDate.month - 1);

  const isDisabled = (day: number, month: number, year: number) => {
    if (!minDate) return false;
    const date = new Date(year, month, day);
    const min = new Date(minDate);
    date.setHours(0, 0, 0, 0);
    min.setHours(0, 0, 0, 0);
    return date < min;
  };

  const isSelected = (day: number, month: number, year: number) => {
    if (!value) return false;
    const parts = value.split("-");
    return +parts[2] === day && +parts[1] - 1 === month && +parts[0] === year;
  };

  const cells: Array<{
    day: number;
    current: boolean;
    disabled: boolean;
    selected: boolean;
    year: number;
    month: number;
  }> = [];

  for (let index = firstDay - 1; index >= 0; index--) {
    const day = prevMonthDays - index;
    const month = viewDate.month === 0 ? 11 : viewDate.month - 1;
    const year = viewDate.month === 0 ? viewDate.year - 1 : viewDate.year;
    cells.push({ day, current: false, disabled: isDisabled(day, month, year), selected: isSelected(day, month, year), year, month });
  }

  for (let day = 1; day <= totalDays; day++) {
    cells.push({ day, current: true, disabled: isDisabled(day, viewDate.month, viewDate.year), selected: isSelected(day, viewDate.month, viewDate.year), year: viewDate.year, month: viewDate.month });
  }

  const remaining = 42 - cells.length;
  for (let day = 1; day <= remaining; day++) {
    const month = viewDate.month === 11 ? 0 : viewDate.month + 1;
    const year = viewDate.month === 11 ? viewDate.year + 1 : viewDate.year;
    cells.push({ day, current: false, disabled: isDisabled(day, month, year), selected: isSelected(day, month, year), year, month });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full flex items-center justify-between px-3 py-2 border border-border rounded-lg text-sm bg-background text-left focus:ring-2 focus:ring-primary/20 outline-none hover:bg-muted/30 transition-colors"
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {value ? formatDisplayDate(value) : "Select date..."}
        </span>
        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() =>
                setViewDate((current) =>
                  current.month === 0
                    ? { year: current.year - 1, month: 11 }
                    : { ...current, month: current.month - 1 },
                )
              }
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold">
              {MONTHS[viewDate.month]} {viewDate.year}
            </span>
            <button
              type="button"
              onClick={() =>
                setViewDate((current) =>
                  current.month === 11
                    ? { year: current.year + 1, month: 0 }
                    : { ...current, month: current.month + 1 },
                )
              }
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell, index) => (
              <button
                key={index}
                type="button"
                disabled={cell.disabled}
                onClick={() => {
                  onChange(formatDate(cell.year, cell.month, cell.day));
                  setOpen(false);
                }}
                className={cn(
                  "w-8 h-8 rounded-md text-xs font-medium flex items-center justify-center transition-colors",
                  cell.selected && "bg-primary text-primary-foreground",
                  !cell.selected && cell.current && !cell.disabled && "hover:bg-muted text-foreground",
                  !cell.selected && !cell.current && "text-muted-foreground/40",
                  cell.disabled && !cell.selected && "text-muted-foreground/20 cursor-not-allowed",
                )}
              >
                {cell.day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
