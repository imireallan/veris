import * as React from "react";
import { useNavigate } from "react-router";
import { cn } from "~/lib/utils";
import {
  X,
  HelpCircle,
  Upload,
  Building2,
  Mail,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Sparkle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { useWizardForm } from "~/hooks/useWizard";

interface OrganizationCreationConfig {
  prerequisites: { key: string; label: string; description: string; required: boolean }[];
  can_create: boolean;
  helper_text: {
    title: string;
    description: string;
    warning: string;
  };
}

interface OrganizationCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: OrganizationCreationConfig;
  onSubmit: (data: OrgFormData) => void;
  isSubmitting: boolean;
  actionData?: { success?: boolean; error?: string; message?: string };
}

interface OrgFormData {
  name: string;
  slug: string;
  framework: string;
  sector: string;
  clientEmail: string;
  contractFile: File | null;
}

const STEPS = [
  { id: 1, title: "Organization", description: "Basic details" },
  { id: 2, title: "Prerequisites", description: "Required items" },
  { id: 3, title: "Invitation", description: "Team access" },
  { id: 4, title: "Review", description: "Confirm & create" },
];

export function OrganizationCreationModal({
  open,
  onOpenChange,
  config,
  onSubmit,
  isSubmitting,
  actionData,
}: OrganizationCreationModalProps) {
  const navigate = useNavigate();
  const [prereqStatus, setPrereqStatus] = React.useState<Record<string, boolean>>({});
  const [contractFile, setContractFile] = React.useState<File | null>(null);

  const {
    data: form,
    step,
    update,
    next,
    back,
    goTo,
    submit,
    isLastStep,
  } = useWizardForm<OrgFormData>({
    persistKey: "veris:draft:org-new",
    totalSteps: 4,
    initialData: {
      name: "",
      slug: "",
      framework: "",
      sector: "",
      clientEmail: "",
      contractFile: null,
    },
    onSubmit: async (values) => {
      onSubmit(values);
    },
  });

  // Initialize prerequisites status
  React.useEffect(() => {
    if (config?.prerequisites && open) {
      const initialStatus: Record<string, boolean> = {};
      config.prerequisites.forEach((p) => {
        initialStatus[p.key] = false;
      });
      setPrereqStatus(initialStatus);
    }
  }, [config, open]);

  // Handle successful creation
  React.useEffect(() => {
    if (actionData?.success && isLastStep) {
      const timer = setTimeout(() => {
        onOpenChange(false);
        navigate(".", { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [actionData?.success, isLastStep, onOpenChange, navigate]);

  // Extract validation errors
  const errors = actionData?.error ? (actionData as any).body || (actionData as any).errors : null;

  const { name, slug, framework, sector, clientEmail } = form;

  const canProceed = () => {
    switch (step) {
      case 1:
        return name.trim().length > 0;
      case 2:
        if (!config?.prerequisites) return true;
        return config.prerequisites
          .filter((p) => p.required)
          .every((p) => prereqStatus[p.key]);
      case 3:
        return clientEmail.includes("@");
      default:
        return true;
    }
  };

  const handlePrereqValidate = (key: string, value: boolean) => {
    setPrereqStatus((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setContractFile(file);
      handlePrereqValidate("contract_upload", true);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Organization Name *
              </label>
              <Input
                placeholder="Acme Corporation"
                value={name}
                onChange={(e) => update("name")(e.target.value)}
                autoFocus
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                This will be the public name of your client organization
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">URL Slug</label>
              <Input
                placeholder="acme-corp"
                value={slug}
                onChange={(e) => update("slug")(e.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated from name if left empty
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {config?.prerequisites.map((prereq) => (
              <Card key={prereq.key} className={cn("transition-colors", prereqStatus[prereq.key] ? "border-primary/50 bg-primary/5" : "")}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {prereqStatus[prereq.key] ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <CardTitle className="text-base">{prereq.label}</CardTitle>
                    {prereq.required && (
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <CardDescription>{prereq.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {prereq.key === "contract_upload" && (
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                        contractFile
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="contract-upload"
                      />
                      <label htmlFor="contract-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {contractFile ? contractFile.name : "Click to upload contract"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, DOC, or DOCX (max 10MB)
                        </p>
                      </label>
                    </div>
                  )}

                  {prereq.key === "client_email" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="admin@client.com"
                          value={clientEmail}
                          onChange={(e) => {
                            update("clientEmail")(e.target.value);
                            handlePrereqValidate("client_email", e.target.value.includes("@"));
                          }}
                          className="h-10"
                        />
                      </div>
                    </div>
                  )}

                  {prereq.key === "framework_selection" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          value={framework}
                          onChange={(e) => {
                            update("framework")(e.target.value);
                            handlePrereqValidate("framework_selection", e.target.value !== "");
                          }}
                        >
                          <option value="" disabled>Select framework</option>
                          <option value="bettercoal">Bettercoal</option>
                          <option value="cgwg">CGWG</option>
                          <option value="custom">Custom Framework</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {prereq.key === "industry_sector" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          value={sector}
                          onChange={(e) => {
                            update("sector")(e.target.value);
                            handlePrereqValidate("industry_sector", e.target.value !== "");
                          }}
                        >
                          <option value="" disabled>Select sector</option>
                          <option value="mining">Mining & Extractives</option>
                          <option value="agriculture">Agriculture</option>
                          <option value="manufacturing">Manufacturing</option>
                          <option value="textiles">Textiles & Apparel</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {!config?.prerequisites?.length && (
              <Alert>
                <AlertDescription>
                  No prerequisites configured. You can proceed to create the organization.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Client Admin Email *
              </label>
              <Input
                type="email"
                placeholder="admin@client.com"
                value={clientEmail}
                onChange={(e) => update("clientEmail")(e.target.value)}
                className="h-11"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                An invitation will be sent to this email address
              </p>
            </div>

            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkle className="w-4 h-4 text-primary" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
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
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Uploaded
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 text-center py-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Ready to Create</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Review the details below and click Create Organization
              </p>
            </div>
            <Card className="bg-muted/50 text-left">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Organization Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{name}</span>
                </div>
                {slug && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slug:</span>
                    <span className="font-mono text-xs">{slug}</span>
                  </div>
                )}
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admin Email:</span>
                  <span className="font-medium">{clientEmail}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>
                {config?.helper_text?.title || "Create New Organization"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {config?.helper_text?.description || "Set up a new client organization on Veris"}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 py-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    step > s.id
                      ? "bg-primary text-primary-foreground"
                      : step === s.id
                      ? "bg-primary/10 text-primary ring-2 ring-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                </div>
                <div className="hidden sm:block">
                  <p className={cn("text-sm font-medium", step === s.id ? "text-foreground" : "text-muted-foreground")}>
                    {s.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("flex-1 h-0.5", step > s.id ? "bg-primary" : "bg-muted")} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Validation Errors */}
        {errors && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(errors).map(([field, messages]: [string, any]) => (
                  <li key={field}>
                    <span className="capitalize">{field.replace(/_/g, " ")}: </span>
                    {Array.isArray(messages) ? messages.join(", ") : messages}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {config?.helper_text?.warning && (
          <Alert variant="destructive">
            <AlertDescription>{config.helper_text.warning}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <div className="py-2">{renderStepContent()}</div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={back}
            disabled={step === 1 || isSubmitting}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {step < 4 ? (
              <Button
                type="button"
                onClick={next}
                disabled={!canProceed() || isSubmitting}
                className="gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={submit}
                disabled={!canProceed() || isSubmitting}
                className="gap-2 min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Create Organization
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Helper Accordion */}
        <div className="mt-2">
          <details className="group">
            <summary className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer list-none">
              <HelpCircle className="w-4 h-4" />
              Need help with organization creation?
            </summary>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground pl-6">
              <p>
                Creating a new organization sets up a dedicated workspace for your client.
                They will receive an invitation email to join and manage their compliance activities.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Ensure you have client approval before creating their organization</li>
                <li>The client admin will have full access to manage their workspace</li>
                <li>You can add additional team members after creation</li>
                <li>Organizations can be suspended but not deleted</li>
              </ul>
            </div>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  );
}
