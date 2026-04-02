import { BarChart3, Leaf, TrendingUp, AlertTriangle } from "lucide-react";
import type { User } from "~/types";

const stats = [
    { label: "Carbon Score", value: "A-", icon: Leaf, trend: "+2.3%", change: "up" as const, color: "text-primary" },
    { label: "Compliance Rate", value: "94%", icon: TrendingUp, trend: "+1.1%", change: "up" as const, color: "text-secondary" },
    { label: "Reports Due", value: "3", icon: AlertTriangle, trend: "this month", change: "neutral" as const, color: "text-accent" },
    { label: "Data Completeness", value: "87%", icon: BarChart3, trend: "+5.4%", change: "up" as const, color: "text-primary" },
];

const recentActivities = [
    { id: 1, date: "2025-01-15", action: "Q4 2024 carbon assessment submitted" },
    { id: 2, date: "2025-01-10", action: "New energy data uploaded for Site A" },
    { id: 3, date: "2025-01-08", action: "Compliance report generated for EU Taxonomy" },
    { id: 4, date: "2025-01-05", action: "Team member added to org" },
];

export default function Dashboard({ user }: { user: User }) {
    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div>
                <h2 className="text-2xl font-semibold text-foreground">
                    Welcome back, {user.firstName ?? user.fullName}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Here&apos;s an overview of your organization&apos;s sustainability metrics.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">{stat.label}</span>
                                <Icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                                <span
                                    className={`text-xs ${
                                        stat.change === "up"
                                            ? "text-success"
                                            : stat.change === "neutral"
                                              ? "text-muted-foreground"
                                              : "text-destructive"
                                    }`}
                                >
                                    {stat.trend}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
                    <h3 className="text-base font-medium text-foreground mb-4">Emissions Breakdown</h3>
                    <div className="h-56 flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg">
                        <BarChart3 className="w-12 h-12 mr-3 opacity-40" />
                        <span>Emissions chart will render here</span>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-base font-medium text-foreground mb-4">Quick Links</h3>
                    <nav className="space-y-2">
                        {([
                            ["Start Assessment", "/assessments"],
                            ["Browse Documents", "/knowledge"],
                            ["Ask AI", "/knowledge/chat"],
                            ["Customize Theme", "/settings/theme"],
                        ] as [string, string][]).map(([label, href]) => (
                            <a
                                key={href}
                                href={href}
                                className="block px-3 py-2.5 rounded-lg bg-muted/60 hover:bg-muted text-sm text-foreground transition-colors"
                            >
                                {label}
                            </a>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-base font-medium text-foreground mb-3">Recent Activity</h3>
                <ul className="divide-y divide-border">
                    {recentActivities.map((a) => (
                        <li key={a.id} className="flex items-center justify-between py-3">
                            <span className="text-sm text-foreground">{a.action}</span>
                            <span className="text-xs text-muted-foreground">{a.date}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
