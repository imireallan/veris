import { type ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  FileText,
  Focus,
  Minimize2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";

const STEP_DURATION_MS = 4300;

const steps = [
  {
    id: 0,
    label: "Upload Evidence",
    title: "Sustainability evidence uploaded",
    description:
      "Veris ingests supplier policies, site evidence, and compliance files into a structured assessment workflow.",
    detail:
      "Evidence enters one shared review path instead of being split across inboxes, shared drives, and spreadsheet trackers.",
    icon: Upload,
  },
  {
    id: 1,
    label: "AI Analysis",
    title: "AI reviews controls and evidence",
    description:
      "The system extracts signals, compares requirements, and flags likely compliance gaps for assessor review.",
    detail:
      "Reviewers receive a structured starting point instead of manually piecing together risk signals from raw documents.",
    icon: Brain,
  },
  {
    id: 2,
    label: "Gap Detection",
    title: "Key risks and gaps are identified",
    description:
      "Potential non-conformities, missing documents, and weaker control areas are highlighted automatically.",
    detail:
      "Severity labels help teams focus on what must be validated, remediated, or escalated next.",
    icon: AlertTriangle,
  },
  {
    id: 3,
    label: "Insights Dashboard",
    title: "Insights and progress update live",
    description:
      "Dashboards, scoring summaries, and next actions become visible for teams, assessors, and management.",
    detail:
      "This gives stakeholders an executive-ready view without waiting for manual summary preparation.",
    icon: BarChart3,
  },
  {
    id: 4,
    label: "Report Ready",
    title: "Assessment output is ready to act on",
    description:
      "Veris turns the workflow into clear findings, recommended actions, and exportable reporting.",
    detail:
      "The final state is designed to feel complete, credible, and ready for follow-through.",
    icon: FileText,
  },
] as const;

const evidenceFiles = [
  "Supplier Code of Conduct.pdf",
  "Worker Safety Audit Q2.pdf",
  "Site Training Register.xlsx",
  "Environmental Incident Log.csv",
] as const;

const analysisTasks = [
  "Extracting controls and policy signals",
  "Comparing evidence against framework requirements",
  "Generating assessor-ready recommendations",
] as const;

const findings = [
  {
    title: "Missing grievance policy evidence",
    severity: "High",
    status: "Needs review",
  },
  {
    title: "Incomplete safety training records",
    severity: "Medium",
    status: "Action required",
  },
  {
    title: "Waste management controls documented",
    severity: "Low",
    status: "Verified",
  },
] as const;

const recommendations = [
  "Request signed grievance mechanism policy from supplier.",
  "Schedule follow-up review for missing training records.",
  "Add evidence mapping to the final assessment report.",
] as const;

const dashboardBars = [
  { label: "Labor", value: 78 },
  { label: "Safety", value: 61 },
  { label: "Environment", value: 89 },
  { label: "Remediation", value: 72 },
] as const;

export function VerisWorkflowDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isCleanMode, setIsCleanMode] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setInterval(() => {
      setCurrentStep((prev) => (prev >= steps.length - 1 ? 0 : prev + 1));
    }, STEP_DURATION_MS);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    if (!isCleanMode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCleanMode]);

  const activeStep = steps[currentStep];
  const ActiveIcon = activeStep.icon;

  const workflowContent = (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur md:flex-row md:items-end md:justify-between md:p-6">
        <div className="space-y-3">
          <Badge className="border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary hover:bg-primary/10">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Veris workflow demo
          </Badge>
          {!isCleanMode ? (
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                A controlled, recordable walkthrough of the product story
              </h3>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                This sequence is designed for marketing capture. It shows evidence upload, AI review, gap detection,
                live insight updates, and a final action-ready reporting state without relying on backend data.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <h3 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                Clean recording mode
              </h3>
              <p className="text-sm text-muted-foreground">
                Minimized chrome so you can focus the recording on the workflow itself.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCleanMode((value) => !value)}
            className="h-10 rounded-xl px-4 text-sm font-medium"
          >
            {isCleanMode ? (
              <>
                <Minimize2 className="mr-2 h-4 w-4" />
                Exit recording mode
              </>
            ) : (
              <>
                <Focus className="mr-2 h-4 w-4" />
                Recording mode
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={() => setIsPlaying((value) => !value)}
            className="h-10 rounded-xl px-4 text-sm font-medium"
          >
            {isPlaying ? (
              <>
                <CirclePause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <CirclePlay className="mr-2 h-4 w-4" />
                Play
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCurrentStep(0);
              setIsPlaying(true);
            }}
            className="h-10 rounded-xl px-4 text-sm font-medium"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Restart
          </Button>
          {!isCleanMode ? (
            <div className="text-xs leading-5 text-muted-foreground">
              Recording mode hides extra framing so the workflow reads more clearly on screen.
            </div>
          ) : null}
        </div>
      </div>

      <ProgressRail currentStep={currentStep} onStepSelect={setCurrentStep} compact={isCleanMode} />

      <div className={cn("grid gap-6", isCleanMode ? "xl:grid-cols-[1fr_1.05fr]" : "lg:grid-cols-[0.94fr_1.06fr]")}>
        <Card className="overflow-hidden border-white/10 bg-[radial-gradient(circle_at_top,_hsla(160,84%,39%,0.16),_transparent_42%),linear-gradient(180deg,rgba(7,17,15,0.98),rgba(10,24,21,0.98))] text-white shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
          <CardContent className={cn("space-y-6", isCleanMode ? "p-7 md:p-8" : "p-6 md:p-7")}>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-white/70">
                Current moment
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="space-y-4"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/16 text-primary shadow-[0_0_0_1px_rgba(16,185,129,0.15)]">
                    <ActiveIcon className="h-7 w-7" />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-2xl font-semibold tracking-tight md:text-3xl">{activeStep.title}</h4>
                    <p className="max-w-xl text-sm leading-7 text-white/82 md:text-base">{activeStep.description}</p>
                    <p className="max-w-xl text-sm leading-7 text-white/58">{activeStep.detail}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="space-y-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3 text-sm text-white/68">
                <span>
                  {currentStep + 1} of {steps.length} stages
                </span>
                <span>{isPlaying ? "Auto-play on" : "Paused"}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.75, ease: "easeInOut" }}
                />
              </div>
              <div className="space-y-2 pt-1">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3 text-sm">
                    <div
                      className={cn(
                        "h-2.5 w-2.5 rounded-full transition-colors",
                        currentStep === index
                          ? "bg-primary shadow-[0_0_16px_rgba(16,185,129,0.65)]"
                          : currentStep > index
                            ? "bg-emerald-400"
                            : "bg-white/20"
                      )}
                    />
                    <span className={cn(currentStep === index ? "text-white" : "text-white/58")}>{step.label}</span>
                    {index < steps.length - 1 ? <ArrowRight className="h-3.5 w-3.5 text-white/28" /> : null}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <UploadStage currentStep={currentStep} />
          <AnalysisStage currentStep={currentStep} />
          <FindingsStage currentStep={currentStep} />
          <DashboardStage currentStep={currentStep} />
          <ReportStage currentStep={currentStep} />
        </div>
      </div>
    </div>
  );

  if (isCleanMode) {
    return (
      <div className="fixed inset-0 z-50 overflow-auto bg-background/95 p-4 backdrop-blur-sm md:p-6">
        <div className="mx-auto max-w-[1600px]">{workflowContent}</div>
      </div>
    );
  }

  return workflowContent;
}

