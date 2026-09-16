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
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
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
import { TablePagination } from "@/components/data-table/table-pagination";

export interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ServiceContract | null;
  initialTab?: "details" | "payments" | "equipment";
  initialEditMode?: boolean;
  onSave: (updated: ServiceContract) => void;
  isAdmin?: boolean;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  contract,
  initialTab = "details",
  initialEditMode = false,
  onSave,
  isAdmin = true,
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "payments" | "equipment">("details");
  const [isEditing, setIsEditing] = useState<boolean>(initialEditMode);
  const contractFileInputRef = React.useRef<HTMLInputElement>(null);
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

  // Manual payment entry & edit form state (Slide 22 & 23)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentFormInvoiceNumber, setPaymentFormInvoiceNumber] = useState<string>("");
  const [paymentFormPlannedDate, setPaymentFormPlannedDate] = useState<string>("");
  const [paymentFormPaymentDate, setPaymentFormPaymentDate] = useState<string>("");
  const [paymentFormAmount, setPaymentFormAmount] = useState<number | "">("");
  const [paymentFormNote, setPaymentFormNote] = useState<string>("");
  const [paymentFormProofName, setPaymentFormProofName] = useState<string>("");

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

  // Pagination for Payment History Table (Tab 2)
  const PAYMENTS_PER_PAGE = 5;
  const [paymentPage, setPaymentPage] = useState(1);
  const paymentPageCount = Math.max(1, Math.ceil(payments.length / PAYMENTS_PER_PAGE));
  const currentPaymentPage = Math.min(paymentPage, paymentPageCount);
  const paginatedPayments = useMemo(() => {
    const start = (currentPaymentPage - 1) * PAYMENTS_PER_PAGE;
    return payments.slice(start, start + PAYMENTS_PER_PAGE);
  }, [payments, currentPaymentPage]);
  const paymentFrom = payments.length === 0 ? 0 : (currentPaymentPage - 1) * PAYMENTS_PER_PAGE + 1;
  const paymentTo = Math.min(payments.length, currentPaymentPage * PAYMENTS_PER_PAGE);

  // Pagination for Equipment Register Table (Tab 3)
  const EQUIPMENT_PER_PAGE = 5;
  const [equipmentPage, setEquipmentPage] = useState(1);
  const equipmentPageCount = Math.max(1, Math.ceil(coveredEquipment.length / EQUIPMENT_PER_PAGE));
  const currentEquipmentPage = Math.min(equipmentPage, equipmentPageCount);
  const paginatedEquipment = useMemo(() => {
    const start = (currentEquipmentPage - 1) * EQUIPMENT_PER_PAGE;
    return coveredEquipment.slice(start, start + EQUIPMENT_PER_PAGE);
  }, [coveredEquipment, currentEquipmentPage]);
  const equipmentFrom = coveredEquipment.length === 0 ? 0 : (currentEquipmentPage - 1) * EQUIPMENT_PER_PAGE + 1;
  const equipmentTo = Math.min(coveredEquipment.length, currentEquipmentPage * EQUIPMENT_PER_PAGE);

  // Sync state when contract or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setPaymentPage(1);
      setEquipmentPage(1);
      setActiveTab(initialTab || "details");
      const shouldEdit = initialEditMode !== undefined ? initialEditMode : !contract?.id;
      setIsEditing(shouldEdit);

      if (contract) {
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
        setEditingPaymentId(null);
        setPaymentFormInvoiceNumber("");
        setPaymentFormPlannedDate("");
        setPaymentFormPaymentDate("");
        setPaymentFormAmount("");
        setPaymentFormNote("");
        setPaymentFormProofName("");
        setServiceContractsList([
          {
            id: "doc_1",
            name: `${contract.contractNumber || "CTR-2026-881"}_Agreement_Signed.pdf`,
            note: contract.notes || "Fully executed OEM maintenance agreement",
            date: contract.contractStartDate,
            size: "2.4 MB",
          },
        ]);
      }
    }
  }, [isOpen, contract, initialTab, initialEditMode]);

  // Slide 23: Total Amount paid = sum of all payment amount made
  const totalAmountPaidCalculated = useMemo(() => {
    if (!payments || payments.length === 0) return amountPaid;
    return payments
      .filter((p) => p.status === "Paid" || Boolean(p.dateOfPayment))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments, amountPaid]);

  useEffect(() => {
    if (totalAmountPaidCalculated > 0) {
      setAmountPaid(Math.min(totalAmountPaidCalculated, contractValue > 0 ? contractValue : totalAmountPaidCalculated));
    }
  }, [totalAmountPaidCalculated, contractValue]);

  // Actions
  const handleSavePayment = () => {
    if (!paymentFormInvoiceNumber.trim()) {
      toast.error("Please enter an Invoice Number.");
      return;
    }
    const enteredAmount = Number(paymentFormAmount) || 0;
    if (paymentFormAmount === "" || enteredAmount <= 0) {
      toast.error("Please enter a valid Payment Amount.");
      return;
    }

    const currentPaidExcludingActive = payments
      .filter((p) => p.id !== editingPaymentId)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const projectedTotalPaid = currentPaidExcludingActive + enteredAmount;

    if (contractValue > 0 && projectedTotalPaid > contractValue) {
      const maxRemaining = Math.max(0, contractValue - currentPaidExcludingActive);
      toast.error(
        `Amount paid cannot be greater than the contracted amount (₦${contractValue.toLocaleString()}). Maximum remaining payable amount is ₦${maxRemaining.toLocaleString()}.`
      );
      return;
    }

    if (editingPaymentId) {
      setPayments((prev) =>
        prev.map((pmt) =>
          pmt.id === editingPaymentId
            ? {
                ...pmt,
                invoiceNumber: paymentFormInvoiceNumber.trim(),
                dateOfPlannedPayment: paymentFormPlannedDate,
                dateOfPayment: paymentFormPaymentDate,
                amount: enteredAmount,
                note: paymentFormNote.trim() || undefined,
                proofOfPaymentName:
                  paymentFormProofName ||
                  pmt.proofOfPaymentName ||
                  `Receipt_${paymentFormInvoiceNumber.trim()}.pdf`,
              }
            : pmt
        )
      );
      toast.success(`Payment invoice ${paymentFormInvoiceNumber.trim()} updated.`);
      setEditingPaymentId(null);
    } else {
      const newPayment: ContractPayment = {
        id: `pmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        invoiceNumber: paymentFormInvoiceNumber.trim(),
        dateOfPlannedPayment: paymentFormPlannedDate,
        dateOfPayment: paymentFormPaymentDate,
        amount: enteredAmount,
        status: "Paid",
        note: paymentFormNote.trim() || undefined,
        proofOfPaymentName:
          paymentFormProofName || `Receipt_${paymentFormInvoiceNumber.trim()}.pdf`,
      };
      setPayments((prev) => {
        const nextList = [...prev, newPayment];
        setPaymentPage(Math.ceil(nextList.length / PAYMENTS_PER_PAGE));
        return nextList;
      });
      toast.success(`Payment invoice ${newPayment.invoiceNumber} saved to table.`);
    }

    // Reset payment entry fields
    setPaymentFormInvoiceNumber("");
    setPaymentFormPlannedDate("");
    setPaymentFormPaymentDate("");
    setPaymentFormAmount("");
    setPaymentFormNote("");
    setPaymentFormProofName("");
  };

  const handleEditPayment = (pmt: ContractPayment) => {
    setEditingPaymentId(pmt.id);
    setPaymentFormInvoiceNumber(pmt.invoiceNumber || "");
    setPaymentFormPlannedDate(pmt.dateOfPlannedPayment || "");
    setPaymentFormPaymentDate(pmt.dateOfPayment || "");
    setPaymentFormAmount(pmt.amount || "");
    setPaymentFormNote(pmt.note || "");
    setPaymentFormProofName(pmt.proofOfPaymentName || "");
  };

  const handleCancelEditPayment = () => {
    setEditingPaymentId(null);
    setPaymentFormInvoiceNumber("");
    setPaymentFormPlannedDate("");
    setPaymentFormPaymentDate("");
    setPaymentFormAmount("");
    setPaymentFormNote("");
    setPaymentFormProofName("");
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

    setLinkedEquipmentIds((prev) => {
      const nextList = [...prev, matchedAsset.id];
      setEquipmentPage(Math.ceil(nextList.length / EQUIPMENT_PER_PAGE));
      return nextList;
    });
    setSelectedEquipmentNumber("");
    setEqContractValue("");
    toast.success(`Added ${matchedAsset.equipmentNumber} (${matchedAsset.model}) to equipment list.`);
  };

  const handleCancelMasterEdit = () => {
    if (!contract?.id || contract.id.startsWith("cnt_draft")) {
      onClose();
      return;
    }
    setPaymentPage(1);
    setEquipmentPage(1);
    setContractValue(contract.contractValue || 0);
    setAmountPaid(contract.totalAmountPaid || 0);
    setContractType(contract.contractType || "PM + LABOUR");
    setContractNumber(contract.contractNumber || "");
    setContractStartDate(contract.contractStartDate || "");
    setContractEndDate(contract.contractEndDate || "");
    setContractInvoiceNumber(contract.contractInvoiceNumber || "");
    setContractPoNumber(contract.poNumber || "");
    setPaymentTermMonths(contract.paymentTermMonths || 3);
    setPaymentStartDate(contract.paymentStartDate || "");
    setPaymentEndDate(contract.paymentEndDate || "");
    setNextPaymentDate(contract.nextPaymentDate || "");
    setPayments(contract.payments || []);
    setLinkedEquipmentIds(contract.linkedEquipmentIds || []);
    setDetailsNote(contract.notes || "");
    setIsEditing(false);
    toast.info("Edit cancelled. Reverted to saved contract details.");
  };

  const handleMasterSave = () => {
    if (!contractNumber.trim()) {
      toast.error("Contract Number is required.");
      return;
    }
    if (contractValue > 0 && Number(amountPaid) > Number(contractValue)) {
      toast.error(`Amount paid cannot be greater than the contracted amount (₦${contractValue.toLocaleString()}).`);
      return;
    }

    const updatedContract: ServiceContract = {
      ...(contract || {} as any),
      id: contract?.id || `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      contractNumber: contractNumber.trim(),
      contractType,
      contractStatus: contract?.contractStatus || "In Contract",
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
    setIsEditing(false);
    toast.success(`Contract ${updatedContract.contractNumber} saved successfully.`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex flex-col w-[96vw] sm:w-[94vw] lg:max-w-5xl h-[92dvh] sm:h-[88dvh] max-h-[92dvh] sm:max-h-[88dvh] overflow-hidden p-0 gap-0 border border-border bg-card rounded-2xl shadow-2xl">
        {/* FIXED MODAL HEADER WITH RESPONSIVE TABS (Slide 19, 20, 22, 24) */}
        <div className="shrink-0 bg-card border-b border-border/80 px-4 sm:px-6 py-3 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 pr-11 sm:pr-12">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="size-8 sm:size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="size-4 sm:size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <DialogTitle className="text-sm sm:text-base font-bold font-mono text-foreground truncate">
                  {contractNumber || "CREATE / EDIT CONTRACT"}
                </DialogTitle>
                <ContractStatusBadge status={contract?.contractStatus || "In Contract"} />
                <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 hidden sm:inline-flex">
                  {contractType}
                </Badge>
                {isAdmin && !isEditing && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-6 px-2 text-[11px] font-bold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs ml-1"
                  >
                    <Pencil className="size-3" />
                    <span>Edit</span>
                  </Button>
                )}
                {isEditing && (
                  <Badge variant="secondary" className="text-[10px] font-semibold py-0 px-1.5 text-primary border border-primary/30">
                    Editing
                  </Badge>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span>{isEditing ? "Editing Contract" : "Viewing Contract (Locked)"}</span>
                <span>&bull;</span>
                <Calendar className="size-3 text-muted-foreground shrink-0" />
                <span className="truncate">
                  {contractStartDate || "—"} to {contractEndDate || "—"}
                </span>
              </p>
            </div>
          </div>

          {/* RESPONSIVE SEGMENTED TABS (Strictly matching Slides 20, 22, 24) */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto p-1 bg-muted/80 rounded-lg border border-border/80 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={cn(
                "flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer shrink-0 whitespace-nowrap",
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
                "flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer shrink-0 whitespace-nowrap",
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
                "flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer shrink-0 whitespace-nowrap",
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

        {/* SCROLLABLE MODAL BODY - ONLY THIS REGION SCROLLS */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-6 space-y-4 sm:space-y-5">
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
                        disabled={!isEditing}
                        value={contractValue || ""}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setContractValue(val);
                          if (val > 0 && amountPaid > val) {
                            setAmountPaid(val);
                            toast.warning("Amount Paid was adjusted to Contract Value.");
                          }
                        }}
                        className="h-9 text-xs pl-7 font-mono font-bold text-foreground bg-background border-border disabled:opacity-75 disabled:cursor-not-allowed"
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
                        max={contractValue > 0 ? contractValue : undefined}
                        disabled={!isEditing}
                        value={amountPaid || ""}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          if (contractValue > 0 && val > contractValue) {
                            toast.error(`Amount Paid cannot be greater than Contract Value (₦${contractValue.toLocaleString()}).`);
                            setAmountPaid(contractValue);
                          } else {
                            setAmountPaid(val);
                          }
                        }}
                        className="h-9 text-xs pl-7 font-mono font-bold text-foreground bg-background border-border disabled:opacity-75 disabled:cursor-not-allowed"
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
                      disabled={!isEditing}
                      onValueChange={(val) => setContractType(val as ContractType)}
                    >
                      <SelectTrigger className="h-9 text-xs font-medium bg-background border-border disabled:opacity-75 disabled:cursor-not-allowed">
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
                      disabled={!isEditing}
                      onChange={(e) => setContractNumber(e.target.value)}
                      placeholder="e.g. CTR-2026-881"
                      className="h-9 text-xs font-mono font-bold bg-background border-border disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Contract Start date</Label>
                    <Input
                      type="date"
                      disabled={!isEditing}
                      value={contractStartDate}
                      onChange={(e) => setContractStartDate(e.target.value)}
                      className="h-9 text-xs bg-background border-border disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Contract end date</Label>
                    <Input
                      type="date"
                      disabled={!isEditing}
                      value={contractEndDate}
                      onChange={(e) => setContractEndDate(e.target.value)}
                      className="h-9 text-xs bg-background border-border disabled:opacity-75 disabled:cursor-not-allowed"
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

                  <div className="w-full lg:w-64 p-4 rounded-lg border border-border bg-muted/20 space-y-3 shrink-0 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        Upload service contract
                      </span>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        Attach signed PDF or agreement annexure
                      </span>
                    </div>

                    <input
                      type="file"
                      ref={contractFileInputRef}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const newDoc = {
                            id: `doc_${Date.now()}`,
                            name: file.name,
                            note: detailsNote.trim() || "Executed agreement document",
                            date: new Date().toISOString().split("T")[0],
                            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                          };
                          setServiceContractsList((prev) => [...prev, newDoc]);
                          toast.success(`Attached ${file.name}`);
                          e.target.value = "";
                        }
                      }}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      disabled={!isEditing}
                      onClick={() => contractFileInputRef.current?.click()}
                      className="h-9 w-full text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs border-border hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="size-3.5 text-primary" />
                      <span>Choose File to Upload</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Note (Bottom Textarea) */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-2">
                <Label className="text-xs font-bold text-foreground">Note</Label>
                <Textarea
                  rows={3}
                  disabled={!isEditing}
                  value={detailsNote}
                  onChange={(e) => setDetailsNote(e.target.value)}
                  placeholder="Enter agreement terms, special warranty clauses, or administrative notes..."
                  className="text-xs bg-background border-border resize-none disabled:opacity-75 disabled:cursor-not-allowed"
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
                      disabled={!isEditing}
                      onChange={(e) => setContractInvoiceNumber(e.target.value)}
                      placeholder="e.g. INV-2026-001"
                      className="h-9 text-xs font-mono font-bold bg-background border-border disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Contract PO Number
                    </Label>
                    <Input
                      value={contractPoNumber}
                      disabled={!isEditing}
                      onChange={(e) => setContractPoNumber(e.target.value)}
                      placeholder="e.g. PO-88910"
                      className="h-9 text-xs font-mono font-bold bg-background border-border disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Payment term (months)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      disabled={!isEditing}
                      value={paymentTermMonths}
                      onChange={(e) => setPaymentTermMonths(Number(e.target.value) || 1)}
                      className="h-9 text-xs font-mono font-semibold bg-background border-border disabled:opacity-75 disabled:cursor-not-allowed"
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
                      disabled={!isEditing}
                      value={paymentStartDate}
                      onChange={(e) => setPaymentStartDate(e.target.value)}
                      className="h-9 text-xs bg-background border-border disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Payment end date</Label>
                    <Input
                      type="date"
                      disabled={!isEditing}
                      value={paymentEndDate}
                      onChange={(e) => setPaymentEndDate(e.target.value)}
                      className="h-9 text-xs bg-background border-border disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Next Payment date</Label>
                    <Input
                      type="date"
                      disabled={!isEditing}
                      value={nextPaymentDate}
                      onChange={(e) => setNextPaymentDate(e.target.value)}
                      className="h-9 text-xs bg-background border-border disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* PAYMENT HISTORY Card (Slide 22 & 23) */}
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
                        Enter payment details manually and save to log verified installments on this contract.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Manual Payment Entry & Edit Form */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      {editingPaymentId ? (
                        <>
                          <Pencil className="size-3.5 text-primary" />
                          <span>Edit Payment Record</span>
                        </>
                      ) : (
                        <>
                          <Plus className="size-3.5 text-primary" />
                          <span>Record Payment</span>
                        </>
                      )}
                    </span>
                    {editingPaymentId && (
                      <Badge variant="outline" className="text-[10px] text-primary font-mono py-0">
                        Editing Active
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-foreground">
                        Invoice Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={paymentFormInvoiceNumber}
                        disabled={!isEditing}
                        onChange={(e) => setPaymentFormInvoiceNumber(e.target.value)}
                        placeholder="e.g. INV-2026-001"
                        className="h-8 text-xs font-mono font-bold bg-background border-border disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-foreground">
                        Date of planned payment
                      </Label>
                      <Input
                        type="date"
                        disabled={!isEditing}
                        value={paymentFormPlannedDate}
                        onChange={(e) => setPaymentFormPlannedDate(e.target.value)}
                        className="h-8 text-xs bg-background border-border disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-foreground">
                        Date of payment
                      </Label>
                      <Input
                        type="date"
                        disabled={!isEditing}
                        value={paymentFormPaymentDate}
                        onChange={(e) => setPaymentFormPaymentDate(e.target.value)}
                        className="h-8 text-xs bg-background border-border disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-foreground">
                        Amount (₦) <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs font-mono font-bold text-muted-foreground">
                          ₦
                        </span>
                        <Input
                          type="number"
                          min="0"
                          disabled={!isEditing}
                          value={paymentFormAmount}
                          onChange={(e) =>
                            setPaymentFormAmount(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          placeholder="0.00"
                          className="h-8 text-xs pl-6 font-mono font-bold bg-background border-border disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-foreground">Note</Label>
                      <Input
                        value={paymentFormNote}
                        disabled={!isEditing}
                        onChange={(e) => setPaymentFormNote(e.target.value)}
                        placeholder="Milestone note, bank ref..."
                        className="h-8 text-xs bg-background border-border disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-foreground">
                        Proof of Payment
                      </Label>
                      <div className="flex items-center gap-2">
                        <label className={cn(
                          "h-8 px-3 rounded-md border border-border bg-background text-xs font-medium flex items-center gap-1.5 shadow-2xs flex-1 truncate",
                          isEditing ? "cursor-pointer hover:bg-muted/60" : "opacity-75 cursor-not-allowed"
                        )}>
                          <Upload className="size-3 text-primary shrink-0" />
                          <span className="truncate text-muted-foreground">
                            {paymentFormProofName || "Attach receipt (PDF/IMG)"}
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            disabled={!isEditing}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setPaymentFormProofName(file.name);
                                toast.success(`Attached ${file.name}`);
                              }
                            }}
                          />
                        </label>
                        {paymentFormProofName && isEditing && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPaymentFormProofName("")}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {editingPaymentId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEditPayment}
                        className="h-8 px-3 text-xs font-semibold cursor-pointer border-border"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={handleSavePayment}
                      disabled={!isEditing || !isAdmin}
                      className="h-8 px-5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="size-3.5" />
                      <span>{editingPaymentId ? "Save Changes" : "Save"}</span>
                    </Button>
                  </div>
                </div>

                {/* The Table */}
                <div className="rounded-lg border border-border overflow-hidden bg-background">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse whitespace-nowrap min-w-[660px]">
                      <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider border-b border-border">
                        <tr>
                          <th className="py-2.5 px-3 w-14 text-center">S/N</th>
                          <th className="py-2.5 px-3 font-bold text-foreground">INVOICE NUMBER</th>
                          <th className="py-2.5 px-3">DATE OF PLANNED PAYMENT</th>
                          <th className="py-2.5 px-3">DATE OF PAYMENT</th>
                          <th className="py-2.5 px-3 text-right">AMOUNT (₦)</th>
                          <th className="py-2.5 px-3">NOTE</th>
                          <th className="py-2.5 px-3 text-center">VIEW PROOF OF PAYMENT</th>
                          <th className="py-2.5 px-3 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {payments.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-muted-foreground">
                              <p className="font-medium text-xs text-foreground">No payments recorded</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Enter payment details in the form above and click "Save" to add them to this table.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          paginatedPayments.map((pmt, idx) => {
                            const pmtIndex = (currentPaymentPage - 1) * PAYMENTS_PER_PAGE + idx + 1;
                            return (
                              <tr key={pmt.id} className="hover:bg-muted/30 transition-colors">
                                <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                                  {pmtIndex}
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
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditPayment(pmt)}
                                      disabled={!isEditing || !isAdmin}
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                      title="Edit payment"
                                    >
                                      <Pencil className="size-3" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {payments.length > 0 && (
                    <TablePagination
                      page={currentPaymentPage}
                      pageCount={paymentPageCount}
                      total={payments.length}
                      from={paymentFrom}
                      to={paymentTo}
                      onPageChange={(p) => setPaymentPage(p)}
                    />
                  )}
                </div>
              </div>

              {/* Note (Bottom Textarea) */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-2">
                <Label className="text-xs font-bold text-foreground">Note</Label>
                <Textarea
                  rows={3}
                  disabled={!isEditing}
                  value={paymentTermsNote}
                  onChange={(e) => setPaymentTermsNote(e.target.value)}
                  placeholder="Enter banking instructions, payment milestone notes, or exchange terms..."
                  className="text-xs bg-background border-border resize-none disabled:opacity-75 disabled:cursor-not-allowed"
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
                    <Select
                      value={selectedEquipmentNumber}
                      onValueChange={(val) => setSelectedEquipmentNumber(val)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="h-9 text-xs font-mono font-bold bg-background border-border" disabled={!isEditing}>
                        <SelectValue placeholder="Select Equipment #" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {allAssets.map((a) => (
                          <SelectItem key={a.id} value={a.equipmentNumber} className="text-xs py-1.5">
                            <span className="font-mono font-bold text-primary">{a.equipmentNumber}</span>
                            <span className="text-muted-foreground ml-1.5">— {a.oem} {a.model}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        disabled={!isEditing}
                        className="h-9 text-xs pl-7 font-mono font-bold bg-background border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Contract type</Label>
                    <Select
                      value={eqContractType}
                      onValueChange={(val) => setEqContractType(val as ContractType)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background border-border" disabled={!isEditing}>
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
                      disabled={!isEditing}
                      className="h-9 text-xs bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Contract end date</Label>
                    <Input
                      type="date"
                      value={eqEndDate}
                      onChange={(e) => setEqEndDate(e.target.value)}
                      disabled={!isEditing}
                      className="h-9 text-xs bg-background border-border"
                    />
                  </div>

                  <div>
                    <Button
                      type="button"
                      onClick={handleAddEquipment}
                      disabled={!isEditing || !isAdmin}
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
                    <table className="w-full text-xs text-left border-collapse whitespace-nowrap min-w-[760px]">
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
                          paginatedEquipment.map((eq, idx) => {
                            const eqIndex = (currentEquipmentPage - 1) * EQUIPMENT_PER_PAGE + idx + 1;
                            return (
                              <tr key={eq.id} className="hover:bg-muted/30 transition-colors">
                                <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                                  {eqIndex}
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
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {coveredEquipment.length > 0 && (
                    <TablePagination
                      page={currentEquipmentPage}
                      pageCount={equipmentPageCount}
                      total={coveredEquipment.length}
                      from={equipmentFrom}
                      to={equipmentTo}
                      onPageChange={(p) => setEquipmentPage(p)}
                    />
                  )}
                </div>

              </div>

              {/* Note (Bottom Textarea) */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-2">
                <Label className="text-xs font-bold text-foreground">Note</Label>
                <Textarea
                  rows={3}
                  value={equipmentListNote}
                  onChange={(e) => setEquipmentListNote(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter covered equipment exclusions, accessories included, or PPM scheduling terms..."
                  className="text-xs bg-background border-border resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* FIXED MODAL FOOTER WITH SAVE & CLOSE BUTTONS (Slides 20, 22, 24) */}
        <div className="shrink-0 bg-card border-t border-border/80 px-4 sm:px-6 py-3 flex items-center justify-between sm:justify-end gap-2.5">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelMasterEdit}
                className="h-9 px-4 sm:px-5 text-xs font-semibold cursor-pointer border-border flex-1 sm:flex-initial"
              >
                <X className="size-3.5 mr-1.5 text-muted-foreground" />
                <span>Cancel</span>
              </Button>
              <Button
                type="button"
                onClick={handleMasterSave}
                className="h-9 px-5 sm:px-6 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs flex-1 sm:flex-initial"
              >
                <Save className="size-3.5 mr-1.5" />
                <span>Save Contract</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-9 px-4 sm:px-5 text-xs font-semibold cursor-pointer border-border flex-1 sm:flex-initial"
              >
                <X className="size-3.5 mr-1.5 text-muted-foreground" />
                <span>Close</span>
              </Button>
              {isAdmin && (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="h-9 px-5 sm:px-6 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs flex-1 sm:flex-initial gap-1.5"
                >
                  <Pencil className="size-3.5" />
                  <span>Edit Contract</span>
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ContractDetailWorkspace = ContractModal;

