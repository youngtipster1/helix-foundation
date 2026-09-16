import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Upload,
  Archive,
  RotateCcw,
  Eye,
  Edit2,
  Wrench,
  AlertCircle,
  Building2,
} from "lucide-react";
import { Asset } from "../types";
import { EquipmentStatusBadge, ContractStatusBadge, WarrantyStatusBadge } from "./status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/auth-context";
import { RowActionsMenu } from "@/components/data-table/row-actions-menu";
import { TablePagination } from "@/components/data-table/table-pagination";

interface AssetTableProps {
  assets: Asset[];
  onViewAsset: (asset: Asset) => void;
  onEditAsset: (asset: Asset) => void;
  onAddAsset: () => void;
  onArchiveAsset: (asset: Asset) => void;
  onUnarchiveAsset: (asset: Asset) => void;
  onLogJob: (asset: Asset) => void;
  onBatchUpload: () => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  onViewAsset,
  onEditAsset,
  onAddAsset,
  onArchiveAsset,
  onUnarchiveAsset,
  onLogJob,
  onBatchUpload,
}) => {
  const { user } = useAuth();
  const userRole = user?.role || "User";
  const isSuperAdmin = userRole === "Super Admin";
  const isAdmin = userRole === "Admin" || userRole === "Asset Admin" || isSuperAdmin;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [warrantyFilter, setWarrantyFilter] = useState<string>("all");
  const [contractFilter, setContractFilter] = useState<string>("all");
  const [modalityFilter, setModalityFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);

  // Extract unique modalities
  const uniqueModalities = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => {
      if (a.modality) set.add(a.modality);
    });
    return Array.from(set).sort();
  }, [assets]);

  // Filtering
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Archive filter
      if (showArchived) {
        if (!asset.isArchived) return false;
      } else {
        if (asset.isArchived) return false;
      }

      // Status filter
      if (statusFilter !== "all" && asset.equipmentStatus !== statusFilter) {
        return false;
      }

      // Warranty filter
      if (warrantyFilter !== "all" && asset.warrantyStatus !== warrantyFilter) {
        return false;
      }

      // Contract filter
      if (contractFilter !== "all" && asset.contractStatus !== contractFilter) {
        return false;
      }

      // Modality filter
      if (modalityFilter !== "all" && asset.modality !== modalityFilter) {
        return false;
      }

      // Search query (includes supplier, equipment #, serial, model, OEM)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const supplierText = (asset.supplier || asset.customer || "").toLowerCase();
        const match =
          asset.equipmentNumber.toLowerCase().includes(q) ||
          asset.serialNumber.toLowerCase().includes(q) ||
          asset.oem.toLowerCase().includes(q) ||
          asset.model.toLowerCase().includes(q) ||
          supplierText.includes(q) ||
          (asset.supplierCode && asset.supplierCode.toLowerCase().includes(q)) ||
          asset.location.toLowerCase().includes(q) ||
          (asset.contractNumber && asset.contractNumber.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [
    assets,
    showArchived,
    statusFilter,
    warrantyFilter,
    contractFilter,
    modalityFilter,
    searchQuery,
  ]);

  const activeCount = assets.filter((a) => !a.isArchived).length;
  const archivedCount = assets.filter((a) => a.isArchived).length;

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Reset to page 1 when any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, warrantyFilter, contractFilter, modalityFilter, showArchived]);

  const totalItems = filteredAssets.length;
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const activePage = Math.min(currentPage, pageCount);

  const paginatedAssets = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredAssets.slice(start, start + pageSize);
  }, [filteredAssets, activePage, pageSize]);

  const fromItem = totalItems === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const toItem = Math.min(totalItems, activePage * pageSize);

  return (
    <div className="space-y-3">
      {/* Top Filter and Action Bar - Compact System Design */}
      <div className="bg-card p-3 sm:p-3.5 rounded-xl border border-border space-y-2.5 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-0 w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by equipment #, serial, OEM, model, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8 w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Archive toggle */}
            <Button
              variant={showArchived ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className="text-xs h-8 gap-1.5"
            >
              <Archive className="h-3 w-3 text-muted-foreground" />
              <span>{showArchived ? "Archived" : "Show Archived"}</span>
              <Badge variant="outline" className="text-[10px] ml-0.5 px-1 py-0 h-3.5">
                {showArchived ? archivedCount : activeCount}
              </Badge>
            </Button>

            {/* Batch Upload (Admin only) */}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBatchUpload}
                className="text-xs h-8 gap-1.5"
              >
                <Upload className="h-3 w-3" />
                <span className="hidden sm:inline">Batch Import</span>
              </Button>
            )}

            {/* Add Asset (Admin only) */}
            {isAdmin && (
              <Button
                size="sm"
                onClick={onAddAsset}
                className="text-xs h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Equipment</span>
              </Button>
            )}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/60 text-xs">
          <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1 mr-1">
            <Filter className="h-3 w-3" /> Filter:
          </span>

          {/* Equipment Status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 text-xs w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Up">Up</SelectItem>
              <SelectItem value="Partially Up">Partially Up</SelectItem>
              <SelectItem value="Down">Down</SelectItem>
              <SelectItem value="Unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>

          {/* Warranty Status */}
          <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
            <SelectTrigger className="h-7 text-xs w-[130px]">
              <SelectValue placeholder="Warranty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Warranties</SelectItem>
              <SelectItem value="Warranty">In Warranty</SelectItem>
              <SelectItem value="Out of Warranty">Out of Warranty</SelectItem>
            </SelectContent>
          </Select>

          {/* Contract Status */}
          <Select value={contractFilter} onValueChange={setContractFilter}>
            <SelectTrigger className="h-7 text-xs w-[130px]">
              <SelectValue placeholder="Contract" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contracts</SelectItem>
              <SelectItem value="In Contract">In Contract</SelectItem>
              <SelectItem value="Out of Contract">Out of Contract</SelectItem>
            </SelectContent>
          </Select>

          {/* Modality */}
          <Select value={modalityFilter} onValueChange={setModalityFilter}>
            <SelectTrigger className="h-7 text-xs w-[140px]">
              <SelectValue placeholder="Modality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modalities</SelectItem>
              {uniqueModalities.map((mod) => (
                <SelectItem key={mod} value={mod}>
                  {mod}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(statusFilter !== "all" ||
            warrantyFilter !== "all" ||
            contractFilter !== "all" ||
            modalityFilter !== "all" ||
            searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setWarrantyFilter("all");
                setContractFilter("all");
                setModalityFilter("all");
                setSearchQuery("");
              }}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </Button>
          )}

          <div className="ml-auto text-[11px] text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{totalItems === 0 ? 0 : `${fromItem}–${toItem}`}</span> of {totalItems} assets
          </div>
        </div>
      </div>

      {/* Table Section with Supplier Column */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto relative">
          <table className="min-w-[1600px] w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">
                <th className="py-2.5 px-3">SN</th>
                <th className="py-2.5 px-3">Equipment Number</th>
                <th className="py-2.5 px-3">Serial Number</th>
                <th className="py-2.5 px-3">OEM</th>
                <th className="py-2.5 px-3">Modality</th>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Equipment Status</th>
                <th className="py-2.5 px-3">Order Number</th>
                <th className="py-2.5 px-3">PO Number</th>
                <th className="py-2.5 px-3">Installation Date</th>
                <th className="py-2.5 px-3">Warranty Status</th>
                <th className="py-2.5 px-3">Warranty Start Date</th>
                <th className="py-2.5 px-3">Warranty End Date</th>
                <th className="py-2.5 px-3">Contract Status</th>
                <th className="py-2.5 px-3">Contract Number</th>
                <th className="py-2.5 px-3">Contract Start Date</th>
                <th className="py-2.5 px-3">Contract End Date</th>
                <th className="py-2.5 px-3">Contract Order Number</th>
                <th className="py-2.5 px-3">Contract PO Number</th>
                <th className="py-2.5 px-3">Next PPM Date</th>
                <th className="py-2.5 px-3">PPM Schedule</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3 text-right sticky right-0 bg-muted/90 backdrop-blur-xs shadow-xs z-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-medium text-foreground">
              {totalItems === 0 ? (
                <tr>
                  <td colSpan={25} className="py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertCircle className="size-5 text-muted-foreground/60" />
                      <p className="text-xs font-medium">No assets matching your filters</p>
                      <p className="text-[11px] text-muted-foreground">
                        Try modifying search query or reset active filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((asset, idx) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => onViewAsset(asset)}
                  >
                    {/* 1. SN */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      {(activePage - 1) * pageSize + idx + 1}
                    </td>

                    {/* 2. Equipment Number */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-foreground group-hover:text-primary transition-colors">
                      {asset.equipmentNumber}
                    </td>

                    {/* 3. Serial Number */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      {asset.serialNumber || "—"}
                    </td>

                    {/* 4. OEM */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-foreground">
                      {asset.oem}
                    </td>

                    {/* 5. Modality */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge variant="outline" className="font-normal text-[10px] py-0 px-1.5">
                        {asset.modality}
                      </Badge>
                    </td>

                    {/* 6. Model */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground truncate max-w-[160px]">
                      {asset.model}
                    </td>

                    {/* 7. Equipment Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <EquipmentStatusBadge status={asset.equipmentStatus} />
                    </td>

                    {/* 8. Order Number */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      {asset.orderNumber || asset.contractOrderNumber || "—"}
                    </td>

                    {/* 9. PO Number */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      {asset.poNumber || asset.contractPoNumber || "—"}
                    </td>

                    {/* 10. Installation Date */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-muted-foreground">
                      {asset.installationDate || "—"}
                    </td>

                    {/* 11. Warranty Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <WarrantyStatusBadge status={asset.warrantyStatus} />
                    </td>

                    {/* 12. Warranty Start Date */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-muted-foreground">
                      {asset.warrantyStartDate || "—"}
                    </td>

                    {/* 13. Warranty End Date */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-muted-foreground">
                      {asset.warrantyEndDate || "—"}
                    </td>

                    {/* 14. Contract Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <ContractStatusBadge status={asset.contractStatus} />
                    </td>

                    {/* 15. Contract Number */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      {asset.contractNumber || "—"}
                    </td>

                    {/* 16. Contract Start Date */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-muted-foreground">
                      {asset.contractStartDate || "—"}
                    </td>

                    {/* 17. Contract End Date */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-muted-foreground">
                      {asset.contractEndDate || "—"}
                    </td>

                    {/* 18. Contract Order Number */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      {asset.contractOrderNumber || "—"}
                    </td>

                    {/* 19. Contract PO Number */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      {asset.contractPoNumber || "—"}
                    </td>

                    {/* 20. Next PPM Date */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-muted-foreground">
                      {asset.nextPpmDate || "—"}
                    </td>

                    {/* 21. PPM Schedule */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                      {asset.ppmSchedule ? (
                        <Badge variant="secondary" className="font-normal text-[10px] py-0 px-1.5">
                          {asset.ppmSchedule}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* 22. Customer */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-foreground truncate max-w-[180px]">
                      {asset.customer || asset.supplier || "—"}
                    </td>

                    {/* 23. Location */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground truncate max-w-[160px]">
                      {asset.location || "—"}
                    </td>

                    {/* 24. Region */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                      {asset.region || "—"}
                    </td>

                    {/* 25. Actions */}
                    <td
                      className="py-2.5 px-3 whitespace-nowrap text-right sticky right-0 bg-card/95 backdrop-blur-xs shadow-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end">
                        <RowActionsMenu
                          label="Actions"
                          align="end"
                          actions={[
                            {
                              label: "View Details",
                              icon: Eye,
                              onClick: () => onViewAsset(asset),
                            },
                            {
                              label: "Equipment Service",
                              icon: Wrench,
                              onClick: () => onLogJob(asset),
                              separatorAfter: isAdmin,
                            },
                            {
                              label: "Edit Equipment",
                              icon: Edit2,
                              onClick: () => onEditAsset(asset),
                              hidden: !isAdmin || asset.isArchived,
                            },
                            {
                              label: "Archive Equipment",
                              icon: Archive,
                              onClick: () => onArchiveAsset(asset),
                              variant: "destructive",
                              hidden: !isAdmin || asset.isArchived,
                            },
                            {
                              label: "Unarchive Equipment",
                              icon: RotateCcw,
                              onClick: () => onUnarchiveAsset(asset),
                              variant: "success",
                              hidden: !isSuperAdmin || !asset.isArchived,
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalItems > 0 && (
          <TablePagination
            page={activePage}
            pageCount={pageCount}
            total={totalItems}
            from={fromItem}
            to={toItem}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};
