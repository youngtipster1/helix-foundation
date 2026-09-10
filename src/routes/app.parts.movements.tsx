import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeftRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import { partsService } from "@/modules/parts/services/parts-service";
import { StockMovementsTable } from "@/modules/parts/components/stock-movements-table";
import { StockMovement, StockMovementType, Part } from "@/modules/parts/types";

export const Route = createFileRoute("/app/parts/movements")({
  head: () => ({
    meta: [
      { title: "Stock Movements Ledger — HEMP" },
      {
        name: "description",
        content: "Audit-trailed inventory ledger tracking stock receipts, job issuances, returns, and adjustments.",
      },
    ],
  }),
  component: StockMovementsPage,
});

function StockMovementsPage() {
  const { user } = useAuth();
  const isAdmin = isModuleAdmin(user, "parts");

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [movementsData, partsData] = await Promise.all([
        partsService.listMovements(),
        partsService.list(),
      ]);
      setMovements(movementsData);
      setParts(partsData);
    } catch (err) {
      console.error("Failed to load stock movements", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecordMovement = async (input: {
    partId: string;
    type: StockMovementType;
    quantity: number;
    referenceNumber: string;
    performedBy: string;
    notes?: string;
  }) => {
    await partsService.recordMovement(input);
    loadData();
  };

  const currentUserName = user ? `${user.firstName} ${user.lastName}` : "Clinical Engineer";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Movements Ledger"
        subtitle="Immutable transaction journal tracking parts received, issued to work orders, returned, and adjusted"
        icon={ArrowLeftRight}
      />

      {loading ? (
        <div className="flex min-h-[350px] items-center justify-center">
          <Loading />
        </div>
      ) : (
        <StockMovementsTable
          movements={movements}
          parts={parts}
          isAdmin={isAdmin}
          onRecordMovement={handleRecordMovement}
          currentUserName={currentUserName}
        />
      )}
    </div>
  );
}
