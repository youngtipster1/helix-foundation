import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import {
  Wrench,
  Calendar,
  User,
  MapPin,
  Clock,
  ArrowRight,
  ShieldAlert,
  Edit2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import type { DebriefJob } from "../../types";
import type { Personnel } from "@/modules/settings/types";
import { getJobTypeStyle } from "./schedule-types";
import { scheduleService } from "../../services/schedule-service";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ScheduleDetailDrawerProps {
  job: DebriefJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  onJobUpdated: (updatedJob: DebriefJob) => void;
  onRequestScheduleMove?: (job: DebriefJob, targetEngineerId: string, targetEngineerName: string, targetDate: string) => void;
}

export function ScheduleDetailDrawer({
  job,
  open,
  onOpenChange,
  isAdmin,
  onJobUpdated,
  onRequestScheduleMove,
}: ScheduleDetailDrawerProps) {
  const navigate = useNavigate();
  const [engineers, setEngineers] = useState<Personnel[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editEngineerId, setEditEngineerId] = useState("");

  useEffect(() => {
    if (job && open) {
      setEditDate(job.jobStartDate || job.startDate || "");
      setEditEngineerId(job.assignedToId || "");
      setIsEditing(false);
      scheduleService.getBiomedicalEngineers().then(setEngineers);
    }
  }, [job, open]);

  if (!job) return null;

  const jobTypeStyle = getJobTypeStyle(job.jobType);

  const handleSaveQuickEdit = async () => {
    if (!editDate || !editEngineerId) {
      toast.error("Please provide both a scheduled date and assigned engineer.");
      return;
    }

    const selectedEng = engineers.find((e) => e.id === editEngineerId);
    const engName = selectedEng ? `${selectedEng.firstName} ${selectedEng.lastName}` : job.assignedToName;

    // Check conflict
    const conflict = await scheduleService.checkConflict(job, editEngineerId, engName, editDate);
    if (conflict.hasConflict && onRequestScheduleMove) {
      onOpenChange(false);
      onRequestScheduleMove(job, editEngineerId, engName, editDate);
      return;
    }

    try {
      const updated = await scheduleService.reassignJob(job.id, editEngineerId, engName, editDate);
      if (updated) {
        toast.success(`Schedule updated for ${job.jobNumber}`);
        onJobUpdated(updated);
        setIsEditing(false);
        onOpenChange(false);
      }
    } catch {
      toast.error("Failed to update schedule");
    }
  };

  const handleGoToWorkspace = () => {
    onOpenChange(false);
    navigate({
      to: "/app/debrief/workspace/$jobId",
      params: { jobId: job.id },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-xl">
        <DialogHeader className="space-y-2 border-b border-border pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base text-primary">
                {job.jobNumber}
              </span>
              <span className={cn("px-2 py-0.5 rounded text-xs font-semibold border", jobTypeStyle.badgeClass)}>
                {job.jobType}
              </span>
            </div>
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-bold border",
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
          <DialogTitle className="text-base font-bold text-foreground">
            {job.model} · {job.oem}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Asset #{job.assetNumber} · Modality: {job.modality}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Schedule & Assignment Section */}
          <div className="p-3.5 rounded-xl bg-muted/25 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                Schedule &amp; Assignment
              </span>
              {isAdmin && !isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-7 px-2 text-xs font-semibold text-primary hover:bg-primary/10 gap-1 cursor-pointer"
                >
                  <Edit2 className="size-3" />
                  <span>Adjust Schedule</span>
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3 pt-1 border-t border-border/60">
                <div className="space-y-1">
                  <Label htmlFor="sched-date" className="text-xs font-medium">Scheduled Start Date</Label>
                  <Input
                    id="sched-date"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="h-8.5 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sched-eng" className="text-xs font-medium">Assigned Biomedical Engineer</Label>
                  <Select value={editEngineerId} onValueChange={setEditEngineerId}>
                    <SelectTrigger id="sched-eng" className="h-8.5 text-xs bg-background">
                      <SelectValue placeholder="Select engineer" />
                    </SelectTrigger>
                    <SelectContent>
                      {engineers.map((eng) => (
                        <SelectItem key={eng.id} value={eng.id} className="text-xs">
                          {eng.firstName} {eng.lastName} ({eng.jobTitle})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={handleSaveQuickEdit}
                    className="h-8 px-3 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="h-8 px-3 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Scheduled Start:</span>
                  <span className="font-mono font-bold text-foreground">
                    {job.jobStartDate || job.startDate || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Assigned Engineer:</span>
                  <span className="font-bold text-foreground">
                    {job.assignedToName || "Unassigned"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Priority:</span>
                  <span className="font-bold text-foreground">{job.jobPriority} Priority</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Assisted By:</span>
                  <span className="text-foreground">{job.assistedBy || "—"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Location & Reported Issue Details */}
          <div className="space-y-2">
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/60">
              <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">{job.location || "Facility Ward"}</span>
                <p className="text-[11px] text-muted-foreground">{job.address || "Main Medical Complex"}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/20 border border-border/60 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Reported Issue
              </span>
              <p className="text-foreground leading-relaxed">
                {job.reportedIssue || "Standard diagnostic service inspection required."}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold cursor-pointer"
          >
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleGoToWorkspace}
            className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            <span>Open Job Workspace</span>
            <ExternalLink className="size-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
