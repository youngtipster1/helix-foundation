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
} from "lucide-react";
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
          {/* Card 1: FTFR */}
          <div
            onClick={() => setActiveKPI("ftfr")}
            className={cn(
              "surface-panel p-5 flex flex-col justify-between cursor-pointer transition-all text-left",
              activeKPI === "ftfr"
                ? "border-primary ring-2 ring-primary/30 shadow-xs bg-primary/5"
                : "hover:border-border/80 hover:bg-muted/10"
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  activeKPI === "ftfr" ? "text-primary" : "text-muted-foreground"
                )}
              >
                1. FTFR (%)
              </span>
              <div
                className={cn(
                  "size-8 rounded-lg grid place-items-center",
                  activeKPI === "ftfr"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary"
                )}
              >
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-mono font-bold text-2xl text-foreground">
                {kpiData.summary.avgFTFR}%
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                &ge; 85% Target
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              First-Time Fix Rate benchmark
            </p>
          </div>

          {/* Card 2: MTTR */}
          <div
            onClick={() => setActiveKPI("mttr")}
            className={cn(
              "surface-panel p-5 flex flex-col justify-between cursor-pointer transition-all text-left",
              activeKPI === "mttr"
                ? "border-primary ring-2 ring-primary/30 shadow-xs bg-primary/5"
                : "hover:border-border/80 hover:bg-muted/10"
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  activeKPI === "mttr" ? "text-primary" : "text-muted-foreground"
                )}
              >
                2. MTTR (Hours)
              </span>
              <div
                className={cn(
                  "size-8 rounded-lg grid place-items-center",
                  activeKPI === "mttr"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary"
                )}
              >
                <Clock className="size-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-mono font-bold text-2xl text-foreground">
                {kpiData.summary.avgMTTR}h
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                &le; 3.5h Target
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mean Time to Repair resolution
            </p>
          </div>

          {/* Card 3: Utilization */}
          <div
            onClick={() => setActiveKPI("utilization")}
            className={cn(
              "surface-panel p-5 flex flex-col justify-between cursor-pointer transition-all text-left",
              activeKPI === "utilization"
                ? "border-primary ring-2 ring-primary/30 shadow-xs bg-primary/5"
                : "hover:border-border/80 hover:bg-muted/10"
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  activeKPI === "utilization" ? "text-primary" : "text-muted-foreground"
                )}
              >
                3. Utilization (%)
              </span>
              <div
                className={cn(
                  "size-8 rounded-lg grid place-items-center",
                  activeKPI === "utilization"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary"
                )}
              >
                <Activity className="size-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-mono font-bold text-2xl text-foreground">
                {kpiData.summary.avgUtilization}%
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                &ge; 75% Target
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Working Days Active Share
            </p>
          </div>

          {/* Card 4: Average Travel Time */}
          <div
            onClick={() => setActiveKPI("travel")}
            className={cn(
              "surface-panel p-5 flex flex-col justify-between cursor-pointer transition-all text-left",
              activeKPI === "travel"
                ? "border-primary ring-2 ring-primary/30 shadow-xs bg-primary/5"
                : "hover:border-border/80 hover:bg-muted/10"
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  activeKPI === "travel" ? "text-primary" : "text-muted-foreground"
                )}
              >
                4. Avg Travel Time
              </span>
              <div
                className={cn(
                  "size-8 rounded-lg grid place-items-center",
                  activeKPI === "travel"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary"
                )}
              >
                <Navigation className="size-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-mono font-bold text-2xl text-foreground">
                {kpiData.summary.avgTravelTimeHours}h
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Transit Velocity
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average Travel per Service Call
            </p>
          </div>

          {/* Card 5: Volume Done */}
          <div
            onClick={() => setActiveKPI("volume")}
            className={cn(
              "surface-panel p-5 flex flex-col justify-between cursor-pointer transition-all text-left",
              activeKPI === "volume"
                ? "border-primary ring-2 ring-primary/30 shadow-xs bg-primary/5"
                : "hover:border-border/80 hover:bg-muted/10"
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  activeKPI === "volume" ? "text-primary" : "text-muted-foreground"
                )}
              >
                5. Total Jobs Done
              </span>
              <div
                className={cn(
                  "size-8 rounded-lg grid place-items-center",
                  activeKPI === "volume"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary"
                )}
              >
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-mono font-bold text-2xl text-foreground">
                {kpiData.summary.totalVolumeDone}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                100% Closed
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total debriefs executed & verified
            </p>
          </div>
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
