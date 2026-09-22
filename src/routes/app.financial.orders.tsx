import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Loading } from "@/components/ui/loading";
import { financialService } from "@/modules/financial/services/financial-service";
import { OrdersTable } from "@/modules/financial/components/orders-table";
import { OrderFormModal } from "@/modules/financial/components/order-form-modal";
import { OrderDetailsModal } from "@/modules/financial/components/order-details-modal";
import { SendBackModal } from "@/modules/financial/components/send-back-modal";
import { RecordDeliveryModal } from "@/modules/financial/components/record-delivery-modal";
import { PurchaseOrderDetailsModal } from "@/modules/financial/components/purchase-order-details-modal";
import { Order, PurchaseOrder, RecordDeliveryInput } from "@/modules/financial/types";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";

export const Route = createFileRoute("/app/financial/orders")({
  head: () => ({
    meta: [
      { title: "Purchase Orders Directory — HEMP" },
      {
        name: "description",
        content:
          "Internal purchasing requests, multi-vendor orders, approval lifecycle, and requisition management.",
      },
    ],
  }),
  component: FinancialOrdersPage,
});

function FinancialOrdersPage() {
  const { user } = useAuth();
  const isAdmin = isModuleAdmin(user, "financial");

  const [orders, setOrders] = useState<Order[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [sendBackOrder, setSendBackOrder] = useState<Order | null>(null);
  const [deliveryPO, setDeliveryPO] = useState<PurchaseOrder | null>(null);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

  const loadData = async () => {
    try {
      const [ordList, poList] = await Promise.all([
        financialService.getOrders({ includeArchived: true }),
        financialService.getPurchaseOrders(),
      ]);
      setOrders(ordList);
      setPos(poList);
    } catch (err) {
      console.error("Failed to load orders directory data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCsv = () => {
    const headers = [
      "Order Number",
      "Date Raised",
      "Category",
      "Initiator",
      "Job Number",
      "Target Date",
      "Net Total",
      "VAT",
      "Gross Total",
      "Status",
    ];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.dateRaised).toLocaleDateString(),
      o.category,
      `"${o.requestedByName}"`,
      o.jobNumber || "",
      o.targetDeliveryDate || "",
      o.totalPrice,
      o.vatAmount,
      o.grossTotal,
      o.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HEMP_Purchase_Orders_${new Date().toISOString().split("T")[0]}.csv`);
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
        title="Purchase Orders Directory"
        subtitle="Manage purchase requisitions, approval revisions, vendor split allocations, and fulfillment states."
        icon={ShoppingCart}
      />

      <OrdersTable
        orders={orders}
        isAdmin={isAdmin}
        currentUserId={user?.id}
        onAddOrder={() => setCreateModalOpen(true)}
        onViewOrder={(order) => setDetailsOrder(order)}
        onEditOrder={(order) => setEditOrder(order)}
        onApproveOrder={async (order) => {
          if (user) {
            const updated = await financialService.approveOrder(order.id, user);
            setDetailsOrder(updated);
            await loadData();
          }
        }}
        onSendBackOrder={(order) => {
          setSendBackOrder(order);
        }}
        onFinalApproveOrder={async (order) => {
          if (user) {
            const { order: updated } = await financialService.finalApproveOrder(order.id, user);
            setDetailsOrder(updated);
            await loadData();
          }
        }}
        onArchiveOrder={async (order) => {
          if (user) {
            const updated = await financialService.archiveOrder(order.id, user);
            setDetailsOrder(updated);
            await loadData();
          }
        }}
        onUnarchiveOrder={async (order) => {
          if (user) {
            const updated = await financialService.unarchiveOrder(order.id, user);
            setDetailsOrder(updated);
            await loadData();
          }
        }}
        onExportCsv={handleExportCsv}
      />

      {/* Create / Edit Stepper Modal */}
      <OrderFormModal
        open={createModalOpen || Boolean(editOrder)}
        onOpenChange={(open) => {
          if (!open) {
            setCreateModalOpen(false);
            setEditOrder(null);
          }
        }}
        orderToEdit={editOrder}
        onSaved={async () => {
          await loadData();
        }}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        open={Boolean(detailsOrder)}
        onOpenChange={(open) => {
          if (!open) setDetailsOrder(null);
        }}
        order={detailsOrder}
        pos={pos}
        onEdit={(order) => {
          setDetailsOrder(null);
          setEditOrder(order);
        }}
        onApprove={async (order) => {
          if (user) {
            const updated = await financialService.approveOrder(order.id, user);
            setDetailsOrder(updated);
            await loadData();
          }
        }}
        onSendBack={(order) => {
          setSendBackOrder(order);
        }}
        onFinalApprove={async (order) => {
          if (user) {
            const { order: updated } = await financialService.finalApproveOrder(order.id, user);
            setDetailsOrder(updated);
            await loadData();
          }
        }}
        onArchive={async (order) => {
          if (user) {
            const updated = await financialService.archiveOrder(order.id, user);
            setDetailsOrder(updated);
            await loadData();
          }
        }}
        onUnarchive={async (order) => {
          if (user) {
            const updated = await financialService.unarchiveOrder(order.id, user);
            setDetailsOrder(updated);
            await loadData();
          }
        }}
        onViewPO={(po) => {
          setViewingPO(po);
        }}
        onRecordDelivery={(po) => {
          setDeliveryPO(po);
        }}
      />

      {/* Send Back Prompt Modal */}
      <SendBackModal
        open={Boolean(sendBackOrder)}
        onOpenChange={(open) => {
          if (!open) setSendBackOrder(null);
        }}
        order={sendBackOrder}
        onConfirm={async (orderId, reason) => {
          if (user) {
            const updated = await financialService.sendBackOrder(orderId, reason, user);
            if (detailsOrder?.id === orderId) setDetailsOrder(updated);
            await loadData();
          }
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
            const { order: updatedOrder } = await financialService.recordDelivery(input, user);
            if (detailsOrder?.id === updatedOrder.id) setDetailsOrder(updatedOrder);
            await loadData();
          }
        }}
      />

      {/* Purchase Order Details Modal */}
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
    </div>
  );
}
