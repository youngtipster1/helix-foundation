import { useMemo } from "react";
import type { EngineerKPIRecord, TeamKPISummary } from "../../services/kpi-service";
import {
  CheckCircle2,
  Clock,
  Activity,
  Navigation,
  CheckSquare,
  TrendingUp,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type KPIType = "ftfr" | "mttr" | "utilization" | "travel" | "volume";

interface EngineerKPIBarChartsProps {
  records: EngineerKPIRecord[];
  summary: TeamKPISummary;
  activeKPI: KPIType;
}

export function EngineerKPIBarCharts({
  records,
  summary,
  activeKPI,
}: EngineerKPIBarChartsProps) {
  // Sorted list based on active KPI
  const sortedRecords = useMemo(() => {
    const list = [...records];
    if (activeKPI === "ftfr") {
      return list.sort((a, b) => b.ftfr - a.ftfr);
    }
    if (activeKPI === "mttr") {
      return list.sort((a, b) => a.mttr - b.mttr); // Lower MTTR is better
    }
    if (activeKPI === "utilization") {
      return list.sort((a, b) => b.utilizationRate - a.utilizationRate);
    }
    if (activeKPI === "travel") {
      return list.sort((a, b) => a.avgTravelTimeHours - b.avgTravelTimeHours); // Lower travel time is more efficient
    }
    if (activeKPI === "volume") {
      return list.sort((a, b) => b.jobsCompletedCount - a.jobsCompletedCount);
    }
    return list;
  }, [records, activeKPI]);

  const maxVolume = useMemo(() => {
    return Math.max(...records.map((r) => r.jobsCompletedCount), 8);
  }, [records]);

  const maxMTTR = useMemo(() => {
    return Math.max(...records.map((r) => r.mttr), 6);
  }, [records]);

  const maxTravelHours = useMemo(() => {
    return Math.max(...records.map((r) => r.avgTravelTimeHours), 3);
  }, [records]);

  const kpiInfo = useMemo(() => {
    switch (activeKPI) {
      case "ftfr":
        return {
          title: "First-Time Fix Rate (FTFR)",
          description:
            "Percentage of service calls resolved on the initial visit without needing a follow-up trip.",
          targetLabel: "Target Benchmark: ≥ 85%",
          teamAvgLabel: `Team Avg: ${summary.avgFTFR}%`,
          icon: CheckCircle2,
          unit: "%",
        };
      case "mttr":
        return {
          title: "Mean Time to Repair (MTTR)",
          description:
            "Average active hours required to troubleshoot and fix reported equipment issues.",
          targetLabel: "Target Benchmark: ≤ 3.5 Hours",
          teamAvgLabel: `Team Avg: ${summary.avgMTTR}h`,
          icon: Clock,
          unit: "h",
        };
      case "utilization":
        return {
          title: "Technician Utilization Rate",
          description:
            "Share of working days with active service job assignments versus idle time.",
          targetLabel: "Target Benchmark: ≥ 75%",
          teamAvgLabel: `Team Avg: ${summary.avgUtilization}%`,
          icon: Activity,
          unit: "%",
        };
      case "travel":
        return {
          title: "Average Travel Time",
          description:
            "Average transit and travel duration recorded per dispatched service call.",
          targetLabel: "Efficiency Goal: ≤ 1.5 Hours",
          teamAvgLabel: `Team Avg: ${summary.avgTravelTimeHours}h`,
          icon: Navigation,
          unit: "h",
        };
      case "volume":
        return {
          title: "Jobs Completed per Technician",
          description:
            "Total volume of successfully debriefed and completed service calls.",
          targetLabel: "Total Across Team",
          teamAvgLabel: `Total: ${summary.totalJobsCompleted} Jobs (Avg ${summary.avgJobsCompleted}/tech)`,
          icon: CheckSquare,
          unit: " jobs",
        };
    }
  }, [activeKPI, summary]);

  const ActiveIcon = kpiInfo.icon;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden space-y-4 p-5">
      {/* Active KPI Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
            <ActiveIcon className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>{kpiInfo.title}</span>
              <span className="text-xs font-normal text-muted-foreground">
                (Comparative Lean Bar Chart)
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">{kpiInfo.description}</p>
          </div>
        </div>

        {/* Benchmark Indicators */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1 rounded-lg bg-muted/60 text-foreground font-semibold text-xs flex items-center gap-1.5">
            <Target className="size-3.5 text-primary" />
            <span>{kpiInfo.targetLabel}</span>
          </div>
          <div className="px-3 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center gap-1.5">
            <TrendingUp className="size-3.5" />
            <span>{kpiInfo.teamAvgLabel}</span>
          </div>
        </div>
      </div>

      {/* Lean Bar Chart Row List */}
      <div className="space-y-2.5 pt-1">
        {sortedRecords.map((eng, idx) => {
          const initials = eng.engineerName
            .split(" ")
            .map((n) => n[0])
            .join("");

          return (
            <div
              key={eng.engineerId}
              className="p-3 rounded-xl border border-border/50 bg-muted/5 hover:bg-muted/15 transition-all space-y-1.5"
            >
              {/* Row Header: Engineer Info & Value Pill */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs font-bold text-muted-foreground w-5 shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {initials}
                  </div>
                  <span className="font-bold text-foreground text-xs truncate">
                    {eng.engineerName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate hidden md:inline">
                    · {eng.jobTitle}
                  </span>
                </div>

                {/* Lean Formatted Value Pill */}
                <div className="font-mono text-xs font-bold shrink-0">
                  {activeKPI === "ftfr" && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md",
                        eng.ftfr >= 85
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {eng.ftfr}% FTFR
                    </span>
                  )}
                  {activeKPI === "mttr" && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md",
                        eng.mttr <= 3.5
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {eng.mttr.toFixed(1)}h MTTR
                    </span>
                  )}
                  {activeKPI === "utilization" && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md",
                        eng.utilizationRate >= 75
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {eng.utilizationRate}% Utilization
                    </span>
                  )}
                  {activeKPI === "travel" && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md",
                        eng.avgTravelTimeHours <= 1.5
                          ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {eng.avgTravelTimeHours.toFixed(1)}h Travel
                    </span>
                  )}
                  {activeKPI === "volume" && (
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      {eng.jobsCompletedCount} Completed
                    </span>
                  )}
                </div>
              </div>

              {/* Lean Bar Visual (Height: 8px, Sleek, Rounded-full) */}
              {activeKPI === "ftfr" && (
                <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden relative">
                  {/* 85% Target Indicator line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/40 z-10"
                    style={{ left: "85%" }}
                    title="Target: 85%"
                  />
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      eng.ftfr >= 85 ? "bg-emerald-500" : "bg-rose-500"
                    )}
                    style={{ width: `${Math.min(eng.ftfr, 100)}%` }}
                  />
                </div>
              )}

              {activeKPI === "mttr" && (
                <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden relative">
                  {/* 3.5h Target Indicator line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/40 z-10"
                    style={{ left: `${(3.5 / maxMTTR) * 100}%` }}
                    title="Target: 3.5h"
                  />
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      eng.mttr <= 3.5 ? "bg-emerald-500" : "bg-amber-500"
                    )}
                    style={{ width: `${(eng.mttr / maxMTTR) * 100}%` }}
                  />
                </div>
              )}

              {activeKPI === "utilization" && (
                <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden relative">
                  {/* 75% Target Indicator line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/40 z-10"
                    style={{ left: "75%" }}
                    title="Target: 75%"
                  />
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      eng.utilizationRate >= 75 ? "bg-emerald-500" : "bg-amber-500"
                    )}
                    style={{ width: `${Math.min(eng.utilizationRate, 100)}%` }}
                  />
                </div>
              )}

              {activeKPI === "travel" && (
                <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden relative">
                  {/* 1.5h Target Indicator line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/40 z-10"
                    style={{ left: `${(1.5 / maxTravelHours) * 100}%` }}
                    title="Goal: 1.5h"
                  />
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      eng.avgTravelTimeHours <= 1.5 ? "bg-sky-500" : "bg-amber-500"
                    )}
                    style={{
                      width: `${(eng.avgTravelTimeHours / maxTravelHours) * 100}%`,
                    }}
                  />
                </div>
              )}

              {activeKPI === "volume" && (
                <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{
                      width: `${(eng.jobsCompletedCount / maxVolume) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
