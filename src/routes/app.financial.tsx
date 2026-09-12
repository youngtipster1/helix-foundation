import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { hasModuleAccess } from "@/features/auth/permissions";

export const Route = createFileRoute("/app/financial")({
  head: () => ({
    meta: [
      { title: "Financial & Procurement — HEMP" },
      {
        name: "description",
        content:
          "Biomedical engineering procurement management, multi-supplier purchase orders, fulfillment tracking, and financial analytics.",
      },
    ],
  }),
  component: FinancialShell,
});

function FinancialShell() {
  const { ready, user } = useAuth();
  const navigate = useNavigate();

  const canAccess = hasModuleAccess(user, "financial");

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
