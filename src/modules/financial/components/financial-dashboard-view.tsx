import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  DollarSign,
  Clock,
  CheckCircle2,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Receipt,
  Plus,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
  LabelList,
} from "recharts";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { FinancialDashboardMetrics, Order } from "../types";
import { OrderStatusBadge } from "./order-status-badge";
import { cn } from "@/lib/utils";

export interface FinancialDashboardViewProps {
  metrics: FinancialDashboardMetrics;
  recentOrders: Order[];
  pendingOrders: Order[];
  onCreateOrder?: () => void;
  onViewOrder?: (order: Order) => void;
  readOnly?: boolean;
}

export function FinancialDashboardView({
  metrics,
  recentOrders,
  pendingOrders,
  onCreateOrder,
  onViewOrder,
  readOnly = false,
}: FinancialDashboardViewProps) {
  // Toggle for Trend Graph: "otif" | "cycleTime" | "accuracy"
  const [activeTrend, setActiveTrend] = useState<"otif" | "cycleTime" | "accuracy">("otif");

  return (
    <div className="space-y-6">
      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Order Value"
          value={`₦${metrics.totalOrderValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          description="Active approved & ongoing procurement valuation"
          icon={DollarSign}
        />
        <StatCard
          title="OTIF Rate"
          value={`${metrics.otifRate}%`}
          description="Orders fully fulfilled on or before target delivery date"
          icon={CheckCircle2}
        />
        <StatCard
          title="Order Cycle Time"
          value={metrics.orderCycleTimeDays}
          unit="days"
          description="Average duration from request creation to complete fulfillment"
          icon={Clock}
        />
        <StatCard
          title="Order Accuracy Rate"
          value={`${metrics.orderAccuracyRate}%`}
          description="Accurate orders divided by total fulfilled orders"
          icon={Percent}
        />
      </div>

      {/* Main Graph & Action Hub Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trend Graph (2 Columns) */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm md:text-base font-bold text-foreground">Procurement Performance Trends</h3>
              <p className="text-xs text-muted-foreground">
                Historical monthly trends for OTIF, procurement cycle speed, and receipt accuracy.
              </p>
            </div>

            {/* Metric Selector Buttons */}
            <div className="flex flex-wrap items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/60 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTrend("otif")}
                className={cn(
                  "flex-1 sm:flex-none px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer text-center",
                  activeTrend === "otif"
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                OTIF (%)
              </button>
              <button
                type="button"
                onClick={() => setActiveTrend("cycleTime")}
                className={cn(
                  "flex-1 sm:flex-none px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer text-center",
                  activeTrend === "cycleTime"
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Cycle Time (Days)
              </button>
              <button
                type="button"
                onClick={() => setActiveTrend("accuracy")}
                className={cn(
                  "flex-1 sm:flex-none px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer text-center",
                  activeTrend === "accuracy"
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Accuracy (%)
              </button>
            </div>
          </div>

          {/* Centered Chart Header Title (Matching PowerPoint Slide 4) */}
          <div className="text-center pt-1 pb-1">
            <h4 className="text-sm font-bold tracking-widest text-foreground uppercase">
              {activeTrend === "otif"
                ? "OTIF"
                : activeTrend === "cycleTime"
                ? "ORDER CYCLE TIME"
                : "ORDER ACCURACY RATE"}
            </h4>
          </div>

          {/* Recharts Chart with Values Directly on Data Points */}
          <div className="h-[290px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.monthlyTrends} margin={{ top: 25, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  domain={activeTrend === "cycleTime" ? [0, 25] : [60, 105]}
                  unit={activeTrend === "cycleTime" ? "d" : "%"}
                />
                <RechartsTooltip
                  formatter={(val: any) => [
                    activeTrend === "cycleTime" ? `${val} days` : `${val}%`,
                    activeTrend === "otif"
                      ? "OTIF Rate"
                      : activeTrend === "cycleTime"
                      ? "Cycle Time"
                      : "Accuracy Rate",
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="linear"
                  dataKey={
                    activeTrend === "otif"
                      ? "otif"
                      : activeTrend === "cycleTime"
                      ? "cycleTimeDays"
                      : "accuracyRate"
                  }
                  name={
                    activeTrend === "otif"
                      ? "OTIF Rate (%)"
                      : activeTrend === "cycleTime"
                      ? "Cycle Time (Days)"
                      : "Accuracy Rate (%)"
                  }
                  stroke="#0284C7"
                  strokeWidth={2.5}
                  dot={{ r: 4.5, fill: "#0284C7", strokeWidth: 1.5, stroke: "#FFFFFF" }}
                  activeDot={{ r: 6.5, fill: "#0284C7" }}
                >
                  <LabelList
                    dataKey={
                      activeTrend === "otif"
                        ? "otif"
                        : activeTrend === "cycleTime"
                        ? "cycleTimeDays"
                        : "accuracyRate"
                    }
                    content={(props: any) => {
                      const { x, y, value } = props;
                      if (value === undefined || value === null) return null;
                      const n = Number(value);
                      const formatted = activeTrend === "cycleTime" ? `${n}d` : `${n}%`;
                      const safeY = typeof y === "number" ? Math.max(14, y - 10) : 14;
                      return (
                        <text
                          x={x}
                          y={safeY}
                          textAnchor="middle"
                          className="fill-foreground font-mono font-bold select-none pointer-events-none"
                          style={{
                            fontSize: "11px",
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
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Lifecycle Distribution & Actions (1 Column) */}
        <div className="space-y-4">
          {/* Quick Action Card (Hidden in readOnly / Management view) */}
          {!readOnly && (
            <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-2.5">
              <h3 className="text-sm md:text-base font-bold text-foreground">Procurement Actions</h3>
              <p className="text-xs text-muted-foreground">
                Initiate requisition orders with automatic pack calculations and multi-vendor splitting.
              </p>
              <div className="pt-1 flex flex-col gap-2">
                <Button
                  onClick={onCreateOrder}
                  className="w-full gap-2 text-xs font-semibold cursor-pointer"
                  size="sm"
                >
                  <Plus className="size-3.5" />
                  Create Order
                </Button>
                <Link to="/app/financial/orders">
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-xs font-medium cursor-pointer"
                    size="sm"
                  >
                    <Layers className="size-3.5" />
                    View All Orders Directory
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Lifecycle Status Counts */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-2.5 text-xs">
            <h3 className="text-sm md:text-base font-bold text-foreground">Pipeline Status Breakdown</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground">Under Review (Submitted):</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {metrics.ordersCount.submitted}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground">Sent Back for Correction:</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {metrics.ordersCount.sentBack}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground">Approved Requisitions:</span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  {metrics.ordersCount.approved}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground">Active Purchase Orders:</span>
                <span className="font-mono font-bold text-primary">
                  {metrics.ordersCount.poCreated}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Fully Completed:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {metrics.ordersCount.completed}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Reviews & Recent Activity Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Orders Pending Admin Attention */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-500" />
              <h3 className="text-sm md:text-base font-bold text-foreground">Orders Pending Attention</h3>
            </div>
            <span className="text-xs font-mono font-semibold text-muted-foreground">
              {pendingOrders.length} pending
            </span>
          </div>

          <div className="space-y-2">
            {pendingOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                All submitted orders have been reviewed.
              </p>
            ) : (
              pendingOrders.slice(0, 4).map((o) => (
                <div
                  key={o.id}
                  onClick={() => !readOnly && onViewOrder?.(o)}
                  className={cn(
                    "p-2.5 rounded-lg border border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs",
                    !readOnly && "hover:bg-muted/50 transition-colors cursor-pointer"
                  )}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-primary">{o.orderNumber}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <div className="text-muted-foreground text-[11px] truncate">
                      By {o.requestedByName} • Category: {o.category}
                    </div>
                  </div>
                  <div className="text-left sm:text-right font-mono shrink-0">
                    <div className="font-bold text-foreground">
                      ₦{o.grossTotal.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(o.dateRaised).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders Overview */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="size-4 text-primary" />
              <h3 className="text-sm md:text-base font-bold text-foreground">Recent Procurement Activity</h3>
            </div>
            {!readOnly && (
              <Link
                to="/app/financial/orders"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>

          <div className="space-y-2">
            {recentOrders.slice(0, 4).map((o) => (
              <div
                key={o.id}
                onClick={() => !readOnly && onViewOrder?.(o)}
                className={cn(
                  "p-2.5 rounded-lg border border-border/80 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs",
                  !readOnly && "hover:bg-muted/40 transition-colors cursor-pointer"
                )}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-foreground">{o.orderNumber}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <div className="text-muted-foreground text-[11px] truncate">
                    {o.items[0]?.description || "Order items"}
                  </div>
                </div>
                <div className="text-left sm:text-right font-mono shrink-0">
                  <div className="font-bold text-foreground">
                    ₦{o.grossTotal.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(o.dateRaised).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
