import { 
  Badge, 
  Card, 
  CardContent, 
  ProgressBar,
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from "~/components/ui";
import { Clock, Building2 } from "lucide-react";

const statusVariant = (
  s: string,
): "default" | "secondary" | "outline" | "destructive" => {
  switch (s) {
    case "COMPLETED":
      return "default";
    case "IN_PROGRESS":
      return "secondary";
    case "UNDER_REVIEW":
      return "outline";
    case "ARCHIVED":
      return "outline";
    default:
      return "secondary";
  }
};

const riskVariant = (
  r: string,
): "default" | "destructive" | "secondary" => {
  switch (r) {
    case "CRITICAL":
    case "HIGH":
      return "destructive";
    case "MEDIUM":
      return "secondary";
    case "LOW":
      return "default";
    default:
      return "secondary";
  }
};

export function AssessmentCard({
  assessment,
  focusAreaName,
  frameworkName,
  siteName,
  orgName,
}: {
  assessment: any;
  focusAreaName?: string;
  frameworkName?: string;
  siteName?: string;
  orgName?: string;
}) {
  // Use display_name from API if available, otherwise build from available data
  const name =
    assessment.display_name ||
    focusAreaName ||
    frameworkName ||
    `Assessment ${assessment.id.slice(0, 8)}`;

  return (
    <Card className="hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 hover:shadow-primary/10 transition-all duration-300 group">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {orgName && (
            <Badge variant="secondary" className="text-[10px]">
              <Building2 className="w-3 h-3 mr-1" />
              {orgName}
            </Badge>
          )}
          <Clock className="w-5 h-5 text-blue-500 shrink-0" />
          <Badge variant={riskVariant(assessment.risk_level)}>
            {assessment.risk_level}
          </Badge>
          <Badge variant={statusVariant(assessment.status)}>
            {assessment.status.replace(/_/g, " ")}
          </Badge>
          {assessment.overall_score > 0 && (
            <span className="text-xs font-mono text-muted-foreground">
              Score: {assessment.overall_score}%
            </span>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-block">
              <h3 className="font-medium group-hover:text-primary transition-colors">
                {name}
              </h3>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" align="center" sideOffset={8}>
            {name}
          </TooltipContent>
        </Tooltip>

        <p className="text-xs text-muted-foreground">
          Due:{" "}
          {assessment.due_date
            ? new Date(assessment.due_date).toLocaleDateString()
            : "—"}
        </p>

        {assessment.ai_summary && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {assessment.ai_summary.replace(/<[^>]*>/g, "")}
          </p>
        )}

        <ProgressBar value={assessment.overall_score} size="sm" />
      </CardContent>
    </Card>
  );
}