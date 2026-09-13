import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/features/auth/auth-context";
import { Topbar } from "@/components/layout/topbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export const Route = createFileRoute("/app")({
  component: AppShell,
});

function AppShell() {
  const { ready, user } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();

  useEffect(() => {
    if (ready && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <Loading />
      </main>
    );
  }

  const pathname = routerState.location.pathname.replace(/\/$/, "");
  const isPortal = pathname === "/app";

  if (isPortal) {
    return (
      <main className="min-h-screen w-full bg-background text-foreground">
        <Outlet />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground overflow-x-hidden">
      <Topbar user={user} />
      <main className="min-w-0 flex-1 w-full max-w-full overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}