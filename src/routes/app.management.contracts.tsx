import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Loading } from "@/components/ui/loading";
import { assetService } from "@/modules/assets/services/asset-service";
import { ContractDashboardView } from "@/modules/assets/components/contract-dashboard-view";
import { ContractDashboardMetrics } from "@/modules/assets/types";

export const Route = createFileRoute("/app/management/contracts")({
  head: () => ({
    meta: [
      { title: "Service Contracts Overview — Management | HEMP" },
      {
        name: "description",
        content: "Executive financial analytics on biomedical service contracts, outstanding payables, and warranty coverage.",
      },
    ],
  }),
  component: ManagementContractsPage,
});

function ManagementContractsPage() {
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
        title="Service Contracts & Warranties"
        subtitle="Financial analytics for service agreements, verified settlements, and outstanding payable balances."
        icon={FileCheck}
      />

      <ContractDashboardView metrics={metrics} />
    </div>
  );
}
