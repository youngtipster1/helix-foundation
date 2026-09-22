import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { hasModuleAccess } from "@/features/auth/permissions";

export const Route = createFileRoute("/app/debrief")({
  head: () => ({
    meta: [
      { title: "Debrief & Jobs — HEMP" },
      {
        name: "description",
        content: "Debrief module for service job dispatch, tracking, and post-service debriefs.",
      },
    ],
  }),
  component: DebriefShell,
});

function DebriefShell() {
  const { ready, user } = useAuth();
  const navigate = useNavigate();

  const canAccess = hasModuleAccess(user, "debrief");

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
