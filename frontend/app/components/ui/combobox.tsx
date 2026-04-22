import * as React from "react"
import { createPortal } from "react-dom"
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
  const [mounted, setMounted] = React.useState(false)
  const [panelStyle, setPanelStyle] = React.useState<React.CSSProperties>({})
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  const updatePanelPosition = React.useCallback(() => {
    const rect = rootRef.current?.getBoundingClientRect()
    if (!rect) return

    setPanelStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, 224),
    })
  }, [])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleWindowChange() {
      updatePanelPosition()
    }

    if (open) {
      updatePanelPosition()
      document.addEventListener("mousedown", handlePointerDown)
      window.addEventListener("resize", handleWindowChange)
      window.addEventListener("scroll", handleWindowChange, true)
      return () => {
        document.removeEventListener("mousedown", handlePointerDown)
        window.removeEventListener("resize", handleWindowChange)
        window.removeEventListener("scroll", handleWindowChange, true)
      }
    }
  }, [open, updatePanelPosition])

  const selected = options.find((option) => option.value === value)
  const filtered = options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
      </Button>

      {mounted && open
        ? createPortal(
            <div style={panelStyle} className="z-[200] rounded-xl border border-border bg-popover p-2 shadow-2xl">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter options..."
                className="mb-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring"
              />
              <div className="max-h-60 overflow-y-auto rounded-md border border-border bg-background p-1">
                {filtered.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
                ) : (
                  filtered.map((option) => {
                    const isSelected = option.value === value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                        onClick={() => {
                          onValueChange(option.value)
                          setOpen(false)
                          setQuery("")
                        }}
                      >
                        <span className="truncate">{option.label}</span>
                        <Check className={cn("h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                      </button>
                    )
                  })
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
