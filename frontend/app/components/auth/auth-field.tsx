import type { InputHTMLAttributes, ReactNode } from "react";

import { Input, cn } from "~/components/ui";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helper?: ReactNode;
  containerClassName?: string;
  inputClassName?: string;
  children?: ReactNode;
}

export function AuthField({
  id,
  label,
  helper,
  className,
  containerClassName,
  inputClassName,
  children,
  ...props
}: AuthFieldProps) {
  const inputId = id ?? props.name;

  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-medium leading-none text-foreground">
          {label}
        </label>
        {helper}
      </div>

      <div className="relative">
        <Input
          id={inputId}
          {...props}
          className={cn("h-11 rounded-xl", className, inputClassName)}
        />
        {children}
      </div>
    </div>
  );
}
