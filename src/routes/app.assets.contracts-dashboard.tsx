import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";
import { assetService } from "@/modules/assets/services/asset-service";
import { ContractDashboardView } from "@/modules/assets/components/contract-dashboard-view";
import { ContractModal } from "@/modules/assets/components/contract-modal";
import { ContractDashboardMetrics, ServiceContract } from "@/modules/assets/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";

export const Route = createFileRoute("/app/assets/contracts-dashboard")({
  head: () => ({
    meta: [
      { title: "Service Contracts — HEMP" },
      {
        name: "description",
        content:
          "Financial analytics on biomedical service contracts, outstanding payable balances, and warranty coverage.",
      },
    ],
  }),
  component: ContractsDashboardPage,
});

function ContractsDashboardPage() {
  const { user } = useAuth();
  const userRole = user?.role || "User";
  const isSuperAdmin = userRole === "Super Admin";
  const isAdmin = userRole === "Admin" || userRole === "Asset Admin" || isSuperAdmin;

  const [metrics, setMetrics] = useState<ContractDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadData = () => {
    const m = assetService.getContractDashboardMetrics();
    setMetrics(m);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = assetService.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, []);

  const handleCreateContract = (contractData: Partial<ServiceContract>) => {
    assetService.createContract(contractData as any);
  };

  if (loading || !metrics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Title Lockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
            Service Contracts Overview
          </h2>
          <p className="text-xs text-muted-foreground">
            Financial analytics for service agreements, verified settlements, and outstanding payable balances.
          </p>
        </div>

        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-semibold"
          >
            <Plus className="size-3" /> New Contract
          </Button>
        )}
      </div>

      {/* Dashboard Metrics View (duplicate in-page tab removed) */}
      <ContractDashboardView metrics={metrics} />

      {/* Modals */}
      <ContractModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        mode="create"
        onSave={handleCreateContract}
      />
    </div>
  );
}
