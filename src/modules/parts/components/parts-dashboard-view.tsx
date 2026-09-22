import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  DollarSign,
  Boxes,
  TrendingDown,
  AlertOctagon,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  ShieldAlert,
  Clock,
  Layers,
  CheckCircle2,
  ArrowRight,
  ArrowLeftRight,
  AlertTriangle,
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
  LineChart as RechartsLineChart,
  Line,
  CartesianGrid,
  LabelList,
} from "recharts";
import { PartsDashboardMetrics } from "../types";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

export interface PartsDashboardViewProps {
  metrics: PartsDashboardMetrics;
}

const MODALITY_COLORS = ["#0284C7", "#0D9488", "#F59E0B", "#8B5CF6", "#EC4899", "#64748B"];

export function PartsDashboardView({ metrics }: PartsDashboardViewProps) {
  const [trendMetric, setTrendMetric] = useState<"value" | "quantity">("value");

  return (
    <div className="space-y-6">
      {/* 4 KPI Summary Cards matching Page 3 of the specification */}
      {/* Row 1: 4 Top KPI Cards (Page 3 of spec) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Inventory Value"
          value={`₦${metrics.totalInventoryValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          subtext="100% Tracked"
          description="Current replacement valuation across all depots"
          icon={DollarSign}
        />
        <StatCard
          title="Total Inventory Quantity"
          value={metrics.totalInventoryQuantity.toLocaleString()}
          unit="units"
          subtext="In-Stock Fleet"
          description="Total active spare parts stock recorded in system"
          icon={Boxes}
        />
        <StatCard
          title="Shrinkage Value"
          value={`₦${metrics.shrinkageValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          subtext="Audit Variance"
          description="Cumulative financial variance identified in physical audits"
          icon={TrendingDown}
        />
        <StatCard
          title="Shrinkage Quantity"
          value={metrics.shrinkageQuantity.toLocaleString()}
          unit="units"
          subtext="Discrepancies"
          description="Missing inventory units from stock reconciliation cycles"
          icon={AlertOctagon}
        />
      </div>

      {/* Row 2: Two Main Specification Charts (Page 3 of spec) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Chart 1: Donut Chart - Part Value per Modality */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="size-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Part Value per Modality</h3>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Total: ₦{metrics.totalInventoryValue.toLocaleString()}
            </span>
          </div>

          <div className="flex-1 min-h-[260px] w-full pt-2">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={metrics.modalityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={88}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="modality"
                  labelLine={false}
                  label={({
                    cx,
                    cy,
                    midAngle,
                    outerRadius,
                    percent,
                  }: any) => {
                    const p = Math.round((percent || 0) * 100);
                    if (p <= 0) return null;
                    const RADIAN = Math.PI / 180;
                    const cos = Math.cos(-midAngle * RADIAN);
                    const sin = Math.sin(-midAngle * RADIAN);
                    const radius = outerRadius + 14;
                    const x = cx + radius * cos;
                    const y = cy + radius * sin;
                    const textAnchor =
                      Math.abs(cos) < 0.25 ? "middle" : cos > 0 ? "start" : "end";
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="currentColor"
                        textAnchor={textAnchor}
                        dominantBaseline="central"
                        className="font-mono text-xs font-bold fill-foreground select-none pointer-events-none"
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          fill: "hsl(var(--foreground))",
                        }}
                      >
                        {`${p}%`}
                      </text>
                    );
                  }}
                >
                  {metrics.modalityDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.modality}`}
                      fill={MODALITY_COLORS[index % MODALITY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(val: any) => [
                    `₦${Number(val).toLocaleString()} (${Math.round(
                      (Number(val) / (metrics.totalInventoryValue || 1)) * 100
                    )}%)`,
                    "Inventory Value",
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
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => {
                    const item = metrics.modalityDistribution.find(
                      (m) => m.modality === value
                    );
                    const pct = item
                      ? Math.round(
                          (item.value / (metrics.totalInventoryValue || 1)) * 100
                        )
                      : null;
                    return (
                      <span className="text-xs text-foreground font-medium">
                        {value} {pct !== null ? `(${pct}%)` : ""}
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Bar Chart - Parts Expiry Date Risk Buckets (Slide 3) */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Parts Expiry Date Distribution</h3>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Shelf Life Risk Monitoring
            </span>
          </div>

          <div className="flex-1 min-h-[260px] w-full pt-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={metrics.expiryBuckets}
                margin={{ top: 25, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="bucket"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax * 1.18))]}
                />
                <RechartsTooltip
                  formatter={(val: any) => [`${val} units`, "Parts In Stock"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {metrics.expiryBuckets.map((entry) => (
                    <Cell key={`bar-${entry.bucket}`} fill={entry.color} />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="top"
                    offset={6}
                    className="fill-foreground font-mono font-bold text-xs"
                    style={{ fontSize: 11, fontWeight: 700, fill: "hsl(var(--foreground))" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Historical Shrinkage Trend Lines (Pages 14-16 of specification) */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <LineIcon className="size-4 text-destructive" />
              <h3 className="text-sm font-bold text-foreground">
                Historical Shrinkage Trend (Quantity & Valuation)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Audit reconciliation history tracking inventory loss over time (Pages 14–16).
            </p>
          </div>

          {/* Toggle between Value ($) and Quantity (Units) */}
          <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTrendMetric("value")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                trendMetric === "value"
                  ? "bg-card text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Shrinkage Value (₦)
            </button>
            <button
              type="button"
              onClick={() => setTrendMetric("quantity")}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                trendMetric === "quantity"
                  ? "bg-card text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Shrinkage Quantity (Units)
            </button>
          </div>
        </div>

        {/* Trend Line Chart */}
        <div className="h-[340px] w-full pt-2">
          <ResponsiveContainer width="100%" height={340}>
            <RechartsLineChart
              data={metrics.historicalTrends}
              margin={{ top: 30, right: 30, left: 15, bottom: 15 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={true} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax * 1.15))]}
                tickFormatter={(v) =>
                  v === 0
                    ? "0"
                    : trendMetric === "value"
                    ? `₦${(v / 1000).toFixed(0)}k`
                    : `${v}`
                }
              />
              <RechartsTooltip
                formatter={(val: any) => [
                  Number(val) === 0
                    ? "-"
                    : trendMetric === "value"
                    ? `₦${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                    : `${val} units`,
                  trendMetric === "value" ? "Shrinkage Value" : "Shrinkage Quantity",
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                }}
              />
              <Line
                type="linear"
                dataKey={trendMetric === "value" ? "shrinkageValue" : "shrinkageQuantity"}
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ r: 4.5, fill: "#0284C7", strokeWidth: 1.5, stroke: "#FFFFFF" }}
                activeDot={{ r: 6.5, fill: "#EF4444" }}
              >
                <LabelList
                  dataKey={trendMetric === "value" ? "shrinkageValue" : "shrinkageQuantity"}
                  content={(props: any) => {
                    const { x, y, value } = props;
                    if (value === undefined || value === null) return null;
                    const n = Number(value);
                    const formatted =
                      n === 0
                        ? "-"
                        : trendMetric === "value"
                        ? `₦${n.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : `${n}`;
                    const safeY = typeof y === "number" ? Math.max(16, y - 10) : 16;
                    return (
                      <text
                        x={x}
                        y={safeY}
                        textAnchor="middle"
                        className="fill-foreground font-mono font-bold select-none pointer-events-none"
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 700,
                          fill: "hsl(var(--foreground))",
                        }}
                      >
                        {formatted}
                      </text>
                    );
                  }}
                />
              </Line>
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Low Stock Alerts & Recent Movements Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Panel 1: Low Stock Queue */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              <h3 className="text-sm font-bold text-foreground">
                Low Stock Threshold Alerts ({metrics.lowStockCount})
              </h3>
            </div>
            <Link
              to="/app/parts/list"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View Parts List</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {metrics.lowStockCount === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
              <CheckCircle2 className="size-6 text-emerald-600 mx-auto" />
              <p className="font-medium text-foreground">Stock Levels Healthy</p>
              <p>All active inventory items are above their minimum reorder thresholds.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground">
                The following parts have reached or fallen below their configured minimum stock level:
              </p>
              <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-mono font-bold text-foreground">PRT-MR-2089</span>
                  <span className="text-muted-foreground block text-[11px]">
                    Magnetom Sola Chilled Water Loop Filter Pack
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-destructive font-bold text-sm block">1 in stock</span>
                  <span className="text-[10px] text-muted-foreground">Min Level: 2 units</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel 2: Recent Stock Movements */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="size-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Recent Stock Movements</h3>
            </div>
            <Link
              to="/app/parts/movements"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View Full Ledger</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden">
            {metrics.recentMovements.slice(0, 4).map((m) => {
              const isPositive = m.quantity > 0;
              return (
                <div
                  key={m.id}
                  className="p-2.5 hover:bg-accent/20 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-mono">
                      <strong className="text-foreground">{m.partNumber}</strong>
                      <span className="text-muted-foreground text-[10px]">&bull; {m.referenceNumber}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{m.partName}</p>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <span
                      className={cn(
                        "font-bold text-xs",
                        isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {isPositive ? `+${m.quantity}` : m.quantity} units
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      Bal: {m.balanceAfter}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
