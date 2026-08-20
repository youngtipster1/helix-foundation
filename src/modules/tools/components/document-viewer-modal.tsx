import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, CheckCircle2, ShieldCheck, Printer } from "lucide-react";

interface DocumentViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    title: string;
    fileName: string;
    fileSize?: string;
    documentType?: string;
    uploadedBy?: string;
    dateUploaded?: string;
    comment?: string;
  } | null;
}

export function DocumentViewerModal({
  open,
  onOpenChange,
  document,
}: DocumentViewerModalProps) {
  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <FileText className="size-4 text-primary" />
                {document.fileName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {document.documentType || "Official Document"} &bull; {document.fileSize || "1.8 MB"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Document Simulated Sheet */}
          <div className="border border-border rounded-lg bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 grid place-items-center text-primary font-bold text-sm">
                  HEMP
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Clinical Engineering Compliance Record
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Healthcare Engineering Management Platform
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <ShieldCheck className="size-3" />
                  Verified & Signed
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground block">Document Name:</span>
                <span className="font-semibold text-foreground">{document.fileName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block">Classification:</span>
                <span className="font-semibold text-foreground">{document.documentType || "Standard Compliance Report"}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block">Date Stamped:</span>
                <span className="text-foreground">{document.dateUploaded || new Date().toISOString().slice(0, 10)}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block">Authenticated By:</span>
                <span className="text-foreground">{document.uploadedBy || "Authorized Biomedical Engineer"}</span>
              </div>
            </div>

            {document.comment && (
              <div className="border-t border-border pt-3">
                <span className="text-xs text-muted-foreground block mb-1">Notes & Scope:</span>
                <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded border border-border/50 leading-relaxed">
                  {document.comment}
                </p>
              </div>
            )}

            <div className="border border-dashed border-border rounded p-4 bg-muted/10 text-center space-y-2">
              <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <p className="text-xs font-medium text-foreground">
                Document Authenticity & Traceability Verified
              </p>
              <p className="text-[11px] text-muted-foreground max-w-md mx-auto leading-relaxed">
                This document conforms to standard biomedical equipment management guidelines and ISO 17025 / IEC 62353 traceability protocols.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-border flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => alert("Printing simulated document...")}
              className="text-xs gap-1.5"
            >
              <Printer className="size-3.5" />
              <span>Print</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => alert(`Downloading ${document.fileName}...`)}
              className="text-xs gap-1.5"
            >
              <Download className="size-3.5" />
              <span>Download File</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
