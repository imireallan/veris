import * as React from "react"
import { cn } from "~/lib/utils"
import { Check, ChevronRight, Circle } from "lucide-react"

interface DropdownMenuState {
  open: boolean
  setOpen: (open: boolean) => void
}
const DropdownMenuContext = React.createContext<DropdownMenuState>({
  open: false,
  setOpen: () => {},
})

const DropdownMenu = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const [open, setOpen] = React.useState(false)
    return (
      <div ref={ref} className={cn("relative inline-block", className)} data-dropdown-open={open}>
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
          {props.children}
        </DropdownMenuContext.Provider>
      </div>
    )
  }
)
DropdownMenu.displayName = "DropdownMenu"

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, onClick, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(DropdownMenuContext)
    return (
      <button
        ref={ref}
        onClick={(e) => {
          onClick?.(e)
          setOpen(!open)
        }}
        className={cn("inline-flex items-center cursor-pointer", className)}
        aria-expanded={open}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { open } = React.useContext(DropdownMenuContext)
    if (!open) return null
    return (
      <div
        ref={ref}
        className={cn(
          "absolute right-0 top-full z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md",
          className
        )}
        role="menu"
      >
        {props.children}
      </div>
    )
  }
)
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }>(
  ({ className, inset, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted",
        inset && "pl-8",
        className
      )}
      role="menuitem"
      {...props}
    />
  )
)
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
  )
)
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold text-muted-foreground", className)} {...props} />
  )
)
DropdownMenuLabel.displayName = "DropdownMenuLabel"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
}
