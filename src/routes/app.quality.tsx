import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DesktopSidebar, MobileSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAuth } from "@/features/auth/auth-context";

export const Route = createFileRoute("/app/quality")({
  component: QualityShell,
});

function QualityShell() {
  const { ready, user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (ready && user && user.role !== "Quality Admin" && user.role !== "Quality User") {
      navigate({ to: "/login", replace: true });
    }
  }, [ready, user, navigate]);

  if (!ready || !user || (user.role !== "Quality Admin" && user.role !== "Quality User")) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <DesktopSidebar collapsed={collapsed} />
      <MobileSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          onToggleSidebar={() => setCollapsed((value) => !value)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-5xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
