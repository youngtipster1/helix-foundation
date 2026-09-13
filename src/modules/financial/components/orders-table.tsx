import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Edit2,
  Archive,
  Eye,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Building2,
  Wrench,
  Calendar,
  Layers,
  Filter,
  Download,
  Clock,
  CheckSquare,
  AlertCircle,
  Inbox,
  Package,
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
import { Order, OrderCategory, OrderStatus } from "../types";
import { OrderStatusBadge } from "./order-status-badge";
import { ColumnFilter } from "@/components/data-table/column-filter";
import { RowActionsMenu } from "@/components/data-table/row-actions-menu";
import { cn } from "@/lib/utils";

export interface OrdersTableProps {
  orders: Order[];
  isAdmin: boolean;
  currentUserId?: string | undefined;
  onAddOrder?: (() => void) | undefined;
  onViewOrder?: ((order: Order) => void) | undefined;
  onEditOrder?: ((order: Order) => void) | undefined;
  onApproveOrder?: ((order: Order) => void) | undefined;
  onSendBackOrder?: ((order: Order) => void) | undefined;
  onFinalApproveOrder?: ((order: Order) => void) | undefined;
  onArchiveOrder?: ((order: Order) => void) | undefined;
  onUnarchiveOrder?: ((order: Order) => void) | undefined;
  onExportCsv?: (() => void) | undefined;
}

