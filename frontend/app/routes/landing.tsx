import { useOutletContext } from "react-router";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileSearch,
  Leaf,
  Menu,
  ShieldCheck,
  Sparkles,
  Telescope,
} from "lucide-react";

import { ThemeToggle } from "~/components/ui/theme-toggle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Card,
  CardContent,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  buttonVariants,
  cn,
} from "~/components/ui";
import { getLandingPrimaryAction } from "~/lib/public-route-viewmodels";
import type { User } from "~/types";

const navItems = [
  { label: "Overview", href: "#overview" },
  { label: "Workflow", href: "#workflow" },
  { label: "FAQ", href: "#faq" },
] as const;

const heroStats = [
  { value: "1 workspace", label: "Evidence, review, findings, and reporting in one layer" },
  { value: "Multi-org", label: "Designed for consultancy-led programs and client teams" },
  { value: "AI-assisted", label: "Structured signals before human sign-off" },
] as const;

const capabilityCards = [
  {
    title: "Evidence intake",
    description: "Capture files against the right assessment and site context so evidence stays reusable.",
    icon: FileSearch,
  },
  {
    title: "AI review",
    description: "Surface likely gaps, weak evidence, and reviewer prompts before manual validation starts.",
    icon: Sparkles,
  },
  {
    title: "Follow-through",
    description: "Turn findings into owned actions instead of losing them inside static reports.",
    icon: CheckCircle2,
  },
] as const;

const workflowViews = [
  {
    title: "Consultancies",
    description: "Run multiple client programs without rebuilding the same assessment operations every cycle.",
    icon: Building2,
  },
  {
    title: "Operators",
    description: "See what evidence exists, what is missing, and what needs action across active assessments.",
    icon: ShieldCheck,
  },
  {
    title: "Leadership",
    description: "Get a current view of readiness, exposure, and follow-through without waiting for summary decks.",
    icon: Telescope,
  },
] as const;

const workflowSteps = [
  {
    step: "01",
    title: "Collect once",
    description: "Attach evidence to the right assessment context instead of re-requesting the same documents every cycle.",
  },
  {
    step: "02",
    title: "Review with signal",
    description: "Use AI to flag likely gaps and focus reviewers on judgment rather than triage.",
  },
  {
    step: "03",
    title: "Move to action",
    description: "Carry approved findings straight into remediation ownership and reporting output.",
  },
] as const;

const faqs = [
  {
    value: "faq-1",
    question: "Who is Veris for?",
    answer:
      "Veris is built for consultancy-led sustainability programs, internal compliance teams, and client operators who need one operating system for evidence, review, and reporting.",
  },
  {
    value: "faq-2",
    question: "What makes it different from a document portal?",
    answer:
      "Veris is not just storage. It links evidence to assessment context, layers structured AI review on top, and pushes outputs into findings, remediation, and reporting workflows.",
  },
  {
    value: "faq-3",
    question: "Is the public experience theme-aware too?",
    answer:
      "Yes. The landing page and login routes use the same light and dark mode tokens as the application, with a manual toggle available before sign-in.",
  },
] as const;

export function meta() {
  return [
    { title: "Veris — Assessment operations platform" },
    {
      name: "description",
      content:
        "Veris helps consultancies and compliance teams run evidence intake, AI-assisted review, findings, and reporting from one workspace.",
    },
  ];
}

