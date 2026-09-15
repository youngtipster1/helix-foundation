import React from "react";
import {
  Stethoscope,
  Banknote,
  Building2,
  ShieldCheck,
  Activity,
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
  CartesianGrid,
  LabelList,
} from "recharts";
import { AssetDashboardMetrics } from "../types";

export interface AssetDashboardViewProps {
  metrics: AssetDashboardMetrics;
}

export function AssetDashboardView({ metrics }: AssetDashboardViewProps) {
  return (
    <div className="space-y-4">
      {/* Top Row: Left KPI Cards (Total Equipment, Total Value, Total OEMs) + Center Warranty Donut + Right Equipment Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Left Column: 3 Metric Cards Stacked (Black text, no colored values) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-3">
          {/* 1. Total Equipment */}
          <div className="flex-1 rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Equipment
              </span>
              <div className="size-7 rounded-md bg-muted/60 flex items-center justify-center text-foreground">
                <Stethoscope className="size-3.5" />
              </div>
            </div>
            <div className="my-1 text-2xl font-mono font-bold text-foreground">
              {metrics.totalEquipment}{" "}
              <span className="text-xs font-sans font-medium text-muted-foreground">units</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Registered biomedical inventory devices
            </p>
          </div>

          {/* 2. Total Value of Equipment */}
          <div className="flex-1 rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Value of Equipment
              </span>
              <div className="size-7 rounded-md bg-muted/60 flex items-center justify-center text-foreground">
                <Banknote className="size-3.5" />
              </div>
            </div>
            <div className="my-1 text-2xl font-mono font-bold text-foreground">
              ₦{metrics.totalValue.toLocaleString("en-US", { minimumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Active service & maintenance valuation
            </p>
          </div>

          {/* 3. Total Number of OEMs */}
          <div className="flex-1 rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Number of OEMs
              </span>
              <div className="size-7 rounded-md bg-muted/60 flex items-center justify-center text-foreground">
                <Building2 className="size-3.5" />
              </div>
            </div>
            <div className="my-1 text-2xl font-mono font-bold text-foreground">
              {metrics.totalOems}{" "}
              <span className="text-xs font-sans font-medium text-muted-foreground">brands</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Equipment manufacturers under management
            </p>
          </div>
        </div>

        {/* Center Column: Warranty Status Donut */}
        <div className="lg:col-span-4 rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-foreground" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Warranty Status
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              {metrics.totalEquipment} units
            </span>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.warrantyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ percentage }) => `${percentage}%`}
                  labelLine={false}
                >
                  {metrics.warrantyDistribution.map((entry, index) => (
                    <Cell key={`cell-warranty-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number, name: string) => [
                    `${value} units`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend matching slide: ■ WARRANTY  ■ OUT OF WARRANTY */}
          <div className="flex items-center justify-center gap-5 pt-2 border-t border-border/60 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="size-2.5 rounded-xs bg-[#10b981]" />
              <span>WARRANTY</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="size-2.5 rounded-xs bg-[#ef4444]" />
              <span>OUT OF WARRANTY</span>
            </div>
          </div>
        </div>

        {/* Right Column: Equipment Status Donut */}
        <div className="lg:col-span-4 rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Activity className="size-4 text-foreground" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Equipment Status
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Live status
            </span>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.equipmentStatusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ percentage }) => `${percentage}%`}
                  labelLine={false}
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
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend matching slide: ■ UP  ■ UP PARTIALLY UP  ■ DOWN  ■ UNKNOWN */}
          <div className="flex items-center justify-center gap-3 pt-2 border-t border-border/60 flex-wrap text-[11px]">
            <div className="flex items-center gap-1 font-medium text-foreground">
              <span className="size-2.5 rounded-xs bg-[#0284c7]" />
              <span>UP</span>
            </div>
            <div className="flex items-center gap-1 font-medium text-foreground">
              <span className="size-2.5 rounded-xs bg-[#f97316]" />
              <span>UP PARTIALLY UP</span>
            </div>
            <div className="flex items-center gap-1 font-medium text-foreground">
              <span className="size-2.5 rounded-xs bg-[#ef4444]" />
              <span>DOWN</span>
            </div>
            <div className="flex items-center gap-1 font-medium text-foreground">
              <span className="size-2.5 rounded-xs bg-[#111827] dark:bg-slate-300" />
              <span>UNKNOWN</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: 3 Bar Charts matching slide (ASSET BY LOCATION, ASSET BY MODALITY, ASSET BY OEM) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* 1. ASSET BY LOCATION */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="text-center mb-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              ASSET BY LOCATION
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.assetsByLocation}
                margin={{ top: 20, right: 10, left: -20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="location"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  formatter={(value: number) => [`${value} units`, "Total Assets"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {metrics.assetsByLocation.map((entry, index) => (
                    <Cell key={`loc-cell-${index}`} fill={entry.color || "#10b981"} />
                  ))}
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

        {/* 2. ASSET BY MODALITY */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="text-center mb-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              ASSET BY MODALITY
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.assetsByModality}
                margin={{ top: 20, right: 10, left: -20, bottom: 15 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="modality"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  formatter={(value: number) => [`${value} units`, "Modality"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {metrics.assetsByModality.map((entry, index) => (
                    <Cell key={`mod-cell-${index}`} fill={entry.color || "#3b82f6"} />
                  ))}
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

          {/* Modality Legend matching slide */}
          <div className="flex items-center justify-center gap-4 pt-2 border-t border-border/60 text-xs">
            {metrics.assetsByModality.map((item, idx) => (
              <div key={`mod-leg-${idx}`} className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                <span className="size-2.5 rounded-xs" style={{ backgroundColor: item.color }} />
                <span>{item.modality}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. ASSET BY OEM */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="text-center mb-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              ASSET BY OEM
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.assetsByOem}
                margin={{ top: 20, right: 10, left: -20, bottom: 15 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="oem"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  formatter={(value: number) => [`${value} units`, "OEM Count"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {metrics.assetsByOem.map((entry, index) => (
                    <Cell key={`oem-cell-${index}`} fill={entry.color || "#3b82f6"} />
                  ))}
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

          {/* OEM Legend matching slide */}
          <div className="flex items-center justify-center gap-2.5 pt-2 border-t border-border/60 flex-wrap text-[11px]">
            {metrics.assetsByOem.map((item, idx) => (
              <div key={`oem-leg-${idx}`} className="flex items-center gap-1 text-[11px] text-foreground font-medium">
                <span className="size-2 rounded-xs" style={{ backgroundColor: item.color }} />
                <span>{item.oem}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