export function OrdersTable({
  orders,
  isAdmin,
  currentUserId,
  onAddOrder,
  onViewOrder,
  onEditOrder,
  onApproveOrder,
  onSendBackOrder,
  onFinalApproveOrder,
  onArchiveOrder,
  onUnarchiveOrder,
  onExportCsv,
}: OrdersTableProps) {
  // Tabs:
  // USER: "active" | "sent_back" | "completed"
  // ADMIN: "pending" | "active" | "completed" | "archived"
  const defaultTab = isAdmin ? "pending" : "active";
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[] | undefined>>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 whenever tab or filter criteria change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, selectedCategory, columnFilters]);

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

  // 1. Data Visibility Filtering:
  // USER can only see their own orders (requestedById === currentUserId)
  // ADMIN can see all orders
  const scopedOrders = useMemo(() => {
    if (isAdmin) return orders;
    if (!currentUserId) return [];
    return orders.filter((o) => o.requestedById === currentUserId);
  }, [orders, isAdmin, currentUserId]);

  // Unique values for each filterable column header
  const uniqueFilterValues = useMemo(() => {
    return {
      orderNumber: Array.from(new Set(scopedOrders.map((o) => o.orderNumber))).sort(),
      requestedByName: Array.from(new Set(scopedOrders.map((o) => o.requestedByName))).sort(),
      dateRaised: Array.from(
        new Set(scopedOrders.map((o) => new Date(o.dateRaised).toISOString().split("T")[0]!)),
      ).sort(),
      requisitionNumber: Array.from(
        new Set(scopedOrders.map((o) => o.requisition?.requisitionNumber || "-")),
      ).sort(),
      supplier: Array.from(
        new Set(scopedOrders.flatMap((o) => o.items.map((it) => it.supplierName)).filter(Boolean)),
      ).sort(),
      status: Array.from(new Set(scopedOrders.map((o) => o.status))).sort(),
      category: Array.from(new Set(scopedOrders.map((o) => o.category))).sort(),
      poNumber: Array.from(
        new Set(
          scopedOrders.map((o) =>
            o.purchaseOrderIds?.length ? `${o.purchaseOrderIds.length} PO(s)` : "-",
          ),
        ),
      ).sort(),
    };
  }, [scopedOrders]);

  // Tab counts
  const tabCounts = useMemo(() => {
    if (isAdmin) {
      return {
        pending: scopedOrders.filter((o) => o.status === "SUBMITTED" && !o.isArchived).length,
        active: scopedOrders.filter(
          (o) => o.status !== "SUBMITTED" && o.status !== "COMPLETED" && !o.isArchived,
        ).length,
        completed: scopedOrders.filter((o) => o.status === "COMPLETED" && !o.isArchived).length,
        archived: scopedOrders.filter((o) => o.isArchived).length,
      };
    } else {
      return {
        active: scopedOrders.filter(
          (o) => o.status !== "SENT_BACK" && o.status !== "COMPLETED" && !o.isArchived,
        ).length,
        sent_back: scopedOrders.filter((o) => o.status === "SENT_BACK" && !o.isArchived).length,
        completed: scopedOrders.filter((o) => o.status === "COMPLETED" && !o.isArchived).length,
      };
    }
  }, [scopedOrders, isAdmin]);

  // Filter by Tab, Search, Category, and ColumnFilters
  const filteredOrders = useMemo(() => {
    return scopedOrders.filter((order) => {
      // Tab filter
      if (isAdmin) {
        if (activeTab === "pending" && (order.status !== "SUBMITTED" || order.isArchived)) return false;
        if (
          activeTab === "active" &&
          (order.status === "SUBMITTED" || order.status === "COMPLETED" || order.isArchived)
        )
          return false;
        if (activeTab === "completed" && (order.status !== "COMPLETED" || order.isArchived))
          return false;
        if (activeTab === "archived" && !order.isArchived) return false;
      } else {
        if (
          activeTab === "active" &&
          (order.status === "SENT_BACK" || order.status === "COMPLETED" || order.isArchived)
        )
          return false;
        if (activeTab === "sent_back" && (order.status !== "SENT_BACK" || order.isArchived))
          return false;
        if (activeTab === "completed" && (order.status !== "COMPLETED" || order.isArchived))
          return false;
      }

      // Search query
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.requestedByName.toLowerCase().includes(q) ||
        (order.jobNumber && order.jobNumber.toLowerCase().includes(q)) ||
        (order.requisition?.requisitionNumber &&
          order.requisition.requisitionNumber.toLowerCase().includes(q)) ||
        (order.notes && order.notes.toLowerCase().includes(q)) ||
        order.items.some(
          (it) =>
            it.description.toLowerCase().includes(q) ||
            it.supplierName.toLowerCase().includes(q) ||
            (it.partNumber && it.partNumber.toLowerCase().includes(q)),
        );

      if (!matchesSearch) return false;

      // Category
      if (selectedCategory !== "all" && order.category !== selectedCategory) return false;

      // Column Filters
      for (const [colKey, selectedValues] of Object.entries(columnFilters)) {
        if (!selectedValues || selectedValues.length === 0) continue;
        let val = "";
        if (colKey === "orderNumber") val = order.orderNumber;
        else if (colKey === "requestedByName") val = order.requestedByName;
        else if (colKey === "dateRaised")
          val = new Date(order.dateRaised).toISOString().split("T")[0]!;
        else if (colKey === "requisitionNumber") val = order.requisition?.requisitionNumber || "-";
        else if (colKey === "supplier") {
          const uniqueSuppliers = Array.from(new Set(order.items.map((it) => it.supplierName)));
          val = uniqueSuppliers[0] || "-";
        } else if (colKey === "status") val = order.status;
        else if (colKey === "category") val = order.category;
        else if (colKey === "poNumber")
          val = order.purchaseOrderIds?.length ? `${order.purchaseOrderIds.length} PO(s)` : "-";

        if (!selectedValues.includes(val)) return false;
      }

      return true;
    });
  }, [scopedOrders, activeTab, search, selectedCategory, isAdmin, columnFilters]);

  // Pagination computations
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredOrders.length);
  const pageOrders = useMemo(() => {
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, startIndex, endIndex]);

  const selectedOrder = useMemo(() => {
    return scopedOrders.find((o) => o.id === selectedOrderId) || null;
  }, [scopedOrders, selectedOrderId]);

  const handleRowClick = (order: Order) => {
    setSelectedOrderId(order.id === selectedOrderId ? null : order.id);
  };

  const handleEdit = () => {
    if (!selectedOrder) return;
    const isAuthor = currentUserId === selectedOrder.requestedById;
    const canEdit =
      (selectedOrder.status === "DRAFT" || selectedOrder.status === "SENT_BACK") &&
      (isAdmin || isAuthor);

    if (canEdit && onEditOrder) {
      onEditOrder(selectedOrder);
    } else if (onViewOrder) {
      onViewOrder(selectedOrder);
    }
  };

  const handleArchive = () => {
    if (!selectedOrder || !isAdmin) return;
    if (selectedOrder.isArchived) {
      onUnarchiveOrder?.(selectedOrder);
    } else {
      onArchiveOrder?.(selectedOrder);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Role-Based Workflow Tabs ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/60">
          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "pending"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Clock className="size-3.5 text-amber-500" />
                <span>Pending Approval</span>
                {tabCounts.pending !== undefined && tabCounts.pending > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white leading-tight">
                    {tabCounts.pending}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("active")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "active"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Layers className="size-3.5 text-blue-500" />
                <span>Active Orders</span>
                {tabCounts.active !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground leading-tight">
                    {tabCounts.active}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("completed")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "completed"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>Completed</span>
                {tabCounts.completed !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground leading-tight">
                    {tabCounts.completed}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("archived")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "archived"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Archive className="size-3.5 text-stone-500" />
                <span>Archived</span>
                {tabCounts.archived !== undefined && tabCounts.archived > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground leading-tight">
                    {tabCounts.archived}
                  </span>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("active")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "active"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Layers className="size-3.5 text-blue-500" />
                <span>Active Orders</span>
                {tabCounts.active !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground leading-tight">
                    {tabCounts.active}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("sent_back")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "sent_back"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <RotateCcw className="size-3.5 text-rose-500" />
                <span>Sent Back</span>
                {tabCounts.sent_back !== undefined && tabCounts.sent_back > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white leading-tight">
                    {tabCounts.sent_back}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("completed")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "completed"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>Completed</span>
                {tabCounts.completed !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground leading-tight">
                    {tabCounts.completed}
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {/* Search, Filter, Export & Create Order Toolbar */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search orders, vendor, requisition..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-8.5 bg-background"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px] text-xs h-8.5 bg-background">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="PARTS">Parts</SelectItem>
              <SelectItem value="TOOLS">Tools</SelectItem>
              <SelectItem value="LABOUR">Labour</SelectItem>
              <SelectItem value="THIRD_PARTY_SERVICE">3rd-Party Service</SelectItem>
            </SelectContent>
          </Select>

          {Object.values(columnFilters).filter((v) => v !== undefined).length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setColumnFilters({})}
              className="h-8.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </Button>
          )}

          {onExportCsv && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCsv}
              className="h-8.5 gap-1.5 text-xs cursor-pointer"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          )}

          {/* Primary Create Order Button */}
          <Button
            size="sm"
            onClick={onAddOrder}
            className="h-8.5 gap-1.5 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground shadow-xs px-3"
          >
            <Plus className="size-3.5" />
            <span>Create Order</span>
          </Button>
        </div>
      </div>

      {/* ── 17-Column Order List Ledger with Unified Actions in Center ────── */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-muted/60 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider select-none">
                <th className="py-2 px-2.5 text-center w-12">SN</th>
                <th className="py-2 px-2.5">
                  <ColumnFilter
                    label="Order code"
                    values={uniqueFilterValues.orderNumber}
                    selected={columnFilters.orderNumber}
                    onChange={(val) => handleColumnFilterChange("orderNumber", val)}
                  />
                </th>
                <th className="py-2 px-2.5">
                  <ColumnFilter
                    label="Requested by"
                    values={uniqueFilterValues.requestedByName}
                    selected={columnFilters.requestedByName}
                    onChange={(val) => handleColumnFilterChange("requestedByName", val)}
                  />
                </th>
                <th className="py-2 px-2.5">
                  <ColumnFilter
                    label="Date raised"
                    values={uniqueFilterValues.dateRaised}
                    selected={columnFilters.dateRaised}
                    onChange={(val) => handleColumnFilterChange("dateRaised", val)}
                  />
                </th>

                {/* Unified Action Button positioned in the middle of the table */}
                <th className="py-2 px-2.5 text-center w-28 text-foreground font-bold">
                  Actions
                </th>

                <th className="py-2 px-2.5 max-w-[180px]">Note</th>
                <th className="py-2 px-2.5 text-center">Quantity</th>
                <th className="py-2 px-2.5 text-center">Order age</th>
                <th className="py-2 px-2.5">
                  <ColumnFilter
                    label="Requisition number"
                    values={uniqueFilterValues.requisitionNumber}
                    selected={columnFilters.requisitionNumber}
                    onChange={(val) => handleColumnFilterChange("requisitionNumber", val)}
                  />
                </th>
                <th className="py-2 px-2.5">
                  <ColumnFilter
                    label="Supplier"
                    values={uniqueFilterValues.supplier}
                    selected={columnFilters.supplier}
                    onChange={(val) => handleColumnFilterChange("supplier", val)}
                  />
                </th>
                <th className="py-2 px-2.5 text-right">Total Cost</th>
                <th className="py-2 px-2.5 text-right">Gross Total Cost</th>
                <th className="py-2 px-2.5">
                  <ColumnFilter
                    label="PO Number"
                    values={uniqueFilterValues.poNumber}
                    selected={columnFilters.poNumber}
                    onChange={(val) => handleColumnFilterChange("poNumber", val)}
                  />
                </th>
                <th className="py-2 px-2.5">Approval date</th>
                <th className="py-2 px-2.5 text-center">
                  <ColumnFilter
                    label="Order Status"
                    values={uniqueFilterValues.status}
                    selected={columnFilters.status}
                    onChange={(val) => handleColumnFilterChange("status", val)}
                  />
                </th>
                <th className="py-2 px-2.5 text-center">
                  <ColumnFilter
                    label="Order Category"
                    values={uniqueFilterValues.category}
                    selected={columnFilters.category}
                    onChange={(val) => handleColumnFilterChange("category", val)}
                  />
                </th>
                <th className="py-2 px-2.5 text-center">Delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-sans text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-muted-foreground">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Package className="size-7 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="font-semibold text-foreground text-xs">No Orders Found</p>
                      <p className="text-[11px] text-muted-foreground">
                        No orders in this tab match your current filter parameters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageOrders.map((order, index) => {
                  const isSelected = order.id === selectedOrderId;
                  const isAuthor = currentUserId === order.requestedById;
                  const canEditRow =
                    (order.status === "DRAFT" || order.status === "SENT_BACK") &&
                    (isAdmin || isAuthor);

                  // Calculations
                  const totalQty = order.items.reduce((s, it) => s + (it.orderedQuantity || 0), 0);
                  const totalFulfilled = order.items.reduce(
                    (s, it) => s + (it.fulfilledQuantity || 0),
                    0,
                  );

                  // Order Age in days
                  const ageDays = Math.max(
                    0,
                    Math.floor(
                      (Date.now() - new Date(order.dateRaised).getTime()) / (1000 * 60 * 60 * 24),
                    ),
                  );

                  // Supplier display
                  const uniqueSuppliers = Array.from(new Set(order.items.map((it) => it.supplierName)));
                  const supplierDisplay =
                    uniqueSuppliers.length === 0
                      ? "-"
                      : uniqueSuppliers.length === 1
                      ? uniqueSuppliers[0]
                      : `${uniqueSuppliers[0]} (+${uniqueSuppliers.length - 1} more)`;

                  // PO numbers display
                  const poDisplay =
                    order.purchaseOrderIds && order.purchaseOrderIds.length > 0
                      ? `${order.purchaseOrderIds.length} PO(s)`
                      : "-";

                  // Delivery status
                  let deliveryBadge = (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-muted-foreground">
                      Pending
                    </span>
                  );
                  if (order.status === "COMPLETED") {
                    deliveryBadge = (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        Delivered In Full
                      </span>
                    );
                  } else if (order.status === "PARTIALLY_FULFILLED" || totalFulfilled > 0) {
                    deliveryBadge = (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-400">
                        Partially Fulfilled ({totalFulfilled}/{totalQty})
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleRowClick(order)}
                      onDoubleClick={() => onViewOrder?.(order)}
                      className={cn(
                        "transition-colors cursor-pointer select-none",
                        isSelected
                          ? "bg-primary/10 hover:bg-primary/15 font-medium"
                          : "hover:bg-accent/40",
                      )}
                    >
                      {/* 1. SN */}
                      <td className="py-2 px-2.5 text-center text-muted-foreground font-mono text-xs">
                        {startIndex + index + 1}
                      </td>

                      {/* 2. Order code */}
                      <td className="py-2 px-2.5 font-mono font-bold text-foreground text-xs">
                        {order.orderNumber}
                      </td>

                      {/* 3. Requested by */}
                      <td className="py-2 px-2.5 text-foreground font-semibold text-xs">
                        {order.requestedByName}
                      </td>

                      {/* 4. Date raised */}
                      <td className="py-2 px-2.5 font-mono text-muted-foreground text-xs">
                        {new Date(order.dateRaised).toISOString().split("T")[0]}
                      </td>

                      {/* 5. Unified Row Actions Dropdown in Center */}
                      <td
                        className="py-2 px-2.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RowActionsMenu
                          label="Actions"
                          align="start"
                          actions={[
                            {
                              label: "View Details",
                              icon: Eye,
                              onClick: () => onViewOrder?.(order),
                            },
                            {
                              label: "Edit Order",
                              icon: Edit2,
                              disabled: !canEditRow,
                              onClick: () => onEditOrder?.(order),
                            },
                            isAdmin && order.status === "SUBMITTED"
                              ? {
                                  label: "Review & Approve",
                                  icon: CheckCircle2,
                                  variant: "success",
                                  onClick: () => onApproveOrder?.(order),
                                }
                              : null,
                            isAdmin && order.status === "SUBMITTED"
                              ? {
                                  label: "Send Back for Revision",
                                  icon: RotateCcw,
                                  variant: "warning",
                                  onClick: () => onSendBackOrder?.(order),
                                }
                              : null,
                            isAdmin && order.requisition?.status === "PENDING_FINAL_APPROVAL"
                              ? {
                                  label: "Final PO Authorization",
                                  icon: ShieldCheck,
                                  variant: "success",
                                  onClick: () => onFinalApproveOrder?.(order),
                                }
                              : null,
                            isAdmin
                              ? {
                                  label: order.isArchived ? "Unarchive Order" : "Archive Order",
                                  icon: Archive,
                                  variant: order.isArchived ? "default" : "destructive",
                                  onClick: () => {
                                    if (order.isArchived) {
                                      onUnarchiveOrder?.(order);
                                    } else {
                                      onArchiveOrder?.(order);
                                    }
                                  },
                                }
                              : null,
                          ]}
                        />
                      </td>

                      {/* 6. Note */}
                      <td
                        className="py-2 px-2.5 max-w-[180px] truncate text-muted-foreground text-xs"
                        title={order.notes}
                      >
                        {order.notes || "-"}
                      </td>

                      {/* 7. Quantity */}
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-foreground text-xs">
                        {totalQty}
                      </td>

                      {/* 8. Order age */}
                      <td className="py-2 px-2.5 text-center font-mono text-xs text-muted-foreground">
                        {ageDays}d
                      </td>

                      {/* 9. Requisition number */}
                      <td className="py-2 px-2.5 font-mono font-bold text-foreground text-xs">
                        {order.requisition?.requisitionNumber || "-"}
                      </td>

                      {/* 10. Supplier */}
                      <td
                        className="py-2 px-2.5 text-foreground font-medium text-xs max-w-[200px] truncate"
                        title={supplierDisplay}
                      >
                        {supplierDisplay}
                      </td>

                      {/* 11. Total Cost (Net) */}
                      <td className="py-2 px-2.5 text-right font-mono text-xs text-muted-foreground">
                        ₦{order.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      {/* 12. Gross Total Cost (Inc VAT) */}
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-xs text-primary">
                        ₦{order.grossTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      {/* 13. PO Number */}
                      <td className="py-2 px-2.5 font-mono text-foreground font-bold text-xs">
                        {order.requisition?.status === "FINAL_APPROVED" ? poDisplay : "-"}
                      </td>

                      {/* 14. Approval date */}
                      <td className="py-2 px-2.5 font-mono text-muted-foreground text-xs">
                        {order.approvedAt
                          ? new Date(order.approvedAt).toISOString().split("T")[0]
                          : "-"}
                      </td>

                      {/* 15. Order Status */}
                      <td className="py-2 px-2.5 text-center">
                        <OrderStatusBadge status={order.status} />
                      </td>

                      {/* 16. Order Category */}
                      <td className="py-2 px-2.5 text-center">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded bg-muted">
                          {order.category.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* 17. Delivery */}
                      <td className="py-2 px-2.5 text-center">{deliveryBadge}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination & Valuation Footer */}
        <div className="px-3.5 py-2.5 bg-muted/20 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Showing <strong className="text-foreground">{filteredOrders.length > 0 ? startIndex + 1 : 0}</strong> to{" "}
              <strong className="text-foreground">{endIndex}</strong> of{" "}
              <strong className="text-foreground">{filteredOrders.length}</strong> Orders
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

          <div className="flex items-center gap-3">
            <div className="font-mono text-xs hidden lg:block">
              Total Valuation (Gross):{" "}
              <strong className="text-primary font-bold">
                ₦
                {filteredOrders
                  .reduce((s, o) => s + (o.grossTotal || 0), 0)
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
                className="h-8 px-2.5 text-xs gap-1 cursor-pointer disabled:cursor-not-allowed"
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
