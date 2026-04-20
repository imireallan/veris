import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  FileSearch,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge, Card, CardContent } from "~/components/ui";

const valueProps = [
  {
    title: "Answer once, map many times",
    description:
      "Turn one evidence submission into coverage across multiple frameworks and client requirements.",
    icon: FileSearch,
  },
  {
    title: "AI-assisted evidence review",
    description:
      "Highlight gaps, suggest framework mappings, and keep consultants focused on validation instead of admin work.",
    icon: Bot,
  },
  {
    title: "Role-based collaboration",
    description:
      "Invite teams, assign responsibilities, and keep every client organization moving inside one shared system.",
    icon: Users,
  },
] as const;

const frameworkChips = ["Supply chain standard", "Supplier questionnaire", "Custom templates"];
const workflowSteps = [
  "Collect evidence",
  "AI maps requirements",
  "Review gaps and progress",
];

export function ProductDemoPanel() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,_hsla(160,84%,39%,0.22),_transparent_48%),linear-gradient(180deg,rgba(5,14,12,0.96),rgba(8,20,17,0.96))] p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.35)] lg:p-8">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.03)_45%,transparent_100%)]" />
      <div className="absolute -right-16 top-8 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-emerald-300/10 blur-3xl" />

      <div className="relative space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-medium text-white hover:bg-white/8">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
              Product walkthrough
            </Badge>
            {frameworkChips.map((chip) => (
              <Badge
                key={chip}
                className="border border-white/10 bg-transparent px-3 py-1 text-[11px] font-medium text-white/70 hover:bg-transparent"
                variant="outline"
              >
                {chip}
              </Badge>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance lg:text-4xl">
              See how Veris turns fragmented compliance work into one guided workflow.
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-white/70 lg:text-base">
              Built for consultancies managing multiple client organizations, Veris combines
              assessments, evidence review, AI mapping, and team coordination in a single system.
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/6 p-3 backdrop-blur-sm">
            <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#081310] shadow-[0_24px_50px_rgba(0,0,0,0.32)]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  Active program workspace
                </div>
              </div>

              <div className="grid items-stretch gap-4 p-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                    <MetricCard label="Sites monitored" value="18" detail="+3 active" />
                    <MetricCard label="Evidence mapped" value="126" detail="92% matched" />
                    <MetricCard label="Open gaps" value="14" detail="4 need review" />
                  </div>

                  <Card className="border border-white/10 bg-white/[0.04] text-white shadow-none">
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                            Assessment progress
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-white">
                            Environmental due diligence review
                          </h3>
                        </div>
                        <Badge className="border-0 bg-primary/18 text-primary hover:bg-primary/18">
                          AI-assisted
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <WorkflowRow
                          title="Site policy evidence uploaded"
                          subtitle="Mapped to 7 framework requirements"
                          status="Synced"
                        />
                        <WorkflowRow
                          title="Child labor due diligence review"
                          subtitle="2 gaps flagged for consultant validation"
                          status="Needs review"
                          accent="warning"
                        />
                        <WorkflowRow
                          title="Site grievance mechanism"
                          subtitle="Ready to reuse across supplier questionnaire"
                          status="Reusable"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-white/10 bg-white/[0.04] text-white shadow-none">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                            Coverage snapshot
                          </p>
                          <h3 className="mt-1 text-base font-semibold text-white">
                            Reusable evidence across active reviews
                          </h3>
                        </div>
                        <Badge className="border-0 bg-white/8 text-white/75 hover:bg-white/8">
                          3 updated today
                        </Badge>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <CoveragePill label="Requirements mapped" value="41" />
                        <CoveragePill label="Ready for review" value="12" />
                        <CoveragePill label="Evidence reused" value="9" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid auto-rows-fr gap-4">
                  <Card className="h-full border border-primary/20 bg-primary/8 text-white shadow-none">
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-primary/80">
                            AI mapping result
                          </p>
                          <h3 className="mt-1 text-base font-semibold text-white">
                            Evidence coverage suggestion
                          </h3>
                        </div>
                        <Bot className="h-5 w-5 text-primary" />
                      </div>

                      <div className="space-y-3">
                        {workflowSteps.map((step, index) => (
                          <div
                            key={step}
                            className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-3 py-2"
                          >
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                              {index + 1}
                            </div>
                            <div className="flex-1 text-sm text-white/85">{step}</div>
                            {index < 2 ? (
                              <ArrowRight className="h-4 w-4 text-white/35" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="h-full border border-white/10 bg-white/[0.04] text-white shadow-none">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                            Team activity
                          </p>
                          <h3 className="mt-1 text-base font-semibold">Client team access</h3>
                        </div>
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>

                      <div className="space-y-2.5">
                        <MiniUser name="Consultancy Admin" role="ADMIN" tone="primary" />
                        <MiniUser name="Client Sustainability Lead" role="COORDINATOR" />
                        <MiniUser name="Site Operator" role="OPERATOR" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {valueProps.map(({ title, description, icon: Icon }) => (
              <Card
                key={title}
                className="border border-white/10 bg-white/[0.05] text-white shadow-none backdrop-blur-sm"
              >
                <CardContent className="flex gap-4 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                    <p className="text-sm leading-6 text-white/65">{description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] min-h-[104px] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{label}</p>
      <div className="mt-3 space-y-2">
        <div className="text-2xl font-semibold text-white">{value}</div>
        <div className="text-xs font-medium text-primary/90">{detail}</div>
      </div>
    </div>
  );
}

function WorkflowRow({
  title,
  subtitle,
  status,
  accent = "default",
}: {
  title: string;
  subtitle: string;
  status: string;
  accent?: "default" | "warning";
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-medium text-white">{title}</div>
          <div className="text-xs leading-5 text-white/55">{subtitle}</div>
        </div>
        <span
          className={
            accent === "warning"
              ? "rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] text-amber-200"
              : "rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] text-primary"
          }
        >
          {status}
        </span>
      </div>
    </div>
  );
}

function CoveragePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniUser({
  name,
  role,
  tone = "default",
}: {
  name: string;
  role: string;
  tone?: "default" | "primary";
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/10 px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div
          className={
            tone === "primary"
              ? "flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
              : "flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-xs font-semibold text-white/80"
          }
        >
          {name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{name}</p>
          <p className="text-xs text-white/45">Assigned to current program</p>
        </div>
      </div>
      <Badge
        variant="outline"
        className="border-white/10 bg-transparent text-[11px] font-medium text-white/70"
      >
        {role}
      </Badge>
    </div>
  );
}
