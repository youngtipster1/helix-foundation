import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";
import { assetService } from "@/modules/assets/services/asset-service";
import { ContractsTable } from "@/modules/assets/components/contracts-table";
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

  // Screen for Create / Edit / View Contract (Slides 20, 22, 24)
  const [workspaceContract, setWorkspaceContract] = useState<ServiceContract | null>(null);

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
    setWorkspaceContract(contract);
  };

  const handleAddContract = () => {
    const newTemplateContract: ServiceContract = {
      id: `cnt_${Date.now()}`,
      contractNumber: `CNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      contractType: "PM + LABOUR",
      contractStatus: "In Contract",
      contractValue: 0,
      contractStartDate: new Date().toISOString().split("T")[0],
      contractEndDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      poNumber: "",
      contractOrderNumber: "",
      contractInvoiceNumber: "",
      totalAmountPaid: 0,
      totalAmountOutstanding: 0,
      paymentTermMonths: 3,
      paymentStartDate: new Date().toISOString().split("T")[0],
      paymentEndDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      nextPaymentDate: new Date().toISOString().split("T")[0],
      payments: [],
      linkedEquipmentIds: [],
      notes: "",
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWorkspaceContract(newTemplateContract);
  };

  const handleSaveWorkspaceContract = (updated: ServiceContract) => {
    const exists = contracts.some((c) => c.id === updated.id);
    if (exists) {
      assetService.updateContract(updated.id, updated);
    } else {
      assetService.createContract(updated as any);
    }
    setWorkspaceContract(null);
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

  // If viewing or creating a contract, render Slide 20/22/24 3-tab layout
  if (workspaceContract) {
    return (
      <div className="space-y-4">
        <ContractDetailWorkspace
          contract={workspaceContract}
          onBack={() => setWorkspaceContract(null)}
          onUpdateContract={handleSaveWorkspaceContract}
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
    </div>
  );
}
