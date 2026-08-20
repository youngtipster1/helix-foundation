import React from "react";
import {
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ClipboardCheck,
  Building2,
  Layers,
  Cpu,
  PlusCircle,
  Check,
  X,
  Minus,
  FileCheck,
  Edit2,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import type { EquipmentChecklist, ChecklistItem, PolicyDocument } from "@/modules/quality/types";

export interface ChecklistDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any | null; // checklist or item with rawChecklist/rawDocument
  approveLabel?: string; // e.g. "Approve" or "Sign Off & Approve"
  onDirectApprove?: () => void;
  onReject?: () => void;
  onRevise?: () => void;
  onExecute?: () => void;
  onEdit?: () => void;
}

export function ChecklistDetailModal({
  open,
  onOpenChange,
  data,
  approveLabel = "Approve",
  onDirectApprove,
  onReject,
  onRevise,
  onExecute,
  onEdit,
}: ChecklistDetailModalProps) {
  if (!data) return null;

  const chk: EquipmentChecklist | undefined = data.rawChecklist || (data.type === "checklist" ? data : undefined);
  const doc: PolicyDocument | undefined = data.rawDocument || (data.type === "document" ? data : undefined);

  const title = chk?.description || doc?.description || data.description;
  const identifier = chk?.formNumber || doc?.policyNumber || data.identifier;
  const version = chk?.version || doc?.version || "v1.0";
  const status = chk?.status || doc?.status || data.status;
  const lastModified = chk?.lastModified || doc?.lastModified || data.lastUpdated;

  const preparedByName = chk?.preparedByName || doc?.preparedByName || data.preparedBy;
  const reviewedByName = chk?.reviewedByName || doc?.reviewedByName;
  const approvedByName = chk?.approvedByName || doc?.approvedByName;
  const assignedToName = chk?.assignedToName || data.assignedToName;

  const isChecklist = !!chk || data.type === "checklist";
  const fileName = chk?.fileName || doc?.fileName || data.fileName;
  const items: ChecklistItem[] = chk?.items || data.items || [];
  const additionalRecommendedItems: ChecklistItem[] = chk?.additionalRecommendedItems || [];

  const rejectionNotes = chk?.rejectionNotes || data.rejectionNotes;
  const executionSummary = chk?.executionSummary || data.executionSummary;

  const passCount = items.filter((it) => it.status === "pass").length;
  const failCount = items.filter((it) => it.status === "fail").length;
  const naCount = items.filter((it) => it.status === "na").length;
  const totalItems = items.length;

  const handleDownload = () => {
    alert(`Downloading "${fileName || "checklist_document.pdf"}"...`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[calc(100%-1.5rem)] sm:w-full p-4 sm:p-6">
        <DialogHeader className="border-b border-border pb-3 pr-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0 pr-2">
              <ClipboardCheck className="size-5 text-primary shrink-0 mt-0.5" />
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground leading-snug break-words">
                {title}
              </DialogTitle>
            </div>
            <div className="shrink-0 self-start sm:self-auto">
              <StatusBadge status={status} label={status} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pt-1.5 font-mono">
            <span>Code: <strong className="text-foreground">{identifier}</strong></span>
            <span>•</span>
            <span>Version: <strong className="text-foreground">{version}</strong></span>
            <span>•</span>
            <span>Updated: <strong className="text-foreground">{lastModified}</strong></span>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Equipment Scope Assignment Details */}
          {chk && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 bg-muted/40 rounded-lg border border-border text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">OEM Manufacturer</span>
                  <span className="font-semibold text-foreground truncate block">{chk.equipmentOem || "Standard"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Modality</span>
                  <span className="font-semibold text-foreground truncate block">{chk.modality || "General"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="size-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Model Scope</span>
                  <span className="font-semibold text-foreground font-mono truncate block">{chk.equipmentModel || "All Models"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Personnel Roles & Governance */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg border border-border/80 bg-accent/10 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Prepared / Author</span>
              <span className="font-medium text-foreground truncate block">{preparedByName || "—"}</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Assigned To</span>
              <span className="font-medium text-foreground truncate block">{assignedToName || "Unassigned"}</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Peer Reviewer</span>
              <span className="font-medium text-foreground truncate block">{reviewedByName || "—"}</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Admin Sign-Off</span>
              <span className="font-medium text-foreground truncate block">{approvedByName || "—"}</span>
            </div>
          </div>

          {/* Rejection Feedback Note (if present) */}
          {rejectionNotes && (
            <div className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-500/10 space-y-2">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                <AlertCircle className="size-4 shrink-0" />
                Admin Feedback & Rejection Reason
              </div>
              <p className="text-xs text-foreground bg-background/90 p-2.5 rounded border border-rose-500/20 leading-relaxed break-words">
                {rejectionNotes}
              </p>
            </div>
          )}

          {/* Additional Admin Recommended Items (if present) */}
          {additionalRecommendedItems.length > 0 && (
            <div className="p-3.5 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <PlusCircle className="size-4 shrink-0" />
                Admin Recommended Additions ({additionalRecommendedItems.length})
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {additionalRecommendedItems.map((rec, i) => (
                  <div key={rec.id || i} className="p-2.5 rounded border border-primary/20 bg-background text-xs space-y-0.5 shadow-2xs">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="break-words">{rec.description}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono pl-5.5 break-words">Criteria: {rec.requirement}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checklist Attachment Document (if upload) */}
          {fileName && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border rounded-lg bg-card shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-foreground truncate">{fileName}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {isChecklist ? "Standardized Equipment Protocol File" : "Official Quality Policy Document"}
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline" className="text-xs font-semibold cursor-pointer w-full sm:w-auto shrink-0" onClick={handleDownload}>
                <Download className="size-3.5 mr-1" />
                Download Document
              </Button>
            </div>
          )}

          {/* Structured Custom Checklist Items with Execution Indicators */}
          {items && items.length > 0 && (
            <div className="space-y-3 border-t border-border pt-3">
              {/* Execution Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-muted/40 rounded-lg border text-xs">
                <span className="font-bold uppercase tracking-wider text-foreground">
                  Checklist Protocol ({totalItems} Checkpoints)
                </span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-bold border border-emerald-500/20">
                    <Check className="size-3" /> {passCount} Pass
                  </span>
                  {failCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-[11px] font-bold border border-rose-500/20">
                      <X className="size-3" /> {failCount} Fail
                    </span>
                  )}
                  {naCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded bg-muted text-muted-foreground px-2 py-0.5 text-[11px] font-bold border border-border">
                      <Minus className="size-3" /> {naCount} N/A
                    </span>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {items.map((item, idx) => {
                  const isPass = item.status === "pass";
                  const isFail = item.status === "fail";
                  const isNa = item.status === "na";

                  return (
                    <div
                      key={item.id || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 rounded-lg border bg-card text-xs shadow-2xs"
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-start gap-2 font-semibold text-foreground">
                          <span className="inline-flex size-4.5 shrink-0 items-center justify-center rounded bg-muted font-bold text-muted-foreground text-[10px] mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="break-words">{item.description}</span>
                        </div>
                        <div className="text-muted-foreground font-mono text-[11px] pl-6.5 break-words">
                          Criteria: <span className="text-foreground/90">{item.requirement}</span>
                        </div>
                      </div>

                      {/* Execution Badge */}
                      <div className="shrink-0 pl-6 sm:pl-0 pt-1 sm:pt-0">
                        {isPass && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <Check className="size-3" /> Pass
                          </span>
                        )}
                        {isFail && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            <X className="size-3" /> Fail
                          </span>
                        )}
                        {isNa && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-muted text-muted-foreground border">
                            <Minus className="size-3" /> N/A
                          </span>
                        )}
                        {!item.status && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            Pending Execution
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Single Unified Execution Remarks & Findings */}
              {executionSummary && (
                <div className="p-3 rounded-lg border border-border bg-muted/40 space-y-1.5">
                  <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                    <FileCheck className="size-4 text-primary shrink-0" />
                    Overall Execution Remarks & Findings
                  </div>
                  <p className="text-xs text-foreground bg-background p-2.5 rounded border border-border leading-relaxed break-words">
                    {executionSummary}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-border pt-3">
          {onEdit && (
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={onEdit}>
              <Edit2 className="size-3.5 mr-1" />
              Edit Checklist
            </Button>
          )}
          {onRevise && (
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={onRevise}>
              <Edit2 className="size-3.5 mr-1" />
              Revise Checklist
            </Button>
          )}
          {onExecute && (
            <Button size="sm" className="w-full sm:w-auto bg-primary text-primary-foreground font-semibold" onClick={onExecute}>
              <PlayCircle className="size-3.5 mr-1" />
              Execute Checklist
            </Button>
          )}
          {onReject && (
            <Button variant="outline" size="sm" className="w-full sm:w-auto text-destructive hover:bg-destructive/10" onClick={onReject}>
              <XCircle className="size-3.5 mr-1" />
              Reject Checklist
            </Button>
          )}
          {onDirectApprove && (
            <Button size="sm" className="w-full sm:w-auto" onClick={onDirectApprove}>
              <CheckCircle2 className="size-3.5 mr-1" />
              {approveLabel}
            </Button>
          )}
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
