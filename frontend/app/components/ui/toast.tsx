import * as React from "react"
import { cn } from "~/lib/utils"
import { Check, X, AlertTriangle, Info } from "lucide-react"

export type ToastType = "success" | "error" | "warning" | "info"

interface ToastData {
  id: string
  title: string
  description?: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  toasts: ToastData[]
  toast: (opts: Omit<ToastData, "id">) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
})

const TOAST_DURATION = 4000

export function useToast() {
  const ctx = React.useContext(ToastContext)
  const success = React.useCallback(
    (title: string, description?: string) => ctx.toast({ title, description, type: "success" }),
    [ctx]
  )
  const error = React.useCallback(
    (title: string, description?: string) => ctx.toast({ title, description, type: "error" }),
    [ctx]
  )
  const warning = React.useCallback(
    (title: string, description?: string) => ctx.toast({ title, description, type: "warning" }),
    [ctx]
  )
  const info = React.useCallback(
    (title: string, description?: string) => ctx.toast({ title, description, type: "info" }),
    [ctx]
  )
  return { ...ctx, success, error, warning, info }
}

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <Check className="h-5 w-5 text-green-500" />,
  error: <X className="h-5 w-5 text-destructive" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
}

interface ToasterProps {
  className?: string
}

export function Toaster({ className }: ToasterProps) {
  const { toasts, dismiss } = React.useContext(ToastContext)
  if (!toasts.length) return null

  return (
    <div className={cn("fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-md w-full pointer-events-none", className)}>
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  )
}

function ToastCard({ toast: t, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  React.useEffect(() => {
    const timer = setTimeout(onDismiss, t.duration ?? TOAST_DURATION)
    return () => clearTimeout(timer)
  }, [t, onDismiss])

  return (
    <div className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-lg animate-in slide-in-from-right">
      {toastIcons[t.type]}
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{t.title}</p>
        {t.description && (
          <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([])

  const addToast = React.useCallback(
    (opts: Omit<ToastData, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
      setToasts((prev) => [...prev, { ...opts, id }])
    },
    []
  )

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const ctx = React.useMemo(
    () => ({ toasts, toast: addToast, dismiss: dismissToast }),
    [toasts, addToast, dismissToast]
  )

  return (
    <ToastContext.Provider value={ctx}>
      {children}
    </ToastContext.Provider>
  )
}

export { ToastContext }
