import * as React from "react"
import { Link } from "react-router"
import { cn } from "~/lib/utils"
import { ChevronRight } from "lucide-react"
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "./navigation-menu"
import { SectionCard } from "./section-card"

interface QuickLink {
  label: string
  href: string
}

interface QuickLinksProps {
  title?: string
  links: QuickLink[]
  className?: string
}

/** Card with list of quick links. */
export function QuickLinks({ title = "Quick Links", links, className }: QuickLinksProps) {
  return (
    <SectionCard title={title} className={cn("", className)}>
      <NavigationMenu>
        <NavigationMenuList>
          {links.map((link) => (
            <NavigationMenuItem key={link.href}>
              <Link
                to={link.href}
                className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium transition-colors hover:border-border hover:bg-muted/60"
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground transition-colors hover:text-foreground" />
              </Link>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </SectionCard>
  )
}
