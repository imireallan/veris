import { useOutletContext } from "react-router";
import { ArrowRight, Bot, Building2, CheckCircle2, FileSearch, ShieldCheck, Sparkles, Users } from "lucide-react";

import { VerisWorkflowDemo } from "~/components/VerisWorkflowDemo";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import type { User } from "~/types";

const personas = [
  {
    title: "Consultancies running multi-client programs",
    description:
      "Standardize how assessment teams collect evidence, surface gaps, and report outcomes across multiple client organizations.",
    icon: Building2,
  },
  {
    title: "Sustainability and compliance operators",
    description:
      "Replace fragmented evidence collection and manual review choreography with one operational workflow.",
    icon: ShieldCheck,
  },
  {
    title: "Leadership teams that need decision-ready visibility",
    description:
      "Turn scattered status updates into a credible, executive-ready view of readiness, exposure, and next actions.",
    icon: Users,
  },
] as const;

const problems = [
  "Evidence is fragmented across inboxes, shared drives, spreadsheets, and point-in-time reviews.",
  "Teams repeat the same mapping work every cycle because evidence is not reusable in a structured way.",
  "Assessors spend too much time assembling context and not enough time validating what matters.",
  "Stakeholders see lagging summaries instead of a live picture of risk, progress, and action ownership.",
] as const;

const solutions = [
  {
    title: "Centralized evidence operations",
    description:
      "Collect documents once, confirm receipt immediately, and keep every file tied to the right assessment context.",
    icon: FileSearch,
  },
  {
    title: "AI-assisted assessment review",
    description:
      "Analyze evidence, prepare structured review signals, and highlight likely gaps before a human reviewer steps in.",
    icon: Bot,
  },
  {
    title: "Action-ready reporting and follow-through",
    description:
      "Move from evidence to findings, dashboards, and remediation actions without rebuilding the story manually.",
    icon: CheckCircle2,
  },
] as const;

const proofPoints = [
  { value: "One workflow", label: "Evidence intake, review, findings, reporting" },
  { value: "AI-assisted", label: "Structured signals with human validation" },
  { value: "Multi-org", label: "Consultancy and client workspaces in one product" },
] as const;

export function meta() {
  return [
    { title: "Veris — AI-first sustainability assessments" },
    {
      name: "description",
      content:
        "Veris is an AI-first sustainability assessment platform for consultancies, compliance teams, and operators who need one workflow from evidence intake to reporting.",
    },
  ];
}

export default function LandingRoute() {
  const { user } = useOutletContext<{ user: User | null }>();

  const primaryHref = user ? "/app" : "/login";
  const primaryLabel = user ? "Open workspace" : "Open Veris";
  const secondaryHref = "/demo/veris-workflow";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted))/0.48)]">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="rounded-[34px] border border-border/70 bg-background/92 px-6 py-8 shadow-[0_32px_100px_rgba(15,23,42,0.08)] backdrop-blur sm:px-8 lg:px-10 lg:py-10">
          <div className="grid gap-10 xl:grid-cols-[0.92fr_1.08fr] xl:items-center">
            <div className="space-y-7">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className="border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary hover:bg-primary/10">
                    AI-first sustainability platform
                  </Badge>
                  <Badge variant="outline" className="border-border/70 bg-background text-muted-foreground">
                    Built for repeatable assessment operations
                  </Badge>
                </div>
                <div className="space-y-4">
                  <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl">
                    Veris turns sustainability assessments into one clear operating workflow.
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                    For consultancies, compliance teams, and operators who need one system to collect evidence,
                    review gaps, update readiness in real time, and deliver action-ready reporting without the usual
                    operational sprawl.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {proofPoints.map((item) => (
                  <div key={item.value} className="rounded-2xl border border-border/70 bg-card/85 px-4 py-4 shadow-sm">
                    <div className="text-lg font-semibold text-foreground">{item.value}</div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <a href={primaryHref} className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-xl px-5 text-sm font-medium")}>
                  {primaryLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <a
                  href={secondaryHref}
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-xl px-5 text-sm font-medium")}
                >
                  Watch the workflow demo
                </a>
              </div>
            </div>

            <Card className="overflow-hidden border-white/10 bg-[radial-gradient(circle_at_top,_hsla(160,84%,39%,0.22),_transparent_48%),linear-gradient(180deg,rgba(5,14,12,0.96),rgba(8,20,17,0.96))] text-white shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
              <CardContent className="space-y-6 p-6 lg:p-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">
                      Why Veris exists
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">
                    Replace fragmented review work with a product system teams can actually scale.
                  </h2>
                  <p className="text-sm leading-7 text-white/72">
                    Veris is designed to eliminate duplicated evidence work, improve review velocity, and give teams a
                    more credible path from document collection to remediation and reporting.
                  </p>
                </div>

                <div className="space-y-3">
                  {problems.map((problem) => (
                    <div
                      key={problem}
                      className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm leading-6 text-white/86"
                    >
                      {problem}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {personas.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="border-border/70 bg-card/90 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                  <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-border/70 bg-card/90 shadow-sm">
            <CardContent className="space-y-5 p-6">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                  Problems Veris addresses
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Assessment operations break down when the workflow lives in too many disconnected places.
                </h2>
              </div>
              <div className="space-y-3">
                {problems.map((problem) => (
                  <div
                    key={problem}
                    className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-3 text-sm leading-6 text-foreground"
                  >
                    {problem}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90 shadow-sm">
            <CardContent className="space-y-5 p-6">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                  Solutions Veris offers
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  One product workflow from intake, to AI review, to accountable follow-through.
                </h2>
              </div>
              <div className="grid gap-4">
                {solutions.map(({ title, description, icon: Icon }) => (
                  <div key={title} className="rounded-2xl border border-border/70 bg-background px-4 py-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-foreground">{title}</h3>
                        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-border/70 bg-card/92 p-6 shadow-sm lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Strategic value</p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                Built for teams that need repeatability, not one-off assessment projects.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                The core Veris model is simple: collect once, structure once, review with AI assistance, and reuse the
                output across future programs, stakeholders, and reporting cycles.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ValuePill label="Reusable evidence" value="Less recollection, less duplication" />
              <ValuePill label="Structured review" value="Higher signal before human validation" />
              <ValuePill label="Live visibility" value="Progress, gaps, and next actions in one view" />
              <ValuePill label="Action follow-through" value="Findings become owned next steps" />
            </div>
          </div>
        </div>
      </section>

      <section id="workflow-demo" className="mx-auto max-w-7xl px-4 py-6 pb-12 sm:px-6 lg:px-8 lg:pb-16">
        <div className="mb-6 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            Recorded product walkthrough
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            See the Veris workflow move from evidence intake to action-ready output.
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            This demo uses mock data only and is intentionally designed for clear screen capture. Use clean mode to
            remove distractions and record a tighter product walkthrough.
          </p>
        </div>

        <VerisWorkflowDemo />
      </section>
    </div>
  );
}

function ValuePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/90 px-4 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}
