import type { ReactNode } from "react";

import { CardHeader } from "~/components/ui";

interface AuthPanelHeaderProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
}

export function AuthPanelHeader({ icon, title, description }: AuthPanelHeaderProps) {
  return (
    <CardHeader className="space-y-0 border-b border-border/60 pb-4 text-left">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          {icon}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </div>
    </CardHeader>
  );
}
