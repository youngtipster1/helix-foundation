import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";
import { assetService } from "@/modules/assets/services/asset-service";
import { ContractsTable } from "@/modules/assets/components/contracts-table";
import { ContractModal } from "@/modules/assets/components/contract-modal";
import { CreateContractModal } from "@/modules/assets/components/create-contract-modal";
import { ContractDetailWorkspace } from "@/modules/assets/components/contract-detail-workspace";
import { ServiceContract } from "@/modules/assets/types";
import { useAuth } from "@/features/auth/auth-context";

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
  const { user } = useAuth();
  const userRole = user?.role || "User";
  const isAdmin = userRole === "Admin" || userRole === "Asset Admin" || userRole === "Super Admin";

  const [contracts, setContracts] = useState<ServiceContract[]>([]);
  const [loading, setLoading] = useState(true);

  // Full screen detail workspace
  const [workspaceContract, setWorkspaceContract] = useState<ServiceContract | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ServiceContract | null>(null);

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

  // Keep workspace contract in sync when contract collection changes
  useEffect(() => {
    if (workspaceContract) {
      const fresh = contracts.find((c) => c.id === workspaceContract.id);
      if (fresh) {
        setWorkspaceContract(fresh);
      }
    }
  }, [contracts]);

  const handleViewContract = (contract: ServiceContract) => {
    setWorkspaceContract(contract);
  };

  const handleEditContract = (contract: ServiceContract) => {
    setSelectedContract(contract);
    setIsEditModalOpen(true);
  };

  const handleAddContract = () => {
    setIsCreateModalOpen(true);
  };

  const handleSaveNewContract = (
    contractData: Partial<ServiceContract>,
    openWorkspace = false
  ) => {
    const newContract = assetService.createContract(contractData as any);
    setIsCreateModalOpen(false);
    if (openWorkspace && newContract) {
      setWorkspaceContract(newContract);
    }
  };

  const handleSaveEditedContract = (contractData: Partial<ServiceContract>) => {
    if (selectedContract) {
      const updated = assetService.updateContract(selectedContract.id, contractData);
      setIsEditModalOpen(false);
      if (workspaceContract && workspaceContract.id === selectedContract.id) {
        setWorkspaceContract(updated);
      }
    }
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading />
      </div>
    );
  }

  // If viewing a contract workspace, render full-screen workspace
  if (workspaceContract) {
    return (
      <div className="space-y-4">
        <ContractDetailWorkspace
          contract={workspaceContract}
          onBack={() => setWorkspaceContract(null)}
          onUpdateContract={(updated) => {
            assetService.updateContract(updated.id, updated);
            setWorkspaceContract(updated);
          }}
          isAdmin={isAdmin}
        />
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

      {/* Table Section */}
      <ContractsTable
        contracts={contracts}
        onViewContract={handleViewContract}
        onEditContract={handleEditContract}
        onAddContract={handleAddContract}
        onArchiveContract={handleArchiveContract}
        onUnarchiveContract={handleUnarchiveContract}
      />

      {/* Create Contract Modal */}
      <CreateContractModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveNewContract}
      />

      {/* Quick Edit Contract Modal */}
      <ContractModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        contract={selectedContract}
        mode="edit"
        onSave={handleSaveEditedContract}
      />
    </div>
  );
}
