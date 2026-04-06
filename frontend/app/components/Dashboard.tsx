import * as React from "react";
import { BarChart3, Leaf, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { User } from "~/types";
import { Card, CardContent, Badge } from "~/components/ui";
import { cn } from "~/lib/utils";

interface StatCard {
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    trend: string;
    change: "up" | "down" | "neutral";
    badgeVariant: "default" | "secondary" | "destructive" | "success" | "outline";
}

const stats: StatCard[] = [
    { label: "Carbon Score", value: "A-", icon: Leaf, trend: "+2.3%", change: "up", badgeVariant: "success" },
    { label: "Compliance Rate", value: "94%", icon: TrendingUp, trend: "+1.1%", change: "up", badgeVariant: "default" },
    { label: "Reports Due", value: "3", icon: AlertTriangle, trend: "this month", change: "neutral", badgeVariant: "secondary" },
    { label: "Data Completeness", value: "87%", icon: BarChart3, trend: "+5.4%", change: "up", badgeVariant: "success" },
];

const recentActivities = [
    { id: 1, date: "2025-01-15", action: "Q4 2024 carbon assessment submitted" },
    { id: 2, date: "2025-01-10", action: "New energy data uploaded for Site A" },
    { id: 3, date: "2025-01-08", action: "Compliance report generated for EU Taxonomy" },
    { id: 4, date: "2025-01-05", action: "Team member added to org" },
];

const quickLinks: [string, string][] = [
    ["Start Assessment", "/assessments"],
    ["Browse Documents", "/knowledge"],
    ["Ask AI", "/knowledge/chat"],
    ["Customize Theme", "/settings/theme"],
];

const trendIcon = {
    up: ArrowUpRight,
    down: ArrowDownRight,
    neutral: Minus,
};

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
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                                    <Icon className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold">{stat.value}</span>
                                    <span className={cn(
                                        "flex items-center text-xs font-medium",
                                        stat.change === "up" ? "text-green-600" :
                                        stat.change === "down" ? "text-destructive" :
                                        "text-muted-foreground"
                                    )}>
                                        {React.createElement(trendIcon[stat.change], { className: "w-3 h-3 mr-0.5" })}
                                        {stat.trend}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Charts placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-base font-semibold">Emissions Breakdown</h3>
                        <div className="h-56 flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg border border-dashed border-border">
                            <BarChart3 className="w-12 h-12 mr-3 opacity-40" />
                            <span>Emissions chart will render here</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-base font-semibold">Quick Links</h3>
                        <nav className="space-y-2">
                            {quickLinks.map(([label, href]) => (
                                <a
                                    key={href}
                                    href={href}
                                    className="block px-3 py-2.5 rounded-lg bg-muted/50 hover:bg-muted text-sm font-medium transition-colors"
                                >
                                    {label}
                                </a>
                            ))}
                        </nav>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <h3 className="text-base font-semibold">Recent Activity</h3>
                    <ul className="divide-y divide-border">
                        {recentActivities.map((a) => (
                            <li key={a.id} className="flex items-center justify-between py-3">
                                <span className="text-sm truncate mr-4">{a.action}</span>
                                <Badge variant="secondary" className="shrink-0 tabular-nums">
                                    {a.date}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
