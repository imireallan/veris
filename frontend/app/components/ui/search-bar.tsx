import * as React from "react"
import { cn } from "~/lib/utils"
import { Input } from "./input"
import { Search } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  maxW?: string
}

/** Search input with leading icon. Pass value + onChange for controlled use. */
export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className,
  maxW = "max-w-sm",
}: SearchBarProps) {
  return (
    <div className={cn("relative", maxW, className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  )
}
