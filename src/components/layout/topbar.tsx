import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
  LayoutGrid,
  Archive,
  Layers,
  Sparkles,
  Boxes,
  Wrench,
  ShieldCheck,
  Settings2,
  Landmark,
  Stethoscope,
  Activity,
} from "lucide-react";

import { BrandLockup } from "@/components/hemp/brand";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { initials, useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin, hasModuleAccess } from "@/features/auth/permissions";
import type { User } from "@/features/auth/types";
import { useNavBadgeCounts } from "@/hooks/use-nav-badge-counts";
import {
  SETTINGS_WORKSPACE_NAV,
  SETTINGS_SYSTEM_NAV,
  QUALITY_ADMIN_NAV,
  QUALITY_USER_NAV,
  TOOLS_ADMIN_MAIN_NAV,
  TOOLS_ADMIN_ARCHIVE_NAV,
  TOOLS_USER_MAIN_NAV,
  PARTS_MAIN_NAV,
  FINANCIAL_NAV,
  ASSETS_NAV,
  DEBRIEF_NAV,
  type NavItem,
} from "@/app/config/navigation";
import { cn } from "@/lib/utils";

function HeaderNavLink({
  item,
  badgeCount,
  exact,
}: {
  item: NavItem;
  badgeCount?: number | undefined;
  exact?: boolean;
}) {
  return (
    <Link
      to={item.to}
      activeOptions={{
        exact: exact ?? (item.to === "/app/tools" || item.to === "/app/tools/jobs" || item.to === "/app/quality" || item.to === "/app/settings"),
      }}
      className="group relative inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-accent/60 hover:text-foreground data-[status=active]:bg-primary/10 data-[status=active]:text-primary data-[status=active]:font-bold"
    >
      <item.icon className="size-4 shrink-0 transition-colors group-data-[status=active]:text-primary" />
      <span className="truncate">{item.label}</span>
      {typeof badgeCount === "number" && badgeCount > 0 && (
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground leading-none">
          {badgeCount}
        </span>
      )}
    </Link>
  );
}

