import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { Loading } from "@/components/ui/loading";

export const Route = createFileRoute("/app/quality/")({
  component: QualityIndexRedirect,
});

function QualityIndexRedirect() {
  const { ready, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && user) {
      if (user.role === "Quality Admin") {
        navigate({ to: "/app/quality/dashboard", replace: true });
      } else if (user.role === "Quality User") {
        navigate({ to: "/app/quality/policy-documents", replace: true });
      } else {
        navigate({ to: "/app/settings/dashboard", replace: true });
      }
    }
  }, [ready, user, navigate]);

  return (
    <div className="flex h-48 items-center justify-center">
      <Loading />
    </div>
  );
}
