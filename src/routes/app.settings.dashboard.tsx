import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users,
  ShieldCheck,
  LayoutGrid,
  AlertCircle,
  Activity,
  ClipboardCheck,
  Wrench,
  GraduationCap,
  Boxes,
  MessageSquareCode,
  Settings2
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/features/auth/auth-context";
import { personnelService } from "@/modules/settings/services/personnel-service";
import { userAccountService } from "@/modules/settings/services/user-account-service";
import { auditService } from "@/modules/settings/services/audit-service";
import type { AuditEvent } from "@/modules/settings/types";

export const Route = createFileRoute("/app/settings/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — HEMP" },
      {
        name: "description",
        content: "Your HEMP workspace overview for healthcare engineering operations.",
      },
      { property: "og:title", content: "Dashboard — HEMP" },
      { property: "og:description", content: "Your HEMP workspace overview." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPersonnel: 0,
    activeUsers: 0,
    activeModules: 3, // Quality, Tools, Personnel
    itemsAttention: 0,
  });
  const [recentLogs, setRecentLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const personnel = await personnelService.list();
        const users = await userAccountService.list();
        const auditLogs = await auditService.list();

        const inactiveAccounts = users.filter(u => !u.active).length;

        setStats({
          totalPersonnel: personnel.length,
          activeUsers: users.filter(u => u.active).length,
          activeModules: 3, // Quality Settings, Tools Settings, Personnel
          itemsAttention: inactiveAccounts,
        });
        setRecentLogs(auditLogs.slice(0, 4));
      } catch (err) {
        console.error("Error loading dashboard stats", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (!user) return null;

  const modules = [
    {
      key: "quality",
      title: "Quality Settings",
      description: "Document statuses, equipment OEM, modality, and model config.",
      status: "available",
      statusLabel: "Available",
      icon: ClipboardCheck,
      href: "/app/settings/quality",
    },
    {
      key: "tools",
      title: "Tools Settings",
      description: "Warranty status, tools model, and tool OEM config.",
      status: "available",
      statusLabel: "Available",
      icon: Wrench,
      href: "/app/settings/tools",
    },
    {
      key: "personnel",
      title: "Personnel Directory",
      description: "System registry for users, roles, and modular access.",
      status: "available",
      statusLabel: "Available",
      icon: Users,
      href: "/app/settings/personnel",
    },
    {
      key: "training",
      title: "Training",
      description: "Personnel training matrices, certifications, and compliance.",
      status: "coming-soon",
      statusLabel: "Coming Soon",
      icon: GraduationCap,
      href: "/app/settings/training",
    },
    {
      key: "parts-inventory",
      title: "Parts Inventory",
      description: "Spare parts tracking, stock levels, and OEM matching.",
      status: "coming-soon",
      statusLabel: "Coming Soon",
      icon: Boxes,
      href: "/app/settings/parts-inventory",
    },
    {
      key: "debrief",
      title: "Debrief",
      description: "Post-maintenance reporting and field debrief analysis.",
      status: "coming-soon",
      statusLabel: "Coming Soon",
      icon: MessageSquareCode,
      href: "/app/settings/debrief",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace Overview"
        title={`Welcome back, ${user.firstName}`}
        subtitle="Here's an overview of your engineering operations."
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-panel p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Personnel</span>
            <Users className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground tracking-tight">
              {loading ? "..." : stats.totalPersonnel}
            </span>
          </div>
        </div>

        <div className="surface-panel p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Users</span>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground tracking-tight">
              {loading ? "..." : stats.activeUsers}
            </span>
          </div>
        </div>

        <div className="surface-panel p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Modules</span>
            <LayoutGrid className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground tracking-tight">
              {loading ? "..." : stats.activeModules}
            </span>
          </div>
        </div>

        <div className="surface-panel p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Attention Required</span>
            <AlertCircle className="size-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground tracking-tight">
              {loading ? "..." : stats.itemsAttention}
            </span>
            <span className="text-xs text-muted-foreground font-normal">Inactive Accounts</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: System Activity */}
        <div className="surface-panel p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Recent System Activity</h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono text-[10px]">Audit Logs</span>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Loading recent logs...</div>
            ) : recentLogs.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No recent activity.</div>
            ) : (
              <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
                {recentLogs.map((log) => (
                  <div key={log.id} className="relative pl-7 group">
                    <div className="absolute left-1.5 top-1.5 size-2 rounded-full border border-background bg-primary transition-transform group-hover:scale-125" />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{log.action}</p>
                        <p className="text-[11px] text-muted-foreground">
                          By <span className="font-medium text-foreground">{log.user}</span> &bull; {log.context}
                        </p>
                      </div>
                      <time className="text-[10px] font-mono text-muted-foreground shrink-0 sm:text-right">
                        {log.timestamp}
                      </time>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Operational Access / Modules */}
        <div className="surface-panel p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Settings2 className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">System Modules</h2>
          </div>
          <div className="mt-4 border-t border-border pt-4 space-y-3">
            {modules.map((mod) => {
              const Icon = mod.icon;
              const isAvailable = mod.status === "available";
              const Wrapper = Link; // The setting sub-routes are all links under settings layout

              return (
                <Wrapper
                  key={mod.key}
                  to={mod.href}
                  className={`flex items-start gap-3 p-2.5 rounded-lg border border-transparent transition-all hover:bg-accent/40 hover:border-border cursor-pointer`}
                >
                  <div className={`p-1.5 rounded-md ${isAvailable ? "bg-primary/8 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-semibold text-foreground truncate">{mod.title}</h3>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          isAvailable
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {mod.statusLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{mod.description}</p>
                  </div>
                </Wrapper>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
