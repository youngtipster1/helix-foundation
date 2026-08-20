import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import type { UserComplianceKPI } from "../types";
import { Award, AlertTriangle, CheckCircle2 } from "lucide-react";

interface QualityComplianceChartProps {
  data: UserComplianceKPI[];
}

export function QualityComplianceChart({ data }: QualityComplianceChartProps) {
  const compliantCount = data.filter((d) => d.complianceRate >= 100).length;
  const nonCompliantCount = data.filter((d) => d.complianceRate < 100).length;

  return (
    <div className="surface-panel p-6 space-y-4">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Award className="size-4 text-primary" />
            <h2 className="text-sm font-bold tracking-tight text-foreground uppercase">
              Quality Compliance
            </h2>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            % Quality Compliance per user &bull; (Completed Trainings &divide; Assigned Trainings &times; 100)
          </p>
        </div>

        {/* Legend / Status Highlights */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="size-3 rounded bg-emerald-500 shrink-0" />
            <span className="text-muted-foreground">100% Compliant ({compliantCount})</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="size-3 rounded bg-rose-500 shrink-0" />
            <span className="text-muted-foreground">&lt; 100% Pending ({nonCompliantCount})</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
            <XAxis
              dataKey="userName"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
            />
            <RechartsTooltip
              cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as UserComplianceKPI;
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3.5 py-2.5 text-xs shadow-lg space-y-1">
                      <p className="font-bold text-foreground">{item.userName}</p>
                      <p className="text-muted-foreground">
                        Quality Compliance:{" "}
                        <strong
                          className={
                            item.complianceRate >= 100
                              ? "text-emerald-600 dark:text-emerald-400 font-mono"
                              : "text-rose-600 dark:text-rose-400 font-mono"
                          }
                        >
                          {item.complianceRate}%
                        </strong>
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        Completed: {item.completedCount} / {item.assignedCount} assigned
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="complianceRate" radius={[4, 4, 0, 0]} maxBarSize={52}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fillColor} />
              ))}
              <LabelList
                dataKey="complianceRate"
                position="top"
                formatter={(val: number) => `${val}%`}
                style={{ fontSize: 11, fontWeight: 700, fill: "currentColor" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
