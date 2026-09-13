import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Receipt,
  PackageCheck,
  Eye,
  ExternalLink,
  Building2,
  Calendar,
  Filter,
  Layers,
  ArrowUpRight,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PurchaseOrder, PurchaseOrderStatus } from "../types";
import { OrderStatusBadge } from "./order-status-badge";
import { ColumnFilter } from "@/components/data-table/column-filter";
import { RowActionsMenu } from "@/components/data-table/row-actions-menu";
import { cn } from "@/lib/utils";

export interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrder[];
  isAdmin: boolean;
  onViewPO?: ((po: PurchaseOrder) => void) | undefined;
  onRecordDelivery?: ((po: PurchaseOrder) => void) | undefined;
  onExportCsv?: (() => void) | undefined;
}

export function PurchaseOrdersTable({
  purchaseOrders,
  isAdmin,
  onViewPO,
  onRecordDelivery,
  onExportCsv,
}: PurchaseOrdersTableProps) {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [columnFilters, setColumnFilters] = useState<Record<string, string[] | undefined>>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatus, columnFilters]);

  const handleColumnFilterChange = (colKey: string, next: string[] | undefined) => {
    setColumnFilters((prev) => {
      const draft = { ...prev };
      if (next === undefined) {
        delete draft[colKey];
      } else {
        draft[colKey] = next;
      }
      return draft;
    });
  };

  const uniqueFilterValues = useMemo(() => {
    return {
      poNumber: Array.from(new Set(purchaseOrders.map((p) => p.poNumber))).sort(),
      sourceOrderNumber: Array.from(new Set(purchaseOrders.map((p) => p.sourceOrderNumber))).sort(),
      supplierName: Array.from(new Set(purchaseOrders.map((p) => p.supplierName))).sort(),
      status: Array.from(new Set(purchaseOrders.map((p) => p.status))).sort(),
    };
  }, [purchaseOrders]);

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        po.poNumber.toLowerCase().includes(q) ||
        po.sourceOrderNumber.toLowerCase().includes(q) ||
        po.supplierName.toLowerCase().includes(q) ||
        po.items.some((it) => it.description.toLowerCase().includes(q));

      const matchesStatus = selectedStatus === "all" || po.status === selectedStatus;

      if (!matchesSearch || !matchesStatus) return false;

      // Column filters
      for (const [colKey, selectedValues] of Object.entries(columnFilters)) {
        if (!selectedValues || selectedValues.length === 0) continue;
        let val = "";
        if (colKey === "poNumber") val = po.poNumber;
        else if (colKey === "sourceOrderNumber") val = po.sourceOrderNumber;
        else if (colKey === "supplierName") val = po.supplierName;
        else if (colKey === "status") val = po.status;

        if (!selectedValues.includes(val)) return false;
      }

      return true;
    });
  }, [purchaseOrders, search, selectedStatus, columnFilters]);

  // Pagination computations
  const totalPages = Math.max(1, Math.ceil(filteredPOs.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredPOs.length);
  const pagePOs = useMemo(() => {
    return filteredPOs.slice(startIndex, endIndex);
  }, [filteredPOs, startIndex, endIndex]);

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-0 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by PO #, source order #, vendor, or item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-9 bg-background w-full"
            />
          </div>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[160px] text-xs h-9 bg-background shrink-0">
              <SelectValue placeholder="PO Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ISSUED">Issued (Pending)</SelectItem>
              <SelectItem value="PARTIALLY_FULFILLED">Partially Fulfilled</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {onExportCsv && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCsv}
            className="h-9 gap-1.5 text-xs shrink-0 w-full sm:w-auto"
          >
            <Download className="size-3.5" />
            <span>Export Registry</span>
          </Button>
        )}
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-muted/60 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider select-none">
                <th className="py-2 px-3">
                  <ColumnFilter
                    label="PO Number"
                    values={uniqueFilterValues.poNumber}
                    selected={columnFilters.poNumber}
                    onChange={(val) => handleColumnFilterChange("poNumber", val)}
                  />
                </th>
                <th className="py-2 px-3">
                  <ColumnFilter
                    label="Source Order"
                    values={uniqueFilterValues.sourceOrderNumber}
                    selected={columnFilters.sourceOrderNumber}
                    onChange={(val) => handleColumnFilterChange("sourceOrderNumber", val)}
                  />
                </th>
                <th className="py-2 px-3">
                  <ColumnFilter
                    label="Supplier / Vendor"
                    values={uniqueFilterValues.supplierName}
                    selected={columnFilters.supplierName}
                    onChange={(val) => handleColumnFilterChange("supplierName", val)}
                  />
                </th>

                {/* Actions column positioned in the middle */}
                <th className="py-2 px-3 text-center w-28 text-foreground font-bold">
                  Actions
                </th>

                <th className="py-2 px-3 text-center">Items</th>
                <th className="py-2 px-3">Target Date</th>
                <th className="py-2 px-3 text-right">Gross Valuation (₦)</th>
                <th className="py-2 px-3 text-center min-w-[130px]">Fulfillment</th>
                <th className="py-2 px-3 text-center">
                  <ColumnFilter
                    label="Status"
                    values={uniqueFilterValues.status}
                    selected={columnFilters.status}
                    onChange={(val) => handleColumnFilterChange("status", val)}
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="font-semibold text-foreground text-xs">No Purchase Orders Found</p>
                      <p className="text-[11px] text-muted-foreground">
                        Purchase orders will appear here once approved requests undergo final authorization.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagePOs.map((po) => {
                  const totalOrdered = po.items.reduce((s, i) => s + i.orderedQuantity, 0);
                  const totalFulfilled = po.items.reduce((s, i) => s + i.fulfilledQuantity, 0);
                  const pct = totalOrdered > 0 ? Math.round((totalFulfilled / totalOrdered) * 100) : 0;

                  return (
                    <tr
                      key={po.id}
                      onClick={() => onViewPO?.(po)}
                      className="hover:bg-muted/40 transition-colors cursor-pointer group"
                    >
                      {/* PO Number */}
                      <td className="py-2 px-3 font-mono font-bold text-primary text-xs group-hover:underline">
                        {po.poNumber}
                      </td>

                      {/* Source Order */}
                      <td className="py-2 px-3 font-mono font-semibold text-muted-foreground text-xs">
                        {po.sourceOrderNumber}
                      </td>

                      {/* Supplier */}
                      <td className="py-2 px-3">
                        <div className="font-semibold text-foreground text-xs">{po.supplierName}</div>
                        <div className="text-[11px] text-muted-foreground">{po.supplierEmail || "No Email"}</div>
                      </td>

                      {/* Unified Row Actions Dropdown in Middle */}
                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <RowActionsMenu
                          label="Actions"
                          align="start"
                          actions={[
                            {
                              label: "View PO Details",
                              icon: Eye,
                              onClick: () => onViewPO?.(po),
                            },
                            isAdmin && po.status !== "COMPLETED"
                              ? {
                                  label: "Record Delivery",
                                  icon: PackageCheck,
                                  variant: "success",
                                  onClick: () => onRecordDelivery?.(po),
                                }
                              : null,
                          ]}
                        />
                      </td>

                      {/* Items */}
                      <td className="py-2 px-3 text-center font-mono font-bold text-xs">
                        {po.items.length}
                      </td>

                      {/* Target Date */}
                      <td className="py-2 px-3 font-mono text-muted-foreground text-xs">
                        {po.targetDeliveryDate}
                      </td>

                      {/* Gross Valuation */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-foreground text-xs">
                        ₦{po.grossTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Fulfillment Progress */}
                      <td className="py-2 px-3 text-center min-w-[130px]">
                        <div className="space-y-1">
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-300",
                                pct === 100 ? "bg-emerald-500" : "bg-primary",
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-muted-foreground block">
                            {totalFulfilled} / {totalOrdered} ({pct}%)
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 text-center">
                        <OrderStatusBadge status={po.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination & Valuation Footer */}
        <div className="px-3.5 py-2.5 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3">
            <span>
              Showing <strong className="text-foreground">{filteredPOs.length > 0 ? startIndex + 1 : 0}</strong> to{" "}
              <strong className="text-foreground">{endIndex}</strong> of{" "}
              <strong className="text-foreground">{filteredPOs.length}</strong> Purchase Orders
            </span>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-15 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="font-mono text-xs hidden lg:block">
              Total PO Valuation:{" "}
              <strong className="text-foreground font-bold">
                ₦
                {filteredPOs
                  .reduce((s, p) => s + p.grossTotal, 0)
                  .toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </strong>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="h-7.5 px-2 text-xs gap-1 cursor-pointer disabled:cursor-not-allowed"
                title="Previous page"
              >
                <ChevronLeft className="size-3.5" />
                <span>Prev</span>
              </Button>

              <span className="text-xs px-2 font-medium select-none">
                Page <strong className="text-foreground">{safePage}</strong> of{" "}
                <strong className="text-foreground">{totalPages}</strong>
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="h-7.5 px-2 text-xs gap-1 cursor-pointer disabled:cursor-not-allowed"
                title="Next page"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
