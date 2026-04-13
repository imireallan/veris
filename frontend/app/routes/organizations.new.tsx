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
  Building2,
  Mail,
  CheckCircle2,
  Eye,
  Upload,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useWizardForm } from "~/hooks/useWizard";
import { useOrganizationCreationConfig } from "~/hooks/useOrganizationCreationConfig";
import { useToast } from "~/hooks/use-toast";

/* ──────────────────────────── SERVER ──────────────────────────── */

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);

  if (user.fallbackRole !== "SUPERADMIN") {
    throw new Response("Forbidden", { status: 403 });
  }

  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries());

  try {
    const payload: any = {
      name: data.name as string,
      slug: (data.slug as string) || undefined,
    };

    // Only include optional fields if they have values
    if (data.framework) payload.framework = data.framework;
    if (data.sector) payload.sector = data.sector;
    if (data.clientEmail) payload.client_email = data.clientEmail;

    const result = await api.post("/api/organizations/", payload, token, request);
    return redirect(`/organizations/${result.id}`);
  } catch (err: any) {
    console.error("Create org error:", err);
    // Backend returns validation errors as { field: ['error message'] }
    const validationErrors = err.body;
    return {
      error: validationErrors?.detail || err.message || "Failed to create organization",
      body: validationErrors,
      success: false,
    };
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);

  if (user.fallbackRole !== "SUPERADMIN") {
    return redirect("/organizations");
  }

  const config = await api
    .get<any>("/api/organizations/creation-config/", token, request)
    .catch(() => null);

  return { config };
}

/* ──────────────────────────── STEPS CONFIG ──────────────────────────── */

const STEPS = [
  { id: 1, label: "Details", icon: Building2 },
  { id: 2, label: "Prerequisites", icon: CheckCircle2 },
  { id: 3, label: "Invitation", icon: Mail },
  { id: 4, label: "Review", icon: Eye },
] as const;

/* ──────────────────────────── CLIENT ──────────────────────────── */

interface OrganizationForm {
  name: string;
  slug: string;
  framework: string;
  sector: string;
  clientEmail: string;
  contractFile: string | null;
  showPrerequisites: boolean;
}

