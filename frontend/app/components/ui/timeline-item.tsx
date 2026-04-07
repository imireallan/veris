import * as React from "react"
import { cn } from "~/lib/utils"
import { Badge } from "./badge"

interface TimelineItemProps {
  text: string
  date?: string
  label?: string
  badge?: string
  badgeVariant?: React.ComponentProps<typeof Badge>["variant"]
  className?: string
  dotColor?: string
}

/** Single timeline/activity list item with date, text, and optional badge. */
export function TimelineItem({
  date,
  text,
  badge,
  badgeVariant = "secondary",
  className,
  dotColor = "bg-primary",
}: TimelineItemProps) {
  return (
    <li className={cn("flex items-center gap-3 py-3", className)}>
      <div className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />
      <span className="text-sm flex-1 truncate">{text}</span>
      {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
    </li>
  )
}
