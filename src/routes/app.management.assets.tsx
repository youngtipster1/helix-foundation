import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Loading } from "@/components/ui/loading";
import { assetService } from "@/modules/assets/services/asset-service";
import { AssetDashboardView } from "@/modules/assets/components/asset-dashboard-view";
import { AssetDashboardMetrics } from "@/modules/assets/types";

export const Route = createFileRoute("/app/management/assets")({
  head: () => ({
    meta: [
      { title: "Assets & Fleet Overview — Management | HEMP" },
      {
        name: "description",
        content: "Executive overview of biomedical asset fleet, operational uptime, and modality distribution.",
      },
    ],
  }),
  component: ManagementAssetsPage,
});

function ManagementAssetsPage() {
  const [metrics, setMetrics] = useState<AssetDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    const m = assetService.getAssetDashboardMetrics();
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
        eyebrow="Executive Management • Fleet Health"
        title="Assets & Devices Overview"
        subtitle="Clinical engineering asset lifecycle overview, operational uptime rates, and manufacturer distribution."
        icon={Stethoscope}
      />

      <AssetDashboardView metrics={metrics} />
    </div>
  );
}
