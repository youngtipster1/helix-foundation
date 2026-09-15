import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";
import { assetService } from "@/modules/assets/services/asset-service";
import { AssetTable } from "@/modules/assets/components/asset-table";
import { AssetModal } from "@/modules/assets/components/asset-modal";
import { AssetBatchUploadModal } from "@/modules/assets/components/asset-batch-upload-modal";
import { Asset } from "@/modules/assets/types";

export const Route = createFileRoute("/app/assets/list")({
  head: () => ({
    meta: [
      { title: "Asset List — HEMP" },
      {
        name: "description",
        content:
          "Inventory catalog of biomedical devices, serial numbers, operational statuses, and warranty schedules.",
      },
    ],
  }),
  component: AssetListPage,
});

function AssetListPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);

  const loadData = () => {
    const data = assetService.getAssets(true);
    setAssets(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = assetService.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, []);

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleAddAsset = () => {
    setSelectedAsset(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleLogJob = (asset: Asset) => {
    setSelectedAsset(asset);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleArchiveAsset = (asset: Asset) => {
    if (window.confirm(`Are you sure you want to archive equipment ${asset.equipmentNumber}?`)) {
      assetService.archiveAsset(asset.id);
    }
  };

  const handleUnarchiveAsset = (asset: Asset) => {
    if (window.confirm(`Unarchive equipment ${asset.equipmentNumber}?`)) {
      assetService.unarchiveAsset(asset.id);
    }
  };

  const handleSaveAsset = (assetData: Partial<Asset>) => {
    if (modalMode === "create") {
      assetService.createAsset(assetData as any);
    } else if (selectedAsset) {
      assetService.updateAsset(selectedAsset.id, assetData);
    }
  };

  const handleBatchImport = (batch: any[]) => {
    assetService.createBatchAssets(batch);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-5 lg:p-6 space-y-3.5 max-w-7xl mx-auto">
      {/* Header - Compact System Design */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          Asset List & Inventory
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Biomedical equipment inventory, operational status, warranty lifecycle, and supplier contracts.
        </p>
      </div>

      {/* Table Section */}
      <AssetTable
        assets={assets}
        onViewAsset={handleViewAsset}
        onEditAsset={handleEditAsset}
        onAddAsset={handleAddAsset}
        onArchiveAsset={handleArchiveAsset}
        onUnarchiveAsset={handleUnarchiveAsset}
        onLogJob={handleLogJob}
        onBatchUpload={() => setIsBatchOpen(true)}
      />

      {/* Modals */}
      <AssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        asset={selectedAsset}
        mode={modalMode}
        onSave={handleSaveAsset}
      />

      <AssetBatchUploadModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onImport={handleBatchImport}
      />
    </div>
  );
}
