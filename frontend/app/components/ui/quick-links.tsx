import * as React from "react"
import { Link } from "react-router"
import { cn } from "~/lib/utils"
import { ChevronRight } from "lucide-react"
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
      <nav className="space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium group"
          >
            {link.label}
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        ))}
      </nav>
    </SectionCard>
  )
}
