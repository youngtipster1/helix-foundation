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
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { Asset, EquipmentStatus, ContractStatus, WarrantyStatus } from "../types";
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
  // User can view and log jobs, but cannot add/edit/archive

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

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          asset.equipmentNumber.toLowerCase().includes(q) ||
          asset.serialNumber.toLowerCase().includes(q) ||
          asset.oem.toLowerCase().includes(q) ||
          asset.model.toLowerCase().includes(q) ||
          asset.customer.toLowerCase().includes(q) ||
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
    <div className="space-y-4">
      {/* Top Filter and Action Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by equipment #, serial, OEM, model, hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Archive toggle */}
            <Button
              variant={showArchived ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className="text-xs h-9 gap-1.5"
            >
              <Archive className="h-3.5 w-3.5 text-slate-500" />
              <span>{showArchived ? "Viewing Archived" : "Show Archived"}</span>
              <Badge variant="outline" className="text-[10px] ml-1 px-1.5 py-0 h-4">
                {showArchived ? archivedCount : activeCount}
              </Badge>
            </Button>

            {/* Batch Upload (Admin only) */}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBatchUpload}
                className="text-xs h-9 gap-1.5"
              >
                <Upload className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                <span className="hidden sm:inline">Batch Import</span>
              </Button>
            )}

            {/* Add Asset (Admin only) */}
            {isAdmin && (
              <Button
                size="sm"
                onClick={onAddAsset}
                className="text-xs h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Equipment</span>
              </Button>
            )}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1 mr-1">
            <Filter className="h-3 w-3" /> Filters:
          </span>

          {/* Equipment Status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-[140px]">
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
            <SelectTrigger className="h-8 text-xs w-[145px]">
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
            <SelectTrigger className="h-8 text-xs w-[145px]">
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
            <SelectTrigger className="h-8 text-xs w-[150px]">
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
              className="h-8 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            >
              Reset Filters
            </Button>
          )}

          <div className="ml-auto text-[11px] text-slate-500">
            Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredAssets.length}</span> of {assets.length} assets
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Equipment #</th>
                <th className="py-3 px-4">OEM & Model</th>
                <th className="py-3 px-4">Modality</th>
                <th className="py-3 px-4">Serial #</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Warranty</th>
                <th className="py-3 px-4">Contract</th>
                <th className="py-3 px-4">Customer & Location</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-200">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="size-6 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium">No assets matching your filters</p>
                      <p className="text-xs text-slate-400">
                        Try changing your search query or reset the active filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onViewAsset(asset)}
                  >
                    {/* Equipment # */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {asset.equipmentNumber}
                      </span>
                      {asset.assetType && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {asset.assetType}
                        </div>
                      )}
                    </td>

                    {/* OEM & Model */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {asset.oem}
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal truncate max-w-[180px]">
                        {asset.model}
                      </div>
                    </td>

                    {/* Modality */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant="outline" className="font-normal text-[11px] py-0 px-2 bg-slate-50 dark:bg-slate-800">
                        {asset.modality}
                      </Badge>
                    </td>

                    {/* Serial # */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {asset.serialNumber}
                    </td>

                    {/* Equipment Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <EquipmentStatusBadge status={asset.equipmentStatus} />
                    </td>

                    {/* Warranty */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <WarrantyStatusBadge status={asset.warrantyStatus} />
                    </td>

                    {/* Contract */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <ContractStatusBadge status={asset.contractStatus} />
                      {asset.contractNumber && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {asset.contractNumber}
                        </div>
                      )}
                    </td>

                    {/* Customer & Location */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                        {asset.customer}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                        {asset.location}, {asset.region}
                      </div>
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3 px-4 whitespace-nowrap text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {/* View details */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          title="View Details"
                          onClick={() => onViewAsset(asset)}
                        >
                          <Eye className="size-3.5" />
                        </Button>

                        {/* Log Job (Available to all users) */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                          title="Log Maintenance Job"
                          onClick={() => onLogJob(asset)}
                        >
                          <Wrench className="size-3.5" />
                        </Button>

                        {/* Edit (Admin only) */}
                        {isAdmin && !asset.isArchived && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            title="Edit Asset"
                            onClick={() => onEditAsset(asset)}
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                        )}

                        {/* Archive (Admin only) */}
                        {isAdmin && !asset.isArchived && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            title="Archive Asset"
                            onClick={() => onArchiveAsset(asset)}
                          >
                            <Archive className="size-3.5" />
                          </Button>
                        )}

                        {/* Unarchive (Super Admin only) */}
                        {isSuperAdmin && asset.isArchived && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                            title="Unarchive Asset"
                            onClick={() => onUnarchiveAsset(asset)}
                          >
                            <RotateCcw className="size-3.5" />
                          </Button>
                        )}
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
