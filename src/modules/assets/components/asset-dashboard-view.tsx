import React from "react";
import {
  Stethoscope,
  Banknote,
  Building2,
  ShieldCheck,
  Activity,
  MapPin,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid,
  LabelList,
} from "recharts";
import { AssetDashboardMetrics } from "../types";

export interface AssetDashboardViewProps {
  metrics: AssetDashboardMetrics;
}

export function AssetDashboardView({ metrics }: AssetDashboardViewProps) {
  const upCount =
    metrics.equipmentStatusDistribution.find((d) => d.name === "Up")?.value || 0;
  const uptimePercent =
    metrics.totalEquipment > 0
      ? ((upCount / metrics.totalEquipment) * 100).toFixed(0)
      : "0";

  return (
    <div className="space-y-4">
      {/* 4 Primary KPI Summary Cards matching Inventory & Finance card sizing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Equipment */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Equipment
            </span>
            <div className="size-7 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Stethoscope className="size-3.5" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-mono font-bold text-foreground">
            {metrics.totalEquipment}{" "}
            <span className="text-xs font-sans font-medium text-muted-foreground">units</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Registered biomedical inventory devices
          </p>
        </div>

        {/* 2. Equipment Operational (Up) */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Operational (Up)
            </span>
            <div className="size-7 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Activity className="size-3.5" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {upCount}{" "}
            <span className="text-xs font-sans font-medium text-muted-foreground">
              ({uptimePercent}%)
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Units actively operable in clinical service
          </p>
        </div>

        {/* 3. Total Contract Value */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Contract Value
            </span>
            <div className="size-7 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Banknote className="size-3.5" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-mono font-bold text-foreground">
            ₦{metrics.totalValue.toLocaleString("en-US", { minimumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Active service & maintenance valuation
          </p>
        </div>

        {/* 4. Total OEMs */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total OEMs
            </span>
            <div className="size-7 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Building2 className="size-3.5" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-mono font-bold text-foreground">
            {metrics.totalOems}{" "}
            <span className="text-xs font-sans font-medium text-muted-foreground">brands</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Equipment manufacturers under management
          </p>
        </div>
      </div>

      {/* Row 1 Charts: Clean Donut Charts without slice text labels (defined by color legend) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* 1. Warranty Status Distribution */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-primary" />
              <h3 className="text-xs font-semibold text-foreground">
                Warranty Status Distribution
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              {metrics.totalEquipment} units
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.warrantyDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {metrics.warrantyDistribution.map((entry, index) => (
                    <Cell key={`cell-warranty-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number, name: string) => [
                    `${value} units (${((value / (metrics.totalEquipment || 1)) * 100).toFixed(0)}%)`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground mr-3 font-medium">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Equipment Operational Status */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Activity className="size-4 text-emerald-500" />
              <h3 className="text-xs font-semibold text-foreground">
                Equipment Operational Status
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Real-time
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.equipmentStatusDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {metrics.equipmentStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-status-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number, name: string) => [
                    `${value} devices`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground mr-3 font-medium">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 Charts: By Modality & By OEM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Assets by Modality */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="size-4 text-blue-500" />
              <h3 className="text-xs font-semibold text-foreground">
                Equipment by Modality
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">Distribution</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.assetsByModality}
                margin={{ top: 15, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis
                  dataKey="modality"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  formatter={(value: number) => [`${value} units`, "Count"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="count"
                    position="top"
                    offset={6}
                    className="fill-foreground font-mono font-bold text-xs"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Assets by OEM */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Building2 className="size-4 text-purple-500" />
              <h3 className="text-xs font-semibold text-foreground">
                Equipment by OEM / Manufacturer
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">Manufacturers</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.assetsByOem}
                margin={{ top: 15, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis
                  dataKey="oem"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  formatter={(value: number) => [`${value} units`, "Count"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="count"
                    position="top"
                    offset={6}
                    className="fill-foreground font-mono font-bold text-xs"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Equipment by Location / Facility — Horizontal Bar Chart with completely clear, readable labels */}
      <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="size-4 text-emerald-500" />
            <h3 className="text-xs font-semibold text-foreground">
              Equipment by Location / Facility
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {metrics.assetsByLocation.length} Facilities Recorded
          </span>
        </div>

        <div className="w-full" style={{ height: Math.max(260, metrics.assetsByLocation.length * 36) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={metrics.assetsByLocation}
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.15} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                type="category"
                dataKey="location"
                width={200}
                tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
              />
              <RechartsTooltip
                formatter={(value: number) => [`${value} equipment units`, "Count"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]}>
                <LabelList
                  dataKey="count"
                  position="right"
                  offset={8}
                  className="fill-foreground font-mono font-bold text-xs"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
