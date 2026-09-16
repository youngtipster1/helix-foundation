import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";
import { assetService } from "@/modules/assets/services/asset-service";
import { ContractsTable } from "@/modules/assets/components/contracts-table";
import { ContractModal } from "@/modules/assets/components/contract-detail-workspace";
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

  // Modal State (Slide 19: Pop up window for creating or editing contract)
  const [activeContract, setActiveContract] = useState<ServiceContract | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "payments" | "equipment">("details");
  const [modalEditMode, setModalEditMode] = useState(false);
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

  const handleViewContract = (
    contract: ServiceContract,
    tab: "details" | "payments" | "equipment" = "details"
  ) => {
    setActiveContract(contract);
    setActiveTab(tab);
    setModalEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditContract = (contract: ServiceContract) => {
    setActiveContract(contract);
    setActiveTab("details");
    setModalEditMode(true);
    setIsModalOpen(true);
  };

  const handleAddContract = () => {
    const newDraft: ServiceContract = {
      id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      contractNumber: `CNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      vendorName: "",
      contractType: "PM + LABOUR",
      contractStatus: "In Contract",
      contractValue: 0,
      contractStartDate: new Date().toISOString().split("T")[0],
      contractEndDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      totalAmountPaid: 0,
      totalAmountOutstanding: 0,
      payments: [],
      linkedEquipmentIds: [],
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveContract(newDraft);
    setActiveTab("details");
    setModalEditMode(true);
    setIsModalOpen(true);
  };

  const handleSaveContract = (updated: ServiceContract) => {
    const exists = contracts.some((c) => c.id === updated.id);
    if (exists) {
      assetService.updateContract(updated.id, updated);
    } else {
      assetService.createContract(updated as any);
    }
    setIsModalOpen(false);
    setActiveContract(null);
    loadData();
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

      {/* Slide 19/20/22/24 Pop up window (Modal) for create / edit / view */}
      <ContractModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActiveContract(null);
        }}
        contract={activeContract}
        initialTab={activeTab}
        initialEditMode={modalEditMode}
        onSave={handleSaveContract}
        isAdmin={isAdmin}
      />
    </div>
  );
}
