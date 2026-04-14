import * as React from "react"
import { cn } from "~/lib/utils"

interface ProgressBarProps {
  value: number
  max?: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  variant?: "semantic" | "primary" | "gradient"
  className?: string
  barClassName?: string
}

/** Semantic colors - communicates status (red → orange → yellow → green) */
function semanticColor(value: number) {
  if (value >= 80) return "bg-green-500"
  if (value >= 50) return "bg-yellow-500"
  if (value >= 25) return "bg-orange-500"
  return "bg-red-500"
}

/** Primary color - brand-consistent, good for completion states */
function primaryColor(value: number) {
  if (value >= 100) return "bg-green-500"
  return "bg-primary"
}

/** Gradient - blends primary with semantic for modern look */
function gradientColor(value: number) {
  if (value >= 80) return "bg-gradient-to-r from-primary to-green-500"
  if (value >= 50) return "bg-gradient-to-r from-primary to-yellow-500"
  if (value >= 25) return "bg-gradient-to-r from-primary to-orange-500"
  return "bg-gradient-to-r from-primary to-red-500"
}

const sizeClasses = { sm: "h-1", md: "h-1.5", lg: "h-2.5" }

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  showLabel = false,
  variant = "semantic",
  className,
  barClassName,
}: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100)
  const colorMap = variant === "primary" ? primaryColor : variant === "gradient" ? gradientColor : semanticColor
  
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
