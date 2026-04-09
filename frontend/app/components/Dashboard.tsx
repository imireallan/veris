import type { User } from "~/types";
import { BarChart3, Leaf, TrendingUp, AlertTriangle } from "lucide-react";
import { StatCard, QuickLinks, TimelineItem } from "~/components/ui";
import { SectionCard } from "~/components/ui";

const stats = [
    { label: "Carbon Score", value: "A-", icon: Leaf, trend: "+2.3%", change: "up" as const },
    { label: "Compliance Rate", value: "94%", icon: TrendingUp, trend: "+1.1%", change: "up" as const },
    { label: "Reports Due", value: "3", icon: AlertTriangle, trend: "this month", change: "neutral" as const },
    { label: "Data Completeness", value: "87%", icon: BarChart3, trend: "+5.4%", change: "up" as const },
];

const recentActivities = [
    { id: 1, date: "2025-01-15", text: "Q4 2024 carbon assessment submitted" },
    { id: 2, date: "2025-01-10", text: "New energy data uploaded for Site A" },
    { id: 3, date: "2025-01-08", text: "Compliance report generated for EU Taxonomy" },
    { id: 4, date: "2025-01-05", text: "Team member added to org" },
];

const quickLinks = [
    { label: "Start Assessment", href: "/assessments" },
    { label: "Browse Documents", href: "/knowledge" },
    { label: "Ask AI", href: "/knowledge/chat" },
    { label: "Manage Organizations", href: "/organizations" },
    { label: "Customize Theme", href: "/settings/theme" },
];

export default function Dashboard({ user }: { user: User }) {
    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                    Welcome back, {user.firstName ?? user.fullName}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Here&apos;s your organization&apos;s sustainability overview.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <StatCard key={stat.label} {...stat} />
                ))}
            </div>

            {/* Charts + Quick Links */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <SectionCard title="Emissions Breakdown" className="lg:col-span-2">
                    <div className="h-56 flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg border border-dashed border-border">
                        <BarChart3 className="w-12 h-12 mr-3 opacity-40" />
                        <span>Emissions chart will render here</span>
                    </div>
                </SectionCard>
                <QuickLinks links={quickLinks} />
            </div>

            {/* Recent Activity */}
            <SectionCard title="Recent Activity">
                <ul className="divide-y divide-border">
                    {recentActivities.map((a) => (
                        <TimelineItem
                            key={a.id}
                            text={a.text}
                            badge={a.date}
                        />
                    ))}
                </ul>
            </SectionCard>
        </div>
    );
}
