import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";

export const Route = createFileRoute("/app/quality")({
  component: QualityShell,
});

function QualityShell() {
  const { ready, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && user && user.role !== "Quality Admin" && user.role !== "Quality User") {
      navigate({ to: "/login", replace: true });
    }
  }, [ready, user, navigate]);

  if (!ready || !user || (user.role !== "Quality Admin" && user.role !== "Quality User")) {
    return null;
  }

  return (
    <div className="w-full animate-fade-in">
      <Outlet />
    </div>
  );
}
