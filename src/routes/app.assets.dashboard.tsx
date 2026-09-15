import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";
import { assetService } from "@/modules/assets/services/asset-service";
import { AssetDashboardView } from "@/modules/assets/components/asset-dashboard-view";
import { AssetNavTabs } from "@/modules/assets/components/asset-nav-tabs";
import { AssetModal } from "@/modules/assets/components/asset-modal";
import { AssetBatchUploadModal } from "@/modules/assets/components/asset-batch-upload-modal";
import { AssetDashboardMetrics, Asset } from "@/modules/assets/types";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";

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
  const { user } = useAuth();
  const userRole = user?.role || "User";
  const isSuperAdmin = userRole === "Super Admin";
  const isAdmin = userRole === "Admin" || userRole === "Asset Admin" || isSuperAdmin;

  const [metrics, setMetrics] = useState<AssetDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);

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

  const handleCreateAsset = (assetData: Partial<Asset>) => {
    assetService.createAsset(assetData as any);
  };

  const handleBatchImport = (batch: any[]) => {
    assetService.createBatchAssets(batch);
  };

  if (loading || !metrics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Sub-Nav */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Assets & Devices Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical engineering asset lifecycle overview, operational status, and manufacturer distribution.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBatchOpen(true)}
              className="text-xs h-9 gap-1.5"
            >
              <Upload className="size-3.5" /> Batch Import
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground font-semibold"
            >
              <Plus className="size-3.5" /> Add Equipment
            </Button>
          </div>
        )}
      </div>

      {/* 4-Pill Header Navigation */}
      <AssetNavTabs />

      {/* Dashboard Metrics Content */}
      <AssetDashboardView metrics={metrics} />

      {/* Modals */}
      <AssetModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        mode="create"
        onSave={handleCreateAsset}
      />

      <AssetBatchUploadModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onImport={handleBatchImport}
      />
    </div>
  );
}
