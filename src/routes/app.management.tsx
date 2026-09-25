import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { hasModuleAccess } from "@/features/auth/permissions";

export const Route = createFileRoute("/app/management")({
  head: () => ({
    meta: [
      { title: "Management & Executive — HEMP" },
      {
        name: "description",
        content: "Executive leadership cockpit and cross-module operational dashboards.",
      },
    ],
  }),
  component: ManagementShell,
});

function ManagementShell() {
  const { ready, user } = useAuth();
  const navigate = useNavigate();

  const canAccess = hasModuleAccess(user, "management");

  useEffect(() => {
    if (ready && user && !canAccess) {
      navigate({ to: "/app", replace: true });
    }
  }, [ready, user, canAccess, navigate]);

  if (!ready || !user || !canAccess) {
    return null;
  }

  return (
    <div className="w-full animate-fade-in space-y-6">
      <Outlet />
    </div>
  );
}
