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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Receipt,
  FileText,
  Boxes,
  Truck,
  History,
  Archive,
  ArrowUpRight,
  ExternalLink,
  Edit2,
  Send,
  Wrench,
  Stethoscope,
  Building2,
  Calendar,
  Layers,
  ShieldCheck,
  PackageCheck,
  DollarSign,
} from "lucide-react";
import { Order, PurchaseOrder } from "../types";
import { OrderStatusBadge } from "./order-status-badge";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import { cn } from "@/lib/utils";

export interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  pos?: PurchaseOrder[] | undefined;
  onEdit?: ((order: Order) => void) | undefined;
  onApprove?: ((order: Order) => void) | undefined;
  onSendBack?: ((order: Order) => void) | undefined;
  onFinalApprove?: ((order: Order) => void) | undefined;
  onArchive?: ((order: Order) => void) | undefined;
  onUnarchive?: ((order: Order) => void) | undefined;
  onViewPO?: ((po: PurchaseOrder) => void) | undefined;
  onRecordDelivery?: ((po: PurchaseOrder) => void) | undefined;
}

export function OrderDetailsModal({
  open,
  onOpenChange,
  order,
  pos = [],
  onEdit,
  onApprove,
  onSendBack,
  onFinalApprove,
  onArchive,
  onUnarchive,
  onViewPO,
  onRecordDelivery,
}: OrderDetailsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("details");

  if (!order) return null;

  const isAdmin = isModuleAdmin(user, "financial");
  const isAuthor = user?.id === order.requestedById;
  const isEditable = (order.status === "DRAFT" || order.status === "SENT_BACK") && (isAdmin || isAuthor);

  // Filter POs belonging to this order
  const relatedPOs = pos.filter((p) => p.sourceOrderId === order.id);

  // Total fulfillment progress
  const totalOrderedQty = order.items.reduce((sum, i) => sum + i.orderedQuantity, 0);
  const totalFulfilledQty = order.items.reduce((sum, i) => sum + i.fulfilledQuantity, 0);
  const fulfillmentPct = totalOrderedQty > 0 ? Math.round((totalFulfilledQty / totalOrderedQty) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-base sm:text-lg font-black text-foreground">
                  {order.orderNumber}
                </span>
                <OrderStatusBadge status={order.status} />
                {order.isArchived && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <Archive className="size-3" /> Archived
                  </span>
                )}
              </div>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-3">
                <span>Raised by: <strong>{order.requestedByName}</strong></span>
                <span>•</span>
                <span>Category: <strong>{order.category}</strong></span>
                <span>•</span>
                <span>Date: <strong>{new Date(order.dateRaised).toLocaleDateString()}</strong></span>
              </DialogDescription>
            </div>

            {/* Quick Financial Highlight */}
            <div className="text-right font-mono bg-background border border-border px-3.5 py-1.5 rounded-lg">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block font-sans">
                Gross Total (Inc. VAT)
              </span>
              <span className="text-sm sm:text-base font-bold text-primary">
                ₦{order.grossTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* 7 Locked Sections Tab Bar */}
          <div className="pt-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-7 h-9 p-1 bg-muted/60 text-xs">
                <TabsTrigger value="details" className="text-[11px] font-semibold">1. Details</TabsTrigger>
                <TabsTrigger value="items" className="text-[11px] font-semibold">2. Items ({order.items.length})</TabsTrigger>
                <TabsTrigger value="history" className="text-[11px] font-semibold">3. History ({order.history.length})</TabsTrigger>
                <TabsTrigger value="requisition" className="text-[11px] font-semibold">4. Requisition</TabsTrigger>
                <TabsTrigger value="pos" className="text-[11px] font-semibold">5. POs ({relatedPOs.length})</TabsTrigger>
                <TabsTrigger value="documents" className="text-[11px] font-semibold">6. Docs ({order.documents.length})</TabsTrigger>
                <TabsTrigger value="fulfillment" className="text-[11px] font-semibold">7. Delivery</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

        {/* Modal Body: 7 Sections */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Sent Back Banner */}
          {order.status === "SENT_BACK" && order.sendBackReason && (
            <div className="mb-4 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400">
                <RotateCcw className="size-4" />
                <span>Admin Return Reason / Required Correction</span>
              </div>
              <p className="text-rose-800 dark:text-rose-300 leading-relaxed pl-6">
                {order.sendBackReason}
              </p>
            </div>
          )}

          {/* SECTION 1: ORDER DETAILS */}
          {activeTab === "details" && (
            <div className="space-y-5 animate-fade-in text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border p-3.5 bg-card space-y-1">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block">
                    Order Status
                  </span>
                  <div className="pt-1">
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>

                <div className="rounded-xl border border-border p-3.5 bg-card space-y-1">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block">
                    Target Delivery Date
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    {order.targetDeliveryDate || "Not Specified"}
                  </span>
                  {order.actualCompletionDate && (
                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-400">
                      Delivered: {new Date(order.actualCompletionDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="rounded-xl border border-border p-3.5 bg-card space-y-1">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block">
                    Initiator / Department
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {order.requestedByName}
                  </span>
                </div>
              </div>

              {/* Maintenance Job Relationship */}
              <div className="rounded-xl border border-border p-4 bg-card space-y-2">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Wrench className="size-4 text-primary" />
                  <span>Maintenance Work Order Relationship</span>
                </div>
                {order.jobNumber ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Job Number:</span>
                      <span className="font-mono font-bold text-primary text-sm">{order.jobNumber}</span>
                    </div>
                    {order.jobTitle && (
                      <div>
                        <span className="text-muted-foreground text-[11px] block">Clinical Issue / Scope:</span>
                        <span className="text-foreground">{order.jobTitle}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">No specific job work-order linked to this order.</p>
                )}
              </div>

              {/* Asset Relationship */}
              <div className="rounded-xl border border-border p-4 bg-card space-y-2">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Stethoscope className="size-4 text-primary" />
                  <span>Equipment / Device Asset Profile</span>
                </div>
                {order.assetId ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Asset Identifier:</span>
                      <span className="font-mono font-bold text-foreground text-sm">{order.assetId}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Equipment Details:</span>
                      <span className="text-foreground">{order.assetName}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">General operational supply (no specific asset tagged).</p>
                )}
              </div>

              {/* Clinical Notes */}
              {order.notes && (
                <div className="rounded-xl border border-border p-4 bg-card space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Clinical Justification & Notes
                  </span>
                  <p className="text-foreground leading-relaxed">{order.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: ITEMS */}
          {activeTab === "items" && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground text-[11px]">
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">Supplier</th>
                      <th className="py-2.5 px-3 text-center">Pack Details</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Net</th>
                      <th className="py-2.5 px-3 text-right">Gross Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {order.items.map((it) => (
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
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-foreground">{it.supplierName}</div>
                          <div className="text-[10px] text-muted-foreground">{it.supplierEmail || "No Email"}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">
                          {it.quantityInPack && it.quantityInPack > 1
                            ? `${it.quantityInPack} / pk (${it.numberOfPacks} pks)`
                            : "Single"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          {it.totalQuantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          ₦{it.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          ₦{it.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                          ₦{it.grossTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Financial Summary */}
                <div className="bg-muted/30 p-4 border-t border-border flex justify-end">
                  <div className="w-72 space-y-1.5 font-mono">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total Net Price:</span>
                      <span>₦{order.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>VAT (7.5%):</span>
                      <span>₦{order.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-primary pt-1 border-t border-border">
                      <span>Gross Total:</span>
                      <span>₦{order.grossTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: APPROVAL & REVISION HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-3 animate-fade-in text-xs">
              <div className="rounded-xl border border-border p-4 bg-card">
                <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                  <History className="size-4 text-primary" />
                  Approval & Lifecycle Action Trail
                </h4>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {order.history.map((entry) => (
                    <div key={entry.id} className="relative">
                      <div className="absolute -left-[23px] top-1 size-3.5 rounded-full border-2 border-background bg-primary" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-xs">{entry.action}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          By: <strong className="text-foreground">{entry.performedBy}</strong>
                        </p>
                        {entry.note && (
                          <div className="text-[11px] bg-muted/40 p-2 rounded-lg border border-border/60 text-foreground leading-relaxed mt-1">
                            {entry.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: REQUISITION INFORMATION */}
          {activeTab === "requisition" && (
            <div className="space-y-4 animate-fade-in text-xs">
              {order.requisition ? (
                <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-sky-700 dark:text-sky-400 uppercase font-bold tracking-wider">
                        Approved Internal Purchasing Document
                      </span>
                      <h4 className="text-lg font-mono font-black text-foreground">
                        {order.requisition.requisitionNumber}
                      </h4>
                    </div>
                    <span className="bg-sky-500/20 text-sky-800 dark:text-sky-300 font-bold px-2.5 py-1 rounded-md text-xs border border-sky-500/30">
                      {order.requisition.status === "FINAL_APPROVED" ? "Final Authorized" : "Pending Final Authorization"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-sky-500/20">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Generated Date:</span>
                      <span className="font-mono font-semibold">
                        {new Date(order.requisition.generatedAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Authorized Date:</span>
                      <span className="font-mono font-semibold">
                        {order.requisition.approvedAt ? new Date(order.requisition.approvedAt).toLocaleString() : "Pending"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Authorized By:</span>
                      <span className="font-semibold">{order.requisition.approvedBy || "Pending"}</span>
                    </div>
                  </div>

                  {isAdmin && order.status === "APPROVED" && (
                    <div className="pt-3 border-t border-sky-500/20 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => onFinalApprove?.(order)}
                        className="gap-1.5 cursor-pointer bg-primary text-primary-foreground"
                      >
                        <ShieldCheck className="size-4" />
                        Perform Final Approval & Generate Purchase Orders
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border py-12 text-center space-y-2">
                  <Receipt className="size-8 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-xs font-semibold text-foreground">No Requisition Generated Yet</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    Requisitions are automatically generated once an Admin approves this purchase order request.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: PURCHASE ORDERS */}
          {activeTab === "pos" && (
            <div className="space-y-4 animate-fade-in text-xs">
              {relatedPOs.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    This order produced {relatedPOs.length} supplier-specific Purchase Order(s):
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {relatedPOs.map((po) => (
                      <div
                        key={po.id}
                        className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-foreground">{po.poNumber}</span>
                            <OrderStatusBadge status={po.status} />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Vendor: <strong className="text-foreground">{po.supplierName}</strong> ({po.items.length} items)
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <span className="text-[10px] text-muted-foreground block font-sans">PO Valuation:</span>
                          <span className="font-bold text-primary text-sm">
                            ₦{po.grossTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewPO?.(po)}
                            className="gap-1.5"
                          >
                            <ExternalLink className="size-3.5" />
                            View PO
                          </Button>
                          {isAdmin && po.status !== "COMPLETED" && (
                            <Button
                              size="sm"
                              onClick={() => onRecordDelivery?.(po)}
                              className="gap-1.5"
                            >
                              <PackageCheck className="size-3.5" />
                              Receive Goods
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border py-12 text-center space-y-2">
                  <Truck className="size-8 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-xs font-semibold text-foreground">No Purchase Orders Issued Yet</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    Purchase Orders are generated upon Final Approval by an Admin.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SECTION 6: DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="space-y-4 animate-fade-in text-xs">
              {order.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {order.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-xl border border-border bg-card p-3.5 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <span className="font-mono text-[10px] font-bold text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded">
                          {doc.type}
                        </span>
                        <div className="font-semibold text-foreground truncate mt-1">{doc.fileName}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <ArrowUpRight className="size-3.5" />
                        Open
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border py-12 text-center space-y-2">
                  <FileText className="size-8 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-xs font-semibold text-foreground">No Documents Attached</p>
                  <p className="text-[11px] text-muted-foreground">
                    Quotes, vendor invoices, or delivery notes attached to this order will appear here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SECTION 7: FULFILLMENT & DELIVERY */}
          {activeTab === "fulfillment" && (
            <div className="space-y-5 animate-fade-in text-xs">
              {/* Overall fulfillment progress bar */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Order Fulfillment Progress</span>
                  <span className="font-mono font-bold text-primary">{fulfillmentPct}% Complete</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      fulfillmentPct === 100 ? "bg-emerald-500" : "bg-primary",
                    )}
                    style={{ width: `${fulfillmentPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Received: <strong>{totalFulfilledQty}</strong> units</span>
                  <span>Total Ordered: <strong>{totalOrderedQty}</strong> units</span>
                  <span>Remaining: <strong>{Math.max(0, totalOrderedQty - totalFulfilledQty)}</strong> units</span>
                </div>
              </div>

              {/* Item-by-item fulfillment breakdown */}
              <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground text-[11px]">
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3 text-center">Ordered</th>
                      <th className="py-2.5 px-3 text-center">Received</th>
                      <th className="py-2.5 px-3 text-center">Remaining</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {order.items.map((it) => {
                      const isComplete = it.remainingQuantity === 0;
                      return (
                        <tr key={it.id} className="hover:bg-muted/30">
                          <td className="py-2.5 px-3 font-medium">
                            <div className="font-semibold text-foreground">{it.description}</div>
                            <span className="text-[10px] text-muted-foreground">{it.supplierName}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">{it.orderedQuantity}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {it.fulfilledQuantity}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                            {it.remainingQuantity}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                isComplete
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                  : it.fulfilledQuantity > 0
                                  ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/30"
                                  : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700",
                              )}
                            >
                              {isComplete ? "Completed" : it.fulfilledQuantity > 0 ? "Partial" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <DialogFooter className="px-6 py-4 border-t border-border/80 bg-muted/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (order.isArchived ? onUnarchive?.(order) : onArchive?.(order))}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Archive className="size-3.5" />
                {order.isArchived ? "Restore from Archive" : "Archive Order"}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* User Edit if Draft or Sent Back */}
            {isEditable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(order)}
                className="gap-1.5 cursor-pointer"
              >
                <Edit2 className="size-3.5" />
                {order.status === "SENT_BACK" ? "Correct & Resubmit" : "Edit Order"}
              </Button>
            )}

            {/* Admin Workflow Actions */}
            {isAdmin && order.status === "SUBMITTED" && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onSendBack?.(order)}
                  className="gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="size-3.5" />
                  Send Back
                </Button>
                <Button
                  size="sm"
                  onClick={() => onApprove?.(order)}
                  className="gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="size-3.5" />
                  Approve Order
                </Button>
              </>
            )}

            {isAdmin && order.status === "APPROVED" && (
              <Button
                size="sm"
                onClick={() => onFinalApprove?.(order)}
                className="gap-1.5 cursor-pointer bg-primary text-primary-foreground"
              >
                <ShieldCheck className="size-3.5" />
                Perform Final Approval & Generate PO(s)
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
