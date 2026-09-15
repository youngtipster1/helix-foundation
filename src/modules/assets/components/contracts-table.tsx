import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Archive,
  RotateCcw,
  Eye,
  Edit2,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { ServiceContract, ContractType, ContractStatus } from "../types";
import { ContractStatusBadge } from "./status-badges";
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

interface ContractsTableProps {
  contracts: ServiceContract[];
  onViewContract: (contract: ServiceContract) => void;
  onEditContract: (contract: ServiceContract) => void;
  onAddContract: () => void;
  onArchiveContract: (contract: ServiceContract) => void;
  onUnarchiveContract: (contract: ServiceContract) => void;
}

export const ContractsTable: React.FC<ContractsTableProps> = ({
  contracts,
  onViewContract,
  onEditContract,
  onAddContract,
  onArchiveContract,
  onUnarchiveContract,
}) => {
  const { user } = useAuth();
  const userRole = user?.role || "User";
  const isSuperAdmin = userRole === "Super Admin";
  const isAdmin = userRole === "Admin" || userRole === "Asset Admin" || isSuperAdmin;

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);

  // Filtering
  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      // Archive filter
      if (showArchived) {
        if (!contract.isArchived) return false;
      } else {
        if (contract.isArchived) return false;
      }

      // Type filter
      if (typeFilter !== "all" && contract.contractType !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && contract.contractStatus !== statusFilter) {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          contract.contractNumber.toLowerCase().includes(q) ||
          contract.vendorName.toLowerCase().includes(q) ||
          contract.poNumber.toLowerCase().includes(q) ||
          (contract.contractOrderNumber && contract.contractOrderNumber.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [contracts, showArchived, typeFilter, statusFilter, searchQuery]);

  const activeCount = contracts.filter((c) => !c.isArchived).length;
  const archivedCount = contracts.filter((c) => c.isArchived).length;

  return (
    <div className="space-y-4">
      {/* Top Filter and Action Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by contract #, vendor, PO number..."
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

            {/* Add Contract (Admin only) */}
            {isAdmin && (
              <Button
                size="sm"
                onClick={onAddContract}
                className="text-xs h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Service Contract</span>
              </Button>
            )}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1 mr-1">
            <Filter className="h-3 w-3" /> Filters:
          </span>

          {/* Contract Type */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 text-xs w-[160px]">
              <SelectValue placeholder="Contract Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="COMPREHENSIVE">COMPREHENSIVE</SelectItem>
              <SelectItem value="PM + LABOUR">PM + LABOUR</SelectItem>
              <SelectItem value="PM ONLY">PM ONLY</SelectItem>
              <SelectItem value="LABOUR ONLY">LABOUR ONLY</SelectItem>
              <SelectItem value="NO CONTRACT">NO CONTRACT</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="In Contract">In Contract</SelectItem>
              <SelectItem value="Out of Contract">Out of Contract</SelectItem>
            </SelectContent>
          </Select>

          {(typeFilter !== "all" || statusFilter !== "all" || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypeFilter("all");
                setStatusFilter("all");
                setSearchQuery("");
              }}
              className="h-8 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            >
              Reset Filters
            </Button>
          )}

          <div className="ml-auto text-[11px] text-slate-500">
            Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredContracts.length}</span> of {contracts.length} contracts
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Contract #</th>
                <th className="py-3 px-4">Vendor / Provider</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Contract Period</th>
                <th className="py-3 px-4">Contract Value</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Outstanding Payable</th>
                <th className="py-3 px-4">Equipment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-200">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="size-6 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium">No service contracts match your filter</p>
                      <p className="text-xs text-slate-400">
                        Try clearing search terms or modifying contract status filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onViewContract(contract)}
                  >
                    {/* Contract # */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {contract.contractNumber}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono">
                        PO: {contract.poNumber}
                      </div>
                    </td>

                    {/* Vendor */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {contract.vendorName}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant="outline" className="font-normal text-[11px] py-0 px-2 bg-slate-50 dark:bg-slate-800">
                        {contract.contractType}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <ContractStatusBadge status={contract.contractStatus} />
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                      <div>{contract.contractStartDate}</div>
                      <div className="text-slate-400">to {contract.contractEndDate}</div>
                    </td>

                    {/* Value */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-semibold text-slate-900 dark:text-white">
                      ₦{contract.contractValue.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                    </td>

                    {/* Amount Paid */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      ₦{contract.totalAmountPaid.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                    </td>

                    {/* Outstanding Payable */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-rose-600 dark:text-rose-400 font-semibold">
                      ₦{contract.totalAmountOutstanding.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                    </td>

                    {/* Linked Equipment */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant="secondary" className="font-medium text-[11px]">
                        {contract.linkedEquipmentIds.length} units
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3 px-4 whitespace-nowrap text-right"
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
                              onClick: () => onViewContract(contract),
                            },
                            {
                              label: "Edit Contract",
                              icon: Edit2,
                              onClick: () => onEditContract(contract),
                              hidden: !isAdmin || contract.isArchived,
                            },
                            {
                              label: "Archive Contract",
                              icon: Archive,
                              onClick: () => onArchiveContract(contract),
                              variant: "destructive",
                              hidden: !isAdmin || contract.isArchived,
                            },
                            {
                              label: "Unarchive Contract",
                              icon: RotateCcw,
                              onClick: () => onUnarchiveContract(contract),
                              variant: "success",
                              hidden: !isSuperAdmin || !contract.isArchived,
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
