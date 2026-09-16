import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";
import { assetService } from "@/modules/assets/services/asset-service";
import { AssetDashboardView } from "@/modules/assets/components/asset-dashboard-view";
import { AssetDashboardMetrics } from "@/modules/assets/types";

export const Route = createFileRoute("/app/assets/dashboard")({
  head: () => ({
    meta: [
      { title: "Assets & Devices Dashboard — HEMP" },
      {
        name: "description",
        content:
          "Biomedical asset lifecycle analytics, operational uptime rates, and warranty distribution.",
      },
    ],
  }),
  component: AssetDashboardPage,
});

function AssetDashboardPage() {
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
      {/* Page Title Lockup */}
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
          Assets & Devices Dashboard
        </h2>
        <p className="text-xs text-muted-foreground">
          Clinical engineering asset lifecycle overview, operational status, and manufacturer distribution.
        </p>
      </div>

      {/* Dashboard Metrics Content */}
      <AssetDashboardView metrics={metrics} />
    </div>
  );
}