export default function NewOrganizationRoute() {
  const { config } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string; success?: boolean }>();
  const submitRemix = useSubmit();
  const navigation = useNavigation();
  const isSubmittingRemix = navigation.state === "submitting";
  const { success, error } = useToast();

  const STORAGE_KEY = "veris:draft:organization-new";

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
  } = useWizardForm<OrganizationForm>({
    persistKey: STORAGE_KEY,
    totalSteps: 4,
    initialData: {
      name: "",
      slug: "",
      framework: "",
      sector: "",
      clientEmail: "",
      contractFile: null,
      showPrerequisites: true,
    },
    onSubmit: async (values) => {
      const formData = new FormData();

      const keyMap: Record<string, string> = {
        clientEmail: "clientEmail",
        contractFile: "contractFile",
      };

      Object.entries(values).forEach(([key, value]) => {
        if (key === "showPrerequisites") return;
        if (value !== null && value !== "") {
          const targetKey = keyMap[key] || key;
          formData.append(targetKey, String(value));
        }
      });

      submitRemix(formData, { method: "post" });
    },
  });

  const { name, slug, framework, sector, clientEmail, contractFile } = form;

  // Show toast feedback from action
  useEffect(() => {
    if (actionData?.error) {
      error("Failed to create organization", actionData.error);
    }
  }, [actionData, success, error]);

  const [prereqStatus, setPrereqStatus] = useState<
    { key: string; completed: boolean }[]
  >([]);

  // Initialize prerequisites status
  useEffect(() => {
    if (config?.prerequisites) {
      setPrereqStatus(
        config.prerequisites.map((p: any) => ({
          key: p.key,
          completed: false,
        }))
      );
    }
  }, [config]);

  const handlePrereqValidate = (key: string, value: any) => {
    setPrereqStatus((prev) =>
      prev.map((s) => (s.key === key ? { ...s, completed: value } : s))
    );
  };

  const allRequiredComplete = () => {
    if (!config?.prerequisites) return true;
    return config.prerequisites
      .filter((p: any) => p.required)
      .every((p: any) => prereqStatus.find((s) => s.key === p.key)?.completed);
  };

  const canNext = () => {
    switch (step) {
      case 1:
        return name.trim().length > 0;
      case 2:
        if (!config?.prerequisites || config.prerequisites.length === 0)
          return true;
        return allRequiredComplete();
      case 3:
        return clientEmail.includes("@");
      default:
        return true;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/organizations" className="p-2 hover:bg-muted rounded-lg">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            New Organization
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Set up a new client organization in 4 steps.
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
                  step < s.id && "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0",
                    step > s.id
                      ? "bg-primary text-primary-foreground"
                      : step === s.id
                      ? "bg-primary/20 text-primary"
                      : "border border-border"
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
                    step > s.id ? "bg-primary/40" : "bg-border"
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
          {/* STEP 1: DETAILS */}
          {step === 1 && (
            <StepWrapper title="Organization Details">
              <Field label="Organization Name" required>
                <input
                  value={name}
                  onChange={(e) => update("name")(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                  placeholder="Acme Corporation"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be the public name of your client organization
                </p>
              </Field>
              <Field label="URL Slug">
                <input
                  value={slug}
                  onChange={(e) => update("slug")(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                  placeholder="acme-corp"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-generated from name if left empty
                </p>
              </Field>
            </StepWrapper>
          )}

          {/* STEP 2: PREREQUISITES */}
          {step === 2 && (
            <StepWrapper title="Prerequisites">
              {config?.prerequisites?.map((prereq: any) => (
                <div key={prereq.key} className="space-y-4">
                  {prereq.key === "contract_upload" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        {prereq.label}
                      </label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              update("contractFile")(file.name);
                              handlePrereqValidate("contract_upload", true);
                            }
                          }}
                          className="hidden"
                          id="contract-upload"
                        />
                        <label htmlFor="contract-upload" className="cursor-pointer">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {contractFile
                              ? contractFile
                              : "Click to upload contract"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, DOC, or DOCX (max 10MB)
                          </p>
                        </label>
                      </div>
                    </div>
                  )}

                  {prereq.key === "client_email" && (
                    <Field label={prereq.label}>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => {
                          update("clientEmail")(e.target.value);
                          handlePrereqValidate(
                            "client_email",
                            e.target.value.includes("@")
                          );
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                        placeholder="admin@client.com"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {prereq.description}
                      </p>
                    </Field>
                  )}

                  {prereq.key === "framework_selection" && (
                    <Field label={prereq.label}>
                      <select
                        value={framework}
                        onChange={(e) => {
                          update("framework")(e.target.value);
                          handlePrereqValidate(
                            "framework_selection",
                            e.target.value !== ""
                          );
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                      >
                        <option value="" disabled>
                          Select framework
                        </option>
                        <option value="bettercoal">Bettercoal</option>
                        <option value="cgwg">CGWG</option>
                        <option value="custom">Custom Framework</option>
                      </select>
                    </Field>
                  )}

                  {prereq.key === "industry_sector" && (
                    <Field label={prereq.label}>
                      <select
                        value={sector}
                        onChange={(e) => {
                          update("sector")(e.target.value);
                          handlePrereqValidate(
                            "industry_sector",
                            e.target.value !== ""
                          );
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                      >
                        <option value="" disabled>
                          Select sector
                        </option>
                        <option value="mining">Mining & Extractives</option>
                        <option value="agriculture">Agriculture</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="textiles">Textiles & Apparel</option>
                        <option value="other">Other</option>
                      </select>
                    </Field>
                  )}
                </div>
              ))}

              {!config?.prerequisites?.length && (
                <div className="px-4 py-3 rounded-lg bg-muted text-sm text-muted-foreground">
                  No prerequisites configured. You can proceed to create the organization.
                </div>
              )}
            </StepWrapper>
          )}

          {/* STEP 3: INVITATION */}
          {step === 3 && (
            <StepWrapper title="Invitation">
              <Field label="Client Admin Email" required>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => update("clientEmail")(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                  placeholder="admin@client.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  An invitation will be sent to this email address
                </p>
              </Field>

              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Eye className="w-4 h-4 text-primary" />
                  Quick Summary
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Organization:</span>
                    <span className="font-medium">{name || "—"}</span>
                  </div>
                  {framework && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Framework:</span>
                      <span className="font-medium capitalize">{framework}</span>
                    </div>
                  )}
                  {sector && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sector:</span>
                      <span className="font-medium capitalize">{sector}</span>
                    </div>
                  )}
                  {contractFile && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contract:</span>
                      <span className="text-green-600">Uploaded ✓</span>
                    </div>
                  )}
                </div>
              </div>
            </StepWrapper>
          )}

          {/* STEP 4: REVIEW */}
          {step === 4 && (
            <StepWrapper title="Review & Create">
              <div className="space-y-4">
                <ReviewSection title="Organization Details" icon={Building2}>
                  <ReviewRow label="Name" value={name || "—"} />
                  {slug && <ReviewRow label="Slug" value={slug} />}
                </ReviewSection>

                <ReviewSection title="Prerequisites" icon={CheckCircle2}>
                  {framework && (
                    <ReviewRow
                      label="Framework"
                      value={framework.charAt(0).toUpperCase() + framework.slice(1)}
                    />
                  )}
                  {sector && (
                    <ReviewRow
                      label="Sector"
                      value={sector.charAt(0).toUpperCase() + sector.slice(1)}
                    />
                  )}
                  {contractFile && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Contract: </span>
                      <span className="text-green-600">Uploaded ✓</span>
                      <span className="text-foreground ml-1">({contractFile})</span>
                    </div>
                  )}
                  {!framework && !sector && !contractFile && (
                    <div className="text-sm text-muted-foreground">
                      No prerequisites configured
                    </div>
                  )}
                </ReviewSection>

                <ReviewSection title="Invitation" icon={Mail}>
                  <ReviewRow label="Admin Email" value={clientEmail || "—"} />
                  <div className="text-xs text-muted-foreground mt-1">
                    An invitation email will be sent upon creation
                  </div>
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
                step === 1 && "invisible"
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
                  canNext()
                    ? "bg-primary text-white hover:opacity-90 shadow-sm"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50 grayscale-[0.5]"
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
                {isSubmittingRemix ? "Creating..." : "Create Organization"}
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
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
