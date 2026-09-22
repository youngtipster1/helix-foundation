import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Loading } from "@/components/ui/loading";
import { financialService } from "@/modules/financial/services/financial-service";
import { PurchaseOrdersTable } from "@/modules/financial/components/purchase-orders-table";
import { PurchaseOrderDetailsModal } from "@/modules/financial/components/purchase-order-details-modal";
import { RecordDeliveryModal } from "@/modules/financial/components/record-delivery-modal";
import { PurchaseOrder, RecordDeliveryInput } from "@/modules/financial/types";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";

export const Route = createFileRoute("/app/financial/purchase-orders")({
  head: () => ({
    meta: [
      { title: "Purchase Orders — HEMP" },
      {
        name: "description",
        content:
          "Official supplier-specific purchase orders, vendor deliveries tracking, and inventory fulfillment status.",
      },
    ],
  }),
  component: FinancialPurchaseOrdersPage,
});

function FinancialPurchaseOrdersPage() {
  const { user } = useAuth();
  const isAdmin = isModuleAdmin(user, "financial");

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [deliveryPO, setDeliveryPO] = useState<PurchaseOrder | null>(null);

  const loadData = async () => {
    try {
      const pos = await financialService.getPurchaseOrders();
      setPurchaseOrders(pos);
    } catch (err) {
      console.error("Failed to load purchase orders data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCsv = () => {
    const headers = [
      "PO Number",
      "Source Order Number",
      "Requisition Number",
      "Supplier Name",
      "Items Count",
      "Target Date",
      "Net Total",
      "VAT",
      "Gross Total",
      "Status",
    ];
    const rows = purchaseOrders.map((po) => [
      po.poNumber,
      po.sourceOrderNumber,
      po.requisitionNumber,
      `"${po.supplierName}"`,
      po.items.length,
      po.targetDeliveryDate,
      po.totalPrice,
      po.vatAmount,
      po.grossTotal,
      po.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HEMP_POs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Procurement & Finance"
        title="Purchase Orders (POs)"
        subtitle="Supplier-specific commercial procurement orders generated from approved internal requisitions."
        icon={FileSpreadsheet}
      />

      <PurchaseOrdersTable
        purchaseOrders={purchaseOrders}
        isAdmin={isAdmin}
        onViewPO={(po) => setViewingPO(po)}
        onRecordDelivery={(po) => setDeliveryPO(po)}
        onExportCsv={handleExportCsv}
      />

      {/* PO Details Modal */}
      <PurchaseOrderDetailsModal
        open={Boolean(viewingPO)}
        onOpenChange={(open) => {
          if (!open) setViewingPO(null);
        }}
        purchaseOrder={viewingPO}
        isAdmin={isAdmin}
        onRecordDelivery={(po) => {
          setViewingPO(null);
          setDeliveryPO(po);
        }}
      />

      {/* Record Delivery Modal */}
      <RecordDeliveryModal
        open={Boolean(deliveryPO)}
        onOpenChange={(open) => {
          if (!open) setDeliveryPO(null);
        }}
        purchaseOrder={deliveryPO}
        onConfirm={async (input: RecordDeliveryInput) => {
          if (user) {
            const { po: updatedPO } = await financialService.recordDelivery(input, user);
            if (viewingPO?.id === updatedPO.id) setViewingPO(updatedPO);
            await loadData();
          }
        }}
      />
    </div>
  );
}