export function Topbar({ user }: { user: User }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const badges = useNavBadgeCounts();
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

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login", replace: true });
  }

  const isTools = pathname.startsWith("/app/tools");
  const isQuality = pathname.startsWith("/app/quality");
  const isSettings = pathname.startsWith("/app/settings");
  const isParts = pathname.startsWith("/app/parts");
  const isFinancial = pathname.startsWith("/app/financial");
  const isAssets = pathname.startsWith("/app/assets");
  const isDebrief = pathname.startsWith("/app/debrief");

  const isToolsAdmin = isModuleAdmin(user, "tools");
  const isQualityAdmin = isModuleAdmin(user, "quality");

  const authorizedModules = [
    {
      id: "assets",
      label: "Assets & Devices",
      to: "/app/assets/dashboard",
      icon: Stethoscope,
      isActive: isAssets,
      hasAccess: hasModuleAccess(user, "assets"),
    },
    {
      id: "parts",
      label: "Parts Inventory",
      to: "/app/parts/dashboard",
      icon: Boxes,
      isActive: isParts,
      hasAccess: hasModuleAccess(user, "parts"),
    },
    {
      id: "financial",
      label: "Financial",
      to: "/app/financial/dashboard",
      icon: Landmark,
      isActive: isFinancial,
      hasAccess: hasModuleAccess(user, "financial"),
    },
    {
      id: "tools",
      label: "Tools & Equipment",
      to: isToolsAdmin ? "/app/tools/dashboard" : "/app/tools/my-jobs",
      icon: Wrench,
      isActive: isTools,
      hasAccess: hasModuleAccess(user, "tools"),
    },
    {
      id: "quality",
      label: "Quality & Training",
      to: isQualityAdmin ? "/app/quality/dashboard" : "/app/quality/training",
      icon: ShieldCheck,
      isActive: isQuality,
      hasAccess: hasModuleAccess(user, "quality"),
    },
    {
      id: "debrief",
      label: "Debrief",
      to: "/app/debrief",
      icon: Activity,
      isActive: isDebrief,
      hasAccess: hasModuleAccess(user, "debrief"),
    },
    {
      id: "settings",
      label: "System Settings",
      to: "/app/settings/dashboard",
      icon: Settings2,
      isActive: isSettings,
      hasAccess: hasModuleAccess(user, "settings"),
    },
  ].filter((m) => m.hasAccess);

  // Split modules between visible pills and overflow dropdown
  // Displays up to 4 modules on desktop, ensuring the active module is always visible
  const MAX_VISIBLE = 4;
  let visibleModules = [...authorizedModules];
  let overflowModules: typeof authorizedModules = [];

  if (authorizedModules.length > MAX_VISIBLE) {
    const activeIndex = authorizedModules.findIndex((m) => m.isActive);
    if (activeIndex >= MAX_VISIBLE) {
      const activeMod = authorizedModules[activeIndex];
      const remaining = authorizedModules.filter((_, idx) => idx !== activeIndex);
      visibleModules = [activeMod, ...remaining.slice(0, MAX_VISIBLE - 1)];
      overflowModules = remaining.slice(MAX_VISIBLE - 1);
    } else {
      visibleModules = authorizedModules.slice(0, MAX_VISIBLE);
      overflowModules = authorizedModules.slice(MAX_VISIBLE);
    }
  }

  const isOverflowActive = overflowModules.some((m) => m.isActive);
  const currentModule = authorizedModules.find((m) => m.isActive);
  const CurrentModuleIcon = currentModule?.icon || LayoutGrid;

  return (
    <header className="sticky top-0 z-30 w-full bg-background/95 backdrop-blur-md border-b border-border shadow-xs">
      {/* Tier 1: Global Navigation & Utilities */}
      <div className="flex h-14 items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6">
        {/* Left: Brand + Responsive Accessible Modules */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            to="/app"
            className="shrink-0 flex items-center hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            title="Return to Workspace Hub"
          >
            <BrandLockup />
          </Link>

          {/* Mobile / Tablet Quick Module Switcher Pill (< md) */}
          <div className="flex md:hidden items-center ml-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold bg-muted/80 text-foreground hover:bg-accent border border-border/80 max-w-[135px] xs:max-w-[170px] truncate transition-colors cursor-pointer">
                  <CurrentModuleIcon className="size-3.5 shrink-0 text-primary" />
                  <span className="truncate">{currentModule ? currentModule.label : "Modules"}</span>
                  <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Switch Module
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {authorizedModules.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <DropdownMenuItem
                      key={mod.id}
                      onSelect={() => navigate({ to: mod.to })}
                      className={cn(
                        "flex items-center gap-2 text-xs font-medium cursor-pointer",
                        mod.isActive && "bg-primary/10 text-primary font-bold"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1">{mod.label}</span>
                      {mod.isActive && <span className="size-1.5 rounded-full bg-primary" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="h-4 w-px bg-border/80 mx-1 shrink-0 hidden md:block" />

          {/* Desktop & Laptop Nav with Smart Overflow (>= md) */}
          <nav className="hidden md:flex items-center gap-2 flex-nowrap min-w-0">
            {visibleModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.id}
                  to={mod.to}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all whitespace-nowrap border shrink-0",
                    mod.isActive
                      ? "bg-primary/10 text-primary border-primary/40 font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60 border-border/40 hover:border-border"
                  )}
                >
                  {mod.isActive ? (
                    <span className="inline-block size-2 rounded-full bg-primary shrink-0" />
                  ) : (
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span>{mod.label}</span>
                </Link>
              );
            })}

            {overflowModules.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all whitespace-nowrap border shrink-0 cursor-pointer",
                      isOverflowActive
                        ? "bg-primary/10 text-primary border-primary/40 font-bold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60 border-border/40 hover:border-border"
                    )}
                  >
                    <span>More Module</span>
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                    More Modules
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {overflowModules.map((mod) => {
                    const Icon = mod.icon;
                    return (
                      <DropdownMenuItem
                        key={mod.id}
                        onSelect={() => navigate({ to: mod.to })}
                        className={cn(
                          "flex items-center gap-2.5 text-sm font-semibold cursor-pointer py-2",
                          mod.isActive && "bg-primary/10 text-primary font-bold"
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="flex-1">{mod.label}</span>
                        {mod.isActive && <span className="size-2 rounded-full bg-primary" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>

        {/* Right: Global Actions & User Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/app" })}
            className="h-8 px-2 sm:px-2.5 text-xs font-semibold gap-1.5 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary cursor-pointer"
            title="Workspace Hub"
          >
            <LayoutGrid className="size-3.5" />
            <span className="hidden sm:inline">Workspace Hub</span>
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Theme</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md py-1 px-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer">
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-muted text-[11px] font-semibold tracking-wide text-foreground">
                  {initials(user)}
                </span>
                <span className="hidden sm:inline font-medium text-xs">{user.firstName}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <span className="block text-sm font-medium text-foreground">
                  {user.firstName} {user.lastName}
                </span>
                <span className="block text-xs text-muted-foreground">{user.role}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate({ to: "/app" })}>
                <LayoutGrid className="size-4" />
                Workspace Hub
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void handleSignOut()}>
                <LogOut className="size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tier 2: Desktop Contextual Module Sub-Navigation (Hidden on Mobile) */}
      <div className="hidden lg:flex h-11 items-center gap-1 border-t border-border/60 bg-muted/20 px-6 overflow-x-auto scrollbar-none">
        {isTools && (
          <>
            {isToolsAdmin ? (
              <>
                {TOOLS_ADMIN_MAIN_NAV.map((item) => (
                  <HeaderNavLink
                    key={item.to}
                    item={item}
                    badgeCount={badges.getBadgeCount(item.to)}
                  />
                ))}

                {/* Archive Dropdown for Tools Admin */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "group relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-accent/60 hover:text-foreground cursor-pointer",
                        pathname.startsWith("/app/tools/archived") &&
                          "bg-primary/10 text-primary font-semibold",
                      )}
                    >
                      <Archive className="size-3.5" />
                      <span>Archive</span>
                      <ChevronDown className="size-3 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {TOOLS_ADMIN_ARCHIVE_NAV.map((archiveItem) => (
                      <DropdownMenuItem
                        key={archiveItem.to}
                        onSelect={() => navigate({ to: archiveItem.to })}
                      >
                        <archiveItem.icon className="size-3.5" />
                        <span>{archiveItem.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              TOOLS_USER_MAIN_NAV.map((item) => (
                <HeaderNavLink
                  key={item.to}
                  item={item}
                  badgeCount={badges.getBadgeCount(item.to)}
                />
              ))
            )}
          </>
        )}

        {isQuality && (
          <>
            {isQualityAdmin
              ? QUALITY_ADMIN_NAV.map((item) => (
                  <HeaderNavLink
                    key={item.to}
                    item={item}
                    badgeCount={badges.getBadgeCount(item.to)}
                  />
                ))
              : QUALITY_USER_NAV.map((item) => (
                  <HeaderNavLink
                    key={item.to}
                    item={item}
                    badgeCount={badges.getBadgeCount(item.to)}
                  />
                ))}
          </>
        )}

        {isParts && (
          <>
            {PARTS_MAIN_NAV.map((item) => (
              <HeaderNavLink key={item.to} item={item} />
            ))}
          </>
        )}

        {isFinancial && (
          <>
            {FINANCIAL_NAV.map((item) => (
              <HeaderNavLink key={item.to} item={item} />
            ))}
          </>
        )}

        {isAssets && (
          <>
            {ASSETS_NAV.map((item) => (
              <HeaderNavLink key={item.to} item={item} />
            ))}
          </>
        )}

        {isDebrief && (
          <>
            {DEBRIEF_NAV.map((item) => (
              <HeaderNavLink key={item.to} item={item} exact />
            ))}
          </>
        )}

        {!isTools && !isQuality && !isParts && !isFinancial && !isAssets && !isDebrief && (
          <>
            {SETTINGS_WORKSPACE_NAV.map((item) => (
              <HeaderNavLink key={item.to} item={item} />
            ))}

            {/* System Dropdown for Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "group relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-accent/60 hover:text-foreground cursor-pointer",
                    SETTINGS_SYSTEM_NAV.some((s) => pathname.startsWith(s.to)) &&
                      "bg-primary/10 text-primary font-semibold",
                  )}
                >
                  <Layers className="size-3.5" />
                  <span>System</span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {SETTINGS_SYSTEM_NAV.map((systemItem) => (
                  <DropdownMenuItem
                    key={systemItem.to}
                    onSelect={() => navigate({ to: systemItem.to })}
                  >
                    <systemItem.icon className="size-3.5" />
                    <span>{systemItem.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}