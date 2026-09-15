import React from "react";
import { Link } from "@tanstack/react-router";
import {
  Stethoscope,
  Banknote,
  Building2,
  ArrowRight,
  ShieldCheck,
  Activity,
  MapPin,
  Layers,
  Wrench,
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
} from "recharts";
import { AssetDashboardMetrics } from "../types";
import { Button } from "@/components/ui/button";

export interface AssetDashboardViewProps {
  metrics: AssetDashboardMetrics;
}

export function AssetDashboardView({ metrics }: AssetDashboardViewProps) {
  return (
    <div className="space-y-6">
      {/* 3 KPI Summary Cards matching Slide 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Total Equipment */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Equipment
            </span>
            <div className="size-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Stethoscope className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              {metrics.totalEquipment}
            </div>
            <p className="text-[12px] text-slate-500 mt-1">
              Registered biomedical and clinical devices
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Link
              to="/app/assets/list"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              View all equipment <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* 2. Total Contract Value */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Equipment Contract Value
            </span>
            <div className="size-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Banknote className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              ₦{metrics.totalValue.toLocaleString("en-US", { minimumFractionDigits: 0 })}
            </div>
            <p className="text-[12px] text-slate-500 mt-1">
              Active service and maintenance commitment
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Link
              to="/app/assets/contracts"
              className="text-xs font-medium text-emerald-600 hover:underline inline-flex items-center gap-1"
            >
              View service contracts <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* 3. Total OEMs */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total OEMs / Manufacturers
            </span>
            <div className="size-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Building2 className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              {metrics.totalOems}
            </div>
            <p className="text-[12px] text-slate-500 mt-1">
              Distinct equipment brands under management
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              GE, Siemens, Philips, Mindray, Roche...
            </span>
          </div>
        </div>
      </div>

      {/* Row 1 Charts: Warranty Distribution & Equipment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warranty Status Distribution */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Warranty Status Distribution
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              {metrics.totalEquipment} units
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.warrantyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {metrics.warrantyDistribution.map((entry, index) => (
                    <Cell key={`cell-warranty-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number, name: string) => [
                    `${value} equipment units`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    color: "#f8fafc",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equipment Status Distribution */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Equipment Operational Status
              </h3>
            </div>
            <span className="text-xs text-slate-500">Real-time status</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.equipmentStatusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) =>
                    value > 0 ? `${name}: ${value}` : ""
                  }
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
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    color: "#f8fafc",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs text-slate-600 dark:text-slate-300">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets by Modality */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Equipment by Modality
              </h3>
            </div>
            <span className="text-xs text-slate-500">Distribution by type</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.assetsByModality}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="modality"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <RechartsTooltip
                  formatter={(value: number) => [`${value} units`, "Count"]}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    color: "#f8fafc",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Assets by OEM */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-purple-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Equipment by OEM / Manufacturer
              </h3>
            </div>
            <span className="text-xs text-slate-500">Top brands</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.assetsByOem}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="oem"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <RechartsTooltip
                  formatter={(value: number) => [`${value} units`, "Count"]}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    color: "#f8fafc",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Equipment by Location */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-rose-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Equipment by Location / Facility
            </h3>
          </div>
          <span className="text-xs text-slate-500">Hospital & clinical locations</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metrics.assetsByLocation}
              margin={{ top: 10, right: 10, left: -20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="location"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <RechartsTooltip
                formatter={(value: number) => [`${value} units`, "Count"]}
                contentStyle={{
                  backgroundColor: "#1e293b",
                  borderColor: "#334155",
                  color: "#f8fafc",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
