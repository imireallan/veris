import { useState, useEffect } from "react";
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
import { useToast } from "~/hooks/use-toast";
import { RBAC } from "~/types/rbac";

/* ──────────────────────────── SERVER ──────────────────────────── */

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);

  if (!RBAC.canCreateOrganization(user)) {
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

    const result = await api.post<any>(
      "/api/organizations/",
      payload,
      token,
      request,
    );

    return redirect(`/organizations/${result.id}`);
  } catch (err: any) {
    console.error("Create org error:", err);
    const validationErrors = err.body;

    return {
      error:
        validationErrors?.detail ||
        err.message ||
        "Failed to create organization",
      body: validationErrors,
      success: false,
    };
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const token = await getUserToken(request);

  if (!RBAC.canCreateOrganization(user)) {
    return redirect("/organizations");
  }

  const config = await api
    .get<any>("/api/creation-config/", token, request)
    .catch(() => null);

  return { config, canCreate: true };
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

  useEffect(() => {
    if (actionData?.error) {
      error("Failed to create organization", actionData.error);
    }
  }, [actionData, error]);

  const [prereqStatus, setPrereqStatus] = useState<
    { key: string; completed: boolean }[]
  >([]);

  useEffect(() => {
    if (config?.prerequisites) {
      setPrereqStatus(
        config.prerequisites.map((p: any) => ({
          key: p.key,
          completed: false,
        })),
      );
    }
  }, [config]);

  const handlePrereqValidate = (key: string, value: any) => {
    setPrereqStatus((prev) =>
      prev.map((s) => (s.key === key ? { ...s, completed: value } : s)),
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
        if (!config?.prerequisites || config.prerequisites.length === 0) {
          return true;
        }
        return allRequiredComplete();
      case 3:
        return clientEmail.includes("@");
      default:
        return true;
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/organizations" className="rounded-lg p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            New Organization
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Set up a new client organization in 4 steps.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => goTo(s.id)}
                className={cn(
                  "flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                  step > s.id && "bg-primary/5 text-primary",
                  step === s.id &&
                    "bg-primary/10 text-primary ring-1 ring-primary/30",
                  step < s.id && "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]",
                    step > s.id
                      ? "bg-primary text-primary-foreground"
                      : step === s.id
                        ? "bg-primary/20 text-primary"
                        : "border border-border",
                  )}
                >
                  {step > s.id ? <Check className="h-3 w-3" /> : s.id}
                </span>
                <span className="hidden truncate sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-px flex-1",
                    step > s.id ? "bg-primary/40" : "bg-border",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {actionData?.error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionData.error}
        </div>
      )}

      <div className="rounded-xl border bg-card p-6">
        <div className="space-y-5">
          {step === 1 && (
            <StepWrapper title="Organization Details">
              <Field label="Organization Name" required>
                <input
                  value={name}
                  onChange={(e) => update("name")(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  placeholder="Acme Corporation"
                  autoFocus
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  This will be the public name of your client organization
                </p>
              </Field>

              <Field label="URL Slug">
                <input
                  value={slug}
                  onChange={(e) => update("slug")(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  placeholder="acme-corp"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Auto-generated from name if left empty
                </p>
              </Field>
            </StepWrapper>
          )}

          {step === 2 && (
            <StepWrapper title="Prerequisites">
              {config?.prerequisites?.map((prereq: any) => (
                <div key={prereq.key} className="space-y-4">
                  {prereq.key === "contract_upload" && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <Upload className="h-4 w-4" />
                        {prereq.label}
                      </label>

                      <div className="cursor-pointer rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50">
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
                        <label
                          htmlFor="contract-upload"
                          className="cursor-pointer"
                        >
                          <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
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
                            e.target.value.includes("@"),
                          );
                        }}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                        placeholder="admin@client.com"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
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
                            e.target.value !== "",
                          );
                        }}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                      >
                        <option value="" disabled>
                          Select framework
                        </option>
                        <option value="mining-standard">Mining assurance standard</option>
                        <option value="supplier-questionnaire">Supplier questionnaire</option>
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
                            e.target.value !== "",
                          );
                        }}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
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
                <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                  No prerequisites configured. You can proceed to create the
                  organization.
                </div>
              )}
            </StepWrapper>
          )}

          {step === 3 && (
            <StepWrapper title="Invitation">
              <Field label="Client Admin Email" required>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => update("clientEmail")(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  placeholder="admin@client.com"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  An invitation will be sent to this email address
                </p>
              </Field>

              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Eye className="h-4 w-4 text-primary" />
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
                      <span className="font-medium capitalize">
                        {framework}
                      </span>
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
                      value={
                        framework.charAt(0).toUpperCase() + framework.slice(1)
                      }
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
                      <span className="ml-1 text-foreground">
                        ({contractFile})
                      </span>
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
                  <div className="mt-1 text-xs text-muted-foreground">
                    An invitation email will be sent upon creation
                  </div>
                </ReviewSection>
              </div>
            </StepWrapper>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <button
              type="button"
              onClick={back}
              className={cn(
                "rounded-lg border px-4 py-2",
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
                  "flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium transition-all",
                  canNext()
                    ? "bg-primary text-white shadow-sm hover:opacity-90"
                    : "cursor-not-allowed bg-muted text-muted-foreground opacity-50 grayscale-[0.5]",
                )}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={isSubmittingRemix || isHookSubmitting}
                className="rounded-lg bg-primary px-6 py-2 text-white"
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
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
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
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
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
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        {title}
      </div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
