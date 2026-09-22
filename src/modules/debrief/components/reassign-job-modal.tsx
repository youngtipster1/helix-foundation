import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { personnelService } from "@/modules/settings/services/personnel-service";
import { debriefService } from "../services/debrief-service";
import type { DebriefJob } from "../types";
import type { Personnel } from "@/modules/settings/types";
import { toast } from "sonner";
import { UserCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReassignJobModalProps {
  job: DebriefJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobUpdated?: (job: DebriefJob) => void;
}

export function ReassignJobModal({
  job,
  open,
  onOpenChange,
  onJobUpdated,
}: ReassignJobModalProps) {
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [assignedToId, setAssignedToId] = useState("");
  const [assistantEngineerId, setAssistantEngineerId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      personnelService
        .list()
        .then((list) => {
          setPersonnelList(list.filter((p) => p.status === "active"));
        })
        .catch((err) => console.error("Error loading personnel:", err));
    }
  }, [open]);

  useEffect(() => {
    if (job && open) {
      setAssignedToId(job.assignedToId || "");
      const firstAssistant = job.assistedByIds?.[0] || "";
      setAssistantEngineerId(firstAssistant || "none");
      setReason("");
      setErrors({});
    }
  }, [job, open]);

  if (!job) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedToId) {
      setErrors({ assignedToId: "Please select a primary engineer." });
      return;
    }

    setSubmitting(true);
    try {
      const primaryEngineer = personnelList.find((p) => p.id === assignedToId);
      const assistantEngineer =
        assistantEngineerId && assistantEngineerId !== "none"
          ? personnelList.find((p) => p.id === assistantEngineerId)
          : null;

      const primaryName = primaryEngineer
        ? `${primaryEngineer.firstName} ${primaryEngineer.lastName}`
        : job.assignedToName;

      const assistantNames = assistantEngineer
        ? [`${assistantEngineer.firstName} ${assistantEngineer.lastName}`]
        : [];

      const updates: Partial<DebriefJob> = {
        assignedToId,
        assignedToName: primaryName,
        assistedByIds: assistantEngineer ? [assistantEngineer.id] : [],
        assistedByNames: assistantNames,
        assistedBy: assistantNames.length > 0 ? assistantNames.join(", ") : "—",
      };

      const updated = await debriefService.update(job.id, updates);
      if (updated) {
        toast.success(`Job ${job.jobNumber} reassigned to ${primaryName}`);
        onJobUpdated?.(updated);
        onOpenChange(false);
      } else {
        toast.error("Failed to reassign job.");
      }
    } catch (err) {
      console.error("Reassign job error:", err);
      toast.error("An error occurred while reassigning the job.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <UserCheck className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Reassign Service Job
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-mono">
                {job.jobNumber} • {job.assetNumber} ({job.model})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="rounded-md border border-border bg-muted/20 p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Currently Assigned:</span>
              <span className="font-semibold text-foreground">{job.assignedToName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Currently Assisted By:</span>
              <span className="text-foreground">{job.assistedBy || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Facility / Location:</span>
              <span className="text-foreground truncate max-w-[200px]">{job.location}</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Primary Engineer */}
            <div className="space-y-1">
              <Label htmlFor="primaryEngineer" className="text-xs font-semibold text-primary">
                New Primary Engineer <span className="text-destructive">*</span>
              </Label>
              <Select
                value={assignedToId}
                onValueChange={(val) => {
                  setAssignedToId(val);
                  if (errors.assignedToId) setErrors({});
                }}
              >
                <SelectTrigger
                  id="primaryEngineer"
                  className={cn("h-9 text-xs", errors.assignedToId && "border-destructive")}
                >
                  <SelectValue placeholder="Select Primary Engineer" />
                </SelectTrigger>
                <SelectContent>
                  {personnelList.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.firstName} {p.lastName} — {p.jobTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assignedToId && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="size-3" /> {errors.assignedToId}
                </p>
              )}
            </div>

            {/* Assistant Engineer */}
            <div className="space-y-1">
              <Label htmlFor="assistantEngineer" className="text-xs font-semibold">
                Assistant Engineer (Optional)
              </Label>
              <Select
                value={assistantEngineerId}
                onValueChange={setAssistantEngineerId}
              >
                <SelectTrigger id="assistantEngineer" className="h-9 text-xs">
                  <SelectValue placeholder="None (Single Engineer)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs text-muted-foreground">
                    None (Single Engineer)
                  </SelectItem>
                  {personnelList
                    .filter((p) => p.id !== assignedToId)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.firstName} {p.lastName} — {p.jobTitle}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reassignment Reason */}
            <div className="space-y-1">
              <Label htmlFor="reassignReason" className="text-xs font-semibold">
                Reassignment Reason (Optional)
              </Label>
              <Textarea
                id="reassignReason"
                rows={2}
                placeholder="e.g. Workload balancing, specialized modality expertise required..."
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
              <span>{submitting ? "Saving..." : "Confirm Reassignment"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
