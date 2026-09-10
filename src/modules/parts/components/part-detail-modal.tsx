import React from "react";
import {
  Wrench,
  Building2,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  Phone,
  Clock,
  Edit2,
  Package,
  Layers,
  ShieldCheck,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Part } from "../types";

export interface PartDetailModalProps {
  part: Part | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (part: Part) => void;
  isAdmin?: boolean;
}

export function PartDetailModal({
  part,
  open,
  onOpenChange,
  onEdit,
  isAdmin,
}: PartDetailModalProps) {
  if (!part) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold text-foreground font-mono">
                  {part.partNumber}
                </DialogTitle>
                <Badge variant="outline" className="text-xs font-semibold">
                  {part.modality}
                </Badge>
                <Badge
                  variant={part.quantityInStock <= part.minStockLevel ? "destructive" : "secondary"}
                  className="text-[10px]"
                >
                  {part.quantityInStock <= part.minStockLevel ? "Low Stock" : "In Stock"}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                OEM Part #: <span className="font-mono text-foreground font-semibold">{part.oemVendorPartNumber}</span> • {part.oem} — {part.model}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Section 1: Overview & Specs */}
          <div className="p-3.5 rounded-lg border border-border bg-muted/10 space-y-2.5">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Wrench className="size-3.5 text-primary" />
              <span>Part Specifications</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Category</span>
                <span className="font-medium text-foreground">{part.category}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Brand</span>
                <span className="font-medium text-foreground">{part.brand || part.oem}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Stock in Depot</span>
                <span className="font-mono font-bold text-foreground">{part.quantityInStock} units</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">On Order</span>
                <span className="font-mono text-muted-foreground">{part.quantityOnOrder} units</span>
              </div>
            </div>

            {part.description && (
              <div className="pt-1.5 border-t border-border/60">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Description</span>
                <p className="text-xs text-foreground mt-0.5 leading-relaxed">{part.description}</p>
              </div>
            )}

            {part.note && (
              <div className="pt-1 border-t border-border/60">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Engineering Note</span>
                <p className="text-xs text-foreground-muted italic mt-0.5">{part.note}</p>
              </div>
            )}
          </div>

          {/* Section 2: Supplier & Order Information */}
          <div className="p-3.5 rounded-lg border border-border bg-muted/10 space-y-2.5">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Building2 className="size-3.5 text-primary" />
              <span>Supplier & Procurement</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Supplier Name</span>
                <span className="font-medium text-foreground">{part.supplierName}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Unit Price</span>
                <span className="font-mono font-bold text-primary">₦{part.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Lead Time</span>
                <span className="font-mono text-foreground">{part.leadTimeWeeks} weeks</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-border/60">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Pack Quantity</span>
                <span className="font-mono text-foreground">{part.quantityInPack} per pack</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">List Price</span>
                <span className="font-mono text-foreground">₦{part.listPrice.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">VAT</span>
                <span className="font-mono text-foreground">{part.vatPercent}%</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Gross Price</span>
                <span className="font-mono font-bold text-foreground">₦{part.grossPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Storage Location & Shelf Life */}
          <div className="p-3.5 rounded-lg border border-border bg-muted/10 space-y-2.5">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="size-3.5 text-primary" />
              <span>Location Coordinates & Shelf Life</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Depot / Room</span>
                <span className="font-medium text-foreground">{part.location}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Bin Code</span>
                <span className="font-mono font-bold text-foreground">{part.binCode}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Rack Col / Row</span>
                <span className="font-mono font-bold text-foreground">Col {part.column} • Row {part.row}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Expiry Status</span>
                <span className="font-medium text-foreground">
                  {part.doesNotExpire ? "Does not expire" : part.expiryDate || "Not specified"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Certificates of Conformance */}
          {part.documents && part.documents.length > 0 && (
            <div className="p-3.5 rounded-lg border border-border bg-muted/10 space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <FileText className="size-3.5 text-primary" />
                <span>Attached Certificates & Documents ({part.documents.length})</span>
              </h4>

              <div className="space-y-1.5">
                {part.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2 rounded border border-border bg-background text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="size-3.5 text-primary" />
                      <div>
                        <span className="font-medium text-foreground block">{doc.name}</span>
                        {doc.comment && <span className="text-[10px] text-muted-foreground">{doc.comment}</span>}
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-muted-foreground">{doc.uploadDate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 sm:p-5 border-t border-border bg-muted/20 shrink-0 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs cursor-pointer"
          >
            Close
          </Button>

          {isAdmin && onEdit && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit(part);
              }}
              className="gap-1.5 text-xs font-bold cursor-pointer"
            >
              <Edit2 className="size-3.5" />
              <span>Edit Part</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
