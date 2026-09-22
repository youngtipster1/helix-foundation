import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Wrench,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ClipboardCheck,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  Receipt,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Activity,
  Calendar,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { CalibrationStatusBadge } from "@/modules/tools/components/calibration-status-badge";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import { toolsService } from "@/modules/tools/services/tools-service";
import { toolsJobService } from "@/modules/tools/services/tools-job-service";
import { toolsExpenseService } from "@/modules/tools/services/tools-expense-service";
import type { Tool, ToolJob } from "@/modules/tools/types";
import { JobDetailModal } from "@/modules/tools/components/job-detail-modal";
import { PageHeader } from "@/components/layout/page-header";

export const Route = createFileRoute("/app/tools/dashboard")({
  head: () => ({
    meta: [
      { title: "Tools Dashboard — HEMP" },
      { name: "description", content: "Biomedical equipment calibration KPIs, fleet status, and active job tracking." },
    ],
  }),
  component: ToolsDashboardPage,
});

const CALIBRATION_COLORS = {
  calibrated: "#16a34a", // Green
  dueSoon: "#eab308", // Yellow / Amber
  expired: "#dc2626", // Red
};

function ToolsDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tools, setTools] = useState<Tool[]>([]);
  const [jobs, setJobs] = useState<ToolJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobNumber, setSelectedJobNumber] = useState<string | null>(null);

  const isAdmin = isModuleAdmin(user, "tools");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [toolsData, jobsData] = await Promise.all([
          toolsService.list(),
          toolsJobService.list(),
        ]);
        setTools(toolsData);
        setJobs(jobsData);
      } catch (err) {
        console.error("Error loading tools dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-[400px] place-items-center">
        <Loading />
      </div>
    );
  }

  // Calculate Calibration Metrics
  const calibratedCount = tools.filter((t) => t.calibrationStatus === "valid").length;
  const dueSoonCount = tools.filter((t) => t.calibrationStatus === "due_soon").length;
  const expiredCount = tools.filter((t) => t.calibrationStatus === "expired").length;
  const totalTools = tools.length;
  const complianceRate = totalTools > 0 ? Math.round((calibratedCount / totalTools) * 100) : 0;

  // Calibration Pie Chart Data (matches reference chart: CALIBRATED, DUE FOR CALIBRATION, OUT OF CALIBRATION)
  const calibrationPieData = [
    { name: "CALIBRATED", value: calibratedCount, color: CALIBRATION_COLORS.calibrated },
    { name: "DUE FOR CALIBRATION", value: dueSoonCount, color: CALIBRATION_COLORS.dueSoon },
    { name: "OUT OF CALIBRATION", value: expiredCount, color: CALIBRATION_COLORS.expired },
  ];

  // Jobs metrics
  const openJobs = jobs.filter((j) => j.jobStatus !== "Completed");
  const completedJobs = jobs.filter((j) => j.jobStatus === "Completed");

  // Job Distribution Data
  const calibrationJobsCount = jobs.filter((j) => j.jobType === "Calibration").length;
  const repairWarrantyCount = jobs.filter((j) => j.jobType === "Repair Warranty").length;
  const repairOowCount = jobs.filter((j) => j.jobType === "Repair OOW").length;

  const jobTypeData = [
    { name: "Calibration", count: calibrationJobsCount, fill: "#3b82f6" },
    { name: "Repair Warranty", count: repairWarrantyCount, fill: "#8b5cf6" },
    { name: "Repair OOW", count: repairOowCount, fill: "#f97316" },
  ];

  // Urgent attention items (Overdue tools and due soon tools)
  const urgentCalibrationTools = tools
    .filter((t) => t.calibrationStatus === "expired" || t.calibrationStatus === "due_soon")
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations Hub • Real-Time Metrology & Equipment Fleet"
        title="Tools Management Dashboard"
        subtitle="Monitor test tool calibration compliance index, active job throughput, and maintenance readiness."
        icon={Wrench}
      >
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => navigate({ to: "/app/tools/jobs/create" })}
            className="h-9 text-xs gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>Create Tools Job</span>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: "/app/tools" })}
          className="h-9 text-xs gap-1.5"
        >
          <Wrench className="size-3.5" />
          <span>Tools Registry</span>
        </Button>
      </PageHeader>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Equipment Fleet"
          value={totalTools}
          description="Registered biomedical diagnostic tools"
          icon={Wrench}
          onClick={() => navigate({ to: "/app/tools" })}
        />
        <StatCard
          title="Calibrated & Valid"
          value={calibratedCount}
          description="Valid calibration certificates active"
          icon={ShieldCheck}
          onClick={() => navigate({ to: "/app/tools" })}
        />
        <StatCard
          title="Due Within 30 Days"
          value={dueSoonCount}
          description="Calibration slots scheduled with vendors"
          icon={AlertTriangle}
          onClick={() => navigate({ to: "/app/tools" })}
        />
        <StatCard
          title="Out of Calibration"
          value={expiredCount}
          description="Quarantined & blocked from operational use"
          icon={XCircle}
          onClick={() => navigate({ to: "/app/tools" })}
        />
      </div>

      {/* Main Charts & Visual KPI Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPI Chart: TOOL CALIBRATION (Matching Reference Donut Visual) */}
        <div className="surface-panel p-6 lg:col-span-1 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Tool Calibration Status
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Current metrological breakdown
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-foreground">
              {totalTools} Total
            </span>
          </div>

          {/* Donut Chart Container */}
          <div className="h-64 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={calibrationPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={96}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    percent,
                  }: any) => {
                    const p = Math.round((percent || 0) * 100);
                    if (p < 4) return null;
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#FFFFFF"
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="select-none pointer-events-none"
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          fill: "#FFFFFF",
                          textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                        }}
                      >
                        {`${p}%`}
                      </text>
                    );
                  }}
                >
                  {calibrationPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                          <p className="font-bold text-foreground">{data.name}</p>
                          <p className="text-muted-foreground font-mono">
                            Count: <span className="font-bold text-foreground">{data.value}</span> ({Math.round(((data.value as number) / totalTools) * 100)}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Donut Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-2xl font-bold font-mono text-foreground leading-tight">
                {complianceRate}%
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                Compliance
              </span>
            </div>
          </div>

          {/* Custom Reference Legend */}
          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-sm bg-emerald-600 shrink-0" />
                <span className="font-semibold text-foreground">CALIBRATED</span>
              </div>
              <span className="font-mono font-bold text-foreground">
                {calibratedCount} ({totalTools > 0 ? Math.round((calibratedCount / totalTools) * 100) : 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-sm bg-yellow-500 shrink-0" />
                <span className="font-semibold text-foreground">DUE FOR CALIBRATION</span>
              </div>
              <span className="font-mono font-bold text-foreground">
                {dueSoonCount} ({totalTools > 0 ? Math.round((dueSoonCount / totalTools) * 100) : 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-sm bg-rose-600 shrink-0" />
                <span className="font-semibold text-foreground">OUT OF CALIBRATION</span>
              </div>
              <span className="font-mono font-bold text-foreground">
                {expiredCount} ({totalTools > 0 ? Math.round((expiredCount / totalTools) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Job Throughput & Distribution Bar Chart */}
        <div className="surface-panel p-6 lg:col-span-2 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Active Job Workload & Classification
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Distribution across calibration, warranty, and out-of-warranty repairs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Active: <strong className="text-foreground font-mono">{openJobs.length}</strong>
              </span>
              <span className="text-border">&bull;</span>
              <span className="text-xs text-muted-foreground">
                Completed: <strong className="text-foreground font-mono">{completedJobs.length}</strong>
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jobTypeData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip
                  cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                          <p className="font-bold text-foreground">{data.payload.name}</p>
                          <p className="text-muted-foreground font-mono">
                            Total Jobs: <span className="font-bold text-foreground">{data.value}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-border grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded bg-muted/20 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Calibration</span>
              <span className="font-mono font-bold text-foreground text-sm">{calibrationJobsCount}</span>
            </div>
            <div className="p-2 rounded bg-muted/20 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Warranty Repair</span>
              <span className="font-mono font-bold text-foreground text-sm">{repairWarrantyCount}</span>
            </div>
            <div className="p-2 rounded bg-muted/20 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">OOW Repair</span>
              <span className="font-mono font-bold text-foreground text-sm">{repairOowCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Equipment Requiring Immediate Action & Active Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Equipment Requiring Calibration / Action */}
        <div className="surface-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Calibration Attention Queue ({urgentCalibrationTools.length})
              </h3>
            </div>
            <Link
              to="/app/tools"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View All Tools</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {urgentCalibrationTools.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
              <CheckCircle2 className="size-6 text-emerald-600 mx-auto" />
              <p className="font-medium text-foreground">All Equipment Calibrated</p>
              <p>No tools are overdue or due for calibration within 30 days.</p>
            </div>
          ) : (
            <div className="divide-y divide-border border border-border rounded-lg bg-card overflow-hidden">
              {urgentCalibrationTools.map((tool) => (
                <div key={tool.id} className="p-3 hover:bg-accent/40 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        to="/app/tools/$toolId"
                        params={{ toolId: tool.id }}
                        className="font-mono font-bold text-primary hover:underline"
                      >
                        {tool.id}
                      </Link>
                      <span className="font-medium text-foreground truncate">{tool.model}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Due: {tool.nextCalibrationDate} &bull; S/N: {tool.serialNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CalibrationStatusBadge status={tool.calibrationStatus} />
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate({ to: "/app/tools/jobs/create" })}
                        className="h-7 text-[11px]"
                      >
                        Schedule
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel 2: Active Open Jobs Overview */}
        <div className="surface-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="size-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Active Operations & Maintenance ({openJobs.length})
              </h3>
            </div>
            <Link
              to="/app/tools/jobs"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View All Jobs</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {openJobs.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
              <CheckCircle2 className="size-6 text-emerald-600 mx-auto" />
              <p className="font-medium text-foreground">No Open Jobs</p>
              <p>All tool repairs and calibration jobs are currently completed.</p>
            </div>
          ) : (
            <div className="divide-y divide-border border border-border rounded-lg bg-card overflow-hidden">
              {openJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="p-3 hover:bg-accent/40 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedJobNumber(job.jobNumber)}
                        className="font-mono font-bold text-primary hover:underline cursor-pointer"
                      >
                        {job.jobNumber}
                      </button>
                      <span className="font-medium text-foreground">&bull; {job.jobType}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {job.toolId} ({job.toolSnapshot.model}) &bull; Assigned: {job.assignedToName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={job.jobStatus} />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedJobNumber(job.jobNumber)}
                      className="h-7 text-xs text-primary hover:underline"
                    >
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <JobDetailModal
        open={Boolean(selectedJobNumber)}
        onOpenChange={(open) => !open && setSelectedJobNumber(null)}
        jobNumber={selectedJobNumber}
        onJobUpdated={() => {
          toolsJobService.list().then(setJobs);
        }}
      />
    </div>
  );
}