function ProgressRail({
  currentStep,
  onStepSelect,
  compact = false,
}: {
  currentStep: number;
  onStepSelect: (step: number) => void;
  compact?: boolean;
}) {
  return (
    <div className="grid gap-3 xl:grid-cols-5">
      {steps.map((step) => {
        const active = currentStep === step.id;
        const complete = currentStep > step.id;
        const Icon = step.icon;

        return (
          <motion.button
            key={step.id}
            type="button"
            onClick={() => onStepSelect(step.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: step.id * 0.08, duration: 0.45 }}
            className={cn(
              "rounded-[24px] border p-4 text-left transition-all",
              active
                ? "border-primary/35 bg-primary/[0.12] shadow-[0_18px_40px_rgba(16,185,129,0.18)] ring-1 ring-primary/20"
                : complete
                  ? "border-emerald-500/18 bg-emerald-500/[0.04] opacity-80"
                  : "border-border/60 bg-card/70 opacity-60 hover:border-primary/15 hover:bg-card/85"
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl",
                  active
                    ? "bg-primary text-primary-foreground shadow-[0_0_18px_rgba(16,185,129,0.3)]"
                    : complete
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              {active ? (
                <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">
                  Now playing
                </span>
              ) : complete ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <span className="text-xs font-semibold text-muted-foreground">0{step.id + 1}</span>
              )}
            </div>
            <div className="text-sm font-semibold text-foreground">{step.label}</div>
            {!compact ? (
              <div className="mt-1 text-xs leading-5 text-muted-foreground">{step.description}</div>
            ) : null}
          </motion.button>
        );
      })}
    </div>
  );
}

function UploadStage({ currentStep }: { currentStep: number }) {
  const visible = currentStep >= 0;

  return (
    <StageShell
      stageId={0}
      currentStep={currentStep}
      icon={Upload}
      iconClassName="bg-slate-900 text-white"
      title="Evidence intake"
      description="Simulated upload experience for a polished Veris walkthrough"
    >
      <div className="space-y-3">
        {evidenceFiles.map((file, index) => (
          <motion.div
            key={file}
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -18 }}
            transition={{ delay: index * 0.12, duration: 0.45, ease: "easeOut" }}
            className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-muted p-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{file}</div>
                <div className="text-xs text-muted-foreground">Mapped to assessment evidence</div>
              </div>
            </div>
            <div className="text-xs font-semibold text-emerald-600">Uploaded</div>
          </motion.div>
        ))}
      </div>
    </StageShell>
  );
}

