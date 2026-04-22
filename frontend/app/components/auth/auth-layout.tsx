import type { ReactNode } from "react";
import { Leaf } from "lucide-react";

import { ThemeToggle } from "~/components/ui/theme-toggle";
import { Badge, Card, cn } from "~/components/ui";

interface AuthLayoutProps {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  widthClassName?: string;
}

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

const authHighlights = [
  "Invitation-aware access",
  "Shared light and dark theme",
  "Consistent public auth flow",
] as const;

const authSupportNote =
  "Use the same product entry surface for login, invitations, onboarding, and password recovery without overwhelming the sign-in task.";

export function AuthLayout({
  icon,
  title,
  description,
  children,
  widthClassName = "max-w-5xl",
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,hsl(var(--primary))/0.08,transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted))/0.18)] px-4 py-6 lg:px-6 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <div className="flex items-center justify-between gap-4 pb-6">
          <a href="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Veris</p>
              <p className="text-xs text-muted-foreground">Assessment operations platform</p>
            </div>
          </a>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="hidden rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Back to product
            </a>
            <ThemeToggle className="border border-border/70 bg-background/80" />
          </div>
        </div>

        <div className={cn("mx-auto grid w-full items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]", widthClassName)}>
          <div className="order-2 space-y-5 lg:order-1 lg:sticky lg:top-24">
            <div className="space-y-3">
              <Badge className="border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary hover:bg-primary/10">
                Secure product entry
              </Badge>

              <div className="space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[22px] border border-primary/15 bg-primary/8">
                  {icon}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Veris</p>
                  <h1 className="max-w-lg text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
                  {description ? <div className="max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">{description}</div> : null}
                </div>
              </div>
            </div>

            <Card className="border-border/70 bg-card/92 shadow-none">
              <div className="space-y-4 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">What stays consistent</p>
                <div className="space-y-3">
                  {authHighlights.map((item, index) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">0{index + 1}</div>
                      <p className="text-sm leading-6 text-foreground">{item}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm leading-7 text-muted-foreground">{authSupportNote}</p>
              </div>
            </Card>
          </div>

          <div className="order-1 lg:order-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AuthCard({ children, className }: AuthCardProps) {
  return <Card className={cn("rounded-[28px] border border-border/70 bg-card/96 shadow-[0_20px_60px_rgba(15,23,42,0.08)]", className)}>{children}</Card>;
}
