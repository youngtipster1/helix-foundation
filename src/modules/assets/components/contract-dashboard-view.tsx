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
    <div className="space-y-4">
      {/* 6 KPI Cards matching System Design with strict Amount Payable terminology */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* 1. Total Contract Value */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Contract Value
            </span>
            <div className="size-7 rounded-md bg-muted/60 flex items-center justify-center text-foreground">
              <Banknote className="size-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-foreground">
            ₦{metrics.totalValue.toLocaleString("en-US", { minimumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Combined value of active service agreements ({metrics.totalContracts} contracts)
          </p>
        </div>

        {/* 2. Total Amount Paid */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Amount Paid
            </span>
            <div className="size-7 rounded-md bg-muted/60 flex items-center justify-center text-foreground">
              <CheckCircle2 className="size-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-foreground">
            ₦{metrics.totalAmountPaid.toLocaleString("en-US", { minimumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Verified settlement payments ({((metrics.totalAmountPaid / (metrics.totalValue || 1)) * 100).toFixed(0)}% fulfilled)
          </p>
        </div>

        {/* 3. Outstanding Payable */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Outstanding Payable
            </span>
            <div className="size-7 rounded-md bg-muted/60 flex items-center justify-center text-foreground">
              <AlertCircle className="size-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-foreground">
            ₦{metrics.totalAmountOutstanding.toLocaleString("en-US", { minimumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Remaining balance payable on agreements
          </p>
        </div>

        {/* 4. Equipment Under Contract */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Covered Equipment
            </span>
            <div className="size-7 rounded-md bg-muted/60 flex items-center justify-center text-foreground">
              <FileSpreadsheet className="size-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-foreground">
            {metrics.equipmentUnderContract}{" "}
            <span className="text-xs font-sans font-medium text-muted-foreground">units</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Devices protected under vendor maintenance agreements
          </p>
        </div>

        {/* 5. Amount Payable Next Month */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Payable Next Month
            </span>
            <div className="size-7 rounded-md bg-muted/60 flex items-center justify-center text-foreground">
              <Calendar className="size-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-foreground">
            ₦{metrics.amountPayableNextMonth.toLocaleString("en-US", { minimumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Scheduled installment due within upcoming 30 days
          </p>
        </div>

        {/* 6. Service Contracts */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Service Contracts
            </span>
            <div className="size-7 rounded-md bg-muted/60 flex items-center justify-center text-foreground">
              <ShieldAlert className="size-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-foreground">
            {metrics.totalContracts}{" "}
            <span className="text-xs font-sans font-medium text-muted-foreground">active</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Active OEM and 3rd-party vendor service agreements
          </p>
        </div>
      </div>

      {/* Row 1 Charts: Contract Coverage & Contract Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Equipment Contract Coverage */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-foreground">
              Equipment Contract Coverage (%)
            </h3>
            <span className="text-[11px] text-muted-foreground">Fleet ratio</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.equipmentContractPercentage}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
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

        {/* Contract Type Distribution */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-foreground">
              Contract Type Distribution
            </h3>
            <span className="text-[11px] text-muted-foreground">Coverage levels</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.contractTypeDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
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

      {/* Row 2 Charts: Contracted Equipment by Modality & by OEM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Modality */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="size-4 text-blue-500" />
              <h3 className="text-xs font-semibold text-foreground">
                Contracted Equipment by Modality
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">Covered types</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.contractsByModality}
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
                  formatter={(value: number) => [`${value} units`, "Contracted"]}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    color: "#f8fafc",
                    borderRadius: "0.5rem",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OEM */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Building2 className="size-4 text-purple-500" />
              <h3 className="text-xs font-semibold text-foreground">
                Contracted Equipment by OEM
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">Manufacturers</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.contractsByOem}
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
                  formatter={(value: number) => [`${value} units`, "Contracted"]}
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
    </div>
  );
}
