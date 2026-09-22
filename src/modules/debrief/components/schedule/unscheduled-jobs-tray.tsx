import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  X,
  GripVertical,
  Inbox,
  AlertCircle,
  Clock,
  Wrench,
} from "lucide-react";
import type { DebriefJob } from "../../types";
import { getJobTypeStyle, type DragJobPayload } from "./schedule-types";
import { cn } from "@/lib/utils";

interface UnscheduledJobsTrayProps {
  jobs: DebriefJob[];
  open: boolean;
  onClose: () => void;
  onSelectJob: (job: DebriefJob) => void;
}

export function UnscheduledJobsTray({
  jobs,
  open,
  onClose,
  onSelectJob,
}: UnscheduledJobsTrayProps) {
  const [search, setSearch] = useState("");

  const filteredJobs = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(
      (j) =>
        j.jobNumber.toLowerCase().includes(q) ||
        j.model.toLowerCase().includes(q) ||
        j.jobType.toLowerCase().includes(q) ||
        j.modality.toLowerCase().includes(q) ||
        j.oem.toLowerCase().includes(q)
    );
  }, [jobs, search]);

  const handleDragStart = (e: React.DragEvent, job: DebriefJob) => {
    const payload: DragJobPayload = {
      jobId: job.id,
      sourceEngineerId: job.assignedToId,
      sourceDate: job.jobStartDate || job.startDate,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  };

  if (!open) return null;

  return (
    <div className="w-80 sm:w-90 shrink-0 rounded-2xl border border-border bg-card shadow-lg flex flex-col h-[calc(100vh-14rem)] min-h-[500px] overflow-hidden animate-in slide-in-from-right-4 duration-200">
      {/* Tray Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Inbox className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Unscheduled Queue</h3>
            <p className="text-[11px] text-muted-foreground">
              {filteredJobs.length} job{filteredJobs.length === 1 ? "" : "s"} ready to dispatch
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-border/60">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search queue..."
            className="h-8 pl-8 text-xs bg-muted/20"
          />
        </div>
      </div>

      {/* Draggable Job Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredJobs.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <AlertCircle className="size-6 text-muted-foreground mx-auto opacity-60" />
            <p className="text-xs text-muted-foreground">
              {search ? "No matching jobs found" : "No unscheduled jobs in backlog"}
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const style = getJobTypeStyle(job.jobType);

            return (
              <div
                key={job.id}
                draggable
                onDragStart={(e) => handleDragStart(e, job)}
                onClick={() => onSelectJob(job)}
                className="p-3 rounded-xl border border-border bg-card/80 hover:bg-card hover:border-primary/50 shadow-2xs hover:shadow-xs transition-all cursor-grab active:cursor-grabbing space-y-2 group select-none"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <GripVertical className="size-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    <span className="font-mono font-bold text-xs text-primary">
                      {job.jobNumber}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-semibold border",
                      style.badgeClass
                    )}
                  >
                    {job.jobType}
                  </span>
                </div>

                <div>
                  <h5 className="font-bold text-xs text-foreground leading-snug line-clamp-1">
                    {job.model}
                  </h5>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {job.modality} · {job.oem}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
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
                  <span className="text-muted-foreground font-mono text-[10px]">
                    Drag to slot →
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Instructions */}
      <div className="p-2.5 border-t border-border/80 bg-muted/20 text-[11px] text-muted-foreground text-center">
        💡 Drag any card onto the calendar to schedule
      </div>
    </div>
  );
}
