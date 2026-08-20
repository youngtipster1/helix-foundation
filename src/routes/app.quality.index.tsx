import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { Loading } from "@/components/ui/loading";

import { isModuleAdmin } from "@/features/auth/permissions";

export const Route = createFileRoute("/app/quality/")({
  component: QualityIndexRedirect,
});

function QualityIndexRedirect() {
  const { ready, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && user) {
      if (isModuleAdmin(user, "quality")) {
        navigate({ to: "/app/quality/dashboard", replace: true });
      } else {
        navigate({ to: "/app/quality/training", replace: true });
      }
    }
  }, [ready, user, navigate]);

  return (
    <div className="flex h-48 items-center justify-center">
      <Loading />
    </div>
  );
}
