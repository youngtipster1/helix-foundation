import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Receipt,
  Building2,
  Calendar,
  PackageCheck,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  Boxes,
} from "lucide-react";
import { PurchaseOrder } from "../types";
import { OrderStatusBadge } from "./order-status-badge";
import { cn } from "@/lib/utils";

interface PurchaseOrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder | null;
  isAdmin: boolean;
  onRecordDelivery?: ((po: PurchaseOrder) => void) | undefined;
}

export function PurchaseOrderDetailsModal({
  open,
  onOpenChange,
  purchaseOrder,
  isAdmin,
  onRecordDelivery,
}: PurchaseOrderDetailsModalProps) {
  if (!purchaseOrder) return null;

  const totalOrdered = purchaseOrder.items.reduce((s, i) => s + i.orderedQuantity, 0);
  const totalFulfilled = purchaseOrder.items.reduce((s, i) => s + i.fulfilledQuantity, 0);
  const fulfillmentPct = totalOrdered > 0 ? Math.round((totalFulfilled / totalOrdered) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-lg font-black text-foreground">
                  {purchaseOrder.poNumber}
                </span>
                <OrderStatusBadge status={purchaseOrder.status} />
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Generated from Requisition {purchaseOrder.requisitionNumber} (Source: {purchaseOrder.sourceOrderNumber})
              </DialogDescription>
            </div>

            <div className="text-right font-mono bg-background border border-border px-3.5 py-1.5 rounded-lg">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block font-sans">
                Gross PO Valuation
              </span>
              <span className="text-base font-bold text-primary">
                ₦{purchaseOrder.grossTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs">
          {/* Supplier Particulars */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Building2 className="size-4 text-primary" />
              <span>Vendor / Supplier Master Particulars</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <span className="text-muted-foreground text-[11px] block">Supplier Legal Name:</span>
                <span className="font-bold text-foreground">{purchaseOrder.supplierName}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px] block">Email Address:</span>
                <span className="font-mono">{purchaseOrder.supplierEmail || "No Email on Record"}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px] block">Telephone:</span>
                <span className="font-mono">{purchaseOrder.supplierPhone || "No Phone on Record"}</span>
              </div>
            </div>

            {purchaseOrder.supplierAddress && (
              <div className="pt-2 border-t border-border/60">
                <span className="text-muted-foreground text-[11px] block">Dispatch & Registered Address:</span>
                <span className="text-foreground">{purchaseOrder.supplierAddress}</span>
              </div>
            )}
          </div>

          {/* Fulfillment Status Banner */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">Fulfillment Status</span>
              <span className="font-mono font-bold text-primary">{fulfillmentPct}% Complete</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  fulfillmentPct === 100 ? "bg-emerald-500" : "bg-primary",
                )}
                style={{ width: `${fulfillmentPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Received: <strong>{totalFulfilled}</strong> units</span>
              <span>Remaining: <strong>{Math.max(0, totalOrdered - totalFulfilled)}</strong> units</span>
            </div>
          </div>

          {/* Items Manifest Table */}
          <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground text-[11px]">
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Ordered</th>
                  <th className="py-2.5 px-3 text-center">Received</th>
                  <th className="py-2.5 px-3 text-center">Remaining</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Gross Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {purchaseOrder.items.map((it) => (
                  <tr key={it.id} className="hover:bg-muted/30">
                    <td className="py-2.5 px-3 font-medium">
                      <div className="font-semibold text-foreground">{it.description}</div>
                      {it.specifications && (
                        <div className="text-[10px] text-muted-foreground">{it.specifications}</div>
                      )}
                      {it.partNumber && (
                        <span className="font-mono text-[10px] text-primary">{it.partNumber}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">{it.orderedQuantity}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {it.fulfilledQuantity}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-amber-600 dark:text-amber-400 font-bold">
                      {it.remainingQuantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      ₦{it.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                      ₦{it.grossTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Delivery Log History */}
          <div className="rounded-xl border border-border p-4 bg-card space-y-3 shadow-2xs">
            <span className="font-bold text-foreground block">
              Physical Deliveries & Goods Receipts ({purchaseOrder.deliveries.length})
            </span>
            {purchaseOrder.deliveries.length > 0 ? (
              <div className="space-y-2">
                {purchaseOrder.deliveries.map((del) => (
                  <div
                    key={del.id}
                    className="p-3 bg-muted/40 rounded-lg border border-border/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 font-semibold text-foreground">
                        <span>{new Date(del.deliveryDate).toLocaleDateString()}</span>
                        {del.deliveryNoteNumber && (
                          <span className="font-mono text-[11px] text-primary">
                            (DN: {del.deliveryNoteNumber})
                          </span>
                        )}
                        <span className={cn(
                          "px-1.5 py-0.2 rounded text-[10px] font-bold",
                          del.isAccurate ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-destructive/10 text-destructive"
                        )}>
                          {del.isAccurate ? "Accurate" : "Discrepancy Logged"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Received by: {del.receivedBy}
                        {del.notes && ` — ${del.notes}`}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-foreground">
                      +{del.itemsReceived.reduce((s, i) => s + i.quantityReceived, 0)} units
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">No deliveries have been logged against this PO yet.</p>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/80 bg-muted/20 flex items-center justify-between shrink-0">
          <div>
            {isAdmin && purchaseOrder.status !== "COMPLETED" && (
              <Button
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onRecordDelivery?.(purchaseOrder);
                }}
                className="gap-1.5 cursor-pointer bg-primary text-primary-foreground"
              >
                <PackageCheck className="size-3.5" />
                Record Goods Receipt
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
