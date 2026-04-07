import * as React from "react"
import { cn } from "~/lib/utils"

interface TabDefinition {
  key: string
  label: string
  count?: number
}

interface TabsSectionProps {
  tabs: TabDefinition[]
  activeTab: string
  onTabChange: (key: string) => void
  className?: string
}

/** Tab navigation bar with optional count badges. */
export function TabsSection({ tabs, activeTab, onTabChange, className }: TabsSectionProps) {
  return (
    <div className={cn("flex gap-1 border-b border-border overflow-x-auto", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
            activeTab === tab.key
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  )
}