export default function LandingRoute() {
  const { user } = useOutletContext<{ user: User | null }>();
  const primaryAction = getLandingPrimaryAction(user ? { id: user.id } : null);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,hsl(var(--primary))/0.08,transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted))/0.18)]">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Veris</div>
              <div className="text-xs text-muted-foreground">Assessment operations platform</div>
            </div>
          </a>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="border border-border/70 bg-background/80" />
            <a href="/login" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex")}>
              Sign in
            </a>
            <a href={primaryAction.href} className={cn(buttonVariants(), "hidden rounded-xl px-4 md:inline-flex")}>
              {primaryAction.label}
            </a>

            <Sheet>
              <SheetTrigger aria-label="Open navigation" className={cn(buttonVariants({ variant: "outline", size: "icon" }), "md:hidden")}>
                <Menu className="h-4 w-4" />
              </SheetTrigger>
              <SheetContent side="right" className="w-[92vw] max-w-sm border-border bg-background">
                <SheetHeader>
                  <SheetTitle>Navigate Veris</SheetTitle>
                  <SheetDescription>Overview, workflow, and sign-in actions.</SheetDescription>
                </SheetHeader>
                <div className="space-y-5 px-5 py-6">
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Theme</p>
                      <p className="text-xs text-muted-foreground">Switch light or dark mode.</p>
                    </div>
                    <ThemeToggle className="border border-border/70 bg-background" />
                  </div>

                  <div className="grid gap-2">
                    {navItems.map((item) => (
                      <SheetClose key={item.href} render={<a href={item.href} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/40" />}>
                        {item.label}
                      </SheetClose>
                    ))}
                  </div>

                  <Separator />

                  <div className="grid gap-3">
                    <SheetClose render={<a href="/login" className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-xl")} />}>
                      Sign in
                    </SheetClose>
                    <SheetClose render={<a href={primaryAction.href} className={cn(buttonVariants(), "w-full rounded-xl")} />}>
                      {primaryAction.label}
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main>
        <section id="overview" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <Badge className="border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary hover:bg-primary/10">
                Minimal product entry
              </Badge>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  One workspace for evidence, review, and assessment follow-through.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                  Veris gives consultancies and compliance teams a cleaner operating model: collect evidence once, review
                  with AI-assisted signal, and move findings into accountable action without juggling disconnected tools.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a href={primaryAction.href} className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-xl px-5 text-sm font-medium")}>
                  {primaryAction.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <a href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-xl px-5 text-sm font-medium")}>
                  Go to login
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {heroStats.map((item) => (
                  <Card key={item.value} className="border-border/70 bg-card/90 shadow-none">
                    <CardContent className="space-y-1 p-4">
                      <div className="text-sm font-semibold text-foreground sm:text-base">{item.value}</div>
                      <p className="text-xs leading-5 text-muted-foreground">{item.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="border-border/70 bg-card/96 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <CardContent className="space-y-6 p-6 lg:p-7">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Why teams switch</p>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Replace repeated assessment admin with a system that keeps context.
                  </h2>
                  <p className="text-sm leading-7 text-muted-foreground">
                    Veris is designed for the real workflow: evidence intake, structured review, findings, remediation,
                    and reporting across multiple organizations.
                  </p>
                </div>

                <div className="grid gap-3">
                  {capabilityCards.map(({ title, description, icon: Icon }) => (
                    <div key={title} className="rounded-2xl border border-border/70 bg-background px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
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

        <section id="workflow" className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <Card className="border-border/70 bg-card/92 shadow-none">
              <CardContent className="space-y-4 p-6">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Who it serves</p>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    One platform, different operating views for each stakeholder.
                  </h2>
                </div>

                <div className="grid gap-3">
                  {workflowViews.map(({ title, description, icon: Icon }) => (
                    <div key={title} className="rounded-2xl border border-border/70 bg-background px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/92 shadow-none">
              <CardContent className="space-y-4 p-6">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">How the workflow runs</p>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    A simple operating sequence from intake to action.
                  </h2>
                  <p className="text-sm leading-7 text-muted-foreground">
                    Keep the page focused on the product story instead of embedding a heavy demo surface directly in the landing page.
                  </p>
                </div>

                <div className="grid gap-3">
                  {workflowSteps.map((item) => (
                    <div key={item.step} className="rounded-2xl border border-border/70 bg-background px-4 py-4">
                      <div className="flex gap-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{item.step}</div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                          <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-4xl px-4 py-8 pb-14 sm:px-6 lg:px-8 lg:pb-16">
          <Card className="border-border/70 bg-card/95 shadow-none">
            <CardContent className="space-y-6 p-6 lg:p-8">
              <div className="space-y-2 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">FAQ</p>
                <h2 className="text-3xl font-semibold tracking-tight text-foreground">Questions teams ask before rollout.</h2>
              </div>

              <Accordion defaultValue={[faqs[0].value]} className="w-full rounded-2xl border border-border/70 bg-background px-4 py-2">
                {faqs.map((faq) => (
                  <AccordionItem key={faq.value} value={faq.value}>
                    <AccordionTrigger className="py-4 text-base font-medium text-foreground hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm leading-7 text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="rounded-[24px] border border-primary/15 bg-primary/6 px-6 py-6 text-center">
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">Ready to open the workspace?</h3>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Keep the entry experience simple, then move operators into the product where the deeper workflow belongs.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <a href={primaryAction.href} className={cn(buttonVariants({ size: "lg" }), "rounded-xl px-5")}>
                    {primaryAction.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                  <a href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl px-5")}>
                    Sign in
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
