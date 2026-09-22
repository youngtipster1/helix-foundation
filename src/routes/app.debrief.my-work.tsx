import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/data-table/table-pagination";
import { useAuth } from "@/features/auth/auth-context";
import { debriefService } from "@/modules/debrief/services/debrief-service";
import type { DebriefJob } from "@/modules/debrief/types";
import {
  Wrench,
  AlertTriangle,
  Play,
  ArrowRight,
  CheckCircle2,
  Calendar,
  FileText,
  Navigation,
  LayoutGrid,
  List,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/debrief/my-work")({
  head: () => ({
    meta: [
      { title: "My Work Queue — Debrief | HEMP" },
      {
        name: "description",
        content: "Active service jobs, scheduled dispatches, and completed debrief records.",
      },
    ],
  }),
  component: DebriefMyWorkPage,
});

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateNow(): string {
  return new Date().toISOString().split("T")[0];
}

function getJobStageLabel(job: DebriefJob, isScheduledTab: boolean): { label: string; icon: typeof Wrench; className: string } {
  if (job.jobStatus === "Completed" || job.stage === "completed") {
    return {
      label: "Completed",
      icon: CheckCircle2,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    };
  }
  if (job.jobStatus === "On Hold" || job.stage === "on_hold") {
    return {
      label: `On Hold · ${job.holdReason || "Awaiting Part"}`,
      icon: AlertTriangle,
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    };
  }
  if (job.stage === "traveling" || (job.labour?.travelStartTime && !job.labour?.labourStartTime)) {
    return {
      label: `In Travel · Started ${job.labour?.travelStartTime || ""}`,
      icon: Navigation,
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    };
  }
  if (job.stage === "working" || job.labour?.labourStartTime || job.jobStatus === "In Progress") {
    return {
      label: "In Progress · Working",
      icon: Wrench,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    };
  }
  if (isScheduledTab) {
    return {
      label: `Scheduled · ${job.jobStartDate || "Upcoming"}`,
      icon: Lock,
      className: "bg-muted text-muted-foreground border-border",
    };
  }
  return {
    label: "Due Today · Ready to Start",
    icon: Calendar,
    className: "bg-primary/10 text-primary font-bold border-primary/30",
  };
}

function DebriefMyWorkPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<DebriefJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "scheduled" | "completed">("active");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);

  const today = formatDateNow();

  const loadMyWork = useCallback(async () => {
    setLoading(true);
    try {
      const data = await debriefService.getMyWork(user);
      setJobs(data);
    } catch (err) {
      console.error("Failed to load My Work queue", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMyWork();
  }, [loadMyWork]);

  // Grouping into 3 clear categories:
  // Active: Jobs in progress, on hold, traveling, OR due today / past due
  const activeJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (j.jobStatus === "Completed" || j.stage === "completed") return false;

      // Already active states
      if (
        j.jobStatus === "In Progress" ||
        j.jobStatus === "On Hold" ||
        j.stage === "traveling" ||
        j.stage === "working" ||
        j.stage === "on_hold" ||
        Boolean(j.labour?.travelStartTime)
      ) {
        return true;
      }

      // Scheduled job due today or past due
      const startDate = j.jobStartDate || j.startDate || "";
      if (startDate && startDate <= today) {
        return true;
      }

      return false;
    });
  }, [jobs, today]);

  // Scheduled: Future jobs (due date > today and not yet started)
  const scheduledJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (j.jobStatus === "Completed" || j.stage === "completed") return false;
      if (
        j.jobStatus === "In Progress" ||
        j.jobStatus === "On Hold" ||
        j.stage === "traveling" ||
        j.stage === "working" ||
        j.stage === "on_hold" ||
        Boolean(j.labour?.travelStartTime)
      ) {
        return false;
      }

      const startDate = j.jobStartDate || j.startDate || "";
      return !startDate || startDate > today;
    });
  }, [jobs, today]);

  const completedJobs = useMemo(() => {
    return jobs.filter((j) => j.jobStatus === "Completed" || j.stage === "completed");
  }, [jobs]);

  const displayedJobs = useMemo(() => {
    if (activeTab === "active") return activeJobs;
    if (activeTab === "scheduled") return scheduledJobs;
    return completedJobs;
  }, [activeTab, activeJobs, scheduledJobs, completedJobs]);

  const handleTabChange = (tab: "active" | "scheduled" | "completed") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  // Pagination Configuration: 6 for Grid View, 25 for List View
  const pageSize = viewMode === "grid" ? 6 : 25;
  const totalPages = Math.max(1, Math.ceil(displayedJobs.length / pageSize));

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return displayedJobs.slice(startIndex, startIndex + pageSize);
  }, [displayedJobs, currentPage, pageSize]);

  const handleOpenWorkspace = (job: DebriefJob) => {
    navigate({
      to: "/app/debrief/workspace/$jobId",
      params: { jobId: job.id },
    });
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <PageHeader
        title="My Work"
        subtitle="Manage active job executions, view your upcoming scheduled dispatches, and review completed service debriefs."
        icon={Wrench}
      />

      {/* Filter Tabs & Grid/List View Mode Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
        {/* 3 Primary Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange("active")}
            className={cn(
              "px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer border flex items-center gap-2",
              activeTab === "active"
                ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
            )}
          >
            <Play className="size-3.5" />
            <span>Active &amp; In Progress</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-xs font-bold leading-none",
                activeTab === "active" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {activeJobs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("scheduled")}
            className={cn(
              "px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer border flex items-center gap-2",
              activeTab === "scheduled"
                ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
            )}
          >
            <Calendar className="size-3.5" />
            <span>Scheduled</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-xs font-bold leading-none",
                activeTab === "scheduled" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {scheduledJobs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("completed")}
            className={cn(
              "px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer border flex items-center gap-2",
              activeTab === "completed"
                ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
            )}
          >
            <CheckCircle2 className="size-3.5" />
            <span>Completed</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-xs font-bold leading-none",
                activeTab === "completed" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {completedJobs.length}
            </span>
          </button>
        </div>

        {/* View Mode Toggle (Grid vs List) */}
        <div className="flex items-center gap-1 self-end sm:self-auto bg-muted/40 p-1 rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => handleViewModeChange("grid")}
            aria-label="Grid view"
            className={cn(
              "p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              viewMode === "grid"
                ? "bg-background text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="size-4" />
            <span className="hidden xs:inline">Grid</span>
          </button>

          <button
            type="button"
            onClick={() => handleViewModeChange("list")}
            aria-label="List view"
            className={cn(
              "p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              viewMode === "list"
                ? "bg-background text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-4" />
            <span className="hidden xs:inline">List</span>
          </button>
        </div>
      </div>

      {/* Queue Content: Loading / Empty State */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground font-semibold">
          Loading your service queue...
        </div>
      ) : displayedJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center space-y-2 bg-muted/10">
          <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">
            {activeTab === "active"
              ? "No Active Jobs"
              : activeTab === "scheduled"
              ? "No Upcoming Scheduled Jobs"
              : "No Completed Debriefs"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {activeTab === "active"
              ? "You are not currently working on or traveling to any active jobs, and no jobs are due today."
              : activeTab === "scheduled"
              ? "You have no upcoming jobs waiting on your schedule."
              : "Completed jobs with signed debrief records will appear here."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (Default) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {paginatedJobs.map((job) => {
            const isScheduledTab = activeTab === "scheduled";
            const stageInfo = getJobStageLabel(job, isScheduledTab);
            const isCompleted = job.jobStatus === "Completed";
            const isOnHold = job.jobStatus === "On Hold";
            const isTraveling = job.stage === "traveling" || (job.labour?.travelStartTime && !job.labour?.labourStartTime);
            const isDueToday = !isCompleted && !isOnHold && !isTraveling && job.stage !== "working" && !job.labour?.labourStartTime;
            const totalSpend = job.totalJobCost || ((job.totalPartsCost || 0) + (job.totalExpensesCost || 0));

            return (
              <div
                key={job.id}
                className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4 transition-all hover:border-primary/50"
              >
                <div className="space-y-3">
                  {/* Card Top: Job # & Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-primary">
                        {job.jobNumber}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border",
                          stageInfo.className
                        )}
                      >
                        <stageInfo.icon className="size-3" />
                        <span className="truncate max-w-[140px]">{stageInfo.label}</span>
                      </span>
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border",
                        job.equipmentStatus === "UP"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : job.equipmentStatus === "Partially UP"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      )}
                    >
                      {job.equipmentStatus}
                    </span>
                  </div>

                  {/* Equipment Header Info */}
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="font-bold text-foreground text-sm leading-snug">
                        {job.model}
                      </h4>
                      <span className="font-mono font-semibold text-xs text-primary shrink-0">
                        {job.assetNumber}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {job.modality} · {job.oem}
                    </span>
                  </div>

                  {/* Compact Job Details Summary */}
                  <div className="p-3 rounded-lg bg-muted/25 border border-border/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Job Type:</span>
                      <span className="font-semibold text-foreground">{job.jobType}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Priority:</span>
                      <span
                        className={cn(
                          "font-bold",
                          job.jobPriority === "High"
                            ? "text-rose-600"
                            : job.jobPriority === "Mid"
                            ? "text-amber-600"
                            : "text-blue-600"
                        )}
                      >
                        {job.jobPriority} Priority
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Scheduled Date:</span>
                      <span className="font-mono font-semibold text-foreground">
                        {job.jobStartDate || job.startDate || "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Location:</span>
                      <span className="text-foreground truncate max-w-[170px]">
                        {job.location || "Main Ward"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <span className="text-muted-foreground font-medium">Job Spend:</span>
                      <span className="font-mono font-bold text-foreground">
                        {formatNaira(totalSpend)}
                      </span>
                    </div>
                  </div>

                  {/* Reported Issue / Debrief Summary preview */}
                  <div className="space-y-1 text-xs">
                    <span className="font-medium text-muted-foreground flex items-center gap-1">
                      <FileText className="size-3" />
                      {isCompleted ? "Work Performed:" : "Reported Issue:"}
                    </span>
                    <p className="p-2.5 rounded-md bg-muted/20 border border-border/60 text-foreground leading-relaxed text-xs line-clamp-2">
                      {isCompleted
                        ? job.labour?.workDone || job.reportedIssue
                        : job.reportedIssue || "Diagnostic service inspection required."}
                    </p>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-1">
                  {isScheduledTab ? (
                    /* Locked button for future scheduled jobs */
                    <Button
                      disabled
                      variant="outline"
                      className="w-full h-9 text-xs font-semibold bg-muted/30 text-muted-foreground border-border/60 cursor-not-allowed gap-1.5"
                    >
                      <Lock className="size-3.5" />
                      <span>Locked (Due {job.jobStartDate})</span>
                    </Button>
                  ) : (
                    /* Active button without emojis */
                    <Button
                      size="sm"
                      onClick={() => handleOpenWorkspace(job)}
                      className={cn(
                        "w-full h-9 text-xs font-bold gap-1.5 cursor-pointer shadow-xs",
                        isCompleted
                          ? "bg-muted text-foreground hover:bg-muted/80 border border-border"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground"
                      )}
                    >
                      <span>
                        {isCompleted
                          ? "View Debrief Summary"
                          : isDueToday
                          ? "Start Travel"
                          : isTraveling
                          ? "Arrive On Site"
                          : isOnHold
                          ? "Resume Job"
                          : "Open Workspace"}
                      </span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="py-3 px-4">Job #</th>
                  <th className="py-3 px-4">Status / Stage</th>
                  <th className="py-3 px-4">Equipment &amp; Model</th>
                  <th className="py-3 px-4">Job Type</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Job Spend</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginatedJobs.map((job) => {
                  const isScheduledTab = activeTab === "scheduled";
                  const stageInfo = getJobStageLabel(job, isScheduledTab);
                  const isCompleted = job.jobStatus === "Completed";
                  const isOnHold = job.jobStatus === "On Hold";
                  const isTraveling = job.stage === "traveling" || (job.labour?.travelStartTime && !job.labour?.labourStartTime);
                  const isDueToday = !isCompleted && !isOnHold && !isTraveling && job.stage !== "working" && !job.labour?.labourStartTime;
                  const totalSpend = job.totalJobCost || ((job.totalPartsCost || 0) + (job.totalExpensesCost || 0));

                  return (
                    <tr key={job.id} className="hover:bg-muted/15 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary whitespace-nowrap">
                        {job.jobNumber}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border",
                            stageInfo.className
                          )}
                        >
                          <stageInfo.icon className="size-3" />
                          <span>{stageInfo.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-foreground">{job.model}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{job.assetNumber} • {job.oem}</div>
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium whitespace-nowrap">
                        {job.jobType}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={cn(
                            "font-bold",
                            job.jobPriority === "High"
                              ? "text-rose-600"
                              : job.jobPriority === "Mid"
                              ? "text-amber-600"
                              : "text-blue-600"
                          )}
                        >
                          {job.jobPriority}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground whitespace-nowrap">
                        {job.jobStartDate || job.startDate || "—"}
                      </td>
                      <td className="py-3 px-4 text-foreground truncate max-w-[160px]">
                        {job.location || "Main Ward"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-foreground whitespace-nowrap">
                        {formatNaira(totalSpend)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isScheduledTab ? (
                          <Button
                            disabled
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs text-muted-foreground bg-muted/30 border-border/60 cursor-not-allowed gap-1"
                          >
                            <Lock className="size-3" />
                            <span>Locked</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleOpenWorkspace(job)}
                            className={cn(
                              "h-8 px-3 text-xs font-bold gap-1 cursor-pointer",
                              isCompleted
                                ? "bg-muted text-foreground hover:bg-muted/80 border border-border"
                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                          >
                            <span>
                              {isCompleted
                                ? "Debrief"
                                : isDueToday
                                ? "Start Travel"
                                : isTraveling
                                ? "Arrive On Site"
                                : isOnHold
                                ? "Resume"
                                : "Open"}
                            </span>
                            <ArrowRight className="size-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {displayedJobs.length > 0 && (
            <TablePagination
              page={currentPage}
              pageCount={totalPages}
              total={displayedJobs.length}
              from={displayedJobs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              to={Math.min(currentPage * pageSize, displayedJobs.length)}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {/* Grid View Pagination */}
      {!loading && viewMode === "grid" && displayedJobs.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs [&>div]:border-t-0">
          <TablePagination
            page={currentPage}
            pageCount={totalPages}
            total={displayedJobs.length}
            from={displayedJobs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            to={Math.min(currentPage * pageSize, displayedJobs.length)}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
