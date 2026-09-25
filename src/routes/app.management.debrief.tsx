import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { kpiService } from "@/modules/debrief/services/kpi-service";
import type { EngineerKPIRecord, TeamKPISummary } from "@/modules/debrief/services/kpi-service";
import {
  EngineerKPIBarCharts,
  type KPIType,
} from "@/modules/debrief/components/dashboard/engineer-kpi-bar-charts";
import {
  CheckCircle2,
  Clock,
  Activity,
  Navigation,
  TrendingUp,
  BarChart2,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";

export const Route = createFileRoute("/app/management/debrief")({
  head: () => ({
    meta: [
      { title: "Debrief & Ops Overview — Management | HEMP" },
      {
        name: "description",
        content: "Executive overview of biomedical engineer performance KPIs and field throughput.",
      },
    ],
  }),
  component: ManagementDebriefPage,
});

function ManagementDebriefPage() {
  const [activeKPI, setActiveKPI] = useState<KPIType>("ftfr");
  const [kpiData, setKpiData] = useState<{
    records: EngineerKPIRecord[];
    summary: TeamKPISummary;
  }>({
    records: [],
    summary: {
      avgFTFR: 0,
      avgMTTR: 0,
      avgUtilization: 0,
      avgTravelTimeHours: 0,
      totalJobsCompleted: 0,
      avgJobsCompleted: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const kpis = await kpiService.getEngineerKPIs();
      setKpiData(kpis);
    } catch (err) {
      console.error("Failed to load management debrief data", err);
      toast.error("Failed to load debrief KPI data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      <PageHeader
        title="Debrief & Field Operations"
        subtitle="Comparative performance benchmarks, engineer utilization, First-Time Fix Rates (FTFR), and Mean Time to Repair (MTTR)."
        icon={Activity}
      />

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <BarChart2 className="size-3.5 text-primary" />
            <span>Operational KPI Metrics (Select a Metric to View Breakdown)</span>
          </h3>
          <span className="text-xs text-muted-foreground font-mono">11 Biomedical Engineers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="1. FTFR (%)"
            value={`${kpiData.summary.avgFTFR}%`}
            description="First-Time Fix Rate benchmark"
            icon={CheckCircle2}
            active={activeKPI === "ftfr"}
            onClick={() => setActiveKPI("ftfr")}
          />
          <StatCard
            title="2. MTTR (Hours)"
            value={`${kpiData.summary.avgMTTR}h`}
            description="Mean Time to Repair resolution"
            icon={Clock}
            active={activeKPI === "mttr"}
            onClick={() => setActiveKPI("mttr")}
          />
          <StatCard
            title="3. Utilization (%)"
            value={`${kpiData.summary.avgUtilization}%`}
            description="Working Days Active Share"
            icon={Activity}
            active={activeKPI === "utilization"}
            onClick={() => setActiveKPI("utilization")}
          />
          <StatCard
            title="4. Avg Travel Time"
            value={`${kpiData.summary.avgTravelTimeHours}h`}
            description="Average Travel per Service Call"
            icon={Navigation}
            active={activeKPI === "travel"}
            onClick={() => setActiveKPI("travel")}
          />
          <StatCard
            title="5. Total Jobs Done"
            value={kpiData.summary.totalVolumeDone}
            description="Total debriefs executed & verified"
            icon={TrendingUp}
            active={activeKPI === "volume"}
            onClick={() => setActiveKPI("volume")}
          />
        </div>
      </div>

      <EngineerKPIBarCharts
        records={kpiData.records}
        summary={kpiData.summary}
        activeKPI={activeKPI}
      />
    </div>
  );
}
