import React, { useState, useMemo } from "react";
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

  return (
    <div className="space-y-3">
      {/* Top Filter and Action Bar - Compact System Design */}
      <div className="bg-card p-3 sm:p-3.5 rounded-xl border border-border space-y-2.5 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by equipment #, serial, OEM, model, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8"
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
            Showing <span className="font-semibold text-foreground">{filteredAssets.length}</span> of {assets.length} assets
          </div>
        </div>
      </div>

      {/* Table Section with Supplier Column */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Equipment #</th>
                <th className="py-2.5 px-3">OEM & Model</th>
                <th className="py-2.5 px-3">Modality</th>
                <th className="py-2.5 px-3">Serial #</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Warranty</th>
                <th className="py-2.5 px-3">Contract</th>
                <th className="py-2.5 px-3">Supplier & Location</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-medium text-foreground">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-muted-foreground">
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
                filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => onViewAsset(asset)}
                  >
                    {/* Equipment # */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-foreground group-hover:text-primary transition-colors">
                        {asset.equipmentNumber}
                      </span>
                      {asset.assetType && (
                        <div className="text-[10px] text-muted-foreground font-normal">
                          {asset.assetType}
                        </div>
                      )}
                    </td>

                    {/* OEM & Model */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-semibold text-foreground">
                        {asset.oem}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-normal truncate max-w-[170px]">
                        {asset.model}
                      </div>
                    </td>

                    {/* Modality */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge variant="outline" className="font-normal text-[10px] py-0 px-1.5">
                        {asset.modality}
                      </Badge>
                    </td>

                    {/* Serial # */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      {asset.serialNumber}
                    </td>

                    {/* Equipment Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <EquipmentStatusBadge status={asset.equipmentStatus} />
                    </td>

                    {/* Warranty */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <WarrantyStatusBadge status={asset.warrantyStatus} />
                    </td>

                    {/* Contract */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <ContractStatusBadge status={asset.contractStatus} />
                      {asset.contractNumber && (
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {asset.contractNumber}
                        </div>
                      )}
                    </td>

                    {/* Supplier & Location (Changed from Customer to Supplier per user request) */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-medium text-foreground truncate max-w-[200px] flex items-center gap-1">
                        <Building2 className="size-3 text-muted-foreground shrink-0" />
                        <span>{asset.supplier || asset.customer || "GE Healthcare Direct"}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                        {asset.location}, {asset.region}
                      </div>
                    </td>

                    {/* Actions */}
                    <td
                      className="py-2.5 px-3 whitespace-nowrap text-right"
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
      </div>
    </div>
  );
};
