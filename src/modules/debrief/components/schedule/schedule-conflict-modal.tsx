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
import {
  AlertTriangle,
  Calendar,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { SchedulingConflict } from "./schedule-types";
import type { Personnel } from "@/modules/settings/types";
import { scheduleService } from "../../services/schedule-service";
import { getJobTypeStyle } from "./schedule-types";
import { cn } from "@/lib/utils";

interface ScheduleConflictModalProps {
  conflict: SchedulingConflict | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmOverride: (conflict: SchedulingConflict) => void;
  onReassign: (
    conflict: SchedulingConflict,
    newEngineerId: string,
    newEngineerName: string
  ) => void;
  onRescheduleDate: (conflict: SchedulingConflict, newDate: string) => void;
}

export function ScheduleConflictModal({
  conflict,
  open,
  onOpenChange,
  onConfirmOverride,
  onReassign,
  onRescheduleDate,
}: ScheduleConflictModalProps) {
  const [engineers, setEngineers] = useState<Personnel[]>([]);
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>("");
  const [alternativeDate, setAlternativeDate] = useState<string>("");
  const [actionChoice, setActionChoice] = useState<"reassign" | "date" | "override">("reassign");

  useEffect(() => {
    if (open && conflict) {
      setAlternativeDate(conflict.targetDate);
      scheduleService.getBiomedicalEngineers().then((list) => {
        setEngineers(list);
        const firstAvailable = list.find((e) => e.id !== conflict.engineerId);
        if (firstAvailable) {
          setSelectedEngineerId(firstAvailable.id);
        }
      });
    }
  }, [open, conflict]);

  if (!conflict) return null;

  const jobTypeStyle = getJobTypeStyle(conflict.job.jobType);

  const handleApplyResolution = () => {
    if (actionChoice === "reassign") {
      const engineer = engineers.find((e) => e.id === selectedEngineerId);
      const name = engineer ? `${engineer.firstName} ${engineer.lastName}` : "Assigned Engineer";
      onReassign(conflict, selectedEngineerId, name);
    } else if (actionChoice === "date") {
      if (alternativeDate) {
        onRescheduleDate(conflict, alternativeDate);
      }
    } else if (actionChoice === "override") {
      onConfirmOverride(conflict);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader className="space-y-2 border-b border-border pb-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Scheduling Conflict Warning
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                This scheduling move conflicts with existing workforce commitments.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Target Job Summary */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-primary">{conflict.job.jobNumber}</span>
              <span className={cn("px-2 py-0.5 rounded text-[11px] font-semibold border", jobTypeStyle.badgeClass)}>
                {conflict.job.jobType}
              </span>
            </div>
            <div className="text-foreground font-semibold">{conflict.job.model} · {conflict.job.assetNumber}</div>
            <div className="text-muted-foreground">Target Date: <span className="font-mono font-semibold text-foreground">{conflict.targetDate}</span> · Target Engineer: <span className="font-semibold text-foreground">{conflict.engineerName}</span></div>
          </div>

          {/* Identified Conflict Alert Card */}
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700 dark:text-rose-300">
              <ShieldAlert className="size-4 shrink-0" />
              <span>{conflict.title}</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90 pl-5.5">
              {conflict.description}
            </p>
          </div>

          {/* Conflict Resolution Choices */}
          <div className="space-y-3 pt-1">
            <Label className="text-xs font-bold text-foreground">Select Resolution Method:</Label>

            {/* Option 1: Reassign to alternative available engineer */}
            <div
              onClick={() => setActionChoice("reassign")}
              className={cn(
                "p-3 rounded-lg border transition-all cursor-pointer space-y-2",
                actionChoice === "reassign"
                  ? "bg-primary/5 border-primary shadow-2xs"
                  : "bg-card border-border hover:bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="action-reassign"
                  name="conflict-action"
                  checked={actionChoice === "reassign"}
                  onChange={() => setActionChoice("reassign")}
                  className="size-3.5 text-primary cursor-pointer"
                />
                <label htmlFor="action-reassign" className="font-bold text-xs text-foreground cursor-pointer flex items-center gap-1.5">
                  <UserCheck className="size-3.5 text-primary" />
                  Reassign to another available engineer on {conflict.targetDate}
                </label>
              </div>

              {actionChoice === "reassign" && (
                <div className="pl-5.5 pt-1">
                  <Select value={selectedEngineerId} onValueChange={setSelectedEngineerId}>
                    <SelectTrigger className="h-8.5 text-xs bg-background">
                      <SelectValue placeholder="Select available engineer" />
                    </SelectTrigger>
                    <SelectContent>
                      {engineers
                        .filter((e) => e.id !== conflict.engineerId)
                        .map((eng) => (
                          <SelectItem key={eng.id} value={eng.id} className="text-xs">
                            {eng.firstName} {eng.lastName} ({eng.jobTitle})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Option 2: Reschedule to alternative date */}
            <div
              onClick={() => setActionChoice("date")}
              className={cn(
                "p-3 rounded-lg border transition-all cursor-pointer space-y-2",
                actionChoice === "date"
                  ? "bg-primary/5 border-primary shadow-2xs"
                  : "bg-card border-border hover:bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="action-date"
                  name="conflict-action"
                  checked={actionChoice === "date"}
                  onChange={() => setActionChoice("date")}
                  className="size-3.5 text-primary cursor-pointer"
                />
                <label htmlFor="action-date" className="font-bold text-xs text-foreground cursor-pointer flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" />
                  Move {conflict.engineerName}&apos;s assignment to an alternate date
                </label>
              </div>

              {actionChoice === "date" && (
                <div className="pl-5.5 pt-1">
                  <Input
                    type="date"
                    value={alternativeDate}
                    onChange={(e) => setAlternativeDate(e.target.value)}
                    className="h-8.5 text-xs bg-background"
                  />
                </div>
              )}
            </div>

            {/* Option 3: Admin Override */}
            <div
              onClick={() => setActionChoice("override")}
              className={cn(
                "p-3 rounded-lg border transition-all cursor-pointer space-y-1",
                actionChoice === "override"
                  ? "bg-amber-500/10 border-amber-500/60 shadow-2xs"
                  : "bg-card border-border hover:bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="action-override"
                  name="conflict-action"
                  checked={actionChoice === "override"}
                  onChange={() => setActionChoice("override")}
                  className="size-3.5 text-amber-600 cursor-pointer"
                />
                <label htmlFor="action-override" className="font-bold text-xs text-foreground cursor-pointer flex items-center gap-1.5">
                  <ShieldAlert className="size-3.5 text-amber-600" />
                  Admin Override: Schedule anyway (double-book / overlap allowed)
                </label>
              </div>
              <p className="pl-5.5 text-[11px] text-muted-foreground">
                Forces job onto schedule despite workforce training or overlapping booking.
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
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApplyResolution}
            className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            <span>Confirm &amp; Apply Schedule</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
