import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";
import { partsService } from "@/modules/parts/services/parts-service";
import { PartsDashboardView } from "@/modules/parts/components/parts-dashboard-view";
import { PartsDashboardMetrics } from "@/modules/parts/types";

export const Route = createFileRoute("/app/parts/dashboard")({
  head: () => ({
    meta: [
      { title: "Parts Dashboard — HEMP" },
      {
        name: "description",
        content: "Overview of spare parts valuation, inventory quantity, shelf-life expiry buckets, and shrinkage variance trends.",
      },
    ],
  }),
  component: PartsDashboardPage,
});

function PartsDashboardPage() {
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

  return <PartsDashboardView metrics={metrics} />;
}
