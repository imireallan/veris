import * as React from "react"
import { cn } from "~/lib/utils"

export interface EditableFieldProps {
  label?: string
  value?: string
  onChange?: (value: string) => void
  multiline?: boolean
  placeholder?: string
  children?: React.ReactNode
  className?: string
}

/** A field that can display a value or render a custom child input.
 * When children are provided, renders them. When value is provided without children,
 * renders a display-only field. */
export function EditableField({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  className,
  children,
}: EditableFieldProps) {
  if (children) {
    return <div className={cn("w-full", className)}>{children}</div>
  }

  if (multiline) {
    return (
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-3 py-2 border rounded-lg text-sm bg-background min-h-[80px]",
          className
        )}
      />
    )
  }

  return (
    <div className={cn("w-full", className)}>
      {label && <div className="text-xs text-muted-foreground">{label}</div>}
      <div className="text-sm mt-0.5">{value ?? "—"}</div>
    </div>
  )
}
