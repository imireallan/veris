import * as React from "react"
import { cn } from "~/lib/utils"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "./card"
import { Button } from "./button"
import { Link } from "react-router"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  action?: React.ReactNode
  className?: string
}

/** Empty state card with icon, message, and optional CTA. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className={cn("text-center py-12 space-y-4", className)}>
        <Icon className="w-12 h-12 mx-auto text-muted-foreground opacity-60" />
        <div>
          <h3 className="font-medium">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {actionLabel && actionHref && (
          <Link to={actionHref}>
            <Button className="mt-2">{actionLabel}</Button>
          </Link>
        )}
        {action}
      </CardContent>
    </Card>
  )
}
