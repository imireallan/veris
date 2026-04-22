import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { cn } from "~/lib/utils"

const sheetVariants = cva(
  "fixed z-50 bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 data-open:animate-in data-closed:animate-out",
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 h-full w-full max-w-xl rounded-none border-l data-open:slide-in-from-right data-closed:slide-out-to-right",
        left:
          "inset-y-0 left-0 h-full w-full max-w-xl rounded-none border-r data-open:slide-in-from-left data-closed:slide-out-to-left",
        top:
          "inset-x-0 top-0 w-full rounded-b-xl border-b data-open:slide-in-from-top data-closed:slide-out-to-top",
        bottom:
          "inset-x-0 bottom-0 w-full rounded-t-xl border-t data-open:slide-in-from-bottom data-closed:slide-out-to-bottom",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

function Sheet(props: React.ComponentProps<typeof Dialog>) {
  return <Dialog {...props} />
}

function SheetTrigger(props: React.ComponentProps<typeof DialogTrigger>) {
  return <DialogTrigger {...props} />
}

function SheetClose(props: React.ComponentProps<typeof DialogClose>) {
  return <DialogClose {...props} />
}

function SheetContent({
  className,
  side,
  children,
  ...props
}: React.ComponentProps<typeof DialogContent> & VariantProps<typeof sheetVariants>) {
  return (
    <DialogContent
      className={cn(sheetVariants({ side }), "left-auto top-auto translate-x-0 translate-y-0 max-w-none gap-0 p-0 sm:max-w-none", className)}
      {...props}
    >
      {children}
    </DialogContent>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <DialogHeader className={cn("border-b px-5 py-4", className)} {...props} />
}

function SheetTitle(props: React.ComponentProps<typeof DialogTitle>) {
  return <DialogTitle {...props} />
}

function SheetDescription(props: React.ComponentProps<typeof DialogDescription>) {
  return <DialogDescription {...props} />
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <DialogFooter className={cn("mt-auto", className)} {...props} />
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
}
