import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { hasModuleAccess } from "@/features/auth/permissions";

export const Route = createFileRoute("/app/settings")({
  component: SettingsShell,
});

function SettingsShell() {
  const { ready, user } = useAuth();
  const navigate = useNavigate();

  const canAccess = hasModuleAccess(user, "settings");

  useEffect(() => {
    if (ready && user && !canAccess) {
      navigate({ to: "/app", replace: true });
    }
  }, [ready, user, canAccess, navigate]);

  if (!ready || !user || !canAccess) {
    return null;
  }

  return (
    <div className="w-full animate-fade-in">
      <Outlet />
    </div>
  );
}
