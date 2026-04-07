import * as React from "react"
import { cn } from "~/lib/utils"

interface DetailFieldProps {
  label: string
  value?: React.ReactNode
  children?: React.ReactNode
  className?: string
  labelClassName?: string
  valueClassName?: string
}

/** Labeled detail field — label on top/left, value inline. */
export function DetailField({
  label,
  value,
  children,
  className,
  labelClassName,
  valueClassName,
}: DetailFieldProps) {
  return (
    <div className={cn("", className)}>
      <div className={cn("text-xs text-muted-foreground", labelClassName)}>{label}</div>
      <div className={cn("font-medium text-sm mt-0.5", valueClassName)}>
        {value ?? children ?? "—"}
      </div>
    </div>
  )
}
