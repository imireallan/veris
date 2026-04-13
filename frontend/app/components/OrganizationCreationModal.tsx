import * as React from "react";
import { Form, useNavigation, useActionData, useNavigate } from "react-router";
import { cn } from "~/lib/utils";
import { X, HelpCircle, Upload, Building2, Mail, BookOpen, Briefcase, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { PrerequisiteChecklist, type Prerequisite, type PrerequisiteStatus } from "./PrerequisiteChecklist";
import { MultiStepForm } from "./MultiStepForm";

interface OrganizationCreationConfig {
  prerequisites: Prerequisite[];
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
}

const STEPS = [
  { id: "details", title: "Organization Details", description: "Basic information" },
  { id: "prerequisites", title: "Prerequisites", description: "Required items" },
  { id: "invitation", title: "Invitation", description: "Team access" },
];

export function OrganizationCreationModal({
  open,
  onOpenChange,
  config,
}: OrganizationCreationModalProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState<Record<string, any>>({
    name: "",
    slug: "",
    framework: "",
    sector: "",
    clientEmail: "",
    contractFile: null,
  });
  const [prereqStatus, setPrereqStatus] = React.useState<PrerequisiteStatus[]>([]);
  const [createdOrg, setCreatedOrg] = React.useState<{ name: string; email: string } | null>(null);

  const navigation = useNavigation();
  const actionData = useActionData<any>();
  const isSubmitting = navigation.state === "submitting";
  const navigate = useNavigate();

  // Extract validation errors from actionData
  const errors = actionData?.error ? actionData.body || actionData.errors : null;

  // Handle successful creation
  React.useEffect(() => {
    if (actionData?.success && createdOrg) {
      // Stay on success screen for 2 seconds then redirect
      const timer = setTimeout(() => {
        onOpenChange(false);
        navigate(".", { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [actionData?.success, createdOrg, onOpenChange, navigate]);

  // Initialize prerequisites status
  React.useEffect(() => {
    if (config?.prerequisites) {
      setPrereqStatus(
        config.prerequisites.map((p) => ({
          key: p.key,
          completed: false,
        }))
      );
    }
  }, [config]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrereqValidate = (key: string, value: any) => {
    setPrereqStatus((prev) =>
      prev.map((s) => (s.key === key ? { ...s, completed: value } : s))
    );
  };

  const allRequiredComplete = () => {
    if (!config?.prerequisites) return true;
    return config.prerequisites
      .filter((p) => p.required)
      .every((p) => prereqStatus.find((s) => s.key === p.key)?.completed);
  };

  const canProceedToStep = (stepIndex: number) => {
    if (stepIndex === 0) return true;
    if (stepIndex === 1) return formData.name.trim().length > 0;
    if (stepIndex === 2) return allRequiredComplete();
    return true;
  };

  const handleStepChange = (step: number) => {
    if (canProceedToStep(step)) {
      setCurrentStep(step);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization Name *</label>
              <Input
                placeholder="Acme Corporation"
                value={formData.name}
                onChange={(e) =>
                  handleInputChange("name", e.target.value)
                }
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This will be the public name of your client organization
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL Slug</label>
              <Input
                placeholder="acme-corp"
                value={formData.slug}
                onChange={(e) =>
                  handleInputChange("slug", e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated from name if left empty
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            {config?.prerequisites.map((prereq) => (
              <div key={prereq.key}>
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
                            handleInputChange("contractFile", file);
                            handlePrereqValidate("contract_upload", true);
                          }
                        }}
                        className="hidden"
                        id="contract-upload"
                      />
                      <label htmlFor="contract-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {formData.contractFile
                            ? formData.contractFile.name
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {prereq.label}
                    </label>
                    <Input
                      type="email"
                      placeholder="admin@client.com"
                      onChange={(e) => {
                        handleInputChange("clientEmail", e.target.value);
                        handlePrereqValidate(
                          "client_email",
                          e.target.value.includes("@")
                        );
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      {prereq.description}
                    </p>
                  </div>
                )}

                {prereq.key === "framework_selection" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {prereq.label}
                    </label>
                    <select
                      className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(e) => {
                        handleInputChange("framework", e.target.value);
                        handlePrereqValidate(
                          "framework_selection",
                          e.target.value !== ""
                        );
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select framework
                      </option>
                      <option value="bettercoal">Bettercoal</option>
                      <option value="cgwg">CGWG</option>
                      <option value="custom">Custom Framework</option>
                    </select>
                  </div>
                )}

                {prereq.key === "industry_sector" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {prereq.label}
                    </label>
                    <select
                      className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(e) => {
                        handleInputChange("sector", e.target.value);
                        handlePrereqValidate(
                          "industry_sector",
                          e.target.value !== ""
                        );
                      }}
                      defaultValue=""
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
                  </div>
                )}
              </div>
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

      case 2:
        // Show success screen if organization was created
        if (actionData?.success && createdOrg) {
          return (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Organization Created!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Invitation sent to <span className="font-medium">{createdOrg.email}</span>
                </p>
              </div>
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Organization:</span>
                      <span className="font-medium">{createdOrg.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invitation:</span>
                      <span className="text-green-600">Sent ✓</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground">
                Redirecting...
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Client Admin Email *</label>
              <Input
                type="email"
                placeholder="admin@client.com"
                value={formData.clientEmail}
                onChange={(e) => handleInputChange("clientEmail", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                An invitation will be sent to this email address
              </p>
            </div>

            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Organization:</span>
                  <span className="font-medium">{formData.name || "—"}</span>
                </div>
                {formData.framework && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Framework:</span>
                    <span className="font-medium capitalize">{formData.framework}</span>
                  </div>
                )}
                {formData.sector && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sector:</span>
                    <span className="font-medium capitalize">{formData.sector}</span>
                  </div>
                )}
                {formData.contractFile && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract:</span>
                    <span className="font-medium text-green-600">Uploaded ✓</span>
                  </div>
                )}
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>
                {config?.helper_text?.title || "Create New Organization"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {config?.helper_text?.description ||
                  "Set up a new client organization on Veris"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogClose className="absolute right-4 top-4" />

        {/* Display validation errors */}
        {errors && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(errors).map(([field, messages]: [string, any]) => (
                  <li key={field}>
                    <span className="capitalize">{field.replace(/_/g, " ")}:</span>{" "}
                    {Array.isArray(messages) ? messages.join(", ") : messages}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {config?.helper_text?.warning && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{config.helper_text.warning}</AlertDescription>
          </Alert>
        )}

        <Form
          method="post"
          className="space-y-4"
        >
          <input type="hidden" name="name" value={formData.name} />
          <input type="hidden" name="slug" value={formData.slug} />
          <input type="hidden" name="framework" value={formData.framework} />
          <input type="hidden" name="sector" value={formData.sector} />
          <input type="hidden" name="clientEmail" value={formData.clientEmail} />

          <MultiStepForm
            steps={STEPS}
            currentStep={currentStep}
            onStepChange={handleStepChange}
            onComplete={() => {
              // Form submission handled by Form component
            }}
            canProceed={currentStep === 0 ? formData.name.trim().length > 0 : currentStep === 1 ? allRequiredComplete() : true}
            canSubmit={allRequiredComplete()}
            isSubmitting={isSubmitting}
          >
            {renderStepContent()}
          </MultiStepForm>
        </Form>

        {/* Helper Accordion */}
        <div className="mt-4">
          <Accordion>
            <AccordionItem value="help">
            <AccordionTrigger className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Need help with organization creation?
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground">
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
            </AccordionContent>
          </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
}
