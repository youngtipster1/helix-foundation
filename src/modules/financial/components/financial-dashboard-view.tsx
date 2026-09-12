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
} from "recharts";
import { Button } from "@/components/ui/button";
import { FinancialDashboardMetrics, Order } from "../types";
import { OrderStatusBadge } from "./order-status-badge";
import { cn } from "@/lib/utils";

export interface FinancialDashboardViewProps {
  metrics: FinancialDashboardMetrics;
  recentOrders: Order[];
  pendingOrders: Order[];
  onCreateOrder?: () => void;
  onViewOrder?: (order: Order) => void;
}

export function FinancialDashboardView({
  metrics,
  recentOrders,
  pendingOrders,
  onCreateOrder,
  onViewOrder,
}: FinancialDashboardViewProps) {
  // Toggle for Trend Graph: "otif" | "cycleTime" | "accuracy"
  const [activeTrend, setActiveTrend] = useState<"otif" | "cycleTime" | "accuracy">("otif");

  return (
    <div className="space-y-6">
      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Total Order Value */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Total Order Value
            </span>
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="text-2xl md:text-[28px] xl:text-3xl font-mono font-bold text-foreground">
            ₦{metrics.totalOrderValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs xl:text-[13px] text-muted-foreground">
            Active approved & ongoing procurement valuation
          </p>
        </div>

        {/* 2. OTIF (On-Time, In-Full) */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              OTIF Rate
            </span>
            <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="text-2xl md:text-[28px] xl:text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.otifRate}%
          </div>
          <p className="text-xs xl:text-[13px] text-muted-foreground">
            Orders fully fulfilled on or before target delivery date
          </p>
        </div>

        {/* 3. Order Cycle Time */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Order Cycle Time
            </span>
            <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="text-2xl md:text-[28px] xl:text-3xl font-mono font-bold text-foreground">
            {metrics.orderCycleTimeDays}{" "}
            <span className="text-sm font-sans font-medium text-muted-foreground">days</span>
          </div>
          <p className="text-xs xl:text-[13px] text-muted-foreground">
            Average duration from request creation to complete fulfillment
          </p>
        </div>

        {/* 4. Order Accuracy Rate */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Order Accuracy Rate
            </span>
            <div className="size-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Percent className="size-4" />
            </div>
          </div>
          <div className="text-2xl md:text-[28px] xl:text-3xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {metrics.orderAccuracyRate}%
          </div>
          <p className="text-xs xl:text-[13px] text-muted-foreground">
            Accurate orders divided by total fulfilled orders
          </p>
        </div>
      </div>

      {/* Main Graph & Action Hub Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Graph (2 Columns) */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg xl:text-xl font-semibold text-foreground">Procurement Performance Trends</h3>
              <p className="text-xs xl:text-[13px] text-muted-foreground">
                Historical monthly trends for OTIF, procurement cycle speed, and receipt accuracy.
              </p>
            </div>

            {/* Metric Selector Buttons */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/60 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTrend("otif")}
                className={cn(
                  "px-2.5 py-1 rounded text-[13px] md:text-sm font-medium transition-all cursor-pointer",
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
                  "px-2.5 py-1 rounded text-[13px] md:text-sm font-medium transition-all cursor-pointer",
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
                  "px-2.5 py-1 rounded text-[13px] md:text-sm font-medium transition-all cursor-pointer",
                  activeTrend === "accuracy"
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Accuracy (%)
              </button>
            </div>
          </div>

          {/* Recharts Chart */}
          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.monthlyTrends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
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
                  domain={activeTrend === "cycleTime" ? [0, 25] : [70, 100]}
                  unit={activeTrend === "cycleTime" ? "d" : "%"}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))",
                    fontSize: "12px",
                  }}
                />
                {activeTrend === "otif" && (
                  <Line
                    type="monotone"
                    dataKey="otif"
                    name="OTIF Rate (%)"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#10B981" }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {activeTrend === "cycleTime" && (
                  <Line
                    type="monotone"
                    dataKey="cycleTimeDays"
                    name="Cycle Time (Days)"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#3B82F6" }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {activeTrend === "accuracy" && (
                  <Line
                    type="monotone"
                    dataKey="accuracyRate"
                    name="Accuracy Rate (%)"
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#6366F1" }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Lifecycle Distribution & Actions (1 Column) */}
        <div className="space-y-4">
          {/* Quick Action Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-3">
            <h3 className="text-lg xl:text-xl font-semibold text-foreground">Procurement Actions</h3>
            <p className="text-xs xl:text-[13px] text-muted-foreground">
              Initiate requisition orders with automatic pack calculations and multi-vendor splitting.
            </p>
            <div className="pt-1 flex flex-col gap-2">
              <Button
                onClick={onCreateOrder}
                className="w-full gap-2 text-[13px] md:text-sm font-medium cursor-pointer"
                size="sm"
              >
                <Plus className="size-3.5" />
                Create Order
              </Button>
              <Link to="/app/financial/orders">
                <Button
                  variant="outline"
                  className="w-full gap-2 text-[13px] md:text-sm font-medium cursor-pointer"
                  size="sm"
                >
                  <Layers className="size-3.5" />
                  View All Orders Directory
                </Button>
              </Link>
            </div>
          </div>

          {/* Lifecycle Status Counts */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-3 text-[13px] md:text-sm">
            <h3 className="text-lg xl:text-xl font-semibold text-foreground">Pipeline Status Breakdown</h3>
            <div className="space-y-2">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Pending Admin Attention */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-500" />
              <h3 className="text-lg xl:text-xl font-semibold text-foreground">Orders Pending Attention</h3>
            </div>
            <span className="text-xs xl:text-[13px] font-mono font-semibold text-muted-foreground">
              {pendingOrders.length} pending
            </span>
          </div>

          <div className="space-y-2">
            {pendingOrders.length === 0 ? (
              <p className="text-xs xl:text-[13px] text-muted-foreground py-6 text-center">
                All submitted orders have been reviewed.
              </p>
            ) : (
              pendingOrders.slice(0, 4).map((o) => (
                <div
                  key={o.id}
                  onClick={() => onViewOrder?.(o)}
                  className="p-3 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-between gap-3 text-[13px] md:text-sm"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{o.orderNumber}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <div className="text-muted-foreground text-xs xl:text-[13px]">
                      By {o.requestedByName} • Category: {o.category}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-foreground">
                      ₦{o.grossTotal.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs xl:text-[13px] text-muted-foreground">
                      {new Date(o.dateRaised).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders Overview */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="size-4 text-primary" />
              <h3 className="text-lg xl:text-xl font-semibold text-foreground">Recent Procurement Activity</h3>
            </div>
            <Link
              to="/app/financial/orders"
              className="text-xs xl:text-[13px] font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentOrders.slice(0, 4).map((o) => (
              <div
                key={o.id}
                onClick={() => onViewOrder?.(o)}
                className="p-3 rounded-lg border border-border/80 bg-card hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between gap-3 text-[13px] md:text-sm"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground">{o.orderNumber}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <div className="text-muted-foreground text-xs xl:text-[13px] truncate max-w-xs">
                    {o.items[0]?.description || "Order items"}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-foreground">
                    ₦{o.grossTotal.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs xl:text-[13px] text-muted-foreground">
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
