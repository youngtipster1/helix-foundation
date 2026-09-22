import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
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
  Clock,
  MapPin,
  FileText,
  Navigation,
  DollarSign,
  Boxes,
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getJobStageLabel(job: DebriefJob): { label: string; icon: typeof Wrench; className: string } {
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
  return {
    label: "Scheduled · Not Started",
    icon: Calendar,
    className: "bg-muted text-muted-foreground border-border",
  };
}

function DebriefMyWorkPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<DebriefJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "scheduled" | "completed">("active");

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

  // Grouping into 3 clear categories
  const activeJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (j.jobStatus === "Completed") return false;
      // Active = In Progress, Traveling, or On Hold
      return (
        j.jobStatus === "In Progress" ||
        j.jobStatus === "On Hold" ||
        j.stage === "traveling" ||
        j.stage === "working" ||
        j.stage === "on_hold" ||
        Boolean(j.labour?.travelStartTime)
      );
    });
  }, [jobs]);

  const scheduledJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (j.jobStatus === "Completed") return false;
      // Scheduled = Open and not yet started travel
      return (
        (j.jobStatus === "Open" || j.stage === "assigned") &&
        !j.labour?.travelStartTime &&
        j.jobStatus !== "In Progress" &&
        j.jobStatus !== "On Hold"
      );
    });
  }, [jobs]);

  const completedJobs = useMemo(() => {
    return jobs.filter((j) => j.jobStatus === "Completed" || j.stage === "completed");
  }, [jobs]);

  const displayedJobs = useMemo(() => {
    if (activeTab === "active") return activeJobs;
    if (activeTab === "scheduled") return scheduledJobs;
    return completedJobs;
  }, [activeTab, activeJobs, scheduledJobs, completedJobs]);

  const handleOpenWorkspace = (job: DebriefJob) => {
    navigate({
      to: "/app/debrief/workspace/$jobId",
      params: { jobId: job.id },
    });
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <PageHeader
        eyebrow="Debrief Module"
        title="My Work"
        subtitle="Manage active job executions, view your scheduled dispatches, and review completed service debriefs."
        icon={Wrench}
      />

      {/* Primary 3-Tab Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("active")}
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
          onClick={() => setActiveTab("scheduled")}
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
          onClick={() => setActiveTab("completed")}
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

      {/* Queue Grid (2-3 columns on desktop, 1 column on mobile) */}
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
              ? "You are not currently working on or traveling to any active jobs."
              : activeTab === "scheduled"
              ? "You have no upcoming jobs waiting for dispatch."
              : "Completed jobs with signed debriefs will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {displayedJobs.map((job) => {
            const stageInfo = getJobStageLabel(job);
            const isCompleted = job.jobStatus === "Completed";
            const isOnHold = job.jobStatus === "On Hold";
            const isTraveling = job.stage === "traveling" || (job.labour?.travelStartTime && !job.labour?.labourStartTime);
            const isScheduled = activeTab === "scheduled";
            const totalSpend = job.totalJobCost || ((job.totalPartsCost || 0) + (job.totalExpensesCost || 0));

            return (
              <div
                key={job.id}
                className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4 transition-all hover:border-primary/50"
              >
                <div className="space-y-3">
                  {/* Card Top: Job # & Equipment Status */}
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
                      <span className="text-muted-foreground font-medium">Location:</span>
                      <span className="text-foreground truncate max-w-[170px]">
                        {job.location || "Main Ward"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <span className="text-muted-foreground font-medium">Job Spend:</span>
                      <span className="font-mono font-bold text-foreground">
                        {formatCurrency(totalSpend)}
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
                        ? "View Debrief Summary 📄"
                        : isScheduled
                        ? "Start Travel 🚗"
                        : isTraveling
                        ? "Arrive On Site 📍"
                        : isOnHold
                        ? "Resume Job ▶️"
                        : "Open Workspace ⚡"}
                    </span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
