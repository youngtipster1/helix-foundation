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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList,
} from "recharts";

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
          targetValue: 85,
          domain: [0, 100],
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
          targetValue: 3.5,
          domain: [0, 6],
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
          targetValue: 75,
          domain: [0, 100],
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
          targetValue: 1.5,
          domain: [0, 4],
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
          targetValue: undefined,
          domain: [0, Math.max(...records.map((r) => r.jobsCompletedCount), 10) + 2],
        };
    }
  }, [activeKPI, summary, records]);

  // Transform data for Vertical Bar Chart
  const chartData = useMemo(() => {
    return sortedRecords.map((eng) => {
      let rawVal = 0;
      let displayVal = "";
      let color = "#0284C7";

      if (activeKPI === "ftfr") {
        rawVal = eng.ftfr;
        displayVal = `${eng.ftfr}%`;
        color = eng.ftfr >= 85 ? "#10B981" : "#F43F5E";
      } else if (activeKPI === "mttr") {
        rawVal = Number(eng.mttr.toFixed(1));
        displayVal = `${rawVal}h`;
        color = eng.mttr <= 3.5 ? "#10B981" : "#F59E0B";
      } else if (activeKPI === "utilization") {
        rawVal = eng.utilizationRate;
        displayVal = `${eng.utilizationRate}%`;
        color = eng.utilizationRate >= 75 ? "#10B981" : "#F59E0B";
      } else if (activeKPI === "travel") {
        rawVal = Number(eng.avgTravelTimeHours.toFixed(1));
        displayVal = `${rawVal}h`;
        color = eng.avgTravelTimeHours <= 1.5 ? "#0284C7" : "#F59E0B";
      } else if (activeKPI === "volume") {
        rawVal = eng.jobsCompletedCount;
        displayVal = `${eng.jobsCompletedCount}`;
        color = "#0284C7";
      }

      const nameParts = eng.engineerName.split(" ");
      const shortName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[1][0]}.` : nameParts[0];

      return {
        ...eng,
        shortName,
        value: rawVal,
        displayVal,
        color,
      };
    });
  }, [sortedRecords, activeKPI]);

  const ActiveIcon = kpiInfo.icon;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden space-y-5 p-5">
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
                (Vertical Performance Chart)
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">{kpiInfo.description}</p>
          </div>
        </div>

        {/* Benchmark Indicators */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1 rounded-lg bg-muted/60 text-foreground font-semibold text-xs flex items-center gap-1.5 border-0">
            <Target className="size-3.5 text-primary" />
            <span>{kpiInfo.targetLabel}</span>
          </div>
          <div className="px-3 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center gap-1.5 border-0">
            <TrendingUp className="size-3.5" />
            <span>{kpiInfo.teamAvgLabel}</span>
          </div>
        </div>
      </div>

      {/* Vertical Bar Chart Container */}
      <div className="h-72 sm:h-80 w-full pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 25, right: 15, left: -10, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
            <XAxis
              dataKey="shortName"
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={35}
            />
            <YAxis
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={kpiInfo.domain as [number, number]}
              tickFormatter={(val) =>
                activeKPI === "ftfr" || activeKPI === "utilization"
                  ? `${val}%`
                  : activeKPI === "mttr" || activeKPI === "travel"
                  ? `${val}h`
                  : `${val}`
              }
            />
            {kpiInfo.targetValue !== undefined && (
              <ReferenceLine
                y={kpiInfo.targetValue}
                stroke="#64748B"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Benchmark (${kpiInfo.targetValue}${kpiInfo.unit})`,
                  position: "insideTopRight",
                  fill: "#64748B",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            )}
            <RechartsTooltip
              cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as typeof chartData[0];
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3.5 py-2.5 text-xs shadow-lg space-y-1">
                      <p className="font-bold text-foreground">{item.engineerName}</p>
                      <p className="text-muted-foreground text-[11px]">{item.jobTitle}</p>
                      <div className="pt-1 flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">{kpiInfo.title}:</span>
                        <strong className="font-mono font-bold" style={{ color: item.color }}>
                          {item.displayVal}
                        </strong>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Completed Jobs: {item.jobsCompletedCount} · FTFR: {item.ftfr}% · MTTR: {item.mttr.toFixed(1)}h
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={44}>
              <LabelList
                dataKey="displayVal"
                position="top"
                content={(props: any) => {
                  const { x, y, width, value } = props;
                  if (!value) return null;
                  return (
                    <text
                      x={x + width / 2}
                      y={y - 8}
                      fill="currentColor"
                      textAnchor="middle"
                      className="fill-foreground font-mono text-[10px] sm:text-[11px] font-bold"
                    >
                      {value}
                    </text>
                  );
                }}
              />
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Engineer Breakdown Leaderboard Grid */}
      <div className="border-t border-border/80 pt-4">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Technician Metric Breakdown & Ranking
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {sortedRecords.map((eng, idx) => {
            const initials = eng.engineerName
              .split(" ")
              .map((n) => n[0])
              .join("");

            let badgeColor = "bg-primary/10 text-primary";
            let valText = `${eng.jobsCompletedCount} Jobs`;

            if (activeKPI === "ftfr") {
              badgeColor = eng.ftfr >= 85 ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-rose-500/15 text-rose-700 dark:text-rose-400";
              valText = `${eng.ftfr}% FTFR`;
            } else if (activeKPI === "mttr") {
              badgeColor = eng.mttr <= 3.5 ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/15 text-amber-700 dark:text-amber-400";
              valText = `${eng.mttr.toFixed(1)}h MTTR`;
            } else if (activeKPI === "utilization") {
              badgeColor = eng.utilizationRate >= 75 ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/15 text-amber-700 dark:text-amber-400";
              valText = `${eng.utilizationRate}% Util`;
            } else if (activeKPI === "travel") {
              badgeColor = eng.avgTravelTimeHours <= 1.5 ? "bg-sky-500/15 text-sky-700 dark:text-sky-400" : "bg-amber-500/15 text-amber-700 dark:text-amber-400";
              valText = `${eng.avgTravelTimeHours.toFixed(1)}h Travel`;
            }

            return (
              <div
                key={eng.engineerId}
                className="p-2.5 rounded-xl border border-border/60 bg-card/60 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[11px] font-bold text-muted-foreground w-4 shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                    {initials}
                  </div>
                  <span className="font-semibold text-foreground text-xs truncate">
                    {eng.engineerName}
                  </span>
                </div>
                <span className={cn("px-2 py-0.5 rounded text-[11px] font-mono font-bold shrink-0 border-0", badgeColor)}>
                  {valText}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

