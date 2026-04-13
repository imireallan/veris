/** Sidebar navigation component. */

import type { User } from "~/types";
import { NavLink, Form } from "react-router";
import { cn } from "~/lib/utils";
import {
    LayoutDashboard,
    ClipboardCheck,
    BookOpen,
    MessageSquare,
    Paintbrush,
    LogOut,
    Leaf,
    Database,
    Building2,
} from "lucide-react";
import React from "react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard,
    ClipboardCheck,
    BookOpen,
    MessageSquare,
    Paintbrush,
    Database,
    Building2,
};

export default function Sidebar({
    navLinks,
    user,
}: {
    navLinks: { to: string; label: string; icon: string }[];
    user: User;
}) {
    const initials = (user.fullName ?? user.firstName ?? user.email ?? "U")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <aside className="w-64 h-screen border-r bg-card flex flex-col">
            {/* Branding - fixed height */}
            <div className="px-5 py-4 flex items-center gap-2.5 border-b shrink-0">
                <Leaf className="w-6 h-6 text-primary" />
                <span className="text-base font-bold tracking-tight">
                    Veris
                </span>
            </div>

            {/* Navigation - fills all remaining space */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {navLinks.map((link) => {
                    const Icon = iconMap[link.icon] ?? LayoutDashboard;
                    return (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )
                            }
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            {link.label}
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
}
