import { Link, useRouterState } from "@tanstack/react-router";
import { X, LayoutGrid } from "lucide-react";
import { BrandLockup } from "@/components/hemp/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";
import {
  SETTINGS_WORKSPACE_NAV,
  SETTINGS_SYSTEM_NAV,
  QUALITY_ADMIN_NAV,
  QUALITY_USER_NAV,
  TOOLS_ADMIN_MAIN_NAV,
  TOOLS_ADMIN_ARCHIVE_NAV,
  TOOLS_USER_MAIN_NAV,
} from "@/app/config/navigation";
import type { NavItem } from "@/app/config/navigation";

import { useEffect, useState } from "react";
import { qualityService } from "@/modules/quality/services/quality-service";
import { trainingService } from "@/modules/quality/services/training-service";
import { toolsJobService } from "@/modules/tools/services/tools-job-service";
import { toolsService } from "@/modules/tools/services/tools-service";
import { toolsExpenseService } from "@/modules/tools/services/tools-expense-service";
import { isModuleAdmin, hasModuleAccess } from "@/features/auth/permissions";

function NavLink({
  item,
  badgeCount,
  onNavigate,
}: {
  item: NavItem;
  badgeCount?: number;
  onNavigate?: (() => void) | undefined;
}) {
  return (
    <Link
      to={item.to}
      activeOptions={{
        exact:
          item.to === "/app/tools" ||
          item.to === "/app/tools/jobs" ||
          item.to === "/app/quality" ||
          item.to === "/app/settings",
      }}
      onClick={onNavigate}
      className="group relative flex min-h-11 md:min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent/60 hover:text-foreground data-[status=active]:bg-primary/8 data-[status=active]:text-foreground"
    >
      <span className="absolute top-1.5 bottom-1.5 left-0 w-[2px] rounded-full bg-primary opacity-0 transition-opacity duration-150 group-data-[status=active]:opacity-100" />
      <item.icon className="size-4 shrink-0 transition-colors group-data-[status=active]:text-primary" />
      <span className="truncate flex-1">{item.label}</span>
      {typeof badgeCount === "number" && badgeCount > 0 && (
        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
          {badgeCount}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/80 uppercase">
      {children}
    </p>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const { user } = useAuth();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const [qualityCounts, setQualityCounts] = useState<{
    reviews: number;
    approvals: number;
    myTasks: number;
    training: number;
  }>({
    reviews: 0,
    approvals: 0,
    myTasks: 0,
    training: 0,
  });

  const [toolsCounts, setToolsCounts] = useState<{
    openJobs: number;
    calibrationAlerts: number;
    pendingExpenses: number;
    myJobs: number;
    myExpenses: number;
  }>({
    openJobs: 0,
    calibrationAlerts: 0,
    pendingExpenses: 0,
    myJobs: 0,
    myExpenses: 0,
  });

  useEffect(() => {
    async function loadCounts() {
      if (!user) return;
      try {
        const fullName = `${user.firstName} ${user.lastName}`;
        const [qualityData, allTrainings] = await Promise.all([
          qualityService.getNavBadgeCounts(fullName, user.role),
          trainingService.list(),
        ]);

        const isQualAdmin = isModuleAdmin(user, "quality");
        const pendingTrainings = allTrainings.filter((t) => t.trainingStatus !== "Completed");
        const myPendingTrainings = pendingTrainings.filter(
          (t) =>
            t.assignedToId === user.id ||
            (fullName && t.assignedToName.toLowerCase().includes(fullName.toLowerCase())),
        );

        setQualityCounts({
          ...qualityData,
          training: isQualAdmin ? pendingTrainings.length : myPendingTrainings.length,
        });

        const [allJobs, allTools, allExpenses] = await Promise.all([
          toolsJobService.list(),
          toolsService.list(),
          toolsExpenseService.list(),
        ]);

        const openJobs = allJobs.filter((j) => j.jobStatus !== "Completed");
        const calAlerts = allTools.filter(
          (t) => t.calibrationStatus === "due_soon" || t.calibrationStatus === "expired",
        );
        const pendingExps = allExpenses.filter((e) => e.approvalStatus === "Pending Approval");

        const userId = user.id || "";
        const userNameLower = fullName.toLowerCase();
        const myOpenJobs = openJobs.filter(
          (j) =>
            j.assignedToId === userId ||
            (userNameLower && j.assignedToName.toLowerCase().includes(userNameLower)) ||
            (user.role?.includes("User") && (j.assignedToName.includes("Marcus") || j.assignedToName.includes("Amara"))),
        );

        const myPendingExps = pendingExps.filter(
          (e) =>
            e.submittedById === userId ||
            (userNameLower && e.submittedByName.toLowerCase().includes(userNameLower)) ||
            (user.role?.includes("User") && (e.submittedByName.includes("Marcus") || e.submittedByName.includes("Amara"))),
        );

        setToolsCounts({
          openJobs: openJobs.length,
          calibrationAlerts: calAlerts.length,
          pendingExpenses: pendingExps.length,
          myJobs: myOpenJobs.length,
          myExpenses: myPendingExps.length,
        });
      } catch (err) {
        console.error("Error loading nav badge counts", err);
      }
    }
    loadCounts();
    const interval = setInterval(loadCounts, 2500);
    return () => clearInterval(interval);
  }, [user]);

  const getQualityBadge = (to: string) => {
    if (to === "/app/quality/reviews") return qualityCounts.reviews;
    if (to === "/app/quality/approvals") return qualityCounts.approvals;
    if (to === "/app/quality/my-tasks") return qualityCounts.myTasks;
    if (to === "/app/quality/training") return qualityCounts.training;
    return undefined;
  };

  const getToolsBadge = (to: string) => {
    if (to === "/app/tools") return toolsCounts.calibrationAlerts;
    if (to === "/app/tools/jobs/open") return toolsCounts.openJobs;
    if (to === "/app/tools/expense-approvals") return toolsCounts.pendingExpenses;
    if (to === "/app/tools/my-jobs") return toolsCounts.myJobs;
    if (to === "/app/tools/my-expenses") return toolsCounts.myExpenses;
    return undefined;
  };

  const renderHubButton = () => (
    <div className="pt-2 pb-1.5">
      <Link
        to="/app"
        onClick={onNavigate}
        className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all border border-primary/20 cursor-pointer"
      >
        <LayoutGrid className="size-4 shrink-0" />
        <span className="flex-1">Main Workspace Hub</span>
        <span className="text-[10px] font-mono text-muted-foreground">Portal</span>
      </Link>
    </div>
  );

  const isToolsAdmin = isModuleAdmin(user, "tools");
  const isQualityAdmin = isModuleAdmin(user, "quality");

  // If inside Tools Module routes
  if (pathname.startsWith("/app/tools")) {
    if (isToolsAdmin) {
      return (
        <nav className="flex h-full flex-col px-3 pb-4">
          {renderHubButton()}

          <SectionLabel>Tools Operations</SectionLabel>
          <div className="space-y-0.5">
            {TOOLS_ADMIN_MAIN_NAV.map((item) => (
              <NavLink
                key={item.to}
                item={item}
                badgeCount={getToolsBadge(item.to)}
                onNavigate={onNavigate}
              />
            ))}
          </div>

          <SectionLabel>Archive</SectionLabel>
          <div className="space-y-0.5">
            {TOOLS_ADMIN_ARCHIVE_NAV.map((item) => (
              <NavLink key={item.to} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </nav>
      );
    }

    return (
      <nav className="flex h-full flex-col px-3 pb-4">
        {renderHubButton()}

        <SectionLabel>My Workspace</SectionLabel>
        <div className="space-y-0.5">
          {TOOLS_USER_MAIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              item={item}
              badgeCount={getToolsBadge(item.to)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>
    );
  }

  // If inside Quality Module routes
  if (pathname.startsWith("/app/quality")) {
    if (isQualityAdmin) {
      return (
        <nav className="flex h-full flex-col px-3 pb-4">
          {renderHubButton()}
          <SectionLabel>Quality Workspace</SectionLabel>
          <div className="space-y-0.5">
            {QUALITY_ADMIN_NAV.map((item) => (
              <NavLink
                key={item.to}
                item={item}
                badgeCount={getQualityBadge(item.to)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </nav>
      );
    }

    return (
      <nav className="flex h-full flex-col px-3 pb-4">
        {renderHubButton()}
        <SectionLabel>Quality Workspace</SectionLabel>
        <div className="space-y-0.5">
          {QUALITY_USER_NAV.map((item) => (
            <NavLink
              key={item.to}
              item={item}
              badgeCount={getQualityBadge(item.to)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>
    );
  }

  // Default: Settings / Workspace
  return (
    <nav className="flex h-full flex-col px-3 pb-4">
      {renderHubButton()}
      <SectionLabel>Workspace</SectionLabel>
      <div className="space-y-0.5">
        {SETTINGS_WORKSPACE_NAV.map((item) => (
          <NavLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </div>
      <SectionLabel>System</SectionLabel>
      <div className="space-y-0.5">
        {SETTINGS_SYSTEM_NAV.map((item) => (
          <NavLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </nav>
  );
}

export function DesktopSidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r border-border bg-sidebar transition-[width] duration-200 ease-out lg:block",
        collapsed ? "w-0 overflow-hidden" : "w-64",
      )}
    >
      <div className="flex h-16 items-center border-b border-border px-5">
        <BrandLockup />
      </div>
      <SidebarNav />
    </aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        aria-label="Close navigation"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[1px]"
      />
      <div className="animate-in slide-in-from-left-4 fade-in absolute inset-y-0 left-0 w-72 border-r border-border bg-sidebar duration-200">
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <BrandLockup />
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close navigation">
            <X className="size-4" />
          </Button>
        </div>
        <SidebarNav onNavigate={onClose} />
      </div>
    </div>
  );
}