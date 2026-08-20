import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { hasModuleAccess } from "@/features/auth/permissions";

export const Route = createFileRoute("/app/tools")({
  head: () => ({
    meta: [
      { title: "Tools & Equipment — HEMP" },
      {
        name: "description",
        content: "Biomedical test tools, calibration certificates, and multi-job tracking.",
      },
    ],
  }),
  component: ToolsShell,
});

function ToolsShell() {
  const { ready, user } = useAuth();
  const navigate = useNavigate();

  const canAccess = hasModuleAccess(user, "tools");

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
