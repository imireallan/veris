import * as React from "react"
import { cn } from "~/lib/utils"

interface ProgressBarProps {
  value: number
  max?: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  colorMap?: (value: number) => string
  className?: string
  barClassName?: string
}

/** Colored progress bar with size variants and optional label. */
function defaultColor(value: number) {
  if (value >= 80) return "bg-green-500"
  if (value >= 50) return "bg-yellow-500"
  if (value >= 25) return "bg-orange-500"
  return "bg-red-500"
}

const sizeClasses = { sm: "h-1", md: "h-1.5", lg: "h-2.5" }

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  showLabel = false,
  colorMap = defaultColor,
  className,
  barClassName,
}: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span className="font-medium tabular-nums">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={cn("w-full bg-muted rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cn("h-full rounded-full transition-all", colorMap(pct), barClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
