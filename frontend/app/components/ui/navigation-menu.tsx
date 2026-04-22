import * as React from "react"

import { cn } from "~/lib/utils"

function NavigationMenu({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav className={cn("w-full", className)} {...props} />
}

function NavigationMenuList({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("grid gap-1", className)} {...props} />
}

function NavigationMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("list-none", className)} {...props} />
}

type NavigationMenuLinkProps = React.ComponentProps<"a"> & {
  active?: boolean
}

function NavigationMenuLink({ className, active = false, ...props }: NavigationMenuLinkProps) {
  return (
    <a
      className={cn(
        "flex items-center justify-between rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium transition-colors hover:border-border hover:bg-muted/60",
        active && "border-border bg-muted/50 text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink }
