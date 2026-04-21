import { ArrowRight, Bot, Building2, FileSearch, ShieldCheck, Sparkles, Users } from "lucide-react";

import { VerisWorkflowDemo } from "~/components/VerisWorkflowDemo";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";

const personas = [
  {
    title: "Consultancies managing client programs",
    description:
      "Run repeatable assessment workflows across multiple client organizations without rebuilding the process every cycle.",
    icon: Building2,
  },
  {
    title: "Sustainability and compliance teams",
    description:
      "Give internal reviewers one place to upload evidence, validate gaps, and coordinate action plans with less admin overhead.",
    icon: ShieldCheck,
  },
  {
    title: "Operations leaders needing clear status",
    description:
      "Turn scattered evidence and status updates into one executive-ready view of readiness, open work, and risk.",
    icon: Users,
  },
] as const;

const problems = [
  "Evidence is scattered across email threads, shared drives, and spreadsheets.",
  "Teams repeat the same mapping work for every assessment or client request.",
  "Reviewers spend too much time collecting context instead of validating it.",
  "Leaders lack a clear picture of coverage, open findings, and next steps.",
] as const;

const solutions = [
  {
    title: "Centralized evidence workflow",
    description: "Collect submissions, confirm receipt, and keep every file tied to the right review context.",
    icon: FileSearch,
  },
  {
    title: "AI-assisted review",
    description: "Analyze evidence, prepare mappings, and surface issues that need consultant or team validation.",
    icon: Bot,
  },
  {
    title: "Action-ready reporting",
    description: "Roll findings into clear dashboards, summaries, and next actions that teams can actually use.",
    icon: ArrowRight,
  },
] as const;

export function meta() {
  return [
    { title: "Veris Workflow Demo" },
    {
      name: "description",
      content:
        "Marketing demo page for Veris showing who the platform is for, the problems it solves, and a recordable AI-first workflow from evidence upload to reporting.",
    },
  ];
}

export default function VerisWorkflowDemoRoute() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted))/0.55)]">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="rounded-[32px] border border-border/70 bg-background/92 px-6 py-8 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur sm:px-8 lg:px-10 lg:py-10">
          <div className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className="border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary hover:bg-primary/10">
                    AI-first sustainability workflow
                  </Badge>
                  <Badge variant="outline" className="border-border/70 bg-background text-muted-foreground">
                    Demo mode
                  </Badge>
                </div>
                <div className="space-y-3">
                  <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground text-balance sm:text-5xl">
                    Veris helps assessment teams move from evidence collection to action-ready decisions.
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                    Built for consultancies, sustainability teams, and compliance operators who need one system to collect evidence, review gaps, track readiness, and deliver credible outputs faster.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <HeroStat value="One workflow" label="Evidence, review, findings, reporting" />
                <HeroStat value="AI-assisted" label="Structured analysis with human validation" />
                <HeroStat value="Multi-team" label="Consultancy and client collaboration" />
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="#workflow-demo"
                  className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-xl px-5 text-sm font-medium")}
                >
                  Jump to workflow demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <a
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-11 rounded-xl px-5 text-sm font-medium"
                  )}
                >
                  Open Veris
                </a>
              </div>
            </div>

            <Card className="overflow-hidden border-white/10 bg-[radial-gradient(circle_at_top,_hsla(160,84%,39%,0.22),_transparent_48%),linear-gradient(180deg,rgba(5,14,12,0.96),rgba(8,20,17,0.96))] text-white shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
              <CardContent className="space-y-6 p-6 lg:p-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">
                      Why teams adopt Veris
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-white">
                    Replace fragmented assessment operations with a guided platform.
                  </h2>
                  <p className="text-sm leading-6 text-white/70">
                    Veris is designed to reduce repetitive assessment admin, improve evidence visibility, and help teams produce a stronger review outcome with less manual coordination.
                  </p>
                </div>

                <div className="space-y-3">
                  {problems.map((problem) => (
                    <div
                      key={problem}
                      className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm leading-6 text-white/85"
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
                  Assessment work breaks down when the workflow lives in too many places.
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
                  <div
                    key={title}
                    className="rounded-2xl border border-border/70 bg-background px-4 py-4 shadow-sm"
                  >
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

      <section id="workflow-demo" className="mx-auto max-w-7xl px-4 py-6 pb-12 sm:px-6 lg:px-8 lg:pb-16">
        <div className="mb-6 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            Recorded product walkthrough
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Watch the Veris workflow play through from start to finish.
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            This demo uses mock data only. It is designed for a clear, believable marketing recording that shows how Veris supports evidence intake, AI review, gap detection, dashboard updates, and final reporting.
          </p>
        </div>

        <VerisWorkflowDemo />
      </section>
    </div>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-4 shadow-sm">
      <div className="text-lg font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-xs leading-5 text-muted-foreground">{label}</div>
    </div>
  );
}
