import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Loading } from "@/components/ui/loading";
import { financialService } from "@/modules/financial/services/financial-service";
import { FinancialDashboardView } from "@/modules/financial/components/financial-dashboard-view";
import { OrderFormModal } from "@/modules/financial/components/order-form-modal";
import { OrderDetailsModal } from "@/modules/financial/components/order-details-modal";
import { SendBackModal } from "@/modules/financial/components/send-back-modal";
import { RecordDeliveryModal } from "@/modules/financial/components/record-delivery-modal";
import {
  FinancialDashboardMetrics,
  Order,
  PurchaseOrder,
  RecordDeliveryInput,
} from "@/modules/financial/types";
import { useAuth } from "@/features/auth/auth-context";

export const Route = createFileRoute("/app/financial/dashboard")({
  head: () => ({
    meta: [
      { title: "Financial Dashboard — HEMP" },
      {
        name: "description",
        content:
          "High-level procurement KPIs including Total Order Value, OTIF rates, cycle times, and order accuracy analytics.",
      },
    ],
  }),
  component: FinancialDashboardPage,
});

function FinancialDashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<FinancialDashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [sendBackOrder, setSendBackOrder] = useState<Order | null>(null);
  const [deliveryPO, setDeliveryPO] = useState<PurchaseOrder | null>(null);

  const loadDashboardData = async () => {
    try {
      const [m, allOrders, allPos] = await Promise.all([
        financialService.getDashboardMetrics(),
        financialService.getOrders({ includeArchived: false }),
        financialService.getPurchaseOrders(),
      ]);
      setMetrics(m);
      setRecentOrders(allOrders);
      setPendingOrders(allOrders.filter((o) => o.status === "SUBMITTED"));
      setPos(allPos);
    } catch (err) {
      console.error("Failed to load financial dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading || !metrics) {
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
        title="Financial & Procurement Dashboard"
        subtitle="Procurement key performance indicators, fulfillment velocity, and multi-supplier financial analytics."
        icon={Receipt}
      />

      <FinancialDashboardView
        metrics={metrics}
        recentOrders={recentOrders}
        pendingOrders={pendingOrders}
        onCreateOrder={() => setCreateModalOpen(true)}
        onViewOrder={(order) => setDetailsOrder(order)}
      />

      {/* Order Creation / Edit Modal */}
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
          await loadDashboardData();
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
            await loadDashboardData();
          }
        }}
        onSendBack={(order) => {
          setSendBackOrder(order);
        }}
        onFinalApprove={async (order) => {
          if (user) {
            const { order: updated } = await financialService.finalApproveOrder(order.id, user);
            setDetailsOrder(updated);
            await loadDashboardData();
          }
        }}
        onArchive={async (order) => {
          if (user) {
            const updated = await financialService.archiveOrder(order.id, user);
            setDetailsOrder(updated);
            await loadDashboardData();
          }
        }}
        onUnarchive={async (order) => {
          if (user) {
            const updated = await financialService.unarchiveOrder(order.id, user);
            setDetailsOrder(updated);
            await loadDashboardData();
          }
        }}
        onRecordDelivery={(po) => {
          setDeliveryPO(po);
        }}
      />

      {/* Send Back Reason Modal */}
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
            await loadDashboardData();
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
            await loadDashboardData();
          }
        }}
      />
    </div>
  );
}
