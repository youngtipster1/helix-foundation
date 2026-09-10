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
      className="group relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-accent/60 hover:text-foreground data-[status=active]:bg-primary/10 data-[status=active]:text-primary data-[status=active]:font-semibold"
    >
      <item.icon className="size-3.5 shrink-0 transition-colors group-data-[status=active]:text-primary" />
      <span className="truncate">{item.label}</span>
      {typeof badgeCount === "number" && badgeCount > 0 && (
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground leading-none">
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

  const isToolsAdmin = isModuleAdmin(user, "tools");
  const isQualityAdmin = isModuleAdmin(user, "quality");

  const authorizedModules = [
    {
      id: "parts",
      label: "Parts Inventory",
      to: "/app/parts/dashboard",
      icon: Boxes,
      isActive: isParts,
      hasAccess: hasModuleAccess(user, "parts"),
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
      id: "settings",
      label: "System Settings",
      to: "/app/settings/dashboard",
      icon: Settings2,
      isActive: isSettings,
      hasAccess: hasModuleAccess(user, "settings"),
    },
  ].filter((m) => m.hasAccess);

  return (
    <header className="sticky top-0 z-30 w-full bg-background/95 backdrop-blur-md border-b border-border shadow-xs">
      {/* Tier 1: Global Navigation & Utilities */}
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left: Brand + Active Accessible Modules Side by Side */}
        <div className="flex items-center gap-3 min-w-0">
          <BrandLockup />

          <div className="h-4 w-px bg-border/80 mx-1 shrink-0 hidden sm:block" />

          {/* Side-by-side Module Navigation Bar (Only accessible modules, no scrollbar) */}
          <nav className="flex items-center gap-1.5 flex-nowrap">
            {authorizedModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.id}
                  to={mod.to}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap border shrink-0",
                    mod.isActive
                      ? "bg-primary/10 text-primary border-primary/40 font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60 border-border/40 hover:border-border"
                  )}
                >
                  {mod.isActive ? (
                    <span className="inline-block size-1.5 rounded-full bg-primary shrink-0" />
                  ) : (
                    <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span>{mod.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Global Actions & User Menu */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/app" })}
            className="h-8 text-xs font-semibold gap-1.5 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary cursor-pointer"
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

        {!isTools && !isQuality && !isParts && (
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