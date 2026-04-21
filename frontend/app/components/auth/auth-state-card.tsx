import type { ReactNode } from "react";

import { AuthCard } from "~/components/auth/auth-layout";
import { Alert, AlertDescription, Button, CardContent } from "~/components/ui";

interface AuthStateAction {
  label: string;
  onClick?: () => void;
  variant?: "default" | "outline";
  icon?: ReactNode;
}

interface AuthStateCardProps {
  message: ReactNode;
  tone?: "default" | "destructive";
  actions?: AuthStateAction[];
}

export function AuthStateCard({ message, tone = "default", actions = [] }: AuthStateCardProps) {
  return (
    <AuthCard>
      <CardContent className="space-y-4 py-6 text-center">
        <Alert variant={tone === "destructive" ? "destructive" : "default"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>

        {actions.length > 0 ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant ?? "default"}
                onClick={action.onClick}
                className="h-11 rounded-xl px-5 text-sm font-medium"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </AuthCard>
  );
}
