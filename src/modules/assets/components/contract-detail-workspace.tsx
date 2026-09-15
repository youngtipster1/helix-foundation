import React, { useState, useMemo, useEffect } from "react";
import {
  FileText,
  CreditCard,
  Wrench,
  Upload,
  Plus,
  Eye,
  Calendar,
  Save,
  X,
  FileSpreadsheet,
  Banknote,
  Receipt,
  FileCheck2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
  Asset,
} from "../types";
import { ContractStatusBadge } from "./status-badges";
import { assetService } from "../services/asset-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ServiceContract | null;
  initialTab?: "details" | "payments" | "equipment";
  onSave: (updated: ServiceContract) => void;
  isAdmin?: boolean;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  contract,
  initialTab = "details",
  onSave,
  isAdmin = true,
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "payments" | "equipment">("details");
  const allAssets = useMemo(() => assetService.getAssets(false), []);

  // -------------------------------------------------------------
  // SLIDE 20: CONTRACT DETAILS STATE
  // -------------------------------------------------------------
  const [contractValue, setContractValue] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const amountOutstanding = Math.max(0, (Number(contractValue) || 0) - (Number(amountPaid) || 0));

  const [contractType, setContractType] = useState<ContractType>("PM + LABOUR");
  const [contractNumber, setContractNumber] = useState<string>("");
  const [contractStartDate, setContractStartDate] = useState<string>("");
  const [contractEndDate, setContractEndDate] = useState<string>("");

  const [serviceContractsList, setServiceContractsList] = useState<
    Array<{ id: string; name: string; note: string; date?: string; size?: string }>
  >([]);
  const [docNote, setDocNote] = useState<string>("");
  const [detailsNote, setDetailsNote] = useState<string>("");

  // -------------------------------------------------------------
  // SLIDE 22 & 23: PAYMENT TERMS STATE
  // -------------------------------------------------------------
  const [contractInvoiceNumber, setContractInvoiceNumber] = useState<string>("");
  const [contractPoNumber, setContractPoNumber] = useState<string>("");
  const [paymentTermMonths, setPaymentTermMonths] = useState<number>(3);
  const [paymentStartDate, setPaymentStartDate] = useState<string>("");
  const [paymentEndDate, setPaymentEndDate] = useState<string>("");
  const [nextPaymentDate, setNextPaymentDate] = useState<string>("");
  const [payments, setPayments] = useState<ContractPayment[]>([]);
  const [paymentTermsNote, setPaymentTermsNote] = useState<string>("");

  // -------------------------------------------------------------
  // SLIDE 24 & 25: EQUIPMENT LIST STATE
  // -------------------------------------------------------------
  const [selectedEquipmentNumber, setSelectedEquipmentNumber] = useState<string>("");
  const matchedAsset = useMemo(() => {
    if (!selectedEquipmentNumber.trim()) return null;
    return (
      allAssets.find(
        (a) =>
          a.equipmentNumber.toLowerCase() === selectedEquipmentNumber.trim().toLowerCase() ||
          a.id === selectedEquipmentNumber
      ) || null
    );
  }, [selectedEquipmentNumber, allAssets]);

  const [eqContractValue, setEqContractValue] = useState<number | "">("");
  const [eqContractType, setEqContractType] = useState<ContractType>("PM + LABOUR");
  const [eqStartDate, setEqStartDate] = useState<string>("");
  const [eqEndDate, setEqEndDate] = useState<string>("");
  const [linkedEquipmentIds, setLinkedEquipmentIds] = useState<string[]>([]);
  const [equipmentListNote, setEquipmentListNote] = useState<string>("");

  const coveredEquipment = useMemo(() => {
    return linkedEquipmentIds
      .map((id) => allAssets.find((a) => a.id === id))
      .filter(Boolean) as Asset[];
  }, [linkedEquipmentIds, allAssets]);

  // Sync state when contract or isOpen changes
  useEffect(() => {
    if (isOpen && contract) {
      setActiveTab(initialTab || "details");
      setContractValue(contract.contractValue || 0);
      setAmountPaid(contract.totalAmountPaid || 0);
      setContractType(contract.contractType || "PM + LABOUR");
      setContractNumber(contract.contractNumber || "");
      setContractStartDate(contract.contractStartDate || new Date().toISOString().split("T")[0]);
      setContractEndDate(
        contract.contractEndDate ||
          new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0]
      );
      setContractInvoiceNumber(contract.contractInvoiceNumber || "");
      setContractPoNumber(contract.poNumber || "");
      setPaymentTermMonths(contract.paymentTermMonths || 3);
      setPaymentStartDate(contract.paymentStartDate || contract.contractStartDate || "");
      setPaymentEndDate(contract.paymentEndDate || contract.contractEndDate || "");
      setNextPaymentDate(contract.nextPaymentDate || contract.contractStartDate || "");
      setPayments(contract.payments || []);
      setLinkedEquipmentIds(contract.linkedEquipmentIds || []);
      setDetailsNote(contract.notes || "");
      setPaymentTermsNote("");
      setEquipmentListNote("");
      setServiceContractsList([
        {
          id: "doc_1",
          name: `${contract.contractNumber || "CTR-2026-881"}_Agreement_Signed.pdf`,
          note: "Fully executed OEM maintenance agreement",
          date: contract.contractStartDate,
          size: "2.4 MB",
        },
      ]);
    }
  }, [isOpen, contract, initialTab]);

  // Slide 23: Total Amount paid = sum of all payment amount made
  const totalAmountPaidCalculated = useMemo(() => {
    if (!payments || payments.length === 0) return amountPaid;
    return payments
      .filter((p) => p.status === "Paid" || Boolean(p.dateOfPayment))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments, amountPaid]);

  useEffect(() => {
    if (totalAmountPaidCalculated > 0) {
      setAmountPaid(totalAmountPaidCalculated);
    }
  }, [totalAmountPaidCalculated]);

  // Actions
  const handleUploadServiceContract = () => {
    const newDoc = {
      id: `doc_${Date.now()}`,
      name: `${contractNumber || "Contract"}_Annexure_${Date.now().toString().slice(-4)}.pdf`,
      note: docNote.trim() || "Uploaded signed contract document",
      date: new Date().toISOString().split("T")[0],
      size: "1.8 MB",
    };
    setServiceContractsList((prev) => [...prev, newDoc]);
    setDocNote("");
    toast.success("Service contract document uploaded.");
  };

  const handleUploadPayment = () => {
    if (!contractInvoiceNumber.trim()) {
      toast.error("Please enter a Contract Invoice Number first.");
      return;
    }

    const plannedDate = new Date();
    plannedDate.setMonth(plannedDate.getMonth() + (Number(paymentTermMonths) || 3));

    const newPayment: ContractPayment = {
      id: `pmt_${Date.now()}`,
      invoiceNumber: contractInvoiceNumber.trim(),
      dateOfPlannedPayment: plannedDate.toISOString().split("T")[0],
      dateOfPayment: new Date().toISOString().split("T")[0],
      amount: Math.round(
        Number(contractValue) / Math.max(1, Math.round(12 / (Number(paymentTermMonths) || 3)))
      ),
      status: "Paid",
      note: paymentTermsNote.trim() || "Payment recorded",
      proofOfPaymentName: `Payment_Receipt_${contractInvoiceNumber.trim()}.pdf`,
    };

    setPayments((prev) => [...prev, newPayment]);
    toast.success(`Payment invoice ${newPayment.invoiceNumber} recorded.`);
  };

  const handleAddEquipment = () => {
    if (!matchedAsset) {
      toast.error("Please enter or select a valid Equipment Number.");
      return;
    }
    if (linkedEquipmentIds.includes(matchedAsset.id)) {
      toast.error("Equipment is already attached to this contract.");
      return;
    }

    setLinkedEquipmentIds((prev) => [...prev, matchedAsset.id]);
    setSelectedEquipmentNumber("");
    setEqContractValue("");
    toast.success(`Added ${matchedAsset.equipmentNumber} (${matchedAsset.model}) to equipment list.`);
  };

  const handleMasterSave = () => {
    if (!contractNumber.trim()) {
      toast.error("Contract Number is required.");
      return;
    }

    const updatedContract: ServiceContract = {
      ...(contract || {} as any),
      id: contract?.id || `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      contractNumber: contractNumber.trim(),
      contractType,
      contractStatus: "In Contract",
      contractValue: Number(contractValue) || 0,
      contractStartDate,
      contractEndDate,
      poNumber: contractPoNumber.trim() || undefined,
      contractInvoiceNumber: contractInvoiceNumber.trim() || undefined,
      paymentTermMonths: Number(paymentTermMonths) || 3,
      paymentStartDate,
      paymentEndDate,
      nextPaymentDate,
      payments,
      linkedEquipmentIds,
      totalAmountPaid: Number(amountPaid) || totalAmountPaidCalculated,
      totalAmountOutstanding: amountOutstanding,
      notes:
        activeTab === "details"
          ? detailsNote.trim() || undefined
          : activeTab === "payments"
          ? paymentTermsNote.trim() || undefined
          : equipmentListNote.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedContract);
    onClose();
    toast.success(`Contract ${updatedContract.contractNumber} saved successfully.`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 border border-border bg-card rounded-2xl shadow-2xl">
        {/* MODAL HEADER WITH INTEGRATED TABS (Slide 19, 20, 22, 24) */}
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-md px-6 py-4 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base font-bold font-mono text-foreground">
                  {contractNumber || "CREATE / EDIT CONTRACT"}
                </DialogTitle>
                <ContractStatusBadge status={contract?.contractStatus || "In Contract"} />
                <Badge variant="outline" className="text-[10px] font-mono py-0 px-2">
                  {contractType}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span>Contract Modal Window</span>
                <span>&bull;</span>
                <Calendar className="size-3 text-muted-foreground" />
                <span>
                  {contractStartDate || "—"} to {contractEndDate || "—"}
                </span>
              </p>
            </div>
          </div>

          {/* SEGMENTED TABS (Strictly matching Slides 20, 22, 24) */}
          <div className="bg-muted/80 p-1 rounded-lg border border-border/80 flex items-center gap-1 self-start sm:self-auto shadow-2xs mr-7">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
                activeTab === "details"
                  ? "bg-background text-foreground shadow-xs font-bold ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              )}
            >
              <FileText className="size-3.5 text-primary" />
              <span>Contract Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("payments")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
                activeTab === "payments"
                  ? "bg-background text-foreground shadow-xs font-bold ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              )}
            >
              <CreditCard className="size-3.5 text-primary" />
              <span>Payment Terms</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("equipment")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
                activeTab === "equipment"
                  ? "bg-background text-foreground shadow-xs font-bold ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              )}
            >
              <Wrench className="size-3.5 text-primary" />
              <span>Equipment List</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-5">
          {/* ========================================================================= */}
          {/* TAB 1: CONTRACT DETAILS (SLIDE 20)                                         */}
          {/* ========================================================================= */}
          {activeTab === "details" && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              {/* DETAILS Card */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <Banknote className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground tracking-tight">DETAILS</h2>
                      <p className="text-[11px] text-muted-foreground">
                        Contract financial sum, agreement status, and active dates.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Row 1: Contract Value | Amount Paid | Amount Outstanding */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border/70">
                    <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                      <span>Contract Value</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">NGN</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-mono font-bold text-muted-foreground">
                        ₦
                      </span>
                      <Input
                        type="number"
                        min="0"
                        value={contractValue}
                        onChange={(e) => setContractValue(Number(e.target.value) || 0)}
                        className="h-9 text-xs pl-7 font-mono font-bold text-foreground bg-background border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border/70">
                    <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                      <span>Amount Paid</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-mono font-semibold">
                        Settled
                      </span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-mono font-bold text-muted-foreground">
                        ₦
                      </span>
                      <Input
                        type="number"
                        min="0"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                        className="h-9 text-xs pl-7 font-mono font-bold text-foreground bg-background border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Label className="text-xs font-semibold text-primary flex items-center justify-between">
                      <span>Amount Outstanding</span>
                      <span className="text-[10px] uppercase font-mono font-bold text-primary">
                        Auto-Calc
                      </span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-mono font-bold text-primary">
                        ₦
                      </span>
                      <Input
                        type="number"
                        readOnly
                        value={amountOutstanding}
                        className="h-9 text-xs pl-7 font-mono font-bold text-primary bg-background border-primary/30 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Contract Type | Contract Number | Contract Start date | Contract end date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Contract Type</Label>
                    <Select
                      value={contractType}
                      onValueChange={(val) => setContractType(val as ContractType)}
                    >
                      <SelectTrigger className="h-9 text-xs font-medium bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PM only">PM only</SelectItem>
                        <SelectItem value="Labour only">Labour only</SelectItem>
                        <SelectItem value="PM + LABOUR">PM+Labour</SelectItem>
                        <SelectItem value="COMPREHENSIVE">Comprehensive</SelectItem>
                        <SelectItem value="NO CONTRACT">No contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Contract Number</Label>
                    <Input
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      placeholder="e.g. CTR-2026-881"
                      className="h-9 text-xs font-mono font-bold bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Contract Start date</Label>
                    <Input
                      type="date"
                      value={contractStartDate}
                      onChange={(e) => setContractStartDate(e.target.value)}
                      className="h-9 text-xs bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Contract end date</Label>
                    <Input
                      type="date"
                      value={contractEndDate}
                      onChange={(e) => setContractEndDate(e.target.value)}
                      className="h-9 text-xs bg-background border-border"
                    />
                  </div>
                </div>
              </div>

              {/* SERVICE CONTRACT Card */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <FileCheck2 className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground tracking-tight">
                        SERVICE CONTRACT
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        Uploaded service agreements, executed terms, and formal SLA annexures.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-5">
                  <div className="flex-1 rounded-lg border border-border overflow-hidden bg-background">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider border-b border-border">
                        <tr>
                          <th className="py-2.5 px-3 w-14 text-center">S/N</th>
                          <th className="py-2.5 px-3 font-bold text-foreground">SERVICE CONTRACT</th>
                          <th className="py-2.5 px-3">NOTE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {serviceContractsList.map((doc, idx) => (
                          <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-foreground">
                              <div className="flex items-center gap-2">
                                <FileText className="size-3.5 text-primary shrink-0" />
                                <span className="font-mono text-xs">{doc.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground">{doc.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="w-full lg:w-64 p-4 rounded-lg border border-border bg-muted/20 space-y-3 shrink-0">
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        Upload service contract
                      </span>
                      <span className="text-[11px] text-muted-foreground block">
                        Attach signed PDF or agreement annexure
                      </span>
                    </div>

                    <Input
                      placeholder="Document note..."
                      value={docNote}
                      onChange={(e) => setDocNote(e.target.value)}
                      className="h-8 text-xs bg-background border-border"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleUploadServiceContract}
                        className="h-9 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs border-border"
                      >
                        <Upload className="size-3.5" />
                        <span>Upload</span>
                      </Button>
                      <Button
                        type="button"
                        onClick={handleMasterSave}
                        className="h-9 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
                      >
                        <Save className="size-3.5 mr-1" />
                        <span>Save</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note (Bottom Textarea) */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-2">
                <Label className="text-xs font-bold text-foreground">Note</Label>
                <Textarea
                  rows={3}
                  value={detailsNote}
                  onChange={(e) => setDetailsNote(e.target.value)}
                  placeholder="Enter agreement terms, special warranty clauses, or administrative notes..."
                  className="text-xs bg-background border-border resize-none"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PAYMENT TERMS (SLIDE 22 & 23)                                       */}
          {/* ========================================================================= */}
          {activeTab === "payments" && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              {/* FINANCIAL Card */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <CreditCard className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground tracking-tight">FINANCIAL</h2>
                      <p className="text-[11px] text-muted-foreground">
                        Contract invoices, PO reference, payment terms interval, and settlement milestones.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Contract Invoice Number
                    </Label>
                    <Input
                      value={contractInvoiceNumber}
                      onChange={(e) => setContractInvoiceNumber(e.target.value)}
                      placeholder="e.g. INV-2026-001"
                      className="h-9 text-xs font-mono font-bold bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Contract PO Number
                    </Label>
                    <Input
                      value={contractPoNumber}
                      onChange={(e) => setContractPoNumber(e.target.value)}
                      placeholder="e.g. PO-88910"
                      className="h-9 text-xs font-mono font-bold bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Payment term (months)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={paymentTermMonths}
                      onChange={(e) => setPaymentTermMonths(Number(e.target.value) || 1)}
                      className="h-9 text-xs font-mono font-semibold bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1.5 p-2 rounded-lg bg-muted/40 border border-border/70">
                    <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                      <span>Total Amount Paid</span>
                      <span className="text-[10px] text-emerald-600 font-mono font-bold uppercase">
                        Sum
                      </span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-mono font-bold text-emerald-600">
                        ₦
                      </span>
                      <Input
                        type="number"
                        readOnly
                        value={totalAmountPaidCalculated || amountPaid}
                        className="h-9 text-xs pl-7 font-mono font-bold text-emerald-600 bg-background border-border cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Payment start date</Label>
                    <Input
                      type="date"
                      value={paymentStartDate}
                      onChange={(e) => setPaymentStartDate(e.target.value)}
                      className="h-9 text-xs bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Payment end date</Label>
                    <Input
                      type="date"
                      value={paymentEndDate}
                      onChange={(e) => setPaymentEndDate(e.target.value)}
                      className="h-9 text-xs bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Next Payment date</Label>
                    <Input
                      type="date"
                      value={nextPaymentDate}
                      onChange={(e) => setNextPaymentDate(e.target.value)}
                      className="h-9 text-xs bg-background border-border"
                    />
                  </div>
                </div>
              </div>

              {/* PAYMENT HISTORY Card */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <Receipt className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground tracking-tight">
                        PAYMENT HISTORY
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        Date of planned payment is auto-calculated based on payment terms (Slide 23).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border overflow-hidden bg-background">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                      <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider border-b border-border">
                        <tr>
                          <th className="py-2.5 px-3 w-14 text-center">S/N</th>
                          <th className="py-2.5 px-3 font-bold text-foreground">INVOICE NUMBER</th>
                          <th className="py-2.5 px-3">DATE OF PLANNED PAYMENT</th>
                          <th className="py-2.5 px-3">DATE OF PAYMENT</th>
                          <th className="py-2.5 px-3 text-right">AMOUNT (₦)</th>
                          <th className="py-2.5 px-3">NOTE</th>
                          <th className="py-2.5 px-3 text-center">VIEW PROOF OF PAYMENT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {payments.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-muted-foreground">
                              <p className="font-medium text-xs text-foreground">No payments recorded</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Click "Upload" below to log verified installment receipts.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          payments.map((pmt, idx) => (
                            <tr key={pmt.id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-primary">
                                {pmt.invoiceNumber}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                {pmt.dateOfPlannedPayment || "—"}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-foreground font-medium">
                                {pmt.dateOfPayment || "—"}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                                ₦{Number(pmt.amount || 0).toLocaleString("en-US")}
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground max-w-[200px] truncate">
                                {pmt.note || "—"}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {pmt.proofOfPaymentName ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      toast.info(`Viewing proof: ${pmt.proofOfPaymentName}`)
                                    }
                                    className="h-7 text-[10px] gap-1 px-2.5 font-mono cursor-pointer border-border"
                                  >
                                    <Eye className="size-3 text-primary" />
                                    <span>Proof</span>
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground/60 font-mono">—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Update payment:
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUploadPayment}
                    className="h-9 px-4 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs border-border hover:bg-muted/80"
                  >
                    <Upload className="size-3.5 text-primary" />
                    <span>Upload</span>
                  </Button>
                </div>
              </div>

              {/* Note (Bottom Textarea) */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-2">
                <Label className="text-xs font-bold text-foreground">Note</Label>
                <Textarea
                  rows={3}
                  value={paymentTermsNote}
                  onChange={(e) => setPaymentTermsNote(e.target.value)}
                  placeholder="Enter banking instructions, payment milestone notes, or exchange terms..."
                  className="text-xs bg-background border-border resize-none"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: EQUIPMENT LIST (SLIDE 24 & 25)                                      */}
          {/* ========================================================================= */}
          {activeTab === "equipment" && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              {/* EQUIPMENT LIST Form */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <Wrench className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground tracking-tight">
                        EQUIPMENT LIST
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        Link equipment to this contract. Matching OEM, modality, serial number, and location auto-populate into highlighted fields.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Equipment Number
                    </Label>
                    <Input
                      placeholder="Enter or select EQ #..."
                      value={selectedEquipmentNumber}
                      onChange={(e) => setSelectedEquipmentNumber(e.target.value)}
                      list="equipment-numbers-datalist"
                      className="h-9 text-xs font-mono font-bold bg-background border-border"
                    />
                    <datalist id="equipment-numbers-datalist">
                      {allAssets.map((a) => (
                        <option key={a.id} value={a.equipmentNumber}>
                          {a.equipmentNumber} — {a.oem} {a.model}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">OEM</Label>
                    <div className="h-9 px-3 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs font-semibold flex items-center shadow-2xs">
                      {matchedAsset?.oem || "—"}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Modality</Label>
                    <div className="h-9 px-3 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs font-semibold flex items-center shadow-2xs">
                      {matchedAsset?.modality || "—"}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Serial Number</Label>
                    <div className="h-9 px-3 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs font-mono font-bold flex items-center shadow-2xs">
                      {matchedAsset?.serialNumber || "—"}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Location</Label>
                    <div className="h-9 px-3 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs font-medium flex items-center truncate shadow-2xs">
                      {matchedAsset?.location || "—"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Contract value</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-mono font-bold text-muted-foreground">
                        ₦
                      </span>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Allocated value..."
                        value={eqContractValue}
                        onChange={(e) =>
                          setEqContractValue(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="h-9 text-xs pl-7 font-mono font-bold bg-background border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Contract type</Label>
                    <Select
                      value={eqContractType}
                      onValueChange={(val) => setEqContractType(val as ContractType)}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PM only">PM only</SelectItem>
                        <SelectItem value="Labour only">Labour only</SelectItem>
                        <SelectItem value="PM + LABOUR">PM+Labour</SelectItem>
                        <SelectItem value="COMPREHENSIVE">Comprehensive</SelectItem>
                        <SelectItem value="NO CONTRACT">No contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Contract start date</Label>
                    <Input
                      type="date"
                      value={eqStartDate}
                      onChange={(e) => setEqStartDate(e.target.value)}
                      className="h-9 text-xs bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Contract end date</Label>
                    <Input
                      type="date"
                      value={eqEndDate}
                      onChange={(e) => setEqEndDate(e.target.value)}
                      className="h-9 text-xs bg-background border-border"
                    />
                  </div>

                  <div>
                    <Button
                      type="button"
                      onClick={handleAddEquipment}
                      disabled={!isAdmin}
                      className="h-9 w-full text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Plus className="size-3.5" />
                      <span>Add</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* EQUIPMENT REGISTER Table */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <FileSpreadsheet className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground tracking-tight">
                        EQUIPMENT REGISTER
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        Master list of biomedical equipment covered under this agreement ({coveredEquipment.length} units).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border overflow-hidden bg-background">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                      <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider border-b border-border">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center">S/N</th>
                          <th className="py-2.5 px-3 font-bold text-foreground">EQUIPMENT NUMBER</th>
                          <th className="py-2.5 px-3">OEM</th>
                          <th className="py-2.5 px-3">MODALITY</th>
                          <th className="py-2.5 px-3">MODEL</th>
                          <th className="py-2.5 px-3 font-mono">SERIAL NUMBER</th>
                          <th className="py-2.5 px-3">LOCATION</th>
                          <th className="py-2.5 px-3 text-right">CONTRACT VALUE</th>
                          <th className="py-2.5 px-3">CONTRACT TYPE</th>
                          <th className="py-2.5 px-3">CONTRACT START DATE</th>
                          <th className="py-2.5 px-3">CONTRACT END DATE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {coveredEquipment.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="py-8 text-center text-muted-foreground">
                              <p className="font-medium text-xs text-foreground">No equipment linked</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Enter an Equipment Number in the form above and click "Add".
                              </p>
                            </td>
                          </tr>
                        ) : (
                          coveredEquipment.map((eq, idx) => (
                            <tr key={eq.id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-primary">
                                {eq.equipmentNumber}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-foreground">{eq.oem}</td>
                              <td className="py-2.5 px-3">
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                  {eq.modality}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3 font-medium text-foreground">{eq.model}</td>
                              <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                {eq.serialNumber}
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground">{eq.location}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                                ₦
                                {Number(
                                  eq.contractValue || contractValue / Math.max(1, coveredEquipment.length)
                                ).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                              </td>
                              <td className="py-2.5 px-3">
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                  {eq.contractType || contractType}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                {eq.contractStartDate || contractStartDate}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                {eq.contractEndDate || contractEndDate}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Update equipment list:
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddEquipment}
                    disabled={!isAdmin}
                    className="h-9 px-4 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs border-border hover:bg-muted/80 disabled:opacity-50"
                  >
                    <Plus className="size-3.5 text-primary" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>

              {/* Note (Bottom Textarea) */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-2">
                <Label className="text-xs font-bold text-foreground">Note</Label>
                <Textarea
                  rows={3}
                  value={equipmentListNote}
                  onChange={(e) => setEquipmentListNote(e.target.value)}
                  placeholder="Enter covered equipment exclusions, accessories included, or PPM scheduling terms..."
                  className="text-xs bg-background border-border resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER WITH SAVE & CLOSE BUTTONS (Slides 20, 22, 24) */}
        <DialogFooter className="sticky bottom-0 z-20 bg-card/95 backdrop-blur-md px-6 py-4 border-t border-border/80 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 px-5 text-xs font-semibold cursor-pointer border-border"
          >
            <X className="size-3.5 mr-1.5 text-muted-foreground" />
            <span>Close</span>
          </Button>
          <Button
            type="button"
            onClick={handleMasterSave}
            className="h-9 px-6 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
          >
            <Save className="size-3.5 mr-1.5" />
            <span>Save Contract</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const ContractDetailWorkspace = ContractModal;