function AnalysisStage({ currentStep }: { currentStep: number }) {
  const active = currentStep >= 1;

  return (
    <StageShell
      stageId={1}
      currentStep={currentStep}
      icon={Brain}
      iconClassName="bg-violet-600 text-white"
      title="AI assessment engine"
      description="Structured extraction, scoring, and evidence-to-requirement matching"
    >
      <div className="space-y-4">
        {analysisTasks.map((task, index) => (
          <motion.div
            key={task}
            initial={{ opacity: 0.45 }}
            animate={{ opacity: active ? 1 : 0.45 }}
            transition={{
              delay: index * 0.2,
              duration: 1.45,
              repeat: active ? Infinity : 0,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3"
          >
            <span className="text-sm text-foreground">{task}</span>
            <Brain className="h-4 w-4 text-violet-500" />
          </motion.div>
        ))}
      </div>
    </StageShell>
  );
}

function FindingsStage({ currentStep }: { currentStep: number }) {
  const visible = currentStep >= 2;

  return (
    <StageShell
      stageId={2}
      currentStep={currentStep}
      icon={ShieldCheck}
      iconClassName="bg-amber-500 text-white"
      title="Detected findings"
      description="The moment where the workflow becomes concrete for assessors and stakeholders"
    >
      <div className="space-y-3">
        {findings.map((finding, index) => (
          <motion.div
            key={finding.title}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : 18 }}
            transition={{ delay: index * 0.14, duration: 0.45, ease: "easeOut" }}
            className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 p-4"
          >
            <div>
              <div className="text-sm font-semibold text-foreground">{finding.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">Status: {finding.status}</div>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                finding.severity === "High"
                  ? "bg-red-100 text-red-700"
                  : finding.severity === "Medium"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
              )}
            >
              {finding.severity}
            </span>
          </motion.div>
        ))}
      </div>
    </StageShell>
  );
}

