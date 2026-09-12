import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { Order } from "../types";

interface SendBackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onConfirm: (orderId: string, reason: string) => Promise<void>;
}

export function SendBackModal({
  open,
  onOpenChange,
  order,
  onConfirm,
}: SendBackModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("A send-back reason/note is required to return this order.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onConfirm(order.id, reason.trim());
      setReason("");
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to send back order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <div className="size-9 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <RotateCcw className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Send Back Order for Revision
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {order.orderNumber} — Raised by {order.requestedByName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Reason Required</p>
              <p className="text-[11px] leading-relaxed text-amber-700/90 dark:text-amber-400/90">
                Please provide specific instructions on what the user must correct. The order will become editable by the user under the same order number ({order.orderNumber}).
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sendBackReason" className="text-xs font-semibold">
              Revision Reason / Note <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="sendBackReason"
              rows={4}
              placeholder="E.g., Supplier quotation missing valid 60-day price guarantee. Please re-upload updated quote and adjust unit price accordingly."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              className="text-xs resize-none"
              autoFocus
            />
            {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={submitting || !reason.trim()}
              className="gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              {submitting ? "Sending Back..." : "Send Back Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
