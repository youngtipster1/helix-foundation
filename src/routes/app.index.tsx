import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, initials } from "@/features/auth/auth-context";
import {
  ShieldCheck,
  Settings2,
  MessageSquareCode,
  Landmark,
  Wrench,
  Stethoscope,
  Boxes,
  Users,
  LineChart,
  LogOut,
  Bell,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sun,
  Moon,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  portalNotificationService,
  type ModuleNotificationSummary,
} from "@/modules/portal/services/portal-notification-service";

import { hasModuleAccess, isModuleAdmin } from "@/features/auth/permissions";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Workspace Portal — HEMP" },
      { name: "description", content: "Healthcare Engineering Management Platform Workspace Portal." },
    ],
  }),
  component: WelcomePortalPage,
});

interface WorkspaceModule {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: any;
  status: "available" | "coming-soon";
  statusLabel: string;
  href?: string;
  getRoute?: (user: any) => string;
  hasAccess: (user: any) => boolean;
  notificationCount?: number;
}

function WelcomePortalPage() {
  const { user, ready, signOut } = useAuth();
  const navigate = useNavigate();

  const [notificationSummary, setNotificationSummary] = useState<ModuleNotificationSummary>({
    qualityCount: 0,
    debriefCount: 0,
    settingsCount: 0,
    financialsCount: 0,
    toolsCount: 0,
    assetsCount: 0,
    partsInventoryCount: 0,
    managementCount: 0,
    kpiCount: 0,
    totalAttentionRequired: 0,
  });
  const [loading, setLoading] = useState(true);
  const [comingSoonModal, setComingSoonModal] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("hemp.theme");
    const initialTheme = saved === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("hemp.theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    if (ready && !user) {
      navigate({ to: "/login", replace: true });
      return;
    }

    if (user) {
      portalNotificationService.getNotificationsForUser(user).then((res) => {
        setNotificationSummary(res);
        setLoading(false);
      });

      const interval = setInterval(() => {
        portalNotificationService.getNotificationsForUser(user).then(setNotificationSummary);
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loading />
      </div>
    );
  }

  const modules: WorkspaceModule[] = [
    {
      id: "quality",
      title: "Quality & Training",
      category: "Clinical Governance",
      description: "Policy document training, SOP compliance monitoring, diagnostic protocols, and supervisor approvals.",
      icon: ShieldCheck,
      status: "available",
      statusLabel: "Available",
      hasAccess: (u) => hasModuleAccess(u, "quality"),
      getRoute: (u) =>
        isModuleAdmin(u, "quality") ? "/app/quality/dashboard" : "/app/quality/training",
      notificationCount: notificationSummary.qualityCount,
    },
    {
      id: "settings",
      title: "System Settings",
      category: "Administration",
      description: "Global taxonomy, personnel directory, equipment master profiles, and system audit trails.",
      icon: Settings2,
      status: "available",
      statusLabel: "Available",
      hasAccess: (u) => hasModuleAccess(u, "settings"),
      getRoute: () => "/app/settings/dashboard",
      notificationCount: notificationSummary.settingsCount,
    },
    {
      id: "debrief",
      title: "Debrief",
      category: "Surgical Operations",
      description: "Post-procedure surgical equipment debriefs, operational handover notes, and incident logs.",
      icon: MessageSquareCode,
      status: "coming-soon",
      statusLabel: "Coming Soon",
      hasAccess: () => true,
    },
    {
      id: "financial",
      title: "Financial",
      category: "Procurement & Orders",
      description: "Order requisitions, supplier purchase orders, fulfillment tracking, and procurement KPIs.",
      icon: Landmark,
      status: "available",
      statusLabel: "Available",
      href: "/app/financial/dashboard",
      getRoute: () => "/app/financial/dashboard",
      hasAccess: (u) => hasModuleAccess(u, "financial"),
    },
    {
      id: "tools",
      title: "Tools & Equipment",
      category: "Engineering Tech",
      description: "Biomedical test tools, calibration certificate tracking, and electrical safety analyzers.",
      icon: Wrench,
      status: "available",
      statusLabel: "Available",
      hasAccess: (u) => hasModuleAccess(u, "tools"),
      getRoute: (u) => (isModuleAdmin(u, "tools") ? "/app/tools/dashboard" : "/app/tools/my-jobs"),
      notificationCount: notificationSummary.toolsCount,
    },
    {
      id: "assets",
      title: "Assets & Devices",
      category: "Fleet Management",
      description: "Hospital fleet asset tagging, lifecycle management, risk classification, and device uptime.",
      icon: Stethoscope,
      status: "coming-soon",
      statusLabel: "Coming Soon",
      hasAccess: () => true,
    },
    {
      id: "parts",
      title: "Parts Inventory",
      category: "Supply Chain",
      description: "Critical biomedical spare parts, minimum inventory thresholds, and replenishment orders.",
      icon: Boxes,
      status: "available",
      statusLabel: "Available",
      href: "/app/parts/dashboard",
      getRoute: () => "/app/parts/dashboard",
      hasAccess: (u) => hasModuleAccess(u, "parts"),
    },
    {
      id: "management",
      title: "Management & HR",
      category: "Operations",
      description: "Clinical engineering staff authorizations, department allocations, and shift scheduling.",
      icon: Users,
      status: "coming-soon",
      statusLabel: "Coming Soon",
      hasAccess: () => true,
    },
    {
      id: "kpi",
      title: "KPI & Metrics",
      category: "Analytics Hub",
      description: "Quality compliance index, MTBF / MTTR statistics, device availability, and SLA scorecards.",
      icon: LineChart,
      status: "coming-soon",
      statusLabel: "Coming Soon",
      hasAccess: () => true,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Simple Header */}
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold tracking-wider text-foreground">HEMP</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">&bull; Healthcare Engineering Management</span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="size-8.5 rounded-lg"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-muted text-[11px] font-semibold text-foreground">
              {initials(user)}
            </span>
            <div className="hidden sm:block text-left text-xs leading-tight">
              <span className="font-semibold text-foreground block">{user.firstName} {user.lastName}</span>
              <span className="text-[11px] text-muted-foreground">{user.role}</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut()}
            className="h-8.5 text-xs font-semibold gap-1.5"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Welcome Header */}
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace Portal
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back, {user.firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Select an authorized workspace below to access your operations and tasks.
          </p>
        </div>

        {/* Attention Summary (Only if tasks pending) */}
        {notificationSummary.totalAttentionRequired > 0 && (
          <div className="surface-panel p-4 flex items-center justify-between gap-4 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <Bell className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Action Required ({notificationSummary.totalAttentionRequired} items)
                </p>
                <p className="text-xs text-muted-foreground">
                  You have outstanding validation tasks or items requiring your supervision.
                </p>
              </div>
            </div>
            {hasModuleAccess(user, "quality") && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs shrink-0"
                onClick={() =>
                  navigate({
                    to: isModuleAdmin(user, "quality")
                      ? "/app/quality/dashboard"
                      : "/app/quality/my-tasks",
                  })
                }
              >
                Go to Tasks &rarr;
              </Button>
            )}
          </div>
        )}

        {/* 3x3 Clean Workspace Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Workspaces ({modules.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod) => {
              const Icon = mod.icon;
              const hasAccess = mod.hasAccess(user);
              const isAvailable = mod.status === "available" && hasAccess;

              if (isAvailable && mod.getRoute) {
                const route = mod.getRoute(user);
                const count = mod.notificationCount || 0;

                return (
                  <Link
                    key={mod.id}
                    to={route}
                    className="surface-panel p-5 flex flex-col justify-between transition-all hover:border-primary/50 hover:bg-accent/30 group cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="p-2.5 rounded-lg bg-primary/8 text-primary border border-primary/15 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Icon className="size-5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {count > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              {count} Pending
                            </span>
                          )}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Available
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          {mod.category}
                        </span>
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {mod.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {mod.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-primary">
                      <span>Enter Workspace</span>
                      <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              }

              // Restricted or Coming Soon
              return (
                <div
                  key={mod.id}
                  onClick={() => setComingSoonModal(mod.title)}
                  className="surface-panel p-5 flex flex-col justify-between opacity-60 hover:opacity-90 transition-opacity cursor-pointer border-dashed"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2.5 rounded-lg bg-muted text-muted-foreground border border-border">
                        <Icon className="size-5" />
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                        {mod.status === "coming-soon" ? "Coming Soon" : "Restricted"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        {mod.category}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span className="text-[11px]">{mod.status === "coming-soon" ? "Under Development" : "Restricted Access"}</span>
                    <Lock className="size-3" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Coming Soon Notice Dialog */}
      <Dialog open={Boolean(comingSoonModal)} onOpenChange={(open) => !open && setComingSoonModal(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              {comingSoonModal} Module
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-2 leading-relaxed">
              The operational workspace for <strong>{comingSoonModal}</strong> is currently under active development and will be available in an upcoming release.
              <br /><br />
              Configuration parameters and taxonomies for this module can currently be managed in <strong>System Settings</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setComingSoonModal(null)} className="text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}