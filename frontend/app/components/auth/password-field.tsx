import { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "~/components/ui";
import { AuthField } from "~/components/auth/auth-field";

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  helper?: ReactNode;
  containerClassName?: string;
  inputClassName?: string;
}

export function PasswordField({
  id,
  label,
  helper,
  className,
  containerClassName,
  inputClassName,
  ...props
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthField
      id={id}
      {...props}
      label={label}
      helper={helper}
      type={showPassword ? "text" : "password"}
      containerClassName={containerClassName}
      inputClassName={cn("pr-11", className, inputClassName)}
    >
      <button
        type="button"
        aria-label={showPassword ? "Hide password" : "Show password"}
        aria-pressed={showPassword}
        onClick={() => setShowPassword((current) => !current)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </AuthField>
  );
}
