import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  FileText,
  Wrench,
  CreditCard,
  Plus,
  Download,
  Upload,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  Layers,
  AlertCircle,
  FileCheck,
  RotateCcw,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ServiceContract,
  ContractPayment,
  ContractType,
  ContractStatus,
  Asset,
} from "../types";
import { ContractStatusBadge } from "./status-badges";
import { assetService } from "../services/asset-service";
import { RowActionsMenu } from "@/components/data-table/row-actions-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ContractDetailWorkspaceProps {
  contract: ServiceContract;
  onBack: () => void;
  onUpdateContract: (updated: ServiceContract) => void;
  isAdmin?: boolean;
}

export const ContractDetailWorkspace: React.FC<ContractDetailWorkspaceProps> = ({
  contract,
  onBack,
  onUpdateContract,
  isAdmin = true,
}) => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const allAssets = useMemo(() => assetService.getAssets(false), []);

  // Live calculations
  const totalPaid = useMemo(() => {
    return (contract.payments || [])
      .filter((p) => p.status === "Paid")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [contract.payments]);

  const totalOutstanding = Math.max(0, (contract.contractValue || 0) - totalPaid);
  const paymentPct =
    contract.contractValue > 0
      ? Math.min(100, Math.round((totalPaid / contract.contractValue) * 100))
      : 0;

  // Equipment mapping
  const coveredEquipment = useMemo(() => {
    return (contract.linkedEquipmentIds || [])
      .map((id) => allAssets.find((a) => a.id === id))
      .filter(Boolean) as Asset[];
  }, [contract.linkedEquipmentIds, allAssets]);

  // --- Add Equipment State (Matching Slide 24) ---
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const selectedAsset = useMemo(() => {
    return allAssets.find((a) => a.id === selectedAssetId) || null;
  }, [selectedAssetId, allAssets]);

  const [addEqValue, setAddEqValue] = useState<number | "">("");
  const [addEqType, setAddEqType] = useState<ContractType>(contract.contractType);
  const [addEqStartDate, setAddEqStartDate] = useState<string>(contract.contractStartDate);
  const [addEqEndDate, setAddEqEndDate] = useState<string>(contract.contractEndDate);

  const handleAddEquipment = () => {
    if (!selectedAsset) {
      toast.error("Please select an equipment to add.");
      return;
    }
    if (contract.linkedEquipmentIds.includes(selectedAsset.id)) {
      toast.error("This equipment is already covered under this contract.");
      return;
    }

    const nextIds = [...contract.linkedEquipmentIds, selectedAsset.id];
    const updated = assetService.updateContract(contract.id, {
      linkedEquipmentIds: nextIds,
    });
    onUpdateContract(updated);
    setSelectedAssetId("");
    setAddEqValue("");
    toast.success(`Equipment ${selectedAsset.equipmentNumber} attached to contract.`);
  };

  const handleRemoveEquipment = (assetId: string) => {
    const nextIds = contract.linkedEquipmentIds.filter((id) => id !== assetId);
    const updated = assetService.updateContract(contract.id, {
      linkedEquipmentIds: nextIds,
    });
    onUpdateContract(updated);
    toast.info("Equipment removed from contract coverage.");
  };

  // --- Record Payment Modal State (Matching Slide 22) ---
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [newInvoiceNumber, setNewInvoiceNumber] = useState(
    () => `INV-${contract.contractNumber}-${(contract.payments || []).length + 1}`
  );
  const [newPlannedDate, setNewPlannedDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + (contract.paymentTermMonths || 3));
    return d.toISOString().split("T")[0];
  });
  const [newPaymentDate, setNewPaymentDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [newPaymentAmount, setNewPaymentAmount] = useState<number | "">(
    Math.round(totalOutstanding / Math.max(1, Math.round(12 / (contract.paymentTermMonths || 3))))
  );
  const [newPaymentNote, setNewPaymentNote] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState<"Paid" | "Pending">("Paid");
  const [newProofName, setNewProofName] = useState("");

  const handleSavePayment = () => {
    if (!newInvoiceNumber.trim()) {
      toast.error("Invoice number is required.");
      return;
    }
    if (newPaymentAmount === "" || Number(newPaymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    const newPayment: ContractPayment = {
      id: `pmt_${Date.now()}`,
      invoiceNumber: newInvoiceNumber.trim(),
      dateOfPlannedPayment: newPlannedDate,
      dateOfPayment: newPaymentStatus === "Paid" ? newPaymentDate : undefined,
      amount: Number(newPaymentAmount),
      status: newPaymentStatus,
      note: newPaymentNote.trim() || undefined,
      proofOfPaymentName: newProofName.trim() || undefined,
    };

    const nextPayments = [...(contract.payments || []), newPayment];
    const updated = assetService.updateContract(contract.id, {
      payments: nextPayments,
    });
    onUpdateContract(updated);
    setIsRecordPaymentOpen(false);
    toast.success(`Payment invoice ${newPayment.invoiceNumber} recorded.`);
  };

  const handleTogglePaymentStatus = (paymentId: string) => {
    const nextPayments = (contract.payments || []).map((p) => {
      if (p.id !== paymentId) return p;
      const isNowPaid = p.status !== "Paid";
      return {
        ...p,
        status: isNowPaid ? ("Paid" as const) : ("Pending" as const),
        dateOfPayment: isNowPaid ? new Date().toISOString().split("T")[0] : undefined,
      };
    });
    const updated = assetService.updateContract(contract.id, {
      payments: nextPayments,
    });
    onUpdateContract(updated);
    toast.success("Payment status updated.");
  };

  const handleDeletePayment = (paymentId: string) => {
    const nextPayments = (contract.payments || []).filter((p) => p.id !== paymentId);
    const updated = assetService.updateContract(contract.id, {
      payments: nextPayments,
    });
    onUpdateContract(updated);
    toast.info("Payment record removed.");
  };

  // Document attachments mockup
  const [docList, setDocList] = useState<Array<{ name: string; date: string; size: string }>>([
    {
      name: `${contract.contractNumber}_Vendor_SLA_Signed.pdf`,
      date: contract.contractStartDate,
      size: "2.4 MB",
    },
  ]);

  const handleSimulateUpload = () => {
    const fileName = `Agreement_Annexure_${Date.now().toString().slice(-4)}.pdf`;
    setDocList((prev) => [
      ...prev,
      { name: fileName, date: new Date().toISOString().split("T")[0], size: "1.1 MB" },
    ]);
    toast.success(`Uploaded ${fileName} to contract vault.`);
  };

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {/* Top Header & Context Navigation */}
      <div className="bg-card p-4 rounded-xl border border-border space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
              title="Return to Service Contracts List"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Contracts</span>
            </Button>

            <div className="h-5 w-px bg-border hidden sm:block" />

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-mono font-bold text-foreground">
                  {contract.contractNumber}
                </h1>
                <ContractStatusBadge status={contract.contractStatus} />
                <Badge variant="outline" className="text-[10px] font-mono">
                  {contract.contractType}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Building2 className="size-3 text-primary" />
                <span>Vendor: <strong className="text-foreground">{contract.vendorName}</strong></span>
                <span>&bull;</span>
                <Calendar className="size-3 text-muted-foreground" />
                <span>Valid: {contract.contractStartDate} to {contract.contractEndDate}</span>
              </p>
            </div>
          </div>

          {/* Right Header Metadata */}
          <div className="flex items-center gap-2 self-end sm:self-auto font-mono text-xs">
            {contract.poNumber && (
              <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-[11px]">
                PO: <strong className="text-foreground">{contract.poNumber}</strong>
              </span>
            )}
            {contract.contractOrderNumber && (
              <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-[11px]">
                Order: <strong className="text-foreground">{contract.contractOrderNumber}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Live KPI Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60">
          <div className="p-3 rounded-lg bg-muted/40 border border-border/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Total Contract Value
            </span>
            <div className="text-base sm:text-lg font-mono font-bold text-foreground">
              ₦{contract.contractValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-muted-foreground block">
              Agreed Master Contract Sum
            </span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
                Total Amount Paid
              </span>
              <CheckCircle2 className="size-3.5 text-emerald-600" />
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400">
              ₦{totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="w-full bg-emerald-500/20 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all"
                style={{ width: `${paymentPct}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 tracking-wider">
                Outstanding Balance
              </span>
              <Clock className="size-3.5 text-blue-600" />
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-blue-700 dark:text-blue-400">
              ₦{totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-muted-foreground block font-mono">
              {paymentPct}% Disbursed &bull; {100 - paymentPct}% Remaining
            </span>
          </div>
        </div>
      </div>

      {/* Main Full-Width Tabs Hub */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="h-10 p-1 bg-muted/60 border border-border grid grid-cols-3 max-w-xl">
          <TabsTrigger value="overview" className="text-xs font-semibold gap-1.5">
            <FileText className="size-3.5" />
            <span>Overview & Agreement</span>
          </TabsTrigger>
          <TabsTrigger value="equipment" className="text-xs font-semibold gap-1.5">
            <Wrench className="size-3.5" />
            <span>Covered Equipment ({coveredEquipment.length})</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs font-semibold gap-1.5">
            <CreditCard className="size-3.5" />
            <span>Payment Terms & History ({contract.payments?.length || 0})</span>
          </TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* TAB 1: CONTRACT OVERVIEW & AGREEMENT                     */}
        {/* ======================================================== */}
        <TabsContent value="overview" className="space-y-4 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Col: Master Terms Card */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Contract Agreement Specifications
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Master vendor parameters, validity terms, and financial reference codes.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {contract.contractType}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Vendor / Provider
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {contract.vendorName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Payment Interval
                  </span>
                  <span className="font-semibold text-foreground font-mono">
                    Every {contract.paymentTermMonths || 3} Month{contract.paymentTermMonths > 1 ? "s" : ""}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Contract Status
                  </span>
                  <div className="mt-0.5">
                    <ContractStatusBadge status={contract.contractStatus} />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Effective Start Date
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {contract.contractStartDate}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Contract Expiry Date
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {contract.contractEndDate}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Next Payment Date
                  </span>
                  <span className="font-mono text-foreground font-semibold">
                    {contract.nextPaymentDate || contract.contractStartDate}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Contract Order #
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {contract.contractOrderNumber || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Contract PO #
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {contract.poNumber || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Master Invoice #
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {contract.contractInvoiceNumber || "—"}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="pt-2 border-t border-border/70 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  SLA Scope & Maintenance Notes
                </span>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/70 text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                  {contract.notes || "No additional SLA clauses recorded for this agreement."}
                </div>
              </div>
            </div>

            {/* Right Col: Document Vault & Attachments */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Signed Agreements</h3>
                </div>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSimulateUpload}
                    className="h-7 text-xs gap-1 cursor-pointer"
                  >
                    <Upload className="size-3" />
                    <span>Upload</span>
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {docList.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-border/80 bg-muted/20 flex items-center justify-between text-xs group hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="size-4 text-primary shrink-0" />
                      <div className="truncate">
                        <span className="font-medium text-foreground block truncate">
                          {doc.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {doc.date} &bull; {doc.size}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toast.info(`Viewing ${doc.name} in document preview.`)}
                      className="h-7 w-7 p-0 shrink-0 cursor-pointer"
                    >
                      <Eye className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-muted-foreground">
                All signed SLAs, annexures, and formal OEM maintenance quotes attached to this contract.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 2: COVERED EQUIPMENT LIST (SLIDE 24 & 25)            */}
        {/* ======================================================== */}
        <TabsContent value="equipment" className="space-y-4 focus-visible:outline-none">
          {/* Top Panel: Add Equipment to Contract with Blue Auto-filling Boxes */}
          {isAdmin && (
            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Add Equipment to Contract Coverage
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Select an equipment from the asset registry. Matching OEM, modality, model, serial, and location auto-populate into the highlighted fields.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddEquipment}
                  disabled={!selectedAsset}
                  className="h-8 text-xs font-bold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="size-3.5" />
                  <span>Add to Contract</span>
                </Button>
              </div>

              {/* Form Row 1: Equipment Selector & Auto-filled Blue Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                {/* 1. Equipment Selector */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-foreground">
                    Select Equipment <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Choose equipment..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allAssets
                        .filter((a) => !contract.linkedEquipmentIds.includes(a.id))
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.equipmentNumber} — {a.model} ({a.serialNumber})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. OEM (Auto-populated Blue Box per Slide 24) */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    OEM
                  </Label>
                  <div className="h-8 px-2.5 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs font-semibold flex items-center">
                    {selectedAsset?.oem || "—"}
                  </div>
                </div>

                {/* 3. Modality (Auto-populated Blue Box) */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Modality
                  </Label>
                  <div className="h-8 px-2.5 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs font-semibold flex items-center">
                    {selectedAsset?.modality || "—"}
                  </div>
                </div>

                {/* 4. Serial Number (Auto-populated Blue Box) */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Serial Number
                  </Label>
                  <div className="h-8 px-2.5 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs font-mono font-bold flex items-center">
                    {selectedAsset?.serialNumber || "—"}
                  </div>
                </div>

                {/* 5. Location (Auto-populated Blue Box) */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Location
                  </Label>
                  <div className="h-8 px-2.5 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs font-medium flex items-center truncate">
                    {selectedAsset?.location || "—"}
                  </div>
                </div>
              </div>

              {/* Form Row 2: Contract Coverage Specifics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-foreground">
                    Allocated Contract Value (₦)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 2500000"
                    value={addEqValue}
                    onChange={(e) =>
                      setAddEqValue(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-foreground">
                    Contract Type
                  </Label>
                  <Select
                    value={addEqType}
                    onValueChange={(val) => setAddEqType(val as ContractType)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Contract type" />
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

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-foreground">
                    Start Date
                  </Label>
                  <Input
                    type="date"
                    value={addEqStartDate}
                    onChange={(e) => setAddEqStartDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-foreground">
                    End Date
                  </Label>
                  <Input
                    type="date"
                    value={addEqEndDate}
                    onChange={(e) => setAddEqEndDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Full 11-Column Covered Equipment Table (Matching Slide 24) */}
          <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
            <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">
                Covered Equipment Register ({coveredEquipment.length} Devices)
              </span>
              <span className="font-mono text-muted-foreground text-[11px]">
                Contract Scope & Service Deliverables
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                <thead className="bg-muted/60 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">S/N</th>
                    <th className="py-2.5 px-3 font-bold text-foreground">Equipment Number</th>
                    <th className="py-2.5 px-3">OEM</th>
                    <th className="py-2.5 px-3">Modality</th>
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3 font-mono">Serial Number</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3 text-right">Contract Value (₦)</th>
                    <th className="py-2.5 px-3">Contract Type</th>
                    <th className="py-2.5 px-3">Start Date</th>
                    <th className="py-2.5 px-3">End Date</th>
                    <th className="py-2.5 px-3 text-right sticky right-0 bg-muted/95 backdrop-blur-xs shadow-xs z-10">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {coveredEquipment.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-muted-foreground">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Wrench className="size-7 mx-auto text-muted-foreground/40 mb-1" />
                          <p className="font-semibold text-foreground text-xs">
                            No Equipment Attached
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Use the form above to add equipment covered under this agreement.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    coveredEquipment.map((eq, idx) => (
                      <tr
                        key={eq.id}
                        className="hover:bg-accent/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-primary">
                          {eq.equipmentNumber}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          {eq.oem}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className="text-[10px]">
                            {eq.modality}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          {eq.model}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                          {eq.serialNumber}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[140px]">
                          {eq.location}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                          ₦{(eq.contractValue || contract.contractValue / Math.max(1, coveredEquipment.length)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-xs">
                          <Badge variant="secondary" className="text-[10px]">
                            {eq.contractType || contract.contractType}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground text-[11px]">
                          {eq.contractStartDate || contract.contractStartDate}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground text-[11px]">
                          {eq.contractEndDate || contract.contractEndDate}
                        </td>
                        <td
                          className="py-2.5 px-3 text-right whitespace-nowrap sticky right-0 bg-card/95 backdrop-blur-xs shadow-xs z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end">
                            <RowActionsMenu
                              label="Actions"
                              align="end"
                              actions={[
                                {
                                  label: "View Device Specs",
                                  icon: Eye,
                                  onClick: () => toast.info(`Equipment ${eq.equipmentNumber} (${eq.model})`),
                                },
                                isAdmin
                                  ? {
                                      label: "Remove from Contract",
                                      icon: Trash2,
                                      variant: "destructive",
                                      onClick: () => handleRemoveEquipment(eq.id),
                                    }
                                  : null,
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
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 3: PAYMENT TERMS & HISTORY (SLIDE 22 & 23)           */}
        {/* ======================================================== */}
        <TabsContent value="payments" className="space-y-4 focus-visible:outline-none">
          {/* Top Card: Financial Schedule Card (Matching Slide 22) */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Payment Terms & Milestone Settings
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Contract billing terms, reference numbers, and installment calculation intervals.
                </p>
              </div>

              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => setIsRecordPaymentOpen(true)}
                  className="h-8 text-xs font-bold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Record Payment / Proof</span>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Contract Invoice #
                </span>
                <span className="font-mono font-bold text-foreground">
                  {contract.contractInvoiceNumber || "—"}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Contract PO #
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {contract.poNumber || "—"}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Payment Term
                </span>
                <span className="font-mono text-foreground font-semibold">
                  {contract.paymentTermMonths || 3} Month{contract.paymentTermMonths > 1 ? "s" : ""}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Total Amount Paid
                </span>
                <span className="font-mono font-bold text-emerald-600">
                  ₦{totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Payment Start Date
                </span>
                <span className="font-mono text-muted-foreground">
                  {contract.paymentStartDate || contract.contractStartDate}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Payment End Date
                </span>
                <span className="font-mono text-muted-foreground">
                  {contract.paymentEndDate || contract.contractEndDate}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Next Payment Date
                </span>
                <span className="font-mono font-bold text-primary">
                  {contract.nextPaymentDate || contract.contractStartDate}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History Table (Matching Slide 22) */}
          <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
            <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">
                Payment History & Settlement Records ({contract.payments?.length || 0} Invoices)
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                Date of planned payment is auto-calculated based on payment terms
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                <thead className="bg-muted/60 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">S/N</th>
                    <th className="py-2.5 px-3 font-bold text-foreground">Invoice Number</th>
                    <th className="py-2.5 px-3">Date of Planned Payment</th>
                    <th className="py-2.5 px-3">Date of Payment</th>
                    <th className="py-2.5 px-3 text-right">Amount (₦)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Note</th>
                    <th className="py-2.5 px-3 text-center">Proof of Payment</th>
                    <th className="py-2.5 px-3 text-right sticky right-0 bg-muted/95 backdrop-blur-xs shadow-xs z-10">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {!contract.payments || contract.payments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-muted-foreground">
                        <div className="max-w-xs mx-auto space-y-2">
                          <CreditCard className="size-7 mx-auto text-muted-foreground/40 mb-1" />
                          <p className="font-semibold text-foreground text-xs">
                            No Payment Records Yet
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Click "Record Payment / Proof" to log installment settlements.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    contract.payments.map((pmt, idx) => {
                      const isPaid = pmt.status === "Paid";
                      return (
                        <tr key={pmt.id} className="hover:bg-accent/40 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                            {idx + 1}
                          </td>

                          <td className="py-2.5 px-3 font-mono font-bold text-primary">
                            {pmt.invoiceNumber}
                          </td>

                          <td className="py-2.5 px-3 font-mono text-muted-foreground">
                            {pmt.dateOfPlannedPayment}
                          </td>

                          <td className="py-2.5 px-3 font-mono text-foreground">
                            {pmt.dateOfPayment || "—"}
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                            ₦{pmt.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <Badge
                              className={cn(
                                "text-[10px] font-bold uppercase",
                                isPaid
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              )}
                            >
                              {pmt.status}
                            </Badge>
                          </td>

                          <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[180px]">
                            {pmt.note || "—"}
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            {pmt.proofOfPaymentName ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  toast.info(`Opening proof receipt: ${pmt.proofOfPaymentName}`)
                                }
                                className="h-6 text-[10px] gap-1 px-2 cursor-pointer font-mono"
                              >
                                <Eye className="size-3 text-primary" />
                                <span>Receipt</span>
                              </Button>
                            ) : (
                              <span className="text-[11px] text-muted-foreground/60">—</span>
                            )}
                          </td>

                          <td
                            className="py-2.5 px-3 text-right whitespace-nowrap sticky right-0 bg-card/95 backdrop-blur-xs shadow-xs z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end">
                              <RowActionsMenu
                                label="Actions"
                                align="end"
                                actions={[
                                  {
                                    label: isPaid ? "Mark as Pending" : "Mark as Paid",
                                    icon: isPaid ? RotateCcw : Check,
                                    onClick: () => handleTogglePaymentStatus(pmt.id),
                                  },
                                  isAdmin
                                    ? {
                                        label: "Delete Record",
                                        icon: Trash2,
                                        variant: "destructive",
                                        onClick: () => handleDeletePayment(pmt.id),
                                      }
                                    : null,
                                ]}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Record Payment Dialog */}
      <Dialog open={isRecordPaymentOpen} onOpenChange={setIsRecordPaymentOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl border border-border bg-card">
          <DialogHeader className="border-b border-border/70 pb-3">
            <DialogTitle className="text-base font-bold text-foreground">
              Record Installment Payment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Invoice Number</Label>
              <Input
                value={newInvoiceNumber}
                onChange={(e) => setNewInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2026-001"
                className="h-9 text-xs font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Planned Date</Label>
                <Input
                  type="date"
                  value={newPlannedDate}
                  onChange={(e) => setNewPlannedDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Payment Status</Label>
                <Select
                  value={newPaymentStatus}
                  onValueChange={(v) => setNewPaymentStatus(v as any)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newPaymentStatus === "Paid" && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Actual Date of Payment</Label>
                <Input
                  type="date"
                  value={newPaymentDate}
                  onChange={(e) => setNewPaymentDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Amount (₦)</Label>
              <Input
                type="number"
                min="0"
                value={newPaymentAmount}
                onChange={(e) =>
                  setNewPaymentAmount(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="e.g. 5000000"
                className="h-9 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Proof of Payment Reference / File</Label>
              <Input
                value={newProofName}
                onChange={(e) => setNewProofName(e.target.value)}
                placeholder="e.g. Bank_Transfer_Receipt_001.pdf"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Notes</Label>
              <Textarea
                value={newPaymentNote}
                onChange={(e) => setNewPaymentNote(e.target.value)}
                placeholder="Payment reference, bank confirmation notes..."
                rows={2}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border/70 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRecordPaymentOpen(false)}
              className="h-9 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSavePayment}
              className="h-9 text-xs font-bold bg-primary text-primary-foreground cursor-pointer shadow-xs"
            >
              Save Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
