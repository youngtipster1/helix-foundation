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

export interface AssetDashboardViewProps {
  metrics: AssetDashboardMetrics;
}

export function AssetDashboardView({ metrics }: AssetDashboardViewProps) {
  return (
    <div className="space-y-4">
      {/* 3 Primary KPI Summary Cards matching System Design */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          <div className="text-xl sm:text-2xl font-mono font-bold text-foreground">
            {metrics.totalEquipment}
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Registered clinical and biomedical inventory units
          </p>
          <div className="pt-1">
            <Link
              to="/app/assets/list"
              className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              View equipment list <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* 2. Total Contract Value */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Contract Valuation
            </span>
            <div className="size-7 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Banknote className="size-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-foreground">
            ₦{metrics.totalValue.toLocaleString("en-US", { minimumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Active service and maintenance commitment
          </p>
          <div className="pt-1">
            <Link
              to="/app/assets/contracts"
              className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              View service contracts <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* 3. Total OEMs */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              OEMs / Manufacturers
            </span>
            <div className="size-7 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Building2 className="size-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-foreground">
            {metrics.totalOems}
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            GE, Siemens, Philips, Mindray, Canon...
          </p>
          <div className="pt-1 text-[11px] text-muted-foreground">
            {metrics.totalEquipment} devices across {metrics.totalOems} vendors
          </div>
        </div>
      </div>

      {/* Row 1 Charts: Warranty Distribution & Equipment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Warranty Status Distribution */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-primary" />
              <h3 className="text-xs font-semibold text-foreground">
                Warranty Status Distribution
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {metrics.totalEquipment} units
            </span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.warrantyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
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
                    fontSize: "11px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={28}
                  formatter={(value) => (
                    <span className="text-[11px] text-muted-foreground">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equipment Status Distribution */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Activity className="size-4 text-emerald-500" />
              <h3 className="text-xs font-semibold text-foreground">
                Equipment Operational Status
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">Real-time status</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.equipmentStatusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
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
                    fontSize: "11px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={28}
                  formatter={(value) => (
                    <span className="text-[11px] text-muted-foreground">
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

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.assetsByModality}
                margin={{ top: 8, right: 8, left: -20, bottom: 15 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="modality"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-10}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <RechartsTooltip
                  formatter={(value: number) => [`${value} units`, "Count"]}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    color: "#f8fafc",
                    borderRadius: "0.5rem",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
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

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.assetsByOem}
                margin={{ top: 8, right: 8, left: -20, bottom: 15 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="oem"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-10}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <RechartsTooltip
                  formatter={(value: number) => [`${value} units`, "Count"]}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    color: "#f8fafc",
                    borderRadius: "0.5rem",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Equipment by Location */}
      <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="size-4 text-rose-500" />
            <h3 className="text-xs font-semibold text-foreground">
              Equipment by Location / Facility
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground">Facilities</span>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metrics.assetsByLocation}
              margin={{ top: 8, right: 8, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis
                dataKey="location"
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <RechartsTooltip
                formatter={(value: number) => [`${value} units`, "Count"]}
                contentStyle={{
                  backgroundColor: "#1e293b",
                  borderColor: "#334155",
                  color: "#f8fafc",
                  borderRadius: "0.5rem",
                  fontSize: "11px",
                }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
