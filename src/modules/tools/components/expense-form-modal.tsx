import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toolsSettingsService } from "../services/tools-settings-service";
import type { CreateExpenseInput } from "../types";
import { FileUp, Receipt } from "lucide-react";

interface ExpenseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  onSubmit: (input: CreateExpenseInput) => Promise<void>;
}

export function ExpenseFormModal({ open, onOpenChange, jobId, onSubmit }: ExpenseFormModalProps) {
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);
  const [expenseType, setExpenseType] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [receiptFileSize, setReceiptFileSize] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadTypes() {
      const types = await toolsSettingsService.getExpenseTypes();
      setExpenseTypes(types);
      if (types.length > 0) setExpenseType(types[0]);
    }
    loadTypes();
  }, []);

  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().slice(0, 10));
      setAmount("");
      setComment("");
      setReceiptFileName("");
      setReceiptFileSize("");
    }
  }, [open]);

  const handleMockFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFileName(file.name);
      setReceiptFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !expenseType) return;

    setSubmitting(true);
    try {
      await onSubmit({
        jobId,
        date: date || new Date().toISOString().slice(0, 10),
        expenseType,
        amount: Number(amount),
        comment: comment.trim(),
        receiptFileName: receiptFileName || "Expense_Receipt.pdf",
        receiptFileSize: receiptFileSize || "1.1 MB",
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Error creating expense", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-card/50 shrink-0">
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
            <Receipt className="size-4 text-primary shrink-0" />
            Add Job Expense
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record maintenance, spare parts, or calibration expenses for job <strong className="font-mono text-foreground">{jobId}</strong>.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="expenseType" className="text-xs">Expense Type *</Label>
              <select
                id="expenseType"
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                required
              >
                {expenseTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expenseAmount" className="text-xs">Amount (₦ NGN) *</Label>
              <Input
                id="expenseAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="45000"
                className="h-9 text-xs font-mono"
                required
                min={1}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expenseDate" className="text-xs">Expense Date *</Label>
            <Input
              id="expenseDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expenseComment" className="text-xs">Description / Reason</Label>
            <Textarea
              id="expenseComment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide breakdown or vendor reference..."
              className="text-xs min-h-[70px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Receipt / Voucher Attachment</Label>
            <div className="border border-dashed border-border rounded-lg p-5 flex flex-col items-center justify-center text-center gap-1.5 bg-muted/20">
              <FileUp className="size-5 text-muted-foreground" />
              <div className="text-xs">
                {receiptFileName ? (
                  <p className="font-semibold text-foreground">
                    {receiptFileName} <span className="text-muted-foreground font-normal">({receiptFileSize || "1.1 MB"})</span>
                  </p>
                ) : (
                  <p className="text-muted-foreground">Upload receipt proof (PDF, JPG, PNG)</p>
                )}
              </div>
              <label className="cursor-pointer mt-1">
                <span className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-xs font-medium hover:bg-accent transition-colors shadow-xs">
                  Select Receipt
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleMockFileUpload}
                />
              </label>
            </div>
          </div>
        </form>

        <DialogFooter className="p-3.5 sm:p-4 border-t border-border bg-card/60 shrink-0 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={submitting || !amount || Number(amount) <= 0} onClick={handleSubmit} className="text-xs">
            {submitting ? "Submitting..." : "Submit Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
