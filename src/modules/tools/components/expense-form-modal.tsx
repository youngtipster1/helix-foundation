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
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Receipt className="size-4 text-primary" />
            Add Job Expense
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Record maintenance, spare parts, or calibration expenses for job <strong>{jobId}</strong>.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expenseComment" className="text-xs">Description / Reason</Label>
            <Textarea
              id="expenseComment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide breakdown or vendor reference..."
              className="text-xs min-h-[60px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Receipt / Voucher Attachment</Label>
            <div className="border border-dashed border-border rounded-lg p-3 flex flex-col items-center justify-center text-center gap-1.5 bg-muted/20">
              <FileUp className="size-4 text-muted-foreground" />
              <div className="text-[11px]">
                {receiptFileName ? (
                  <p className="font-semibold text-foreground">
                    {receiptFileName} <span className="text-muted-foreground font-normal">({receiptFileSize || "1.1 MB"})</span>
                  </p>
                ) : (
                  <p className="text-muted-foreground">Upload receipt proof (PDF, JPG, PNG)</p>
                )}
              </div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center justify-center rounded-md border border-input bg-background px-2.5 py-0.5 text-[11px] font-medium hover:bg-accent transition-colors">
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

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting || !amount || Number(amount) <= 0} className="text-xs">
              {submitting ? "Submitting..." : "Submit Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
