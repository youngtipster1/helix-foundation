import React, { useState, useMemo } from "react";
import {
  Search,
  Download,
  Plus,
  Edit2,
  Archive,
  Eye,
  AlertTriangle,
  Package,
  Layers,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Part } from "../types";
import { cn } from "@/lib/utils";

export interface PartsTableProps {
  parts: Part[];
  isAdmin: boolean;
  onAddPart?: () => void;
  onEditPart?: (part: Part) => void;
  onArchivePart?: (part: Part) => void;
  onViewPart?: (part: Part) => void;
  onRefresh?: () => void;
}

export function PartsTable({
  parts,
  isAdmin,
  onAddPart,
  onEditPart,
  onArchivePart,
  onViewPart,
}: PartsTableProps) {
  const [search, setSearch] = useState("");
  const [selectedModality, setSelectedModality] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedOem, setSelectedOem] = useState("all");

  // Extract unique filter options
  const modalities = useMemo(() => {
    return Array.from(new Set(parts.map((p) => p.modality))).filter(Boolean);
  }, [parts]);

  const categories = useMemo(() => {
    return Array.from(new Set(parts.map((p) => p.category))).filter(Boolean);
  }, [parts]);

  const oems = useMemo(() => {
    return Array.from(new Set(parts.map((p) => p.oem))).filter(Boolean);
  }, [parts]);

  // Filtered parts
  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        part.partNumber.toLowerCase().includes(q) ||
        part.oemVendorPartNumber.toLowerCase().includes(q) ||
        part.brand.toLowerCase().includes(q) ||
        part.model.toLowerCase().includes(q) ||
        part.supplierName.toLowerCase().includes(q) ||
        part.category.toLowerCase().includes(q) ||
        part.location.toLowerCase().includes(q);

      const matchesModality = selectedModality === "all" || part.modality === selectedModality;
      const matchesCategory = selectedCategory === "all" || part.category === selectedCategory;
      const matchesOem = selectedOem === "all" || part.oem === selectedOem;

      return matchesSearch && matchesModality && matchesCategory && matchesOem;
    });
  }, [parts, search, selectedModality, selectedCategory, selectedOem]);

  // Export Full CSV functionality (Page 6 in spec: "The downloaded version contains all the columns")
  const handleExportCSV = () => {
    const headers = [
      "SN",
      "Part Number",
      "OEM / Vendor Part Number",
      "Supplier",
      "Part Category",
      "Brand",
      "OEM",
      "Modality",
      "Model",
      "Description",
      "Quantity in Stock",
      "Min Stock Level",
      "Max Stock Level",
      "Quantity on Order",
      "Date of Purchase",
      "Shelf Life (months)",
      "Expiry Date",
      "Lead Time (weeks)",
      "List Price (₦)",
      "VAT (%)",
      "Gross Price (₦)",
      "Unit Price (₦)",
      "Location",
      "Bin Code",
      "Bin Number",
      "Column",
      "Row",
      "Contact Phone",
    ];

    const rows = filteredParts.map((p, idx) => [
      idx + 1,
      `"${p.partNumber}"`,
      `"${p.oemVendorPartNumber}"`,
      `"${p.supplierName}"`,
      `"${p.category}"`,
      `"${p.brand}"`,
      `"${p.oem}"`,
      `"${p.modality}"`,
      `"${p.model}"`,
      `"${(p.description || "").replace(/"/g, '""')}"`,
      p.quantityInStock,
      p.minStockLevel,
      p.maxStockLevel,
      p.quantityOnOrder,
      p.dateOfPurchase,
      p.shelfLifeMonths ?? (p.doesNotExpire ? "N/A" : ""),
      p.expiryDate ?? (p.doesNotExpire ? "Does not expire" : ""),
      p.leadTimeWeeks,
      p.listPrice,
      p.vatPercent,
      p.grossPrice,
      p.unitPrice,
      `"${p.location}"`,
      `"${p.binCode}"`,
      `"${p.binNumber}"`,
      `"${p.column}"`,
      `"${p.row}"`,
      `"${p.contactPhone || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Helix_Parts_Inventory_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateAge = (dateOfPurchase: string) => {
    if (!dateOfPurchase) return "—";
    const year = new Date(dateOfPurchase).getFullYear();
    const currentYear = new Date().getFullYear();
    const diff = Math.max(0, currentYear - year);
    return diff === 0 ? "< 1 yr" : `${diff} yr${diff > 1 ? "s" : ""}`;
  };

  return (
    <div className="space-y-4">
      {/* Action & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border border-border bg-card shadow-2xs">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search parts, OEM, model, location..."
              className="h-9 pl-8 text-xs"
            />
          </div>

          {/* Modality Filter */}
          <select
            value={selectedModality}
            onChange={(e) => setSelectedModality(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
          >
            <option value="all">All Modalities</option>
            {modalities.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* OEM Filter */}
          <select
            value={selectedOem}
            onChange={(e) => setSelectedOem(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary cursor-pointer hidden sm:inline-block"
          >
            <option value="all">All OEMs</option>
            {oems.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        {/* Right Actions: Export CSV & Add Part (Admin only) */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 gap-1.5 text-xs font-medium cursor-pointer"
            title="Download full part list spreadsheet"
          >
            <Download className="size-3.5 text-primary" />
            <span>Export CSV</span>
          </Button>

          {isAdmin && onAddPart && (
            <Button
              type="button"
              size="sm"
              onClick={onAddPart}
              className="h-9 gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
            >
              <Plus className="size-4" />
              <span>Add Part</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Stacked Card View (md:hidden) */}
      <div className="space-y-3 md:hidden">
        {filteredParts.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-border bg-card text-muted-foreground text-xs">
            No spare parts match your filters.
          </div>
        ) : (
          filteredParts.map((part, idx) => {
            const isLowStock = part.quantityInStock <= part.minStockLevel;

            return (
              <div
                key={part.id}
                className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs space-y-3 transition-colors hover:border-primary/40"
              >
                {/* Header: Part # + Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-foreground">
                        {part.partNumber}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {part.modality}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono mt-0.5 block">
                      OEM: {part.oemVendorPartNumber}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {onViewPart && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewPart(part)}
                        className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="View details"
                      >
                        <Eye className="size-3.5" />
                      </Button>
                    )}

                    {isAdmin && onEditPart && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditPart(part)}
                        className="h-7 px-2 text-xs font-medium text-primary cursor-pointer gap-1"
                      >
                        <Edit2 className="size-3" />
                        <span>Edit</span>
                      </Button>
                    )}

                    {isAdmin && onArchivePart && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onArchivePart(part)}
                        className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
                        title="Archive part"
                      >
                        <Archive className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Body Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Category & Model
                    </span>
                    <span className="font-medium text-foreground truncate block">
                      {part.category} — {part.model}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Supplier
                    </span>
                    <span className="font-medium text-foreground truncate block">
                      {part.supplierName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Stock Level
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn("font-mono font-bold", isLowStock && "text-destructive")}>
                        {part.quantityInStock} in stock
                      </span>
                      {isLowStock && (
                        <span className="inline-flex items-center px-1 rounded bg-destructive/10 text-destructive text-[9px] font-bold">
                          Low
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Unit Price
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      ₦{part.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3 text-primary" />
                      {part.location} (Bin {part.binCode} / Col {part.column}{part.row})
                    </span>
                    <span className="font-mono">Age: {calculateAge(part.dateOfPurchase)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop 16-Column Table View (hidden on mobile, visible on md+) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-muted/40 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
            <tr>
              <th className="px-3 py-3 w-10 text-center">SN</th>
              <th className="px-3.5 py-3">Part Number</th>
              <th className="px-3.5 py-3">OEM / Vendor Part #</th>
              <th className="px-3.5 py-3">Supplier</th>
              <th className="px-3.5 py-3">Category</th>
              {/* Action Column is positioned at column 6 as per project design standard */}
              <th className="px-3 py-3 text-center w-28 bg-muted/60 text-primary font-bold">
                Action
              </th>
              <th className="px-3 py-3">Age</th>
              <th className="px-3.5 py-3">OEM</th>
              <th className="px-3 py-3">Modality</th>
              <th className="px-3.5 py-3">Model</th>
              <th className="px-3 py-3 text-right">In Stock</th>
              <th className="px-3 py-3 text-right">On Order</th>
              <th className="px-3 py-3">Lead Time</th>
              <th className="px-3.5 py-3 text-right">Unit Price</th>
              <th className="px-3.5 py-3">Location</th>
              <th className="px-2.5 py-3 text-center">Col</th>
              <th className="px-2.5 py-3 text-center">Row</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredParts.length === 0 ? (
              <tr>
                <td colSpan={17} className="px-4 py-8 text-center text-muted-foreground">
                  No spare parts found matching current filters.
                </td>
              </tr>
            ) : (
              filteredParts.map((part, idx) => {
                const isLowStock = part.quantityInStock <= part.minStockLevel;

                return (
                  <tr key={part.id} className="hover:bg-accent/40 transition-colors group">
                    <td className="px-3 py-2.5 text-center font-mono text-muted-foreground">
                      {idx + 1}
                    </td>

                    <td className="px-3.5 py-2.5 font-mono font-bold text-foreground whitespace-nowrap">
                      {onViewPart ? (
                        <button
                          type="button"
                          onClick={() => onViewPart(part)}
                          className="text-primary hover:underline cursor-pointer font-bold"
                        >
                          {part.partNumber}
                        </button>
                      ) : (
                        part.partNumber
                      )}
                    </td>

                    <td className="px-3.5 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                      {part.oemVendorPartNumber}
                    </td>

                    <td className="px-3.5 py-2.5 font-medium text-foreground truncate max-w-[140px]">
                      {part.supplierName}
                    </td>

                    <td className="px-3.5 py-2.5 text-foreground whitespace-nowrap">
                      {part.category}
                    </td>

                    {/* Column 6: Action Button */}
                    <td className="px-3 py-2.5 text-center whitespace-nowrap bg-muted/10 group-hover:bg-muted/30">
                      <div className="flex items-center justify-center gap-1.5">
                        {onViewPart && (
                          <button
                            type="button"
                            onClick={() => onViewPart(part)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                            title="View part specs"
                          >
                            <Eye className="size-3.5" />
                          </button>
                        )}

                        {isAdmin && onEditPart && (
                          <button
                            type="button"
                            onClick={() => onEditPart(part)}
                            className="p-1 rounded text-primary hover:text-primary/80 cursor-pointer"
                            title="Edit part"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                        )}

                        {isAdmin && onArchivePart && (
                          <button
                            type="button"
                            onClick={() => onArchivePart(part)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Archive part"
                          >
                            <Archive className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                      {calculateAge(part.dateOfPurchase)}
                    </td>

                    <td className="px-3.5 py-2.5 text-muted-foreground whitespace-nowrap">
                      {part.oem}
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {part.modality}
                      </Badge>
                    </td>

                    <td className="px-3.5 py-2.5 font-medium text-foreground truncate max-w-[130px]">
                      {part.model}
                    </td>

                    <td className="px-3 py-2.5 text-right font-mono font-bold whitespace-nowrap">
                      <span className={cn(isLowStock && "text-destructive")}>
                        {part.quantityInStock}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-right font-mono text-muted-foreground whitespace-nowrap">
                      {part.quantityOnOrder}
                    </td>

                    <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                      {part.leadTimeWeeks} wk{part.leadTimeWeeks > 1 ? "s" : ""}
                    </td>

                    <td className="px-3.5 py-2.5 text-right font-mono font-medium text-foreground whitespace-nowrap">
                      ₦{part.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-3.5 py-2.5 text-muted-foreground truncate max-w-[130px]">
                      {part.location}
                    </td>

                    <td className="px-2.5 py-2.5 text-center font-mono text-muted-foreground">
                      {part.column}
                    </td>

                    <td className="px-2.5 py-2.5 text-center font-mono text-muted-foreground">
                      {part.row}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
