import React from "react";
import {
  Banknote,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileSpreadsheet,
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
  CartesianGrid,
  LabelList,
} from "recharts";
import { ContractDashboardMetrics } from "../types";

export interface ContractDashboardViewProps {
  metrics: ContractDashboardMetrics;
}

export function ContractDashboardView({ metrics }: ContractDashboardViewProps) {
  return (
    <div className="space-y-4">
      {/* 1. Restored 6 KPI Summary Cards (All neutral black numbers, no colored values) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Card 1: Total Contract Value */}
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

        {/* Card 2: Total Amount Paid */}
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

        {/* Card 3: Outstanding Payable */}
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

        {/* Card 4: Covered Equipment */}
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

        {/* Card 5: Payable Next Month */}
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
            Contract amount payable next month
          </p>
        </div>

        {/* Card 6: Service Contracts */}
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

      {/* 2. Middle Row: 2 Donut Charts (Contract Status + Service Contract Types) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Donut 1: Contract Status (Slide 17: Red 75% NOT ON CONTRACT, Green 25% CONTRACT) */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <FileSpreadsheet className="size-4 text-foreground" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Contract Status
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Coverage
            </span>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.equipmentContractPercentage}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ percentage }) => `${percentage}%`}
                  labelLine={false}
                >
                  {metrics.equipmentContractPercentage.map((entry, index) => (
                    <Cell key={`cell-contract-${index}`} fill={entry.color} />
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
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend matching slide 17: ■ CONTRACT  ■ NOT ON CONTRACT */}
          <div className="flex items-center justify-center gap-5 pt-2 border-t border-border/60 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="size-2.5 rounded-xs bg-[#10b981]" />
              <span>CONTRACT</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="size-2.5 rounded-xs bg-[#ef4444]" />
              <span>NOT ON CONTRACT</span>
            </div>
          </div>
        </div>

        {/* Donut 2: Service Contract Types (Slide 17: PM ONLY, LABOUR ONLY, PM + LABOUR, COMPREHENSIVE) */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Banknote className="size-4 text-foreground" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Service Contract Types
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Distribution
            </span>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.contractTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ percentage }) => `${percentage}%`}
                  labelLine={false}
                >
                  {metrics.contractTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-type-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number, name: string) => [
                    `${value} agreements`,
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

          {/* Legend matching slide 17: ■ PM ONLY  ■ LABOUR ONLY  ■ PM + LABOUR  ■ COMPREHENSIVE */}
          <div className="flex items-center justify-center gap-3 pt-2 border-t border-border/60 flex-wrap text-[11px]">
            <div className="flex items-center gap-1 font-medium text-foreground">
              <span className="size-2.5 rounded-xs bg-[#0284c7]" />
              <span>PM ONLY</span>
            </div>
            <div className="flex items-center gap-1 font-medium text-foreground">
              <span className="size-2.5 rounded-xs bg-[#f97316]" />
              <span>LABOUR ONLY</span>
            </div>
            <div className="flex items-center gap-1 font-medium text-foreground">
              <span className="size-2.5 rounded-xs bg-[#94a3b8]" />
              <span>PM + LABOUR</span>
            </div>
            <div className="flex items-center gap-1 font-medium text-foreground">
              <span className="size-2.5 rounded-xs bg-[#10b981]" />
              <span>COMPREHENSIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: 3 Bar Charts matching slide 17 (CONTRACT BY LOCATION, CONTRACT BY MODALITY, CONTRACT BY OEM) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Bar 1: CONTRACT BY LOCATION */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="text-center mb-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              CONTRACT BY LOCATION
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.contractsByLocation}
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
                  formatter={(value: number) => [`${value} contracts`, "Location"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {metrics.contractsByLocation.map((entry, index) => (
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

        {/* Bar 2: CONTRACT BY MODALITY */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="text-center mb-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              CONTRACT BY MODALITY
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.contractsByModality}
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
                  formatter={(value: number) => [`${value} contracts`, "Modality"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {metrics.contractsByModality.map((entry, index) => (
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
            {metrics.contractsByModality.map((item, idx) => (
              <div key={`mod-leg-${idx}`} className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                <span className="size-2.5 rounded-xs" style={{ backgroundColor: item.color }} />
                <span>{item.modality}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar 3: CONTRACT BY OEM */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="text-center mb-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              CONTRACT BY OEM
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.contractsByOem}
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
                  formatter={(value: number) => [`${value} contracts`, "OEM Count"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {metrics.contractsByOem.map((entry, index) => (
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
            {metrics.contractsByOem.map((item, idx) => (
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
