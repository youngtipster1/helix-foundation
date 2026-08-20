import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ToolExpense } from "../types";
import { CheckCircle2, XCircle, FileText } from "lucide-react";

interface ExpenseApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: ToolExpense | null;
  onApprove: (expenseId: string) => Promise<void>;
  onReject: (expenseId: string, reason: string) => Promise<void>;
}

export function ExpenseApprovalDialog({
  open,
  onOpenChange,
  expense,
  onApprove,
  onReject,
}: ExpenseApprovalDialogProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [mode, setMode] = useState<"view" | "rejecting">("view");
  const [processing, setProcessing] = useState(false);

  if (!expense) return null;

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await onApprove(expense.id);
      onOpenChange(false);
    } catch (err) {
      console.error("Error approving expense", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setProcessing(true);
    try {
      await onReject(expense.id, rejectionReason.trim());
      setRejectionReason("");
      setMode("view");
      onOpenChange(false);
    } catch (err) {
      console.error("Error rejecting expense", err);
    } finally {
      setProcessing(false);
    }
  };

  const formattedAmount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(expense.amount);

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        setMode("view");
        setRejectionReason("");
      }
      onOpenChange(val);
    }}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground">
            {mode === "rejecting" ? "Reject Expense Claim" : "Review Expense Claim"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Expense ID: <span className="font-mono font-semibold text-foreground">{expense.id}</span> &bull; Job: <span className="font-mono font-semibold text-foreground">{expense.jobId}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-bold text-foreground text-sm font-mono">{formattedAmount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Expense Type:</span>
              <span className="font-medium text-foreground">{expense.expenseType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="text-foreground">{expense.date}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Submitted By:</span>
              <span className="font-medium text-foreground">{expense.submittedByName}</span>
            </div>
            {expense.comment && (
              <div className="pt-2 border-t border-border/60">
                <span className="text-muted-foreground block mb-1">Details:</span>
                <p className="text-foreground leading-relaxed italic bg-background/50 p-2 rounded border border-border/40">
                  &ldquo;{expense.comment}&rdquo;
                </p>
              </div>
            )}
            {expense.receiptFileName && (
              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="size-3.5 text-primary" />
                  {expense.receiptFileName}
                </span>
                <span className="text-muted-foreground font-mono">{expense.receiptFileSize || "1.2 MB"}</span>
              </div>
            )}
          </div>

          {mode === "rejecting" && (
            <div className="space-y-1.5 animate-fade-in">
              <Label htmlFor="rejectReason" className="text-xs text-destructive font-semibold">
                Reason for Rejection *
              </Label>
              <Textarea
                id="rejectReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this expense claim is being rejected..."
                className="text-xs min-h-[70px]"
                required
              />
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-border flex items-center justify-between sm:justify-between">
          {mode === "rejecting" ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMode("view")}
                className="text-xs"
                disabled={processing}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
                className="text-xs gap-1.5"
              >
                <XCircle className="size-3.5" />
                <span>{processing ? "Rejecting..." : "Confirm Rejection"}</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
                disabled={processing}
              >
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMode("rejecting")}
                  className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30 gap-1"
                  disabled={processing}
                >
                  <XCircle className="size-3.5" />
                  <span>Reject</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApprove}
                  disabled={processing}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>{processing ? "Approving..." : "Approve Expense"}</span>
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
