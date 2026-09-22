import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { debriefService } from "../services/debrief-service";
import type { DebriefJob, JobPriority } from "../types";
import { toast } from "sonner";
import { Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RescheduleJobModalProps {
  job: DebriefJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobUpdated?: (job: DebriefJob) => void;
}

const JOB_PRIORITIES: JobPriority[] = ["High", "Mid", "Low"];

export function RescheduleJobModal({
  job,
  open,
  onOpenChange,
  onJobUpdated,
}: RescheduleJobModalProps) {
  const [jobStartDate, setJobStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [jobPriority, setJobPriority] = useState<JobPriority>("High");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (job && open) {
      setJobStartDate(job.jobStartDate || job.startDate || "");
      setEndDate(job.endDate && job.endDate !== "—" ? job.endDate : "");
      setJobPriority(job.jobPriority || "Mid");
      setReason("");
      setErrors({});
    }
  }, [job, open]);

  if (!job) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobStartDate.trim()) {
      setErrors({ jobStartDate: "New start date is required." });
      return;
    }

    setSubmitting(true);
    try {
      const updates: Partial<DebriefJob> = {
        jobStartDate,
        startDate: jobStartDate,
        endDate: endDate.trim() || "—",
        jobPriority,
      };

      const updated = await debriefService.update(job.id, updates);
      if (updated) {
        toast.success(`Job ${job.jobNumber} rescheduled to ${jobStartDate}`);
        onJobUpdated?.(updated);
        onOpenChange(false);
      } else {
        toast.error("Failed to reschedule job.");
      }
    } catch (err) {
      console.error("Reschedule job error:", err);
      toast.error("An error occurred while rescheduling the job.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <Calendar className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Reschedule Job
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-mono">
                {job.jobNumber} • {job.assetNumber} ({job.model})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4">
          <div className="rounded-md border border-border bg-muted/20 p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Assigned Engineer:</span>
              <span className="font-semibold text-foreground">{job.assignedToName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Current Schedule:</span>
              <span className="font-mono text-foreground">{job.jobStartDate || "Not scheduled"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Facility / Location:</span>
              <span className="text-foreground truncate max-w-[200px]">{job.location}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="jobStartDate" className="text-xs font-semibold text-primary">
                New Start Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="jobStartDate"
                type="date"
                value={jobStartDate}
                onChange={(e) => {
                  setJobStartDate(e.target.value);
                  if (errors.jobStartDate) setErrors({});
                }}
                className={cn("h-9 text-xs font-mono", errors.jobStartDate && "border-destructive")}
              />
              {errors.jobStartDate && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="size-3" /> {errors.jobStartDate}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-xs font-semibold">
                Estimated End Date (Optional)
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="jobPriority" className="text-xs font-semibold">
                Job Priority
              </Label>
              <Select
                value={jobPriority}
                onValueChange={(val) => setJobPriority(val as JobPriority)}
              >
                <SelectTrigger id="jobPriority" className="h-9 text-xs">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      {p} Priority
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="rescheduleReason" className="text-xs font-semibold">
                Reason / Scheduling Notes (Optional)
              </Label>
              <Textarea
                id="rescheduleReason"
                rows={2}
                placeholder="e.g. Customer requested date change, awaiting replacement parts..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="text-xs h-9 font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer shadow-sm px-4"
            >
              <CheckCircle2 className="size-4" />
              <span>{submitting ? "Saving..." : "Save Reschedule"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
