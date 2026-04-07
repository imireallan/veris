import * as React from "react"
import { cn } from "~/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./card"

interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  headerAction?: React.ReactNode
  padding?: "default" | "compact"
}

/** Card wrapper with optional header, title, description and action. */
export function SectionCard({
  title,
  description,
  headerAction,
  padding = "default",
  className,
  children,
}: SectionCardProps) {
  const paddingClass = padding === "compact" ? "px-4 py-3" : "p-6"
  return (
    <Card className={className}>
      {(title || description || headerAction) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
          <div>
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          {headerAction}
        </CardHeader>
      )}
      <CardContent className={cn(paddingClass, "pt-2")}>
        {children}
      </CardContent>
    </Card>
  )
}
