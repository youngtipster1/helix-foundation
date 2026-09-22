import { useState, useMemo } from "react";
import type { EngineerKPIRecord, TeamKPISummary } from "../../services/kpi-service";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Activity,
  Navigation,
  CheckSquare,
  TrendingUp,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EngineerKPIBarChartsProps {
  records: EngineerKPIRecord[];
  summary: TeamKPISummary;
}

type KPIType = "ftfr" | "mttr" | "utilization" | "travel" | "volume";

export function EngineerKPIBarCharts({ records, summary }: EngineerKPIBarChartsProps) {
  const [selectedKPI, setSelectedKPI] = useState<KPIType>("ftfr");
  const [travelSubMetric, setTravelSubMetric] = useState<"both" | "time" | "distance">("both");

  // Sorted list based on active KPI
  const sortedRecords = useMemo(() => {
    const list = [...records];
    if (selectedKPI === "ftfr") {
      return list.sort((a, b) => b.ftfr - a.ftfr);
    }
    if (selectedKPI === "mttr") {
      return list.sort((a, b) => a.mttr - b.mttr); // Lower MTTR is better
    }
    if (selectedKPI === "utilization") {
      return list.sort((a, b) => b.utilizationRate - a.utilizationRate);
    }
    if (selectedKPI === "travel") {
      return list.sort((a, b) => a.avgTravelTimeHours - b.avgTravelTimeHours);
    }
    if (selectedKPI === "volume") {
      return list.sort((a, b) => b.jobsCompletedCount - a.jobsCompletedCount);
    }
    return list;
  }, [records, selectedKPI]);

  const maxVolume = useMemo(() => {
    return Math.max(...records.map((r) => r.jobsCompletedCount), 10);
  }, [records]);

  const maxMTTR = useMemo(() => {
    return Math.max(...records.map((r) => r.mttr), 6);
  }, [records]);

  const maxTravelHours = useMemo(() => {
    return Math.max(...records.map((r) => r.avgTravelTimeHours), 3);
  }, [records]);

  const maxTravelKm = useMemo(() => {
    return Math.max(...records.map((r) => r.avgTravelDistanceKm), 60);
  }, [records]);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden space-y-4 p-5">
      {/* KPI Header & Tab Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Engineer KPI Benchmarks (Per-Engineer Bar Charts)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            System-generated performance comparative analysis across biomedical engineering personnel.
          </p>
        </div>

        {/* 5 Source-Mandated KPI Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/50">
          <Button
            variant={selectedKPI === "ftfr" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedKPI("ftfr")}
            className={cn(
              "h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer rounded-lg",
              selectedKPI === "ftfr"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CheckCircle2 className="size-3.5" />
            <span>1. FTFR (%)</span>
          </Button>

          <Button
            variant={selectedKPI === "mttr" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedKPI("mttr")}
            className={cn(
              "h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer rounded-lg",
              selectedKPI === "mttr"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Clock className="size-3.5" />
            <span>2. MTTR (Hours)</span>
          </Button>

          <Button
            variant={selectedKPI === "utilization" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedKPI("utilization")}
            className={cn(
              "h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer rounded-lg",
              selectedKPI === "utilization"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Activity className="size-3.5" />
            <span>3. Utilization (%)</span>
          </Button>

          <Button
            variant={selectedKPI === "travel" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedKPI("travel")}
            className={cn(
              "h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer rounded-lg",
              selectedKPI === "travel"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Navigation className="size-3.5" />
            <span>4. Travel (Time &amp; Dist)</span>
          </Button>

          <Button
            variant={selectedKPI === "volume" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedKPI("volume")}
            className={cn(
              "h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer rounded-lg",
              selectedKPI === "volume"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CheckSquare className="size-3.5" />
            <span>5. Volume Done</span>
          </Button>
        </div>
      </div>

      {/* Benchmark Banner for Active KPI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/20 border border-border/60 text-xs">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-primary shrink-0" />
          <div className="text-foreground">
            {selectedKPI === "ftfr" && (
              <span>
                <strong className="font-semibold">First-Time Fix Rate (FTFR):</strong> Percentage of service calls resolved on the initial visit without needing a follow-up trip. <strong>Target: &ge; 85%</strong>
              </span>
            )}
            {selectedKPI === "mttr" && (
              <span>
                <strong className="font-semibold">Mean Time to Repair (MTTR):</strong> Average hours required to troubleshoot and fix reported issues. <strong>Target Benchmark: &le; 3.5 Hours</strong>
              </span>
            )}
            {selectedKPI === "utilization" && (
              <span>
                <strong className="font-semibold">Technician Utilization Rate:</strong> Share of working days with active service assignments. <strong>Target: &ge; 75%</strong>
              </span>
            )}
            {selectedKPI === "travel" && (
              <span>
                <strong className="font-semibold">Average Travel Time &amp; Distance:</strong> Distinct travel duration and route distance measured per service call dispatch.
              </span>
            )}
            {selectedKPI === "volume" && (
              <span>
                <strong className="font-semibold">Jobs Completed per Technician:</strong> Total volume of successfully executed and closed service jobs.
              </span>
            )}
          </div>
        </div>

        {/* Sub-metric toggle for Travel Time & Distance */}
        {selectedKPI === "travel" && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setTravelSubMetric("both")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                travelSubMetric === "both"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              Dual View
            </button>
            <button
              type="button"
              onClick={() => setTravelSubMetric("time")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                travelSubMetric === "time"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              Time (h)
            </button>
            <button
              type="button"
              onClick={() => setTravelSubMetric("distance")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                travelSubMetric === "distance"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              Distance (km)
            </button>
          </div>
        )}

        {/* Team average summary badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0 self-start sm:self-auto">
          <TrendingUp className="size-3.5" />
          <span>
            {selectedKPI === "ftfr" && `Team Avg: ${summary.avgFTFR}%`}
            {selectedKPI === "mttr" && `Team Avg: ${summary.avgMTTR}h`}
            {selectedKPI === "utilization" && `Team Avg: ${summary.avgUtilization}%`}
            {selectedKPI === "travel" && `Avg: ${summary.avgTravelTimeHours}h · ${summary.avgTravelDistanceKm} km`}
            {selectedKPI === "volume" && `Total Completed: ${summary.totalJobsCompleted} Jobs`}
          </span>
        </div>
      </div>

      {/* The Per-Engineer Bar Chart Container */}
      <div className="space-y-3 pt-2">
        {sortedRecords.map((eng) => {
          return (
            <div
              key={eng.engineerId}
              className="p-3.5 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/20 transition-colors space-y-2"
            >
              {/* Engineer Header info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {eng.engineerName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <span className="font-bold text-foreground text-xs">{eng.engineerName}</span>
                  <span className="text-muted-foreground text-xs font-normal">
                    · {eng.jobTitle}
                  </span>
                </div>

                {/* Exact Value Display */}
                <div className="font-mono text-xs font-bold text-foreground self-end sm:self-auto">
                  {selectedKPI === "ftfr" && (
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
                  {selectedKPI === "mttr" && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md",
                        eng.mttr <= 3.5
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {eng.mttr.toFixed(1)} Hours MTTR
                    </span>
                  )}
                  {selectedKPI === "utilization" && (
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
                  {selectedKPI === "travel" && (
                    <div className="flex items-center gap-2">
                      {(travelSubMetric === "both" || travelSubMetric === "time") && (
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                          {eng.avgTravelTimeHours.toFixed(1)}h avg time
                        </span>
                      )}
                      {(travelSubMetric === "both" || travelSubMetric === "distance") && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          {eng.avgTravelDistanceKm} km avg dist
                        </span>
                      )}
                    </div>
                  )}
                  {selectedKPI === "volume" && (
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      {eng.jobsCompletedCount} Completed Jobs
                    </span>
                  )}
                </div>
              </div>

              {/* Bar Visual Representation */}
              {selectedKPI === "ftfr" && (
                <div className="w-full bg-muted/60 h-4 rounded-full overflow-hidden relative">
                  {/* 85% Target Indicator line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/40 z-10"
                    style={{ left: "85%" }}
                    title="Target Benchmark: 85%"
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

              {selectedKPI === "mttr" && (
                <div className="w-full bg-muted/60 h-4 rounded-full overflow-hidden relative">
                  {/* 3.5h Target Indicator line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/40 z-10"
                    style={{ left: `${(3.5 / maxMTTR) * 100}%` }}
                    title="Target Benchmark: 3.5h"
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

              {selectedKPI === "utilization" && (
                <div className="w-full bg-muted/60 h-4 rounded-full overflow-hidden relative">
                  {/* 75% Target Indicator line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/40 z-10"
                    style={{ left: "75%" }}
                    title="Target Benchmark: 75%"
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

              {selectedKPI === "travel" && (
                <div className="space-y-1.5">
                  {(travelSubMetric === "both" || travelSubMetric === "time") && (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                        <span>Travel Duration</span>
                        <span>{eng.avgTravelTimeHours.toFixed(1)}h / job</span>
                      </div>
                      <div className="w-full bg-muted/60 h-3 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${(eng.avgTravelTimeHours / maxTravelHours) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {(travelSubMetric === "both" || travelSubMetric === "distance") && (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                        <span>Travel Distance</span>
                        <span>{eng.avgTravelDistanceKm} km / job</span>
                      </div>
                      <div className="w-full bg-muted/60 h-3 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${(eng.avgTravelDistanceKm / maxTravelKm) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedKPI === "volume" && (
                <div className="w-full bg-muted/60 h-4 rounded-full overflow-hidden">
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
