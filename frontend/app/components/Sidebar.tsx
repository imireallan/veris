/** Sidebar navigation component. */

import type { User } from "~/types";
import { NavLink, Form } from "react-router";
import {
    LayoutDashboard,
    ClipboardCheck,
    BookOpen,
    MessageSquare,
    Paintbrush,
    LogOut,
    Leaf,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard,
    ClipboardCheck,
    BookOpen,
    MessageSquare,
    Paintbrush,
};

const LINK_STYLES = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

export default function Sidebar({
    navLinks,
    user,
}: {
    navLinks: { to: string; label: string; icon: string }[];
    user: User;
}) {
    return (
        <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
            {/* Branding */}
            <div className="px-5 py-4 flex items-center gap-2.5 border-b border-border">
                <Leaf className="w-6 h-6 text-primary" />
                <span className="text-base font-bold text-foreground">
                    SustainabilityAI
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navLinks.map((link) => {
                    const Icon = iconMap[link.icon] ?? LayoutDashboard;
                    return (
                        <NavLink key={link.to} to={link.to} className={LINK_STYLES}>
                            <Icon className="w-4.5 h-4.5 shrink-0" />
                            {link.label}
                        </NavLink>
                    );
                })}
            </nav>

            {/* User footer */}
            <div className="px-3 py-3 border-t border-border space-y-2">
                <div className="px-3 py-2">
                    <div className="text-sm font-medium text-foreground truncate">
                        {user.fullName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                        {user.email}
                    </div>
                </div>
                <Form method="post" action="/logout">
                    <button
                        type="submit"
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </Form>
            </div>
        </aside>
    );
}
