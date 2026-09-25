import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardCheck,
  Zap,
  Wrench,
  Receipt,
  FileCheck,
  CheckSquare,
  ShieldCheck,
  GraduationCap,
  FileText,
  Menu,
  Archive,
  Boxes,
  MessageSquareCode,
  Users,
  UserCheck,
  History,
  LayoutGrid,
  ChevronRight,
  LogOut,
  ArrowLeftRight,
  Landmark,
  Stethoscope,
  CalendarRange,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";
import { hasModuleAccess, isModuleAdmin } from "@/features/auth/permissions";
import { useNavBadgeCounts } from "@/hooks/use-nav-badge-counts";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

interface BottomTabItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: number | undefined;
  exact?: boolean;
}

export function MobileBottomNav() {
  const { user, signOut } = useAuth();
  const routerState = useRouterState();
  const navigate = useNavigate();
  const pathname = routerState.location.pathname;
  const badges = useNavBadgeCounts();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!user) return null;

  const isSuperAdmin = Boolean(user.isSuperAdmin || user.role === "Super Admin");
  const canAccessParts = hasModuleAccess(user, "parts");
  const canAccessFinancial = hasModuleAccess(user, "financial");
  const canAccessAssets = hasModuleAccess(user, "assets");
  const canAccessTools = hasModuleAccess(user, "tools");
  const canAccessQuality = hasModuleAccess(user, "quality");
  const canAccessSettings = hasModuleAccess(user, "settings");
  const canAccessDebrief = hasModuleAccess(user, "debrief");
  const canAccessManagement = hasModuleAccess(user, "management");

  const isToolsAdmin = isModuleAdmin(user, "tools");
  const isQualityAdmin = isModuleAdmin(user, "quality");
  const isSettingsAdmin = isModuleAdmin(user, "settings");

  // Determine current active section
  const isTools = pathname.startsWith("/app/tools");
  const isQuality = pathname.startsWith("/app/quality");
  const isParts = pathname.startsWith("/app/parts");
  const isFinancial = pathname.startsWith("/app/financial");
  const isAssets = pathname.startsWith("/app/assets");
  const isSettings = pathname.startsWith("/app/settings");
  const isDebrief = pathname.startsWith("/app/debrief");
  const isManagement = pathname.startsWith("/app/management");

  // Authorized modules for dynamic switcher
  const authorizedModules = [
    {
      id: "management",
      label: "Management",
      to: "/app/management/assets",
      icon: LayoutGrid,
      hasAccess: canAccessManagement,
      isCurrent: isManagement,
    },
    {
      id: "assets",
      label: "Assets & Devices",
      to: "/app/assets/dashboard",
      icon: Stethoscope,
      hasAccess: canAccessAssets,
      isCurrent: isAssets,
    },
    {
      id: "parts",
      label: "Parts Inventory",
      to: "/app/parts/dashboard",
      icon: Boxes,
      hasAccess: canAccessParts,
      isCurrent: isParts,
    },
    {
      id: "financial",
      label: "Financial Module",
      to: "/app/financial/dashboard",
      icon: Landmark,
      hasAccess: canAccessFinancial,
      isCurrent: isFinancial,
    },
    {
      id: "tools",
      label: "Tools & Equipment",
      to: isToolsAdmin ? "/app/tools/dashboard" : "/app/tools/my-jobs",
      icon: Wrench,
      hasAccess: canAccessTools,
      isCurrent: isTools,
    },
    {
      id: "quality",
      label: "Quality & Training",
      to: isQualityAdmin ? "/app/quality/dashboard" : "/app/quality/training",
      icon: ShieldCheck,
      hasAccess: canAccessQuality,
      isCurrent: isQuality,
    },
    {
      id: "debrief",
      label: "Debrief",
      to: "/app/debrief/dashboard",
      icon: Activity,
      hasAccess: canAccessDebrief,
      isCurrent: isDebrief,
    },
    {
      id: "settings",
      label: "System Settings",
      to: "/app/settings/dashboard",
      icon: LayoutDashboard,
      hasAccess: canAccessSettings,
      isCurrent: isSettings,
    },
  ];

  const switchableModules = authorizedModules.filter((m) => m.hasAccess && !m.isCurrent);
  const accessibleModuleCount = authorizedModules.filter((m) => m.hasAccess).length;
  // Only show Workspace Hub Portal if superadmin or user has access to multiple modules
  const showHubPortal = isSuperAdmin || accessibleModuleCount > 1;

  let tabs: BottomTabItem[] = [];
  let moreBadgeCount: number | undefined = undefined;

  if (isTools) {
    if (isToolsAdmin) {
      tabs = [
        { label: "Dashboard", to: "/app/tools/dashboard", icon: LayoutDashboard },
        { label: "Jobs", to: "/app/tools/jobs", icon: ClipboardCheck, exact: true },
        { label: "Open Jobs", to: "/app/tools/jobs/open", icon: Zap, badge: badges.tools.openJobs },
        { label: "Registry", to: "/app/tools", icon: Wrench, exact: true, badge: badges.tools.calibrationAlerts },
      ];
      moreBadgeCount = badges.tools.pendingExpenses || undefined;
    } else {
      tabs = [
        { label: "My Jobs", to: "/app/tools/my-jobs", icon: ClipboardCheck, badge: badges.tools.myJobs },
        { label: "Registry", to: "/app/tools", icon: Wrench, exact: true, badge: badges.tools.calibrationAlerts },
        { label: "Expenses", to: "/app/tools/my-expenses", icon: Receipt, badge: badges.tools.myExpenses },
        { label: "Documents", to: "/app/tools/documents", icon: FileCheck },
      ];
    }
  } else if (isQuality) {
    if (isQualityAdmin) {
      tabs = [
        { label: "Dashboard", to: "/app/quality/dashboard", icon: LayoutDashboard },
        { label: "Checklists", to: "/app/quality/checklists", icon: ClipboardCheck },
        { label: "Reviews", to: "/app/quality/reviews", icon: CheckSquare, badge: badges.quality.reviews },
        { label: "Approvals", to: "/app/quality/approvals", icon: ShieldCheck, badge: badges.quality.approvals },
      ];
      moreBadgeCount = badges.quality.training || undefined;
    } else {
      tabs = [
        { label: "My Tasks", to: "/app/quality/my-tasks", icon: CheckSquare, badge: badges.quality.myTasks },
        { label: "Checklists", to: "/app/quality/checklists", icon: ClipboardCheck },
        { label: "Training", to: "/app/quality/training", icon: GraduationCap, badge: badges.quality.training },
        { label: "Policies", to: "/app/quality/policy-documents", icon: FileText },
      ];
    }
  } else if (isFinancial) {
    tabs = [
      { label: "Dashboard", to: "/app/financial/dashboard", icon: LayoutDashboard },
      { label: "Orders", to: "/app/financial/orders", icon: ClipboardCheck },
      { label: "POs", to: "/app/financial/purchase-orders", icon: Receipt },
      { label: "Contracts", to: "/app/financial/service-contracts", icon: FileText },
    ];
  } else if (isAssets) {
    tabs = [
      { label: "Dashboard", to: "/app/assets/dashboard", icon: LayoutDashboard },
      { label: "Asset List", to: "/app/assets/list", icon: Stethoscope },
      { label: "Contract", to: "/app/assets/contracts-dashboard", icon: FileCheck },
      { label: "Service List", to: "/app/assets/contracts", icon: FileText },
    ];
  } else if (isParts) {
    tabs = [
      { label: "Dashboard", to: "/app/parts/dashboard", icon: LayoutDashboard },
      { label: "Parts List", to: "/app/parts/list", icon: Boxes },
      { label: "Movements", to: "/app/parts/movements", icon: ArrowLeftRight },
      { label: "Audit", to: "/app/parts/audit", icon: ClipboardCheck },
    ];
  } else if (isDebrief) {
    tabs = [
      { label: "Dashboard", to: "/app/debrief/dashboard", icon: LayoutDashboard },
      { label: "Jobs", to: "/app/debrief", icon: ClipboardCheck, exact: true },
      { label: "Schedule", to: "/app/debrief/schedule", icon: CalendarRange },
      { label: "My Work", to: "/app/debrief/my-work", icon: Wrench, exact: true },
    ];
  } else if (isManagement) {
    tabs = [
      { label: "Assets", to: "/app/management/assets", icon: Stethoscope },
      { label: "Debrief", to: "/app/management/debrief", icon: Activity },
      { label: "Financial", to: "/app/management/financial", icon: Landmark },
      { label: "Parts", to: "/app/management/parts", icon: Boxes },
    ];
  } else if (isSettings) {
    tabs = [
      { label: "Dashboard", to: "/app/settings/dashboard", icon: LayoutDashboard },
      { label: "Debrief", to: "/app/settings/debrief", icon: MessageSquareCode },
      { label: "Personnel", to: "/app/settings/personnel", icon: Users },
      { label: "Audit Log", to: "/app/settings/audit-log", icon: History },
    ];
  } else {
    // Fallback
    tabs = [
      { label: "Hub", to: "/app", icon: LayoutGrid },
    ];
  }

  const handleSignOut = async () => {
    setDrawerOpen(false);
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  const handleNavigate = () => {
    setDrawerOpen(false);
  };

  return (
    <>
      <nav
        aria-label="Mobile Navigation Bar"
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] shadow-lg"
      >
        <div className="flex h-16 items-center justify-around px-1">
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.exact }}
              className="group relative flex flex-1 flex-col items-center justify-center py-1 text-muted-foreground transition-all duration-150 data-[status=active]:text-primary"
            >
              <div className="relative flex items-center justify-center">
                <tab.icon className="size-5 transition-transform group-active:scale-90" />
                {typeof tab.badge === "number" && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground leading-none shadow-sm">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </div>
              <span className="mt-1 text-[11px] font-medium tracking-tight truncate max-w-[68px]">
                {tab.label}
              </span>
            </Link>
          ))}

          {/* 5th Tab: More Button */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "group relative flex flex-1 flex-col items-center justify-center py-1 text-muted-foreground transition-all duration-150 active:scale-95 cursor-pointer",
              drawerOpen && "text-primary",
            )}
            aria-label="More navigation options"
          >
            <div className="relative flex items-center justify-center">
              <Menu className="size-5" />
              {typeof moreBadgeCount === "number" && moreBadgeCount > 0 && (
                <span className="absolute -top-1 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground leading-none">
                  {moreBadgeCount > 99 ? "99+" : moreBadgeCount}
                </span>
              )}
            </div>
            <span className="mt-1 text-[11px] font-medium tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* Slide-Up Drawer for Additional Navigation & Modules */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[85vh] px-4 pb-8 focus:outline-none">
          <DrawerHeader className="text-left border-b border-border/60 pb-3 mb-3">
            <DrawerTitle className="text-base font-semibold">
              {isTools
                ? "Tools Navigation"
                : isQuality
                ? "Quality Navigation"
                : isFinancial
                ? "Financial Navigation"
                : isParts
                ? "Parts Navigation"
                : isDebrief
                ? "Debrief Navigation"
                : "Workspace Navigation"}
            </DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">
              Signed in as {user.firstName} {user.lastName} ({user.role})
            </DrawerDescription>
          </DrawerHeader>

          <div className="overflow-y-auto space-y-4 pr-1">
            {/* Contextual More Items */}
            {isManagement && (
              <div className="space-y-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Management Dashboards
                </p>
                <DrawerLink
                  to="/app/management/assets"
                  icon={Stethoscope}
                  label="Assets & Fleet"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/management/debrief"
                  icon={Activity}
                  label="Debrief & Ops"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/management/financial"
                  icon={Landmark}
                  label="Financial & Spend"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/management/parts"
                  icon={Boxes}
                  label="Parts Inventory"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/management/tools"
                  icon={Wrench}
                  label="Tools & Metrology"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/management/quality"
                  icon={ShieldCheck}
                  label="Quality & Governance"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/management/contracts"
                  icon={FileCheck}
                  label="Service Contracts"
                  onNavigate={handleNavigate}
                />
              </div>
            )}

            {isDebrief && (
              <div className="space-y-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Debrief Menus
                </p>
                <DrawerLink
                  to="/app/debrief/dashboard"
                  icon={LayoutDashboard}
                  label="Debrief Dashboard"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/debrief"
                  icon={ClipboardCheck}
                  label="Jobs Register"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/debrief/schedule"
                  icon={CalendarRange}
                  label="Schedule Calendar"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/debrief/workforce"
                  icon={Users}
                  label="Workforce Management"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/debrief/my-work"
                  icon={Wrench}
                  label="My Work Queue"
                  onNavigate={handleNavigate}
                />
              </div>
            )}

            {isTools && (
              <div className="space-y-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Additional Tools Menus
                </p>
                {isToolsAdmin && (
                  <DrawerLink
                    to="/app/tools/expense-approvals"
                    icon={Receipt}
                    label="Expense Approvals"
                    badge={badges.tools.pendingExpenses}
                    onNavigate={handleNavigate}
                  />
                )}
                <DrawerLink
                  to="/app/tools/documents"
                  icon={FileCheck}
                  label="Documents"
                  onNavigate={handleNavigate}
                />
                {isToolsAdmin && (
                  <>
                    <DrawerLink
                      to="/app/tools/archived-tools"
                      icon={Archive}
                      label="Archived Tools"
                      onNavigate={handleNavigate}
                    />
                    <DrawerLink
                      to="/app/tools/archived-jobs"
                      icon={History}
                      label="Archived Jobs"
                      onNavigate={handleNavigate}
                    />
                  </>
                )}
              </div>
            )}

            {isQuality && (
              <div className="space-y-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Additional Quality Menus
                </p>
                <DrawerLink
                  to="/app/quality/training"
                  icon={GraduationCap}
                  label="Training & Compliance"
                  badge={badges.quality.training}
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/quality/policy-documents"
                  icon={FileText}
                  label="Policy Documents"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/quality/archive"
                  icon={Archive}
                  label="Archive"
                  onNavigate={handleNavigate}
                />
              </div>
            )}

            {isFinancial && (
              <div className="space-y-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Financial Menus
                </p>
                <DrawerLink
                  to="/app/financial/dashboard"
                  icon={LayoutDashboard}
                  label="Financial Dashboard"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/financial/orders"
                  icon={ClipboardCheck}
                  label="Orders Directory"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/financial/purchase-orders"
                  icon={Receipt}
                  label="Purchase Orders"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/financial/service-contracts"
                  icon={FileText}
                  label="Service Contracts"
                  onNavigate={handleNavigate}
                />
              </div>
            )}

            {isParts && (
              <div className="space-y-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Parts Menus
                </p>
                <DrawerLink
                  to="/app/parts/dashboard"
                  icon={LayoutDashboard}
                  label="Parts Dashboard"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/parts/list"
                  icon={Boxes}
                  label="Parts Directory"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/parts/movements"
                  icon={ArrowLeftRight}
                  label="Stock Movements"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/parts/audit"
                  icon={ClipboardCheck}
                  label="Physical Audit"
                  onNavigate={handleNavigate}
                />
              </div>
            )}

            {isSettings && canAccessSettings && (
              <div className="space-y-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Workspace & System
                </p>
                <DrawerLink
                  to="/app/settings/dashboard"
                  icon={LayoutDashboard}
                  label="Settings Dashboard"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/settings/debrief"
                  icon={MessageSquareCode}
                  label="Debrief"
                  onNavigate={handleNavigate}
                />
                <DrawerLink
                  to="/app/settings/personnel"
                  icon={Users}
                  label="Personnel"
                  onNavigate={handleNavigate}
                />
                {(isSettingsAdmin || isSuperAdmin) && (
                  <>
                    <DrawerLink
                      to="/app/settings/user-accounts"
                      icon={UserCheck}
                      label="User Accounts"
                      onNavigate={handleNavigate}
                    />
                    <DrawerLink
                      to="/app/settings/audit-log"
                      icon={History}
                      label="Audit Log"
                      onNavigate={handleNavigate}
                    />
                  </>
                )}
              </div>
            )}

            {/* Dynamic Module Switcher / Hub */}
            {(showHubPortal || switchableModules.length > 0) && (
              <div className="space-y-1 border-t border-border/60 pt-3">
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Switch Module / Hub
                </p>
                {showHubPortal && (
                  <DrawerLink
                    to="/app"
                    icon={LayoutGrid}
                    label="Workspace Hub Portal"
                    onNavigate={handleNavigate}
                  />
                )}
                {switchableModules.map((m) => (
                  <DrawerLink
                    key={m.id}
                    to={m.to}
                    icon={m.icon}
                    label={m.label}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            )}

            {/* Session Management */}
            <div className="border-t border-border/60 pt-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="size-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function DrawerLink({
  to,
  icon: Icon,
  label,
  badge,
  onNavigate,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: number | undefined;
  onNavigate: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent/60 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="size-4 text-muted-foreground" />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {typeof badge === "number" && badge > 0 && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
            {badge}
          </span>
        )}
        <ChevronRight className="size-4 text-muted-foreground/60" />
      </div>
    </Link>
  );
}
