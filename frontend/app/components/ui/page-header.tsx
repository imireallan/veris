import * as React from "react"
import { cn } from "~/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

/** Standard page header with title, optional subtitle, and optional action (e.g. "New" button). */
export function PageHeader({ title, subtitle, action, className, ...props }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)} {...props}>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
