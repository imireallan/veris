import * as React from "react"
import { cn } from "~/lib/utils"
import { Card, CardContent } from "./card"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  change?: "up" | "down" | "neutral"
  className?: string
}

/** KPI stat card with label, value, icon, and optional trend indicator. */
const trendIcons = { up: ArrowUpRight, down: ArrowDownRight, neutral: Minus }
const trendColors = { up: "text-green-600", down: "text-destructive", neutral: "text-muted-foreground" }

export function StatCard({ label, value, icon: Icon, trend, change = "neutral", className }: StatCardProps) {
  const TrendIcon = trendIcons[change]
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend && (
            <span className={cn("flex items-center text-xs font-medium", trendColors[change])}>
              <TrendIcon className="w-3 h-3 mr-0.5" />
              {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
