import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { hasModuleAccess } from "@/features/auth/permissions";

export const Route = createFileRoute("/app/parts")({
  head: () => ({
    meta: [
      { title: "Parts Inventory — HEMP" },
      {
        name: "description",
        content: "Biomedical equipment spare parts inventory, supplier pricing, shelf-life monitoring, and stock reconciliation.",
      },
    ],
  }),
  component: PartsShell,
});

function PartsShell() {
  const { ready, user } = useAuth();
  const navigate = useNavigate();

  const canAccess = hasModuleAccess(user, "parts");

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
