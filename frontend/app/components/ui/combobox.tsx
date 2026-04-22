import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  value: string
  onValueChange: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  className?: string
}

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Select option",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const selected = options.find((option) => option.value === value)
  const filtered = options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
      </Button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-xl border border-border bg-popover p-2 shadow-lg">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter options..."
            className="mb-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring"
          />
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
            ) : (
              filtered.map((option) => {
                const isSelected = option.value === value
                return (
                  <button
                    key={option.value}
                    type="button"
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      onValueChange(option.value)
                      setOpen(false)
                      setQuery("")
                    }}
                  >
                    <span>{option.label}</span>
                    <Check className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
