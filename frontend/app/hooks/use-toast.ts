import { toast as sonnerToast } from "sonner"

type ToastType = "success" | "error" | "warning" | "info" | "loading"

interface ToastOptions {
  description?: string
  duration?: number
}

export function useToast() {
  const toast = (title: string, description?: string, type: ToastType = "info", duration?: number) => {
    const opts: any = {
      description,
      duration: duration ?? 4000,
    }

    switch (type) {
      case "success":
        return sonnerToast.success(title, opts)
      case "error":
        return sonnerToast.error(title, opts)
      case "warning":
        return sonnerToast.warning(title, opts)
      case "info":
        return sonnerToast.info(title, opts)
      case "loading":
        return sonnerToast.loading(title, opts)
      default:
        return sonnerToast(title, opts)
    }
  }

  const success = (title: string, description?: string) => toast(title, description, "success")
  const error = (title: string, description?: string) => toast(title, description, "error")
  const warning = (title: string, description?: string) => toast(title, description, "warning")
  const info = (title: string, description?: string) => toast(title, description, "info")
  const loading = (title: string, description?: string) => toast(title, description, "loading")

  return { toast, success, error, warning, info, loading }
}
