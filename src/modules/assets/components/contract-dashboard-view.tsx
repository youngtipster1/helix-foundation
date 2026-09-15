import React from "react";
import { Link } from "@tanstack/react-router";
import {
  Banknote,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Building2,
  MapPin,
  ArrowRight,
  ShieldAlert,
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
import { ContractDashboardMetrics } from "../types";

export interface ContractDashboardViewProps {
  metrics: ContractDashboardMetrics;
}

export function ContractDashboardView({ metrics }: ContractDashboardViewProps) {
  return (
    <div className="space-y-6">
      {/* 6 KPI Cards matching Slide 17 with strict Amount Payable terminology */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Total Contract Value */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Contract Value
            </span>
            <div className="size-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Banknote className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              ₦{metrics.totalValue.toLocaleString("en-US", { minimumFractionDigits: 0 })}
            </div>
            <p className="text-[12px] text-slate-500 mt-1">
              Combined value of all active service contracts
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">{metrics.totalContracts} active contracts</span>
          </div>
        </div>

        {/* 2. Total Amount Paid */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Amount Paid
            </span>
            <div className="size-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              ₦{metrics.totalAmountPaid.toLocaleString("en-US", { minimumFractionDigits: 0 })}
            </div>
            <p className="text-[12px] text-slate-500 mt-1">
              Settled payments verified with transaction receipts
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {((metrics.totalAmountPaid / (metrics.totalValue || 1)) * 100).toFixed(1)}% of total value
            </span>
          </div>
        </div>

        {/* 3. Outstanding Payable (Client confirmed: Payable, not Receivable) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Outstanding Payable
            </span>
            <div className="size-9 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-rose-600 dark:text-rose-400 font-mono">
              ₦{metrics.totalAmountOutstanding.toLocaleString("en-US", { minimumFractionDigits: 0 })}
            </div>
            <p className="text-[12px] text-slate-500 mt-1">
              Remaining balance owed on service agreements
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Contract Value - Total Paid</span>
          </div>
        </div>

        {/* 4. Equipment Under Contract */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Equipment Under Contract
            </span>
            <div className="size-9 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <FileSpreadsheet className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              {metrics.equipmentUnderContract}
            </div>
            <p className="text-[12px] text-slate-500 mt-1">
              Devices covered under active service agreements
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Link
              to="/app/assets/list"
              className="text-xs font-medium text-teal-600 hover:underline inline-flex items-center gap-1"
            >
              Inspect assets <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* 5. Amount Payable Next Month (Confirmed Payable) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Amount Payable Next Month
            </span>
            <div className="size-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Calendar className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400 font-mono">
              ₦{metrics.amountPayableNextMonth.toLocaleString("en-US", { minimumFractionDigits: 0 })}
            </div>
            <p className="text-[12px] text-slate-500 mt-1">
              Scheduled milestone and installment payments
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Due within upcoming 30 days</span>
          </div>
        </div>

        {/* 6. Service Contracts Count */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Service Contracts
            </span>
            <div className="size-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldAlert className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              {metrics.totalContracts}
            </div>
            <p className="text-[12px] text-slate-500 mt-1">
              Active vendor and OEM service contracts
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Link
              to="/app/assets/contracts"
              className="text-xs font-medium text-indigo-600 hover:underline inline-flex items-center gap-1"
            >
              View all contracts <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Row 1 Charts: Contract Coverage & Contract Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Contract Coverage */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Equipment Contract Coverage (%)
            </h3>
            <span className="text-xs text-slate-500">Total fleet ratio</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.equipmentContractPercentage}
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
                  {metrics.equipmentContractPercentage.map((entry, index) => (
                    <Cell key={`cell-cov-${index}`} fill={entry.color} />
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

        {/* Contract Type Distribution */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Contract Type Distribution
            </h3>
            <span className="text-xs text-slate-500">By service agreement level</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.contractTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => (value > 0 ? `${name}: ${value}` : "")}
                  labelLine={false}
                >
                  {metrics.contractTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-type-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number, name: string) => [
                    `${value} contracts`,
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

      {/* Row 2 Charts: Contracted Equipment by Modality & by OEM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Modality */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Contracted Equipment by Modality
              </h3>
            </div>
            <span className="text-xs text-slate-500">Covered modalities</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.contractsByModality}
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
                  formatter={(value: number) => [`${value} units`, "Contracted"]}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    color: "#f8fafc",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OEM */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-purple-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Contracted Equipment by OEM
              </h3>
            </div>
            <span className="text-xs text-slate-500">Covered manufacturers</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.contractsByOem}
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
                  formatter={(value: number) => [`${value} units`, "Contracted"]}
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
    </div>
  );
}
