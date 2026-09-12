import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loading } from "@/components/ui/loading";

export const Route = createFileRoute("/app/financial/")({
  component: FinancialIndexRedirect,
});

function FinancialIndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/app/financial/dashboard", replace: true });
  }, [navigate]);

  return (
    <div className="flex h-48 items-center justify-center">
      <Loading />
    </div>
  );
}
