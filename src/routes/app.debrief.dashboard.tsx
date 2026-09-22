import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import { debriefService } from "@/modules/debrief/services/debrief-service";
import { kpiService } from "@/modules/debrief/services/kpi-service";
import type { DebriefJob } from "@/modules/debrief/types";
import type { EngineerKPIRecord, TeamKPISummary } from "@/modules/debrief/services/kpi-service";
import { EngineerKPIBarCharts } from "@/modules/debrief/components/dashboard/engineer-kpi-bar-charts";
import { OperationalAttentionCard } from "@/modules/debrief/components/dashboard/operational-attention-card";
import {
  LayoutDashboard,
  ClipboardList,
  Play,
  PauseCircle,
  CheckCircle2,
  Inbox,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/debrief/dashboard")({
  head: () => ({
    meta: [
      { title: "Debrief Dashboard — HEMP" },
      {
        name: "description",
        content:
          "High-level operational overview of Debrief jobs, engineer performance KPI bar charts, and operational attention alerts.",
      },
    ],
  }),
  component: DebriefDashboardPage,
});

function DebriefDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<DebriefJob[]>([]);
  const [kpiData, setKpiData] = useState<{
    records: EngineerKPIRecord[];
    summary: TeamKPISummary;
  }>({
    records: [],
    summary: {
      avgFTFR: 0,
      avgMTTR: 0,
      avgUtilization: 0,
      avgTravelTimeHours: 0,
      avgTravelDistanceKm: 0,
      totalJobsCompleted: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  const isAdmin =
    Boolean(user?.isSuperAdmin) ||
    user?.role === "Super Admin" ||
    isModuleAdmin(user, "debrief") ||
    (user?.role || "").toLowerCase().includes("admin");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [jobsList, kpis] = await Promise.all([
        debriefService.list(user),
        kpiService.getEngineerKPIs(),
      ]);
      setJobs(jobsList);
      setKpiData(kpis);
    } catch (err) {
      console.error("Failed to load dashboard operational data", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Section 1: Job status counts
  const totalJobsCount = jobs.length;
  const openJobsCount = useMemo(() => {
    return jobs.filter(
      (j) =>
        (j.jobStatus === "Open" || j.stage === "assigned") &&
        !j.labour?.travelStartTime &&
        j.jobStatus !== "In Progress" &&
        j.jobStatus !== "On Hold"
    ).length;
  }, [jobs]);

  const inProgressJobsCount = useMemo(() => {
    return jobs.filter(
      (j) =>
        j.jobStatus === "In Progress" ||
        j.stage === "traveling" ||
        j.stage === "working"
    ).length;
  }, [jobs]);

  const onHoldJobs = useMemo(() => {
    return jobs.filter((j) => j.jobStatus === "On Hold" || j.stage === "on_hold");
  }, [jobs]);

  const completedJobsCount = useMemo(() => {
    return jobs.filter(
      (j) => j.jobStatus === "Completed" || j.stage === "completed"
    ).length;
  }, [jobs]);

  return (
    <div className="w-full space-y-6 pb-12">
      <PageHeader
        eyebrow="Debrief Module"
        title="Debrief Dashboard"
        subtitle={
          isAdmin
            ? "High-level operational overview across job statuses, per-engineer KPI comparative bar charts, and operational attention escalations."
            : "Operational overview of active jobs, personal performance benchmarks, and status alerts."
        }
        icon={LayoutDashboard}
      />

      {/* SECTION 1: JOB STATUS OVERVIEW (5 Standard Full-Size Clickable Cards) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ClipboardList className="size-3.5 text-primary" />
            <span>Job Status Overview (Click to Navigate to Jobs)</span>
          </h3>
          <span className="text-xs text-muted-foreground font-mono">Live Roster Sync</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Jobs */}
          <div
            onClick={() => navigate({ to: "/app/debrief" })}
            className="p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-2 cursor-pointer hover:border-primary/60 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="font-semibold uppercase tracking-wider text-xs">Total Jobs</span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Inbox className="size-4" />
              </div>
            </div>
            <div className="font-mono font-bold text-2xl text-foreground flex items-baseline justify-between">
              <span>{totalJobsCount}</span>
              <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground">All active &amp; historical jobs</p>
          </div>

          {/* Card 2: Open Jobs */}
          <div
            onClick={() => navigate({ to: "/app/debrief" })}
            className="p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-2 cursor-pointer hover:border-sky-500/60 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="font-semibold uppercase tracking-wider text-xs">Open Jobs</span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                <ClipboardList className="size-4" />
              </div>
            </div>
            <div className="font-mono font-bold text-2xl text-foreground flex items-baseline justify-between">
              <span>{openJobsCount}</span>
              <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-sky-500 transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground">Assigned &amp; scheduled visits</p>
          </div>

          {/* Card 3: In Progress */}
          <div
            onClick={() => navigate({ to: "/app/debrief" })}
            className="p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-2 cursor-pointer hover:border-primary/60 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="font-semibold uppercase tracking-wider text-xs">In Progress</span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Play className="size-4" />
              </div>
            </div>
            <div className="font-mono font-bold text-2xl text-foreground flex items-baseline justify-between">
              <span>{inProgressJobsCount}</span>
              <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground">Active traveling or field labour</p>
          </div>

          {/* Card 4: On Hold */}
          <div
            onClick={() => navigate({ to: "/app/debrief" })}
            className="p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-2 cursor-pointer hover:border-amber-500/60 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="font-semibold uppercase tracking-wider text-xs">On Hold</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <PauseCircle className="size-4" />
              </div>
            </div>
            <div className="font-mono font-bold text-2xl text-foreground flex items-baseline justify-between">
              <span>{onHoldJobs.length}</span>
              <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground">Pending spare parts or PO quote</p>
          </div>

          {/* Card 5: Completed */}
          <div
            onClick={() => navigate({ to: "/app/debrief" })}
            className="p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-2 cursor-pointer hover:border-emerald-500/60 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="font-semibold uppercase tracking-wider text-xs">Completed</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div className="font-mono font-bold text-2xl text-foreground flex items-baseline justify-between">
              <span>{completedJobsCount}</span>
              <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground">Signed off and debriefed</p>
          </div>
        </div>
      </div>

      {/* SECTION 3: ENGINEER KPI BAR CHARTS (Source-Mandated Per Engineer Bar Charts) */}
      <EngineerKPIBarCharts records={kpiData.records} summary={kpiData.summary} />

      {/* SECTION 4: OPERATIONAL ATTENTION AREA */}
      <OperationalAttentionCard onHoldJobs={onHoldJobs} isAdmin={isAdmin} />
    </div>
  );
}
