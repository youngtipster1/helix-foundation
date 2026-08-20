import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { TrainingAssignment } from "../types";
import {
  FileText,
  CheckCircle2,
  ShieldCheck,
  Download,
  Calendar,
  User,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface ReadAcknowledgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: TrainingAssignment | null;
  isAdmin?: boolean;
  onAcknowledge: (id: string, notes?: string) => void;
}

export function ReadAcknowledgeModal({
  open,
  onOpenChange,
  assignment,
  isAdmin = false,
  onAcknowledge,
}: ReadAcknowledgeModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!assignment) return null;

  const isCompleted = assignment.trainingStatus === "Completed";
  const isReadOnly = isAdmin || isCompleted;

  const handleDownload = () => {
    const docContent = `HEMP CLINICAL ENGINEERING HEALTHCARE SYSTEM
QUALITY ASSURANCE & POLICY DIRECTIVE

Title: ${assignment.policyDocumentTitle}
Policy Code: ${assignment.policyDocumentNumber || "POL-BME-001"}
Version: ${assignment.documentVersion}
Assigned Date: ${assignment.assignedDate}
Due Date: ${assignment.dueDate || "N/A"}
Assigned By: ${assignment.assignedByName}
Assigned To: ${assignment.assignedToName}

--------------------------------------------------------------------------------
1. PURPOSE & CLINICAL OBJECTIVE:
The purpose of this standard operating procedure is to establish strict, standardized
metrological and electrical safety protocols for all clinical engineering personnel.
Compliance with this directive is mandatory under ISO 13485 and IEC 62353 standards.

2. MANDATORY SAFETY & COMPLIANCE PROTOCOLS:
- Ground wire resistance must be <= 0.10 ohms.
- Chassis touch leakage must remain below 100 uA in normal condition.
- Test analyzers used for verification must possess valid, active NIST calibration certificates.
- Any failed equipment must be immediately tagged with a RESTRICTED tag and quarantined.

3. SCOPE OF APPLICATION:
${assignment.summaryOrScope || "Applies to all surgical suites, intensive care units, and clinical engineering service depots."}
--------------------------------------------------------------------------------
HEMP Healthcare Engineering Management Portal • Confidential
`;

    const blob = new Blob([docContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${assignment.policyDocumentNumber || "Policy_Document"}_${assignment.documentVersion}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded "${assignment.policyDocumentTitle}" for reading.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) return;

    setSubmitting(true);
    onAcknowledge(assignment.id, notes);
    setSubmitting(false);
    setConfirmed(false);
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
            <DialogTitle>
              {isReadOnly ? "Policy Training Record" : "Acknowledge Policy Training"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isReadOnly
              ? "View policy details, completion record, and training history."
              : "Download and review the policy document, then sign off your electronic acknowledgment below."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Policy Document File Card */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-foreground leading-snug">
                    {assignment.policyDocumentTitle}
                  </h3>
                  <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                    {assignment.policyDocumentNumber || "POL-BME-001"} &bull; Rev {assignment.documentVersion}
                  </p>
                </div>
              </div>
            </div>

            {/* Metadata Badges */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="size-3.5 text-primary shrink-0" />
                <span>Assigned: <strong className="text-foreground font-mono">{assignment.assignedDate}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-3.5 text-primary shrink-0" />
                <span>Due Date: <strong className="text-foreground font-mono">{assignment.dueDate || "N/A"}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                <User className="size-3.5 text-primary shrink-0" />
                <span>Assigned By: <strong className="text-foreground">{assignment.assignedByName}</strong></span>
              </div>
            </div>

            {/* Scope / Instructions */}
            {assignment.summaryOrScope && (
              <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/50">
                {assignment.summaryOrScope}
              </p>
            )}

            {/* Download Document Button */}
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="w-full h-9 text-xs gap-2 border-primary/30 text-primary hover:bg-primary/5 cursor-pointer font-semibold"
              >
                <Download className="size-4" />
                <span>Download Policy Document (PDF / File)</span>
              </Button>
            </div>
          </div>

          {/* If already completed: show confirmation badge */}
          {isCompleted && (
            <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Policy Document Training Completed</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                Completion Timestamp: {assignment.acknowledgedAt || assignment.completionDate}
              </p>
              {assignment.acknowledgementNotes && (
                <p className="text-xs text-foreground mt-1">
                  Note: "{assignment.acknowledgementNotes}"
                </p>
              )}
            </div>
          )}

          {/* Active Acknowledgment Sign-Off Form (Only for User in Pending state) */}
          {!isReadOnly && (
            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
              <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 rounded text-primary focus:ring-primary size-4 cursor-pointer"
                    id="acknowledge-checkbox"
                  />
                  <span className="text-xs text-foreground font-medium leading-normal select-none">
                    I confirm that I have downloaded, read, and understood this policy document, and agree to adhere strictly to all guidelines and standard operating procedures.
                  </span>
                </label>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  Comments / Notes (Optional)
                </Label>
                <Textarea
                  placeholder="e.g. Downloaded and reviewed procedures."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={!confirmed || submitting}
                  className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 cursor-pointer"
                >
                  <CheckCircle2 className="size-4" />
                  <span>Acknowledge & Complete Training</span>
                </Button>
              </DialogFooter>
            </form>
          )}

          {/* Admin Read-Only Footer */}
          {isAdmin && !isCompleted && (
            <DialogFooter className="pt-2">
              <span className="text-xs text-muted-foreground mr-auto self-center">
                Awaiting technician signature &bull; Assigned to {assignment.assignedToName}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                Close
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
