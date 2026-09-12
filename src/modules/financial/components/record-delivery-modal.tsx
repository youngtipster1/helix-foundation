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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PackageCheck, Boxes, AlertCircle, CheckCircle2 } from "lucide-react";
import { PurchaseOrder, RecordDeliveryInput } from "../types";

interface RecordDeliveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder | null;
  onConfirm: (input: RecordDeliveryInput) => Promise<void>;
}

export function RecordDeliveryModal({
  open,
  onOpenChange,
  purchaseOrder,
  onConfirm,
}: RecordDeliveryModalProps) {
  const [deliveryDate, setDeliveryDate] = useState<string>(new Date().toISOString().split("T")[0] ?? "");
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("");
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});
  const [isAccurate, setIsAccurate] = useState(true);
  const [accuracyNotes, setAccuracyNotes] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Initialize received quantities on open
  React.useEffect(() => {
    if (open && purchaseOrder) {
      const initialQtys: Record<string, number> = {};
      purchaseOrder.items.forEach((it) => {
        initialQtys[it.id] = it.remainingQuantity; // Default to remaining
      });
      setReceivedQuantities(initialQtys);
      setDeliveryDate(new Date().toISOString().split("T")[0] ?? "");
      setDeliveryNoteNumber("");
      setIsAccurate(true);
      setAccuracyNotes("");
      setGeneralNotes("");
      setError("");
    }
  }, [open, purchaseOrder]);

  if (!purchaseOrder) return null;

  const handleQtyChange = (itemId: string, val: number) => {
    setReceivedQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, val),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemsToReceive = Object.entries(receivedQuantities)
      .map(([orderItemId, quantityReceived]) => ({
        orderItemId,
        quantityReceived,
      }))
      .filter((i) => i.quantityReceived > 0);

    if (itemsToReceive.length === 0) {
      setError("Please specify a received quantity greater than 0 for at least one item.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await onConfirm({
        poId: purchaseOrder.id,
        deliveryDate: deliveryDate || (new Date().toISOString().split("T")[0] ?? ""),
        deliveryNoteNumber: deliveryNoteNumber.trim() || undefined,
        itemsReceived: itemsToReceive,
        isAccurate,
        accuracyNotes: !isAccurate ? accuracyNotes.trim() : undefined,
        notes: generalNotes.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to record delivery.");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if any item is a physical part that will update inventory
  const hasPhysicalParts = purchaseOrder.items.some(
    (i) => i.category === "PARTS" && i.partId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <PackageCheck className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Record Delivery & Goods Receipt
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Purchase Order {purchaseOrder.poNumber} — {purchaseOrder.supplierName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium">
              {error}
            </div>
          )}

          {/* Parts Inventory Integration Notice */}
          {hasPhysicalParts && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 flex items-start gap-3 text-xs text-foreground">
              <Boxes className="size-4 shrink-0 text-primary mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-primary">Automatic Parts Inventory Integration</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Recorded physical part deliveries will automatically post a <strong>received</strong> stock movement
                  and increase on-hand inventory balances under PO reference <strong>{purchaseOrder.poNumber}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Delivery Note & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="deliveryDate" className="text-xs font-semibold">
                Delivery Receipt Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="deliveryDate"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dnNumber" className="text-xs font-semibold">
                Supplier Delivery Note Number (DN#)
              </Label>
              <Input
                id="dnNumber"
                placeholder="e.g. DN-GEHC-881920"
                value={deliveryNoteNumber}
                onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* Items Receipt Table */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Items & Received Quantities</Label>
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground text-[11px]">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Ordered</th>
                    <th className="py-2.5 px-3 text-center">Fulfilled</th>
                    <th className="py-2.5 px-3 text-center">Remaining</th>
                    <th className="py-2.5 px-3 text-right w-28">Receiving Now</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {purchaseOrder.items.map((it) => {
                    const currentQty = receivedQuantities[it.id] ?? it.remainingQuantity;
                    return (
                      <tr key={it.id} className="hover:bg-muted/30">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-foreground">{it.description}</div>
                          {it.partNumber && (
                            <span className="font-mono text-[10px] text-primary">{it.partNumber}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">{it.orderedQuantity}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                          {it.fulfilledQuantity}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                          {it.remainingQuantity}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Input
                            type="number"
                            min="0"
                            max={it.remainingQuantity}
                            value={currentQty}
                            onChange={(e) =>
                              handleQtyChange(it.id, parseInt(e.target.value) || 0)
                            }
                            className="h-8 text-xs font-mono text-right w-20 ml-auto font-bold"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Accuracy Tracking Checkbox */}
          <div className="rounded-xl border border-border p-3.5 bg-card space-y-2.5">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="isAccurateCheck"
                checked={isAccurate}
                onCheckedChange={(val) => setIsAccurate(Boolean(val))}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor="isAccurateCheck" className="text-xs font-bold text-foreground cursor-pointer">
                  Order Delivered Accurately as Specified
                </Label>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Confirms that the received items match required parts, correct specifications/models, and show no damage or delivery discrepancies.
                </p>
              </div>
            </div>

            {!isAccurate && (
              <div className="pt-2 space-y-1">
                <Label htmlFor="accNotes" className="text-xs font-semibold text-destructive">
                  Specify Inaccuracy / Discrepancy Reason
                </Label>
                <Textarea
                  id="accNotes"
                  rows={2}
                  placeholder="e.g. Received incorrect model rev; packing seal broken; wrong voltage specification..."
                  value={accuracyNotes}
                  onChange={(e) => setAccuracyNotes(e.target.value)}
                  className="text-xs resize-none border-destructive/40"
                  required={!isAccurate}
                />
              </div>
            )}
          </div>

          {/* General Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="genNotes" className="text-xs font-semibold">
              Inspection / Delivery Notes
            </Label>
            <Textarea
              id="genNotes"
              rows={2}
              placeholder="e.g. Received at Central Depot bay 4; visual ESD check passed..."
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              className="text-xs resize-none"
            />
          </div>
        </form>

        <DialogFooter className="px-6 py-4 border-t border-border/80 bg-muted/20 flex items-center justify-between shrink-0">
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
            type="button"
            onClick={handleSubmit}
            size="sm"
            disabled={submitting}
            className="gap-1.5 cursor-pointer bg-primary text-primary-foreground"
          >
            <PackageCheck className="size-3.5" />
            {submitting ? "Posting Delivery..." : "Confirm & Record Delivery"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
