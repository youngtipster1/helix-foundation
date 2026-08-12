import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { BrandLockup } from "@/components/hemp/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";
import { SETTINGS_WORKSPACE_NAV, SETTINGS_SYSTEM_NAV, QUALITY_ADMIN_NAV, QUALITY_USER_NAV } from "@/app/config/navigation";
import type { NavItem } from "@/app/config/navigation";

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: (() => void) | undefined }) {
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className="group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent/60 hover:text-foreground data-[status=active]:bg-primary/8 data-[status=active]:text-foreground"
    >
      <span className="absolute top-1.5 bottom-1.5 left-0 w-[2px] rounded-full bg-primary opacity-0 transition-opacity duration-150 group-data-[status=active]:opacity-100" />
      <item.icon className="size-4 shrink-0 transition-colors group-data-[status=active]:text-primary" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="px-3 pt-5 pb-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/80 uppercase">
      {children}
    </p>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const { user } = useAuth();

  if (user?.role === "Quality Admin") {
    return (
      <nav className="flex h-full flex-col px-3 pb-4">
        <SectionLabel>Quality Workspace</SectionLabel>
        <div className="space-y-0.5">
          {QUALITY_ADMIN_NAV.map((item) => (
            <NavLink key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>
    );
  }

  if (user?.role === "Quality User") {
    return (
      <nav className="flex h-full flex-col px-3 pb-4">
        <SectionLabel>Quality Workspace</SectionLabel>
        <div className="space-y-0.5">
          {QUALITY_USER_NAV.map((item) => (
            <NavLink key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex h-full flex-col px-3 pb-4">
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