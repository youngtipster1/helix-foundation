import React, { useState, useEffect } from "react";
import {
  ClipboardCheck,
  Calendar,
  Save,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  Clock,
  UserCheck,
  Check,
  X,
  History,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditItem, AuditRun } from "../types";
import { partsService } from "../services/parts-service";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface PartsAuditTableProps {
  initialItems: AuditItem[];
  currentUserName?: string;
  currentUserId?: string;
  isAdmin?: boolean;
  onAuditSaved?: (run: AuditRun) => void;
}

export function PartsAuditTable({
  initialItems,
  currentUserName = "Senior Clinical Engineer",
  currentUserId = "user_1",
  isAdmin = true,
  onAuditSaved,
}: PartsAuditTableProps) {
  const [activeTab, setActiveTab] = useState<"sheet" | "history">("sheet");
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<AuditItem[]>(initialItems);
  const [auditRuns, setAuditRuns] = useState<AuditRun[]>([]);
  const [saving, setSaving] = useState(false);
  const [auditNotes, setAuditNotes] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync initialItems
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Load audit history
  const loadRuns = async () => {
    const runs = await partsService.getAuditRuns();
    setAuditRuns(runs);
  };

  useEffect(() => {
    loadRuns();
  }, []);

  // Handle audited quantity keying in
  const handleAuditedQuantityChange = (itemId: string, valStr: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        if (valStr.trim() === "") {
          return {
            ...item,
            auditedQuantity: null,
            shrinkageQuantity: null,
            shrinkageValue: null,
          };
        }

        const auditedQty = parseInt(valStr, 10);
        if (isNaN(auditedQty)) return item;

        // Shrinkage calculations per specification and correct financial math:
        // Shrinkage Quantity = Quantity in stock - audited quantity
        // Shrinkage Value = Shrinkage Quantity × Unit price
        const shrinkageQty = item.quantityInStock - auditedQty;
        const shrinkageVal = shrinkageQty * item.unitPrice;

        return {
          ...item,
          auditedQuantity: auditedQty,
          shrinkageQuantity: shrinkageQty,
          shrinkageValue: shrinkageVal,
        };
      })
    );
  };

  // Summaries
  const auditedCount = items.filter((i) => i.auditedQuantity !== null).length;
  const totalShrinkageQty = items.reduce(
    (sum, i) => sum + (i.shrinkageQuantity ?? 0),
    0
  );
  const totalShrinkageValue = items.reduce(
    (sum, i) => sum + (i.shrinkageValue ?? 0),
    0
  );

  const handleSaveAudit = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const run = await partsService.saveAuditRun(
        auditDate,
        items,
        { id: currentUserId, name: currentUserName },
        auditNotes
      );
      setSavedSuccess(true);
      toast.success("Physical audit run saved and submitted for Admin sign-off.");
      onAuditSaved?.(run);
      loadRuns();
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (e: any) {
      console.error("Failed to save audit:", e);
      toast.error(e?.message || "Failed to save audit run");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveRun = async (runId: string) => {
    try {
      await partsService.approveAuditRun(runId, currentUserName);
      toast.success("Audit run approved! Stock balances reconciled and ledger updated.");
      loadRuns();
      // Reload current items
      const newSheet = await partsService.getAuditSheet();
      setItems(newSheet);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to approve audit run");
    }
  };

  const handleRejectRun = async (runId: string) => {
    try {
      await partsService.rejectAuditRun(runId, currentUserName);
      toast.info("Audit run marked as rejected. No stock changes applied.");
      loadRuns();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to reject audit run");
    }
  };

  const pendingRunsCount = auditRuns.filter((r) => r.status === "pending_approval").length;

  return (
    <div className="space-y-4">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-auto">
          <TabsList className="h-9 p-1 bg-muted/50 border border-border">
            <TabsTrigger value="sheet" className="text-xs gap-1.5">
              <ClipboardCheck className="size-3.5" />
              <span>Count Matrix (18 Cols)</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1.5">
              <History className="size-3.5" />
              <span>Audit Runs & Sign-Off</span>
              {pendingRunsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {pendingRunsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "sheet" && (
        <div className="space-y-4">
          {/* Audit Run Header & Reconciliation Summary */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-2xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="size-5 text-primary" />
                <div>
                  <h2 className="text-sm font-bold text-foreground">Parts Inventory Physical Audit</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Stock reconciliation, discrepancy verification, and shrinkage valuation.
                  </p>
                </div>
              </div>

              <div className="h-6 w-px bg-border hidden sm:block" />

              {/* Date Picker (Matching Page 12 'Date' field) */}
              <div className="flex items-center gap-2">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Audit Date:</span>
                <Input
                  type="date"
                  value={auditDate}
                  onChange={(e) => setAuditDate(e.target.value)}
                  className="h-8 text-xs font-medium w-36"
                />
              </div>

              {/* Auditor Badge */}
              <div className="hidden xl:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-md border border-border">
                <UserCheck className="size-3.5 text-primary" />
                <span>
                  Auditor: <strong className="text-foreground">{currentUserName}</strong>
                </span>
              </div>
            </div>

            {/* Right Summary Metrics & Save Button */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Progress / Status Counters */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-muted/40 border border-border text-xs font-mono">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block">Audited</span>
                  <span className="font-bold text-foreground">
                    {auditedCount} / {items.length}
                  </span>
                </div>

                <div className="h-5 w-px bg-border" />

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block">Shrinkage Qty</span>
                  <span
                    className={cn(
                      "font-bold",
                      totalShrinkageQty > 0
                        ? "text-destructive"
                        : totalShrinkageQty < 0
                        ? "text-blue-500"
                        : "text-emerald-500"
                    )}
                  >
                    {totalShrinkageQty > 0
                      ? `-${totalShrinkageQty}`
                      : totalShrinkageQty < 0
                      ? `+${Math.abs(totalShrinkageQty)}`
                      : "0"}
                  </span>
                </div>

                <div className="h-5 w-px bg-border" />

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block">Shrinkage Value</span>
                  <span
                    className={cn(
                      "font-bold",
                      totalShrinkageValue > 0
                        ? "text-destructive"
                        : totalShrinkageValue < 0
                        ? "text-blue-500"
                        : "text-emerald-500"
                    )}
                  >
                    ₦{totalShrinkageValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Save Audit Run Button */}
              {isAdmin && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveAudit}
                  disabled={saving || auditedCount === 0}
                  className="h-9 gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 className="size-4 text-emerald-300" />
                      <span>Submitted for Sign-Off!</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      <span>{saving ? "Saving..." : "Submit Audit Run"}</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Stacked Audit Cards (< md) */}
          <div className="space-y-3 md:hidden">
            {items.map((item, idx) => {
              const isAudited = item.auditedQuantity !== null;
              const hasShrinkage = (item.shrinkageQuantity ?? 0) > 0;
              const hasSurplus = (item.shrinkageQuantity ?? 0) < 0;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-2xs text-xs"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-muted-foreground font-bold">#{idx + 1}</span>
                        <span className="font-mono font-bold text-foreground text-sm">
                          {item.partNumber}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{item.model}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {item.modality}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-muted/30 p-2 rounded-lg">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block">In Stock</span>
                      <span className="font-bold text-foreground">{item.quantityInStock}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block">Unit Price</span>
                      <span className="font-bold text-foreground">₦{item.unitPrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block">Location</span>
                      <span className="font-bold text-foreground truncate">{item.location}</span>
                    </div>
                  </div>

                  {/* Physical Count Input and Variance Result */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Physical Count (Audited Qty)
                      </span>
                      <Input
                        type="number"
                        min="0"
                        placeholder={isAdmin ? "Enter count" : "Read-only"}
                        value={item.auditedQuantity ?? ""}
                        onChange={(e) => handleAuditedQuantityChange(item.id, e.target.value)}
                        disabled={!isAdmin}
                        className="h-8 text-xs font-mono font-bold disabled:opacity-60"
                      />
                    </div>

                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Variance
                      </span>
                      <div className="h-8 flex items-center gap-1 text-xs font-mono font-bold">
                        {isAudited ? (
                          hasShrinkage ? (
                            <span className="text-destructive flex items-center gap-0.5">
                              <TrendingDown className="size-3" />
                              -{item.shrinkageQuantity} (₦{item.shrinkageValue?.toLocaleString()})
                            </span>
                          ) : hasSurplus ? (
                            <span className="text-blue-500 flex items-center gap-0.5">
                              <ArrowUpRight className="size-3" />
                              +{Math.abs(item.shrinkageQuantity!)}
                            </span>
                          ) : (
                            <span className="text-emerald-500 flex items-center gap-0.5">
                              <CheckCircle2 className="size-3" />
                              Match
                            </span>
                          )
                        ) : (
                          <span className="text-muted-foreground font-normal">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop 18-Column Reconciliation Table View (md+) */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/40 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
                <tr>
                  <th className="px-3 py-3 w-10 text-center">SN</th>
                  <th className="px-3.5 py-3">Part Number</th>
                  <th className="px-3.5 py-3">OEM / Vendor Part #</th>
                  <th className="px-3.5 py-3">Supplier</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-2.5 py-3">Age</th>
                  <th className="px-3 py-3">OEM</th>
                  <th className="px-2.5 py-3">Modality</th>
                  <th className="px-3 py-3">Model</th>
                  <th className="px-3 py-3 text-right">In Stock</th>
                  <th className="px-3 py-3 text-right">On Order</th>
                  <th className="px-3.5 py-3 text-right">Unit Price</th>
                  <th className="px-3 py-3">Location</th>
                  <th className="px-2 py-3 text-center">Col</th>
                  <th className="px-2 py-3 text-center">Row</th>

                  {/* 3 Core Audit Columns matching Page 12 of spec */}
                  <th className="px-3.5 py-3 w-28 text-center bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold border-l border-border">
                    Audited Qty
                  </th>
                  <th className="px-3 py-3 text-right bg-blue-500/5 text-foreground font-bold">
                    Shrinkage Qty
                  </th>
                  <th className="px-3.5 py-3 text-right bg-blue-500/5 text-foreground font-bold">
                    Shrinkage Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((item, idx) => {
                  const isAudited = item.auditedQuantity !== null;
                  const hasShrinkage = (item.shrinkageQuantity ?? 0) > 0;
                  const hasSurplus = (item.shrinkageQuantity ?? 0) < 0;

                  return (
                    <tr key={item.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-3 py-2.5 text-center font-mono text-muted-foreground">
                        {idx + 1}
                      </td>

                      <td className="px-3.5 py-2.5 font-mono font-bold text-foreground whitespace-nowrap">
                        {item.partNumber}
                      </td>

                      <td className="px-3.5 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                        {item.oemVendorPartNumber}
                      </td>

                      <td className="px-3.5 py-2.5 font-medium text-foreground truncate max-w-[130px]">
                        {item.supplierName}
                      </td>

                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                        {item.category}
                      </td>

                      <td className="px-2.5 py-2.5 text-center font-mono text-muted-foreground">
                        {item.age}
                      </td>

                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                        {item.oem}
                      </td>

                      <td className="px-2.5 py-2.5 text-center">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                          {item.modality}
                        </Badge>
                      </td>

                      <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">
                        {item.model}
                      </td>

                      <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground">
                        {item.quantityInStock}
                      </td>

                      <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                        {item.quantityOnOrder}
                      </td>

                      <td className="px-3.5 py-2.5 text-right font-mono font-medium text-foreground whitespace-nowrap">
                        ₦{item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-3.5 py-2.5 text-muted-foreground truncate max-w-[120px]">
                        {item.location}
                      </td>

                      <td className="px-2 py-2.5 text-center font-mono text-muted-foreground">
                        {item.column}
                      </td>

                      <td className="px-2 py-2.5 text-center font-mono text-muted-foreground">
                        {item.row}
                      </td>

                      {/* 16. Audited Quantity Input (Page 12 spec) */}
                      <td className="px-2.5 py-2 text-center bg-blue-500/5 border-l border-border">
                        <Input
                          type="number"
                          min="0"
                          placeholder={isAdmin ? "Count" : "—"}
                          value={item.auditedQuantity ?? ""}
                          onChange={(e) => handleAuditedQuantityChange(item.id, e.target.value)}
                          disabled={!isAdmin}
                          className="h-8 w-20 mx-auto text-center text-xs font-mono font-bold bg-background disabled:opacity-60"
                        />
                      </td>

                      {/* 17. Shrinkage Quantity (Computed: Quantity in stock - audited quantity) */}
                      <td className="px-3 py-2.5 text-right font-mono font-bold whitespace-nowrap bg-blue-500/5">
                        {isAudited ? (
                          <span
                            className={cn(
                              hasShrinkage
                                ? "text-destructive font-extrabold"
                                : hasSurplus
                                ? "text-blue-500 font-extrabold"
                                : "text-emerald-500"
                            )}
                          >
                            {hasShrinkage
                              ? `-${item.shrinkageQuantity}`
                              : hasSurplus
                              ? `+${Math.abs(item.shrinkageQuantity!)}`
                              : "0"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* 18. Shrinkage Value (Computed: Shrinkage Quantity × Unit price) */}
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold whitespace-nowrap bg-blue-500/5">
                        {isAudited ? (
                          <span
                            className={cn(
                              hasShrinkage
                                ? "text-destructive font-extrabold"
                                : hasSurplus
                                ? "text-blue-500 font-extrabold"
                                : "text-emerald-500"
                            )}
                          >
                            ₦{(item.shrinkageValue ?? 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Audit Runs History & Sign-Off Approvals */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Stocktaking Audit Run Logs</h3>
                <p className="text-[11px] text-muted-foreground">
                  History of physical audit sessions, variance values, and administrator approval sign-offs.
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {auditRuns.length} Total Runs
              </Badge>
            </div>
          </div>

          {auditRuns.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl bg-card">
              No audit runs recorded yet. Perform an audit in the Count Matrix and submit for sign-off.
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
              {auditRuns.map((run) => {
                const isPending = run.status === "pending_approval";
                const isApproved = run.status === "approved";

                return (
                  <div
                    key={run.id}
                    className="p-4 hover:bg-accent/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground text-sm">
                          {run.id.toUpperCase()}
                        </span>
                        <Badge
                          className={cn(
                            "text-[10px] uppercase font-bold",
                            isPending
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : isApproved
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                              : "bg-destructive/10 text-destructive border-destructive/30"
                          )}
                        >
                          {isPending ? "Pending Approval" : isApproved ? "Approved & Reconciled" : "Rejected"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-[11px]">
                        <span>Date: <strong className="text-foreground">{run.date}</strong></span>
                        <span>&bull;</span>
                        <span>Auditor: <strong className="text-foreground">{run.auditorName}</strong></span>
                        <span>&bull;</span>
                        <span>Items Verified: <strong className="text-foreground">{run.totalAudited}</strong></span>
                      </div>

                      {run.approvedBy && (
                        <p className="text-[10px] text-muted-foreground">
                          Signed off by <strong>{run.approvedBy}</strong> on {run.approvalDate ? new Date(run.approvalDate).toLocaleDateString() : ""}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right font-mono">
                        <span className="text-[10px] text-muted-foreground uppercase block">Shrinkage Value</span>
                        <span className={cn("text-sm font-bold", run.totalShrinkageValue > 0 ? "text-destructive" : "text-emerald-500")}>
                          ₦{run.totalShrinkageValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {isAdmin && isPending && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleApproveRun(run.id)}
                            className="h-8 text-xs font-bold gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            <Check className="size-3.5" />
                            <span>Approve & Sync</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRun(run.id)}
                            className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                          >
                            <X className="size-3.5" />
                            <span>Reject</span>
                          </Button>
                        </div>
                      )}

                      {!isAdmin && isPending && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-600 text-[11px] font-medium shrink-0">
                          <Clock className="size-3.5" />
                          <span>Awaiting Admin Sign-Off</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
