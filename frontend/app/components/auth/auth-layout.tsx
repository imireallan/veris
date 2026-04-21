import type { ReactNode } from "react";

import { Card, cn } from "~/components/ui";

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

export function AuthLayout({
  icon,
  title,
  description,
  children,
  widthClassName = "max-w-sm",
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted))/0.18)] px-4 py-8 lg:px-6">
      <div className={cn("mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center", widthClassName)}>
        <div className="w-full space-y-5">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/8">
              {icon}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Veris</p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
              {description ? <div className="text-sm leading-6 text-muted-foreground">{description}</div> : null}
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <Card className={cn("rounded-[24px] border border-border/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.06)]", className)}>
      {children}
    </Card>
  );
}
