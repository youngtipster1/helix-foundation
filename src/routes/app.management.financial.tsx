import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Landmark } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Loading } from "@/components/ui/loading";
import { financialService } from "@/modules/financial/services/financial-service";
import { FinancialDashboardView } from "@/modules/financial/components/financial-dashboard-view";
import { FinancialDashboardMetrics, Order } from "@/modules/financial/types";

export const Route = createFileRoute("/app/management/financial")({
  head: () => ({
    meta: [
      { title: "Financial & Spend Overview — Management | HEMP" },
      {
        name: "description",
        content: "Executive procurement KPIs including Total Order Value, OTIF rates, and supplier distribution.",
      },
    ],
  }),
  component: ManagementFinancialPage,
});

function ManagementFinancialPage() {
  const [metrics, setMetrics] = useState<FinancialDashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [m, allOrders] = await Promise.all([
        financialService.getDashboardMetrics(),
        financialService.getOrders({ includeArchived: false }),
      ]);
      setMetrics(m);
      setRecentOrders(allOrders);
      setPendingOrders(allOrders.filter((o) => o.status === "SUBMITTED"));
    } catch (err) {
      console.error("Failed to load management financial data", err);
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
        title="Financial & Procurement Overview"
        subtitle="Procurement key performance indicators, fulfillment velocity, and multi-supplier financial analytics."
        icon={Landmark}
      />

      <FinancialDashboardView
        metrics={metrics}
        recentOrders={recentOrders}
        pendingOrders={pendingOrders}
        readOnly={true}
      />
    </div>
  );
}
