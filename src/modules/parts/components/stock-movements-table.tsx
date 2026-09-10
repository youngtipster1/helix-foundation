import React, { useState, useMemo } from "react";
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Sliders,
  ClipboardCheck,
  Layers,
  Search,
  Download,
  Plus,
  Calendar,
  Filter,
  Package,
  Wrench,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StockMovement, StockMovementType, Part } from "../types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface StockMovementsTableProps {
  movements: StockMovement[];
  parts: Part[];
  isAdmin: boolean;
  onRecordMovement: (input: {
    partId: string;
    type: StockMovementType;
    quantity: number;
    referenceNumber: string;
    performedBy: string;
    notes?: string;
  }) => Promise<void>;
  currentUserName?: string;
}

const TYPE_CONFIG: Record<
  StockMovementType,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  received: {
    label: "Received",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-400",
    icon: ArrowDownLeft,
  },
  issued: {
    label: "Issued to Job",
    bg: "bg-rose-500/10 border-rose-500/30",
    text: "text-rose-700 dark:text-rose-400",
    icon: ArrowUpRight,
  },
  returned: {
    label: "Returned",
    bg: "bg-purple-500/10 border-purple-500/30",
    text: "text-purple-700 dark:text-purple-400",
    icon: RotateCcw,
  },
  adjustment: {
    label: "Adjustment",
    bg: "bg-blue-500/10 border-blue-500/30",
    text: "text-blue-700 dark:text-blue-400",
    icon: Sliders,
  },
  audit_variance: {
    label: "Audit Variance",
    bg: "bg-amber-500/10 border-amber-500/30",
    text: "text-amber-700 dark:text-amber-400",
    icon: ClipboardCheck,
  },
  opening_balance: {
    label: "Opening Stock",
    bg: "bg-slate-500/10 border-slate-500/30",
    text: "text-slate-700 dark:text-slate-400",
    icon: Layers,
  },
};

