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
    <div className="p-3.5 sm:p-5 lg:p-6 space-y-3.5 max-w-7xl mx-auto">
      {/* Header - Compact System Design */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          Service Contracts & Agreements List
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Master register of equipment maintenance agreements, payment installment terms, and verified settlement records.
        </p>
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
