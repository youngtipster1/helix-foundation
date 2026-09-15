import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, ArrowRight } from "lucide-react";
import { ServiceContract, ContractType, ContractStatus } from "../types";
import { toast } from "sonner";

interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    contractData: Partial<ServiceContract>,
    openWorkspace?: boolean
  ) => void;
}

export const CreateContractModal: React.FC<CreateContractModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [contractNumber, setContractNumber] = useState(
    () => `CNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [vendorName, setVendorName] = useState("");
  const [contractType, setContractType] = useState<ContractType>("PM + LABOUR");
  const [contractStatus, setContractStatus] = useState<ContractStatus>("In Contract");
  const [contractValue, setContractValue] = useState<number | "">("");
  const [contractStartDate, setContractStartDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [contractEndDate, setContractEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  });
  const [contractOrderNumber, setContractOrderNumber] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [contractInvoiceNumber, setContractInvoiceNumber] = useState("");
  const [paymentTermMonths, setPaymentTermMonths] = useState<number>(3);
  const [notes, setNotes] = useState("");

  const handleSubmit = (openWorkspace = false) => {
    if (!contractNumber.trim()) {
      toast.error("Contract Number is required.");
      return;
    }
    if (!vendorName.trim()) {
      toast.error("Vendor / Supplier Name is required.");
      return;
    }
    if (contractValue === "" || Number(contractValue) <= 0) {
      toast.error("Please enter a valid Contract Value.");
      return;
    }

    const payload: Partial<ServiceContract> = {
      contractNumber: contractNumber.trim(),
      vendorName: vendorName.trim(),
      contractType,
      contractStatus,
      contractValue: Number(contractValue),
      contractStartDate,
      contractEndDate,
      contractOrderNumber: contractOrderNumber.trim() || undefined,
      poNumber: poNumber.trim() || `PO-${contractNumber.trim()}`,
      contractInvoiceNumber: contractInvoiceNumber.trim() || undefined,
      paymentTermMonths: Number(paymentTermMonths) || 3,
      paymentStartDate: contractStartDate,
      paymentEndDate: contractEndDate,
      nextPaymentDate: contractStartDate,
      notes: notes.trim() || undefined,
      linkedEquipmentIds: [],
      payments: [],
      totalAmountPaid: 0,
      totalAmountOutstanding: Number(contractValue),
      amountPayableNextMonth: Math.round(Number(contractValue) / Math.max(1, Math.round(12 / (Number(paymentTermMonths) || 3)))),
      isArchived: false,
    };

    onSave(payload, openWorkspace);
    onClose();
    toast.success(`Service contract ${payload.contractNumber} created successfully.`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-border bg-card">
        <DialogHeader className="border-b border-border/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Create Service Contract
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Enter core contract terms, vendor agreement details, and valuation.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          {/* Row 1: Contract Number & Vendor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Contract Number <span className="text-destructive">*</span>
              </Label>
              <Input
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder="e.g. CNT-2026-001"
                className="h-9 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Vendor / Supplier Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. GE Healthcare / Siemens Healthineers"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Row 2: Contract Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Contract Type
              </Label>
              <Select
                value={contractType}
                onValueChange={(val) => setContractType(val as ContractType)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPREHENSIVE">COMPREHENSIVE</SelectItem>
                  <SelectItem value="PM + LABOUR">PM + LABOUR</SelectItem>
                  <SelectItem value="PM ONLY">PM ONLY</SelectItem>
                  <SelectItem value="LABOUR ONLY">LABOUR ONLY</SelectItem>
                  <SelectItem value="NO CONTRACT">NO CONTRACT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Contract Status
              </Label>
              <Select
                value={contractStatus}
                onValueChange={(val) => setContractStatus(val as ContractStatus)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In Contract">In Contract</SelectItem>
                  <SelectItem value="Out of Contract">Out of Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Contract Value & Payment Term Months */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Total Contract Value (₦) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                step="1000"
                value={contractValue}
                onChange={(e) =>
                  setContractValue(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="e.g. 15000000"
                className="h-9 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Payment Term (Frequency in Months)
              </Label>
              <Select
                value={String(paymentTermMonths)}
                onValueChange={(val) => setPaymentTermMonths(Number(val))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select payment term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month (Monthly)</SelectItem>
                  <SelectItem value="3">3 Months (Quarterly)</SelectItem>
                  <SelectItem value="6">6 Months (Bi-Annually)</SelectItem>
                  <SelectItem value="12">12 Months (Annually / Lump Sum)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Contract Start Date
              </Label>
              <Input
                type="date"
                value={contractStartDate}
                onChange={(e) => setContractStartDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Contract End Date
              </Label>
              <Input
                type="date"
                value={contractEndDate}
                onChange={(e) => setContractEndDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Row 5: PO Number, Order Number & Invoice Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Contract PO Number
              </Label>
              <Input
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. PO-2026-081"
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Contract Order Number
              </Label>
              <Input
                value={contractOrderNumber}
                onChange={(e) => setContractOrderNumber(e.target.value)}
                placeholder="e.g. ORD-2026-104"
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Master Invoice Number
              </Label>
              <Input
                value={contractInvoiceNumber}
                onChange={(e) => setContractInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2026-902"
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 6: Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Contract Description / SLA Terms Notes
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail response turnaround time, included maintenance visits, parts coverage clauses, etc."
              rows={3}
              className="text-xs resize-none"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-border/70 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-9 cursor-pointer"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSubmit(false)}
              className="text-xs h-9 cursor-pointer"
            >
              Save Contract
            </Button>

            <Button
              type="button"
              onClick={() => handleSubmit(true)}
              className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground font-bold shadow-xs cursor-pointer"
            >
              <span>Save & Open Workspace</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