export function StockMovementsTable({
  movements,
  parts,
  isAdmin,
  onRecordMovement,
  currentUserName = "Clinical Engineer",
}: StockMovementsTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [modalityFilter, setModalityFilter] = useState<string>("all");

  // Record Movement Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState(parts[0]?.id || "");
  const [movementType, setMovementType] = useState<StockMovementType>("issued");
  const [quantity, setQuantity] = useState<number>(1);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const selectedPart = parts.find((p) => p.id === selectedPartId);

  // Available modalities for filter
  const modalities = useMemo(() => {
    return Array.from(new Set(movements.map((m) => m.modality))).filter(Boolean);
  }, [movements]);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (modalityFilter !== "all" && m.modality !== modalityFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          m.partNumber.toLowerCase().includes(q) ||
          m.partName.toLowerCase().includes(q) ||
          m.referenceNumber.toLowerCase().includes(q) ||
          m.performedBy.toLowerCase().includes(q) ||
          (m.notes && m.notes.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [movements, typeFilter, modalityFilter, search]);

  const handleOpenModal = (presetType?: StockMovementType) => {
    if (presetType) setMovementType(presetType);
    if (!selectedPartId && parts.length > 0) setSelectedPartId(parts[0].id);
    setQuantity(1);
    setReferenceNumber(presetType === "issued" ? "WO-" : presetType === "received" ? "PO-" : "");
    setNotes("");
    setIsModalOpen(true);
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartId) {
      toast.error("Please select a part");
      return;
    }
    if (quantity <= 0) {
      toast.error("Quantity must be greater than zero");
      return;
    }

    if (movementType === "issued" && selectedPart && quantity > selectedPart.quantityInStock) {
      toast.error(`Cannot issue ${quantity} units. Only ${selectedPart.quantityInStock} in stock.`);
      return;
    }

    setSubmitting(true);
    try {
      await onRecordMovement({
        partId: selectedPartId,
        type: movementType,
        quantity,
        referenceNumber: referenceNumber || "UNREFERENCED",
        performedBy: currentUserName,
        notes,
      });
      toast.success("Stock movement recorded successfully.");
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to record stock movement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Part Number",
      "Part Name",
      "Modality",
      "Type",
      "Quantity Change",
      "Balance After",
      "Reference #",
      "Performed By",
      "Notes",
    ];

    const rows = filteredMovements.map((m) => [
      `"${new Date(m.date).toLocaleString()}"`,
      `"${m.partNumber}"`,
      `"${m.partName}"`,
      `"${m.modality}"`,
      `"${m.type}"`,
      m.quantity > 0 ? `+${m.quantity}` : `${m.quantity}`,
      m.balanceAfter,
      `"${m.referenceNumber}"`,
      `"${m.performedBy}"`,
      `"${(m.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Stock_Movements_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card border border-border p-4 rounded-xl shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, part #, engineer..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Movement Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="received">Received (Stock In)</option>
            <option value="issued">Issued to Job (Stock Out)</option>
            <option value="returned">Returned</option>
            <option value="adjustment">Adjustments</option>
            <option value="audit_variance">Audit Variances</option>
            <option value="opening_balance">Opening Balances</option>
          </select>

          {/* Modality Filter */}
          {modalities.length > 0 && (
            <select
              value={modalityFilter}
              onChange={(e) => setModalityFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Modalities</option>
              {modalities.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          )}

          {(search || typeFilter !== "all" || modalityFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setTypeFilter("all");
                setModalityFilter("all");
              }}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 gap-1.5 text-xs"
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </Button>

          {isAdmin && (
            <Button
              size="sm"
              onClick={() => handleOpenModal("issued")}
              className="h-9 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-3.5" />
              <span>Record Movement</span>
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Ledger Table (md+) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-muted/40 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
            <tr>
              <th className="px-3.5 py-3 w-32">Timestamp</th>
              <th className="px-3.5 py-3">Part Number & Model</th>
              <th className="px-3 py-3">Modality</th>
              <th className="px-3.5 py-3">Movement Type</th>
              <th className="px-3.5 py-3 text-right">Quantity</th>
              <th className="px-3.5 py-3 text-right">Balance After</th>
              <th className="px-3.5 py-3">Reference #</th>
              <th className="px-3.5 py-3">Performed By</th>
              <th className="px-3.5 py-3">Notes / Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredMovements.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-xs text-muted-foreground">
                  No stock movements match the selected filters.
                </td>
              </tr>
            ) : (
              filteredMovements.map((m) => {
                const config = TYPE_CONFIG[m.type] || TYPE_CONFIG.adjustment;
                const IconComponent = config.icon;
                const isPositive = m.quantity > 0;

                return (
                  <tr key={m.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(m.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      <span className="text-[10px] opacity-70">
                        {new Date(m.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>

                    <td className="px-3.5 py-2.5">
                      <div className="font-mono font-bold text-foreground">{m.partNumber}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                        {m.partName}
                      </div>
                    </td>

                    <td className="px-3 py-2.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                        {m.modality}
                      </Badge>
                    </td>

                    <td className="px-3.5 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border",
                          config.bg,
                          config.text
                        )}
                      >
                        <IconComponent className="size-3 shrink-0" />
                        <span>{config.label}</span>
                      </span>
                    </td>

                    <td className="px-3.5 py-2.5 text-right font-mono font-extrabold whitespace-nowrap">
                      <span
                        className={cn(
                          isPositive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {isPositive ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>

                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-foreground whitespace-nowrap">
                      {m.balanceAfter} <span className="text-[10px] text-muted-foreground font-normal">units</span>
                    </td>

                    <td className="px-3.5 py-2.5 font-mono font-semibold text-primary whitespace-nowrap">
                      {m.referenceNumber}
                    </td>

                    <td className="px-3.5 py-2.5 text-foreground whitespace-nowrap">
                      {m.performedBy}
                    </td>

                    <td className="px-3.5 py-2.5 text-muted-foreground text-[11px] max-w-[220px] truncate" title={m.notes}>
                      {m.notes || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards (< md) */}
      <div className="space-y-3 md:hidden">
        {filteredMovements.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl bg-card">
            No stock movements found.
          </div>
        ) : (
          filteredMovements.map((m) => {
            const config = TYPE_CONFIG[m.type] || TYPE_CONFIG.adjustment;
            const IconComponent = config.icon;
            const isPositive = m.quantity > 0;

            return (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border border-border bg-card space-y-2.5 shadow-2xs text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-foreground text-sm block">
                      {m.partNumber}
                    </span>
                    <span className="text-[11px] text-muted-foreground block truncate max-w-[220px]">
                      {m.partName}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border shrink-0",
                      config.bg,
                      config.text
                    )}
                  >
                    <IconComponent className="size-3" />
                    <span>{config.label}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-lg bg-muted/40 font-mono">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block">Quantity Delta</span>
                    <span
                      className={cn(
                        "font-bold text-sm",
                        isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {isPositive ? `+${m.quantity}` : m.quantity}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block">Balance After</span>
                    <span className="font-bold text-sm text-foreground">{m.balanceAfter} units</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
                  <span>Ref: <strong className="text-primary font-mono">{m.referenceNumber}</strong></span>
                  <span>{new Date(m.date).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record Stock Movement Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ArrowLeftRight className="size-4 text-primary" />
              <span>Record Stock Movement</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Log an inventory receipt, part issuance to a work order, return, or manual adjustment.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveMovement} className="space-y-4 text-xs">
            {/* Part Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Spare Part *</Label>
              <select
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.partNumber} — {p.model} ({p.modality}) [In Stock: {p.quantityInStock}]
                  </option>
                ))}
              </select>
              {selectedPart && (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                  <span>Location: <strong>{selectedPart.location} (Bin {selectedPart.binCode})</strong></span>
                  <span>Current Stock: <strong className="font-mono text-foreground">{selectedPart.quantityInStock}</strong></span>
                </div>
              )}
            </div>

            {/* Movement Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Movement Type *</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementType("issued")}
                  className={cn(
                    "p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer",
                    movementType === "issued"
                      ? "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold"
                      : "border-border hover:bg-muted/40 text-foreground"
                  )}
                >
                  <ArrowUpRight className="size-3.5 text-rose-500" />
                  <div>
                    <span className="block text-xs">Issue to Job</span>
                    <span className="text-[10px] text-muted-foreground">Consumes stock</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMovementType("received")}
                  className={cn(
                    "p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer",
                    movementType === "received"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold"
                      : "border-border hover:bg-muted/40 text-foreground"
                  )}
                >
                  <ArrowDownLeft className="size-3.5 text-emerald-500" />
                  <div>
                    <span className="block text-xs">Receive Stock</span>
                    <span className="text-[10px] text-muted-foreground">Adds to depot</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMovementType("returned")}
                  className={cn(
                    "p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer",
                    movementType === "returned"
                      ? "border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-400 font-bold"
                      : "border-border hover:bg-muted/40 text-foreground"
                  )}
                >
                  <RotateCcw className="size-3.5 text-purple-500" />
                  <div>
                    <span className="block text-xs">Return Part</span>
                    <span className="text-[10px] text-muted-foreground">Unused from work</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMovementType("adjustment")}
                  className={cn(
                    "p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer",
                    movementType === "adjustment"
                      ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold"
                      : "border-border hover:bg-muted/40 text-foreground"
                  )}
                >
                  <Sliders className="size-3.5 text-blue-500" />
                  <div>
                    <span className="block text-xs">Stock Adjustment</span>
                    <span className="text-[10px] text-muted-foreground">Correction</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Quantity & Reference Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  max={movementType === "issued" && selectedPart ? selectedPart.quantityInStock : 999}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                  className="h-9 text-xs font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Reference # (PO/WO) *</Label>
                <Input
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. WO-2026-088"
                  className="h-9 text-xs font-mono uppercase"
                  required
                />
              </div>
            </div>

            {/* Notes / Reason */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notes / Work Order Description</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="State the reason, equipment S/N, or clinical procedure..."
                className="text-xs min-h-[60px] resize-none"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="h-8 text-xs bg-primary text-primary-foreground font-bold"
              >
                {submitting ? "Saving..." : "Commit Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
