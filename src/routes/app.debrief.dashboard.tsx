import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import { kpiService } from "@/modules/debrief/services/kpi-service";
import type { EngineerKPIRecord, TeamKPISummary } from "@/modules/debrief/services/kpi-service";
import {
  EngineerKPIBarCharts,
  type KPIType,
} from "@/modules/debrief/components/dashboard/engineer-kpi-bar-charts";
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  Activity,
  Navigation,
  CheckSquare,
  BarChart2,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/debrief/dashboard")({
  head: () => ({
    meta: [
      { title: "Debrief Dashboard — HEMP" },
      {
        name: "description",
        content:
          "Operational overview of Debrief engineer performance KPI bar charts and comparative metrics.",
      },
    ],
  }),
  component: DebriefDashboardPage,
});

function DebriefDashboardPage() {
  const { user } = useAuth();

  // Active KPI selected from top stat cards (defaults to FTFR)
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

  const isAdmin =
    Boolean(user?.isSuperAdmin) ||
    user?.role === "Super Admin" ||
    isModuleAdmin(user, "debrief") ||
    (user?.role || "").toLowerCase().includes("admin");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const kpis = await kpiService.getEngineerKPIs();
      setKpiData(kpis);
    } catch (err) {
      console.error("Failed to load dashboard operational data", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="w-full space-y-6 pb-12">
      <PageHeader
        title="Debrief Dashboard"
        subtitle={
          isAdmin
            ? "High-level operational overview: select any performance KPI card to inspect comparative lean bar charts across biomedical engineers."
            : "Operational overview of personal and team performance benchmarks."
        }
      />

      {/* TOP KPI STAT CARDS (Clicking any card immediately displays the corresponding bar chart data below) */}
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

      {/* LEAN ENGINEER KPI BAR CHARTS (Source-Mandated Per Engineer Bar Charts) */}
      <EngineerKPIBarCharts
        records={kpiData.records}
        summary={kpiData.summary}
        activeKPI={activeKPI}
      />
    </div>
  );
}