function DashboardStage({ currentStep }: { currentStep: number }) {
  const visible = currentStep >= 3;

  return (
    <StageShell
      stageId={3}
      currentStep={currentStep}
      icon={BarChart3}
      iconClassName="bg-primary text-primary-foreground"
      title="Live assessment summary"
      description="A strong pause point where decision-makers can understand readiness immediately"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Compliance score"
          value={visible ? <AnimatedCounter value={82} suffix="%" /> : <>0%</>}
        />
        <MetricCard label="Open findings" value={visible ? <AnimatedCounter value={6} /> : <>0</>} />
        <MetricCard
          label="Evidence coverage"
          value={visible ? <AnimatedCounter value={91} suffix="%" /> : <>0%</>}
        />
      </div>

      <div className="mt-6 flex h-44 items-end gap-4 rounded-2xl bg-muted/45 p-4">
        {dashboardBars.map((bar, index) => (
          <div key={bar.label} className="flex flex-1 flex-col items-center justify-end gap-2">
            <motion.div
              initial={{ height: 12 }}
              animate={{ height: visible ? `${bar.value}%` : 12 }}
              transition={{ duration: 0.95, delay: index * 0.12, ease: "easeInOut" }}
              className="w-full rounded-t-2xl bg-[linear-gradient(180deg,hsl(var(--primary)),rgba(16,185,129,0.55))]"
            />
            <span className="text-xs text-muted-foreground">{bar.label}</span>
          </div>
        ))}
      </div>
    </StageShell>
  );
}

function ReportStage({ currentStep }: { currentStep: number }) {
  const visible = currentStep >= 4;

  return (
    <StageShell
      stageId={4}
      currentStep={currentStep}
      icon={FileText}
      iconClassName="bg-emerald-600 text-white"
      title="Report and next actions"
      description="A confident final state for closing the walkthrough"
    >
      <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.985 }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
          className="rounded-2xl border border-border/70 bg-background/80 p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-foreground">Assessment Summary Report</div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Ready to export
            </span>
          </div>
          <div className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              This assessment highlights priority risk areas, evidence coverage, and recommended remediation actions.
            </p>
            <p>
              Teams can now share findings, assign follow-ups, and track closure from one place.
            </p>
          </div>
        </motion.div>

        <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
          <div className="mb-3 text-sm font-semibold text-foreground">Recommended next steps</div>
          <div className="space-y-3">
            {recommendations.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : 12 }}
                transition={{ delay: index * 0.14, duration: 0.45, ease: "easeOut" }}
                className="flex items-start gap-3 rounded-2xl bg-muted/45 p-3"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <span className="text-sm leading-6 text-foreground">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </StageShell>
  );
}

function StageShell({
  stageId,
  currentStep,
  children,
  description,
  icon: Icon,
  iconClassName,
  title,
}: {
  stageId: number;
  currentStep: number;
  children: ReactNode;
  description: string;
  icon: typeof Upload;
  iconClassName: string;
  title: string;
}) {
  const isActive = currentStep === stageId;
  const isCompleted = currentStep > stageId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: isActive ? 1 : isCompleted ? 0.62 : 0.44,
        y: 0,
        scale: isActive ? 1 : 0.992,
      }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={cn(
        "rounded-[28px] border bg-card/95 p-6 shadow-sm transition-all",
        isActive
          ? "border-primary/24 shadow-[0_18px_48px_rgba(16,185,129,0.12)]"
          : "border-border/70"
      )}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", iconClassName)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-lg font-semibold text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function MetricCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-h-[112px] rounded-2xl bg-muted/45 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{value}</div>
    </div>
  );
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 42;
    const timer = window.setInterval(() => {
      frame += 1;
      const progress = frame / totalFrames;
      setDisplay(Math.round(value * progress));

      if (frame >= totalFrames) {
        window.clearInterval(timer);
      }
    }, 24);

    return () => window.clearInterval(timer);
  }, [value]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}
