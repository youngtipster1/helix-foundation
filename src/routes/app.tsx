import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/features/auth/auth-context";

export const Route = createFileRoute("/app")({
  component: AppShell,
});

function AppShell() {
  const { ready, user } = useAuth();
  const navigate = useNavigate();

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

  return <Outlet />;
}