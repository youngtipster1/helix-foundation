import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DebriefJob } from "../types";
import {
  Stethoscope,
  User,
  Wrench,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JobDetailsModalProps {
  job: DebriefJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
}

export function JobDetailsModal({
  job,
  open,
  onOpenChange,
  isAdmin = false,
}: JobDetailsModalProps) {
  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b border-border bg-card/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Wrench className="size-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-foreground font-mono">
                    {job.jobNumber}
                  </DialogTitle>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border",
                      job.equipmentStatus === "UP"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : job.equipmentStatus === "Partially UP"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    )}
                  >
                    Status: {job.equipmentStatus}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold",
                      job.jobPriority === "High"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : job.jobPriority === "Mid"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    )}
                  >
                    Priority: {job.jobPriority}
                  </span>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  {job.jobType} — {job.assetNumber} ({job.model})
                </DialogDescription>
              </div>
            </div>

            <span className="text-xs font-mono text-muted-foreground">
              Opened: {job.jobOpenDate}
            </span>
          </div>
        </DialogHeader>

        {/* Content Body — Full-Width Horizontal Cards */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Card 1: Horizontal Equipment & Asset Card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3.5 shadow-2xs">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-2 pb-2.5 border-b border-border/60 uppercase tracking-wider">
              <Stethoscope className="size-4 text-primary" />
              Equipment & Asset Information
            </h4>
            <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 text-xs">
              <div>
                <dt className="text-xs font-bold uppercase text-muted-foreground">Asset No</dt>
                <dd className="font-mono font-bold text-primary mt-0.5">{job.assetNumber}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-muted-foreground">Modality</dt>
                <dd className="font-medium text-foreground mt-0.5">{job.modality}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-muted-foreground">OEM</dt>
                <dd className="text-foreground mt-0.5">{job.oem}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-muted-foreground">Model</dt>
                <dd className="font-semibold text-foreground mt-0.5">{job.model}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-muted-foreground">Serial Number</dt>
                <dd className="font-mono text-muted-foreground mt-0.5">{job.serialNumber}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-muted-foreground">Year of Mfg</dt>
                <dd className="text-foreground mt-0.5">{job.yearOfManufacture}</dd>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <dt className="text-xs font-bold uppercase text-muted-foreground">Location & Facility</dt>
                <dd className="text-foreground mt-0.5">{job.location || "—"} ({job.address || "—"})</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-muted-foreground">Warranty Period</dt>
                <dd className="text-foreground mt-0.5">{job.warrantyStartDate || "—"} to {job.warrantyEndDate || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-muted-foreground">Contract Type</dt>
                <dd className="text-foreground mt-0.5">{job.contractType || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-muted-foreground">Contract End</dt>
                <dd className="font-mono text-muted-foreground mt-0.5">{job.contractEndDate || "—"}</dd>
              </div>
            </dl>
          </div>

          {/* Card 2: Horizontal Service Assignment & Labor Card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3.5 shadow-2xs">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-2 pb-2.5 border-b border-border/60 uppercase tracking-wider">
              <User className="size-4 text-primary" />
              Service Assignment & Labor
            </h4>
            <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 text-xs">
              <div>
                <dt className="text-xs font-bold uppercase text-muted-foreground">Primary Engineer</dt>
                <dd className="font-bold text-foreground mt-0.5">{job.assignedToName}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-muted-foreground">Assisted By</dt>
                <dd className="text-muted-foreground mt-0.5">{job.assistedBy || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-primary">Assigned / Start Date</dt>
                <dd className="font-semibold text-primary font-mono mt-0.5">{job.jobStartDate || job.startDate || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-foreground">Completion / End Date</dt>
                <dd className="font-mono text-foreground mt-0.5">{job.endDate || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-muted-foreground">Site Contact</dt>
                <dd className="text-foreground truncate mt-0.5">
                  {job.contactName ? `${job.contactName} (${job.contactEmail || "No email"})` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-muted-foreground">Root Cause</dt>
                <dd className="font-medium text-foreground mt-0.5">{job.rootCause || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase text-muted-foreground">Resolution</dt>
                <dd className="font-medium text-foreground mt-0.5">{job.resolution || "—"}</dd>
              </div>
            </dl>
          </div>

          {/* Card 3: Horizontal Reported Issue Card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 shadow-2xs">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
              <FileText className="size-4 text-primary" />
              Reported Issue & Complaint
            </h4>
            <p className="text-xs text-foreground leading-relaxed bg-muted/30 p-3.5 rounded-lg border border-border/60">
              {job.reportedIssue || "No complaint notes logged."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card/60 flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-9 cursor-pointer px-5"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
