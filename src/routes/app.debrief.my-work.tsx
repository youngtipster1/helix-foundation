import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { debriefService } from "@/modules/debrief/services/debrief-service";
import { JobWorkspaceModal } from "@/modules/debrief/components/job-workspace-modal";
import type { DebriefJob } from "@/modules/debrief/types";
import {
  Wrench,
  Clock,
  AlertTriangle,
  Play,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Building2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/debrief/my-work")({
  head: () => ({
    meta: [
      { title: "My Work Queue — Debrief | HEMP" },
      {
        name: "description",
        content: "Active service jobs and task assignments requiring your execution or currently on hold.",
      },
    ],
  }),
  component: DebriefMyWorkPage,
});

function DebriefMyWorkPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<DebriefJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<DebriefJob | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [filterState, setFilterState] = useState<"all" | "in_progress" | "on_hold">("all");

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

  const filteredJobs = useMemo(() => {
    if (filterState === "in_progress") {
      return jobs.filter((j) => j.jobStatus === "In Progress" || j.jobStatus === "Open");
    }
    if (filterState === "on_hold") {
      return jobs.filter((j) => j.jobStatus === "On Hold");
    }
    return jobs;
  }, [jobs, filterState]);

  const inProgressCount = useMemo(
    () => jobs.filter((j) => j.jobStatus === "In Progress" || j.jobStatus === "Open").length,
    [jobs]
  );

  const onHoldCount = useMemo(
    () => jobs.filter((j) => j.jobStatus === "On Hold").length,
    [jobs]
  );

  const handleContinueJob = (job: DebriefJob) => {
    setSelectedJob(job);
    setWorkspaceOpen(true);
  };

  const handleJobUpdated = (updatedJob: DebriefJob) => {
    // If job was completed, remove it from active My Work queue
    if (updatedJob.jobStatus === "Completed") {
      setJobs((prev) => prev.filter((j) => j.id !== updatedJob.id));
    } else {
      setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
    }
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader
        eyebrow="Debrief Module"
        title="My Work"
        subtitle="Your active service assignments requiring action or currently on hold."
        icon={Wrench}
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setFilterState("all")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border",
            filterState === "all"
              ? "bg-primary text-primary-foreground border-primary shadow-xs"
              : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
          )}
        >
          All Active ({jobs.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterState("in_progress")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5",
            filterState === "in_progress"
              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
              : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
          )}
        >
          <Play className="size-3" />
          <span>In Progress ({inProgressCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterState("on_hold")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5",
            filterState === "on_hold"
              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
              : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
          )}
        >
          <AlertTriangle className="size-3" />
          <span>On Hold ({onHoldCount})</span>
        </button>
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-muted-foreground">
          Loading your active work queue...
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center space-y-2 bg-muted/10">
          <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No Active Jobs in Queue</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {filterState === "all"
              ? "You have no active service jobs assigned to you at this moment."
              : `You have no jobs currently ${filterState === "in_progress" ? "in progress" : "on hold"}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredJobs.map((job) => {
            const isOnHold = job.jobStatus === "On Hold";
            const isDown = job.equipmentStatus === "Down";

            return (
              <div
                key={job.id}
                className={cn(
                  "rounded-xl border bg-card p-4 sm:p-5 shadow-2xs space-y-3 transition-all hover:border-primary/50",
                  isOnHold ? "border-amber-500/30 bg-amber-500/[0.02]" : "border-border"
                )}
              >
                {/* Header Line */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-border/60">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-primary">
                        {job.jobNumber}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="font-bold text-foreground text-xs sm:text-sm">
                        {job.model}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({job.oem})
                      </span>

                      {/* Status Badges */}
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border ml-1",
                          isOnHold
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        )}
                      >
                        {isOnHold ? `On Hold: ${job.holdReason || "Awaiting Part"}` : "In Progress"}
                      </span>

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
                        Equip: {job.equipmentStatus}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
                      <span className="font-mono font-medium text-foreground">
                        Asset: {job.assetNumber}
                      </span>
                      <span>•</span>
                      <span>Modality: {job.modality}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Building2 className="size-3" />
                        {job.location || "Main Ward"}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleContinueJob(job)}
                    className="h-8 px-4 text-xs font-bold gap-1.5 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs shrink-0"
                  >
                    <span>Continue Job</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>

                {/* Body Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <span className="text-muted-foreground font-medium block">Job Type:</span>
                    <span className="font-semibold text-foreground">{job.jobType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block">Assigned / Start:</span>
                    <span className="font-mono text-foreground">{job.jobStartDate || job.startDate || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block">Priority:</span>
                    <span className={cn("font-bold", job.jobPriority === "High" ? "text-rose-600" : "text-amber-600")}>
                      {job.jobPriority} Priority
                    </span>
                  </div>
                </div>

                {/* Reported Issue / Hold Notice */}
                {isOnHold ? (
                  <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs flex items-center gap-2">
                    <AlertTriangle className="size-3.5 text-amber-600 shrink-0" />
                    <span className="text-amber-900 dark:text-amber-200">
                      <strong>Job On Hold:</strong> {job.holdReason || "Awaiting Part"}. Resume work and record parts/labour when ready.
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-md bg-muted/30 border border-border/60 text-xs text-foreground">
                    <strong className="text-muted-foreground">Reported Issue: </strong>
                    {job.reportedIssue || "Diagnostic service check required."}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Individual Job Workspace Modal (6 Tabs) */}
      <JobWorkspaceModal
        job={selectedJob}
        open={workspaceOpen}
        onOpenChange={setWorkspaceOpen}
        onJobUpdated={handleJobUpdated}
      />
    </div>
  );
}
