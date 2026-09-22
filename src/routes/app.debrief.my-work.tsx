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
  Building2,
  Clock,
  Sparkles,
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
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<DebriefJob[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleOpenWorkspace = (job: DebriefJob) => {
    navigate({
      to: "/app/debrief/workspace/$jobId",
      params: { jobId: job.id },
    });
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

      {/* Queue Grid (2-3 columns on desktop, 1 column on mobile) */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => {
            const isOnHold = job.jobStatus === "On Hold";
            const isOpen = job.jobStatus === "Open";

            return (
              <div
                key={job.id}
                className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4 transition-colors hover:border-primary/50"
              >
                {/* Header: Job Number & Status Badge */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-sm text-primary">
                      {job.jobNumber}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border",
                        isOnHold
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : isOpen
                          ? "bg-muted text-muted-foreground border-border"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                      )}
                    >
                      {isOnHold
                        ? `On Hold · ${job.holdReason || "Awaiting Part"}`
                        : isOpen
                        ? "Open"
                        : "In Progress"}
                    </span>
                  </div>

                  {/* Equipment & Modality */}
                  <div>
                    <h4 className="font-bold text-foreground text-sm leading-snug">
                      {job.model}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {job.modality} · {job.oem}
                    </span>
                  </div>

                  {/* Asset & Location */}
                  <div className="pt-2 border-t border-border/50 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Asset:</span>
                      <span className="font-mono font-semibold text-foreground">
                        {job.assetNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Location:</span>
                      <span className="font-medium text-foreground truncate max-w-[180px]">
                        {job.location || "Main Ward"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Priority:</span>
                      <span
                        className={cn(
                          "font-bold",
                          job.jobPriority === "High"
                            ? "text-rose-600"
                            : "text-amber-600"
                        )}
                      >
                        {job.jobPriority} Priority
                      </span>
                    </div>
                  </div>

                  {/* Status Note */}
                  <div className="pt-2">
                    {isOnHold ? (
                      <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                        <AlertTriangle className="size-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">
                          Reason: {job.holdReason || "Awaiting Part"}
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-md bg-muted/30 border border-border/60 text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="size-3.5 text-primary shrink-0" />
                        <span className="truncate">
                          {job.labour?.labourStartTime
                            ? `Labour active (Started ${job.labour.labourStartTime})`
                            : job.labour?.travelStartTime
                            ? `Dispatched (Travel ${job.labour.travelStartTime})`
                            : "Ready for service dispatch"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleOpenWorkspace(job)}
                    className="w-full h-8.5 text-xs font-bold gap-1.5 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                  >
                    <span>
                      {isOnHold ? "Resume Job" : isOpen ? "Start Job" : "Continue Work"}
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
