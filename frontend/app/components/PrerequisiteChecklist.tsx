import * as React from "react";
import { cn } from "~/lib/utils";
import { CheckCircle2, Circle, AlertCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

export interface Prerequisite {
  key: string;
  label: string;
  description: string;
  required: boolean;
}

export interface PrerequisiteStatus {
  key: string;
  completed: boolean;
  value?: string;
}

interface PrerequisiteChecklistProps {
  prerequisites: Prerequisite[];
  status?: PrerequisiteStatus[];
  onValidate?: (key: string, value: any) => void;
  className?: string;
}

export function PrerequisiteChecklist({
  prerequisites,
  status = [],
  onValidate,
  className,
}: PrerequisiteChecklistProps) {
  const getStatus = (key: string) => {
    const s = status.find((ps) => ps.key === key);
    return s?.completed ?? false;
  };

  const getCompletedCount = () => {
    return status.filter((s) => s.completed).length;
  };

  const getRequiredCount = () => {
    return prerequisites.filter((p) => p.required).length;
  };

  const allRequiredComplete = () => {
    return prerequisites
      .filter((p) => p.required)
      .every((p) => getStatus(p.key));
  };

  return (
    <Card className={cn("border-dashed", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Prerequisites
          </CardTitle>
          <Badge variant={allRequiredComplete() ? "default" : "secondary"}>
            {getCompletedCount()}/{getRequiredCount()} required
          </Badge>
        </div>
        <CardDescription>
          Complete the following requirements before creating the organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {prerequisites.map((prereq) => {
          const completed = getStatus(prereq.key);
          const isRequired = prereq.required;

          return (
            <div
              key={prereq.key}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                completed
                  ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                  : "bg-muted/50 border-border"
              )}
            >
              <div className="mt-0.5">
                {completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : isRequired ? (
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{prereq.label}</p>
                  {isRequired && !completed && (
                    <Badge variant="destructive" className="h-5 text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {prereq.description}
                </p>
              </div>
              {onValidate && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={completed}
                    onChange={(e) =>
                      onValidate(prereq.key, e.target.checked)
                    }
                    className="w-4 h-4 rounded border-border"
                  />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
