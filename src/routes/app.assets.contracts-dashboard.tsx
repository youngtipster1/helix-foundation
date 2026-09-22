import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Loading } from "@/components/ui/loading";
import { assetService } from "@/modules/assets/services/asset-service";
import { ContractDashboardView } from "@/modules/assets/components/contract-dashboard-view";
import { ContractDashboardMetrics } from "@/modules/assets/types";

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
  const [metrics, setMetrics] = useState<ContractDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading || !metrics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Asset Contracts"
        title="Service Contracts Overview"
        subtitle="Financial analytics for service agreements, verified settlements, and outstanding payable balances."
        icon={FileText}
      />

      {/* Dashboard Metrics View */}
      <ContractDashboardView metrics={metrics} />
    </div>
  );
}
