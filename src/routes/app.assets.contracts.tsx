import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";
import { assetService } from "@/modules/assets/services/asset-service";
import { ContractsTable } from "@/modules/assets/components/contracts-table";
import { ContractModal } from "@/modules/assets/components/contract-modal";
import { ServiceContract } from "@/modules/assets/types";

export const Route = createFileRoute("/app/assets/contracts")({
  head: () => ({
    meta: [
      { title: "Service List — HEMP" },
      {
        name: "description",
        content:
          "Manage vendor service agreements, payment schedules, and covered biomedical devices.",
      },
    ],
  }),
  component: ContractsListPage,
});

function ContractsListPage() {
  const [contracts, setContracts] = useState<ServiceContract[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedContract, setSelectedContract] = useState<ServiceContract | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = () => {
    const data = assetService.getContracts(true);
    setContracts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = assetService.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, []);

  const handleViewContract = (contract: ServiceContract) => {
    setSelectedContract(contract);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEditContract = (contract: ServiceContract) => {
    setSelectedContract(contract);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleAddContract = () => {
    setSelectedContract(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleArchiveContract = (contract: ServiceContract) => {
    if (window.confirm(`Are you sure you want to archive contract ${contract.contractNumber}?`)) {
      assetService.archiveContract(contract.id);
    }
  };

  const handleUnarchiveContract = (contract: ServiceContract) => {
    if (window.confirm(`Unarchive contract ${contract.contractNumber}?`)) {
      assetService.unarchiveContract(contract.id);
    }
  };

  const handleSaveContract = (contractData: Partial<ServiceContract>) => {
    if (modalMode === "create") {
      assetService.createContract(contractData as any);
    } else if (selectedContract) {
      assetService.updateContract(selectedContract.id, contractData);
    }
  };

  if (loading) {
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
            Service Contracts & Agreements List
          </h2>
          <p className="text-xs text-muted-foreground">
            Master register of equipment maintenance agreements, payment installment terms, and verified settlement records.
          </p>
        </div>
      </div>

      {/* Table Section (duplicate in-page tab removed) */}
      <ContractsTable
        contracts={contracts}
        onViewContract={handleViewContract}
        onEditContract={handleEditContract}
        onAddContract={handleAddContract}
        onArchiveContract={handleArchiveContract}
        onUnarchiveContract={handleUnarchiveContract}
      />

      {/* Modals */}
      <ContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contract={selectedContract}
        mode={modalMode}
        onSave={handleSaveContract}
      />
    </div>
  );
}
