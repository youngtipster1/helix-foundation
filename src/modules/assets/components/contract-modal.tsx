import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  CreditCard,
  Wrench,
  Plus,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Upload,
  Paperclip,
  Download,
  Building,
  Layers,
  FileUp,
} from "lucide-react";
import {
  ServiceContract,
  ContractPayment,
  ContractType,
  ContractStatus,
  Asset,
  AssetJob,
} from "../types";
import { ContractStatusBadge, EquipmentStatusBadge } from "./status-badges";
import { assetService } from "../services/asset-service";
import { useAuth } from "@/features/auth/auth-context";

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract?: ServiceContract | null;
  mode: "view" | "edit" | "create";
  onSave: (contractData: Partial<ServiceContract>) => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  contract,
  mode: initialMode,
  onSave,
}) => {
  const { user } = useAuth();
  const userRole = user?.role || "User";
  const isSuperAdmin = userRole === "Super Admin";
  const isAdmin = userRole === "Admin" || userRole === "Asset Admin" || isSuperAdmin;

  const [mode, setMode] = useState<"view" | "edit" | "create">(initialMode);
  const [activeTab, setActiveTab] = useState("contract");

  useEffect(() => {
    setMode(initialMode);
    setActiveTab("contract");
  }, [initialMode, isOpen]);

  // Form state
  const [formData, setFormData] = useState<Partial<ServiceContract>>({
    contractNumber: "",
    contractType: "COMPREHENSIVE",
    contractValue: 50000000,
    contractStartDate: new Date().toISOString().split("T")[0],
    contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    contractStatus: "In Contract",
    poNumber: "",
    contractOrderNumber: "",
    contractInvoiceNumber: "",
    paymentTermMonths: 12,
    paymentStartDate: new Date().toISOString().split("T")[0],
    paymentEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    vendorName: "",
    notes: "",
    linkedEquipmentIds: [],
    payments: [],
    amountPayableNextMonth: 4166666,
  });

  // Available assets
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [linkedJobs, setLinkedJobs] = useState<AssetJob[]>([]);

  // Payment Recording Form
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    dateOfPlannedPayment: new Date().toISOString().split("T")[0],
    dateOfPayment: new Date().toISOString().split("T")[0],
    amount: 5000000,
    status: "Paid" as const,
    proofOfPaymentName: "",
    note: "Quarterly maintenance advance payment",
  });

  useEffect(() => {
    const assets = assetService.getAssets(false);
    setAllAssets(assets);

    if (contract && mode !== "create") {
      setFormData(contract);
      setLinkedJobs(assetService.getJobsForContract(contract.id));
    } else if (mode === "create") {
      setFormData({
        contractNumber: `SC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        contractType: "COMPREHENSIVE",
        contractValue: 45000000,
        contractStartDate: new Date().toISOString().split("T")[0],
        contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        contractStatus: "In Contract",
        poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        contractOrderNumber: `ORD-${new Date().getFullYear()}-01`,
        contractInvoiceNumber: `INV-INIT-${Math.floor(100 + Math.random() * 900)}`,
        paymentTermMonths: 12,
        paymentStartDate: new Date().toISOString().split("T")[0],
        paymentEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        vendorName: "GE Healthcare EMEA Direct",
        notes: "Full comprehensive coverage including glassware and vacuum components.",
        linkedEquipmentIds: [],
        payments: [],
        amountPayableNextMonth: 3750000,
      });
      setLinkedJobs([]);
    }
  }, [contract, mode, isOpen]);

  // Handle linking/unlinking equipment
  const toggleEquipmentLink = (assetId: string) => {
    const current = formData.linkedEquipmentIds || [];
    const next = current.includes(assetId)
      ? current.filter((id) => id !== assetId)
      : [...current, assetId];
    setFormData({ ...formData, linkedEquipmentIds: next });
  };

  // Handle adding payment
  const handleAddPaymentSubmit = () => {
    const newPayment: ContractPayment = {
      id: `pay_${Date.now()}`,
      invoiceNumber: paymentForm.invoiceNumber,
      dateOfPlannedPayment: paymentForm.dateOfPlannedPayment,
      dateOfPayment: paymentForm.status === "Paid" ? paymentForm.dateOfPayment : undefined,
      amount: Number(paymentForm.amount) || 0,
      status: paymentForm.status,
      proofOfPaymentName: paymentForm.proofOfPaymentName || "Bank_Receipt_Settlement.pdf",
      proofOfPaymentUrl: "https://example.com/receipt.pdf",
      note: paymentForm.note,
    };

    const currentPayments = formData.payments || [];
    const updatedPayments = [newPayment, ...currentPayments];

    const totalPaid = updatedPayments
      .filter((p) => p.status === "Paid")
      .reduce((sum, p) => sum + p.amount, 0);

    const contractValue = formData.contractValue || 0;
    const totalOutstanding = Math.max(0, contractValue - totalPaid);

    setFormData({
      ...formData,
      payments: updatedPayments,
      totalAmountPaid: totalPaid,
      totalAmountOutstanding: totalOutstanding,
    });

    setIsAddingPayment(false);
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const isReadOnly = mode === "view";
  const contractValue = formData.contractValue || 0;
  const totalAmountPaid = (formData.payments || [])
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const outstandingPayable = Math.max(0, contractValue - totalAmountPaid);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <FileText className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                    {mode === "create"
                      ? "Create New Service Contract"
                      : `${formData.contractNumber || "Contract"} - ${formData.vendorName || ""}`}
                  </DialogTitle>
                  <ContractStatusBadge status={formData.contractStatus || "In Contract"} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Type: {formData.contractType} | PO: {formData.poNumber || "N/A"}
                </p>
              </div>
            </div>

            {mode === "view" && isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode("edit")}
                className="text-xs h-8"
              >
                Edit Contract
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* 3 Restructured Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-5 pt-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <TabsList className="grid grid-cols-3 w-full sm:w-auto sm:inline-flex h-9 bg-slate-100 dark:bg-slate-800 p-1">
              <TabsTrigger value="contract" className="text-xs gap-1.5">
                <FileText className="size-3.5" /> 1. Service Contract
              </TabsTrigger>
              <TabsTrigger value="payment" className="text-xs gap-1.5">
                <CreditCard className="size-3.5" /> 2. Payment Terms
              </TabsTrigger>
              <TabsTrigger value="service" className="text-xs gap-1.5">
                <Wrench className="size-3.5" /> 3. Equipment Service
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* ========================================================= */}
            {/* TAB 1: SERVICE CONTRACT */}
            {/* ========================================================= */}
            <TabsContent value="contract" className="m-0 space-y-5">
              {/* Contract Metadata Card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Agreement Identification & Commercial Terms
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Contract # *
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.contractNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, contractNumber: e.target.value })
                      }
                      className="mt-1 h-8 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Vendor / Service Provider *
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.vendorName || ""}
                      onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Contract Type *
                    </Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.contractType || "COMPREHENSIVE"}
                      onValueChange={(val: ContractType) =>
                        setFormData({ ...formData, contractType: val })
                      }
                    >
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue />
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

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Contract Value (₦) *
                    </Label>
                    <Input
                      type="number"
                      disabled={isReadOnly}
                      value={formData.contractValue || 0}
                      onChange={(e) =>
                        setFormData({ ...formData, contractValue: parseFloat(e.target.value) || 0 })
                      }
                      className="mt-1 h-8 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Contract Status *
                    </Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.contractStatus || "In Contract"}
                      onValueChange={(val: ContractStatus) =>
                        setFormData({ ...formData, contractStatus: val })
                      }
                    >
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="In Contract">In Contract</SelectItem>
                        <SelectItem value="Out of Contract">Out of Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Purchase Order (PO) # *
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.poNumber || ""}
                      onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                      className="mt-1 h-8 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Contract Start Date * (Manual)
                    </Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.contractStartDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, contractStartDate: e.target.value })
                      }
                      className="mt-1 h-8 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Contract End Date * (Manual)
                    </Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.contractEndDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, contractEndDate: e.target.value })
                      }
                      className="mt-1 h-8 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Payment Term (Months)
                    </Label>
                    <Input
                      type="number"
                      disabled={isReadOnly}
                      value={formData.paymentTermMonths || 12}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentTermMonths: parseInt(e.target.value) || 12,
                        })
                      }
                      className="mt-1 h-8 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Order / Requisition Number
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.contractOrderNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, contractOrderNumber: e.target.value })
                      }
                      className="mt-1 h-8 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Initial Invoice #
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.contractInvoiceNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, contractInvoiceNumber: e.target.value })
                      }
                      className="mt-1 h-8 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Next Payment Date
                    </Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.nextPaymentDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, nextPaymentDate: e.target.value })
                      }
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Terms & Conditions / Special Inclusions
                  </Label>
                  <Textarea
                    disabled={isReadOnly}
                    rows={2}
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-1 text-xs"
                    placeholder="SLA response times, emergency weekend coverage, parts discounts..."
                  />
                </div>
              </div>

              {/* Linked Equipment Selector */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Linked Equipment Units Covered by this Contract
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Selected equipment will automatically inherit this contract's coverage details
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {(formData.linkedEquipmentIds || []).length} Selected
                  </Badge>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {allAssets.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">
                      No assets in system
                    </div>
                  ) : (
                    allAssets.map((asset) => {
                      const isLinked = (formData.linkedEquipmentIds || []).includes(asset.id);
                      return (
                        <div
                          key={asset.id}
                          onClick={() => !isReadOnly && toggleEquipmentLink(asset.id)}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                            isLinked
                              ? "border-teal-500/40 bg-teal-50/40 dark:bg-teal-950/20"
                              : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                          } ${!isReadOnly ? "cursor-pointer hover:border-slate-300" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isLinked}
                              disabled={isReadOnly}
                              onChange={() => !isReadOnly && toggleEquipmentLink(asset.id)}
                              className="size-4 text-teal-600 rounded"
                            />
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {asset.equipmentNumber} — {asset.oem} {asset.model}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                SN: {asset.serialNumber} • Modality: {asset.modality} • Customer: {asset.customer}
                              </div>
                            </div>
                          </div>
                          <EquipmentStatusBadge status={asset.equipmentStatus} />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ========================================================= */}
            {/* TAB 2: PAYMENT TERMS (Strict Amount Payable Direction) */}
            {/* ========================================================= */}
            <TabsContent value="payment" className="m-0 space-y-5">
              {/* Financial Direction Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">
                    Total Contract Value
                  </span>
                  <div className="text-xl font-black font-mono mt-1 text-slate-900 dark:text-white">
                    ₦{contractValue.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <span className="text-[11px] font-semibold text-emerald-600 uppercase">
                    Total Amount Paid
                  </span>
                  <div className="text-xl font-black font-mono mt-1 text-emerald-600 dark:text-emerald-400">
                    ₦{totalAmountPaid.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Outstanding Payable (confirmed payable) */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <span className="text-[11px] font-semibold text-rose-600 uppercase">
                    Outstanding Payable
                  </span>
                  <div className="text-xl font-black font-mono mt-1 text-rose-600 dark:text-rose-400">
                    ₦{outstandingPayable.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

              {/* Payments Ledger */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Payment Schedule & Settlement Records
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Proof of payment documents and bank confirmation receipts
                    </p>
                  </div>
                  {!isReadOnly && (
                    <Button
                      size="sm"
                      onClick={() => setIsAddingPayment(true)}
                      className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      <Plus className="size-3.5" /> Record Payment
                    </Button>
                  )}
                </div>

                {/* Sub-form to record payment */}
                {isAddingPayment && (
                  <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                    <div className="font-semibold text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <DollarSign className="size-3.5" /> Record Settlement / Payment
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <Label className="text-[11px]">Invoice # *</Label>
                        <Input
                          value={paymentForm.invoiceNumber}
                          onChange={(e) =>
                            setPaymentForm({ ...paymentForm, invoiceNumber: e.target.value })
                          }
                          className="h-8 text-xs mt-1 font-mono"
                        />
                      </div>

                      <div>
                        <Label className="text-[11px]">Amount (₦) *</Label>
                        <Input
                          type="number"
                          value={paymentForm.amount}
                          onChange={(e) =>
                            setPaymentForm({
                              ...paymentForm,
                              amount: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-8 text-xs mt-1 font-mono"
                        />
                      </div>

                      <div>
                        <Label className="text-[11px]">Payment Status</Label>
                        <Select
                          value={paymentForm.status}
                          onValueChange={(val: any) =>
                            setPaymentForm({ ...paymentForm, status: val })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-[11px]">Date of Planned Payment (Manual)</Label>
                        <Input
                          type="date"
                          value={paymentForm.dateOfPlannedPayment}
                          onChange={(e) =>
                            setPaymentForm({
                              ...paymentForm,
                              dateOfPlannedPayment: e.target.value,
                            })
                          }
                          className="h-8 text-xs mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-[11px]">Date of Actual Payment (Manual)</Label>
                        <Input
                          type="date"
                          value={paymentForm.dateOfPayment}
                          onChange={(e) =>
                            setPaymentForm({ ...paymentForm, dateOfPayment: e.target.value })
                          }
                          className="h-8 text-xs mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-[11px]">Proof of Payment Document</Label>
                        <Input
                          placeholder="e.g. CBN_Transfer_Receipt.pdf"
                          value={paymentForm.proofOfPaymentName}
                          onChange={(e) =>
                            setPaymentForm({
                              ...paymentForm,
                              proofOfPaymentName: e.target.value,
                            })
                          }
                          className="h-8 text-xs mt-1"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <Label className="text-[11px]">Payment Note</Label>
                        <Input
                          value={paymentForm.note}
                          onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                          placeholder="Bank reference number, authorized approver..."
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsAddingPayment(false)}
                        className="text-xs h-7"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddPaymentSubmit}
                        className="text-xs h-7 bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Save Payment
                      </Button>
                    </div>
                  </div>
                )}

                {/* Table of Payments */}
                <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 text-[11px]">
                        <th className="py-2.5 px-3">Invoice #</th>
                        <th className="py-2.5 px-3">Planned Date</th>
                        <th className="py-2.5 px-3">Paid Date</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Proof of Payment</th>
                        <th className="py-2.5 px-3 text-right">Amount (₦)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {(formData.payments || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            No payment records entered for this contract yet.
                          </td>
                        </tr>
                      ) : (
                        formData.payments?.map((payment) => (
                          <tr key={payment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              {payment.invoiceNumber}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {payment.dateOfPlannedPayment}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {payment.dateOfPayment || "—"}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className={`text-[10px] py-0 px-2 ${
                                  payment.status === "Paid"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                                }`}
                              >
                                {payment.status}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {payment.proofOfPaymentName ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(`Downloading ${payment.proofOfPaymentName}...`)
                                  }
                                  className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                                >
                                  <Paperclip className="size-3" />
                                  {payment.proofOfPaymentName}
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[11px]">None</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-900 dark:text-white text-right whitespace-nowrap">
                              ₦{payment.amount.toLocaleString("en-US")}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* ========================================================= */}
            {/* TAB 3: EQUIPMENT SERVICE (Option A: Filtered view of jobs) */}
            {/* ========================================================= */}
            <TabsContent value="service" className="m-0 space-y-5">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Service Jobs for Attached Equipment
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Aggregated view of maintenance activities performed across covered devices
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {linkedJobs.length} Jobs
                  </Badge>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 text-[11px]">
                        <th className="py-2.5 px-3">Job #</th>
                        <th className="py-2.5 px-3">Equipment #</th>
                        <th className="py-2.5 px-3">Job Type</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Dates</th>
                        <th className="py-2.5 px-3">Technician</th>
                        <th className="py-2.5 px-3 text-right">Cost (₦)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {linkedJobs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                            No service jobs found for the equipment attached to this contract.
                          </td>
                        </tr>
                      ) : (
                        linkedJobs.map((job) => (
                          <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              {job.jobNumber}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {job.equipmentNumber}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                              {job.jobType}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className={`text-[10px] py-0 px-2 ${
                                  job.jobStatus === "Completed"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                                }`}
                              >
                                {job.jobStatus}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                              {job.startDate} to {job.endDate}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {job.technician}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-900 dark:text-white text-right whitespace-nowrap">
                              ₦{job.costOfService.toLocaleString("en-US")}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <DialogFooter className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between sm:justify-between flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
            {mode === "view" ? "Close" : "Cancel"}
          </Button>

          {mode !== "view" && (
            <Button
              size="sm"
              onClick={handleSave}
              className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {mode === "create" ? "Create Service Contract" : "Save Changes"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
