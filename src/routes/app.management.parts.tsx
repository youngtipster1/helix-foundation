import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Loading } from "@/components/ui/loading";
import { partsService } from "@/modules/parts/services/parts-service";
import { PartsDashboardView } from "@/modules/parts/components/parts-dashboard-view";
import { PartsDashboardMetrics } from "@/modules/parts/types";

export const Route = createFileRoute("/app/management/parts")({
  head: () => ({
    meta: [
      { title: "Parts Inventory Overview — Management | HEMP" },
      {
        name: "description",
        content: "Executive overview of spare parts valuation, inventory health, and expiry buckets.",
      },
    ],
  }),
  component: ManagementPartsPage,
});

function ManagementPartsPage() {
  const [metrics, setMetrics] = useState<PartsDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await partsService.getDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        console.error("Failed to load parts dashboard metrics", err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
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
        title="Parts & Inventory Health"
        subtitle="Overview of spare parts valuation, inventory quantity, shelf-life expiry buckets, and critical stockout alerts."
        icon={Boxes}
      />

      <PartsDashboardView metrics={metrics} />
    </div>
  );
}
