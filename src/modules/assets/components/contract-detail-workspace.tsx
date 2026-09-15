import React, { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Upload, Plus, Eye } from "lucide-react";
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
import {
  ServiceContract,
  ContractPayment,
  ContractType,
  Asset,
} from "../types";
import { assetService } from "../services/asset-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [activeTab, setActiveTab] = useState<"details" | "payments" | "equipment">("details");
  const allAssets = useMemo(() => assetService.getAssets(false), []);

  // -------------------------------------------------------------
  // SLIDE 20: CONTRACT DETAILS STATE
  // -------------------------------------------------------------
  const [contractValue, setContractValue] = useState<number>(contract.contractValue || 0);
  const [amountPaid, setAmountPaid] = useState<number>(contract.totalAmountPaid || 0);
  // Slide 21: Amount Outstanding = Contract Value - amount paid
  const amountOutstanding = Math.max(0, (Number(contractValue) || 0) - (Number(amountPaid) || 0));

  const [contractType, setContractType] = useState<ContractType>(
    contract.contractType || "PM + LABOUR"
  );
  const [contractNumber, setContractNumber] = useState<string>(contract.contractNumber || "");
  const [contractStartDate, setContractStartDate] = useState<string>(
    contract.contractStartDate || new Date().toISOString().split("T")[0]
  );
  const [contractEndDate, setContractEndDate] = useState<string>(
    contract.contractEndDate || new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0]
  );

  // Service Contract Table (Slide 20: S/N, Service contract, Note)
  const [serviceContractsList, setServiceContractsList] = useState<
    Array<{ id: string; name: string; note: string }>
  >([
    {
      id: "doc_1",
      name: `${contract.contractNumber || "Contract"}_Agreement_Signed.pdf`,
      note: "Fully executed OEM maintenance agreement",
    },
  ]);
  const [docNote, setDocNote] = useState<string>("");

  // Bottom Note for Details Tab (Slide 20)
  const [detailsNote, setDetailsNote] = useState<string>(contract.notes || "");

  // -------------------------------------------------------------
  // SLIDE 22 & 23: PAYMENT TERMS STATE
  // -------------------------------------------------------------
  const [contractInvoiceNumber, setContractInvoiceNumber] = useState<string>(
    contract.contractInvoiceNumber || ""
  );
  const [contractPoNumber, setContractPoNumber] = useState<string>(contract.poNumber || "");
  const [paymentTermMonths, setPaymentTermMonths] = useState<number>(
    contract.paymentTermMonths || 3
  );

  const [paymentStartDate, setPaymentStartDate] = useState<string>(
    contract.paymentStartDate || contractStartDate
  );
  const [paymentEndDate, setPaymentEndDate] = useState<string>(
    contract.paymentEndDate || contractEndDate
  );
  const [nextPaymentDate, setNextPaymentDate] = useState<string>(
    contract.nextPaymentDate || contractStartDate
  );

  // Payment History Table (Slide 22: S/N, Invoice Number, Date of planned payment, Date of payment, Amount, Note, View proof of payment)
  const [payments, setPayments] = useState<ContractPayment[]>(contract.payments || []);

  // Slide 23: Total Amount paid = sum of all payment amount made
  const totalAmountPaidCalculated = useMemo(() => {
    return payments
      .filter((p) => p.status === "Paid" || Boolean(p.dateOfPayment))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments]);

  // Bottom Note for Payment Terms Tab (Slide 22)
  const [paymentTermsNote, setPaymentTermsNote] = useState<string>("");

  // -------------------------------------------------------------
  // SLIDE 24 & 25: EQUIPMENT LIST STATE
  // -------------------------------------------------------------
  // Top Form Fields:
  // Row 1: Equipment Number, OEM (blue), Modality (blue), Serial Number (blue), Location (blue)
  // Row 2: Contract value, Contract type, Contract start date, Contract end date
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
  const [eqContractType, setEqContractType] = useState<ContractType>(contractType);
  const [eqStartDate, setEqStartDate] = useState<string>(contractStartDate);
  const [eqEndDate, setEqEndDate] = useState<string>(contractEndDate);

  // Table rows for covered equipment (Slide 24: S/N, Equipment Number, OEM, Modality, Model, Serial Number, Location, Contract value, Contract Type, Contract start date, Contract end date)
  const [linkedEquipmentIds, setLinkedEquipmentIds] = useState<string[]>(
    contract.linkedEquipmentIds || []
  );

  const coveredEquipment = useMemo(() => {
    return linkedEquipmentIds
      .map((id) => allAssets.find((a) => a.id === id))
      .filter(Boolean) as Asset[];
  }, [linkedEquipmentIds, allAssets]);

  // Bottom Note for Equipment List Tab (Slide 24)
  const [equipmentListNote, setEquipmentListNote] = useState<string>("");

  // Sync payments total to amountPaid when on payment terms
  useEffect(() => {
    if (totalAmountPaidCalculated > 0) {
      setAmountPaid(totalAmountPaidCalculated);
    }
  }, [totalAmountPaidCalculated]);

  // -------------------------------------------------------------
  // ACTIONS: Slide 20 (Upload Service Contract)
  // -------------------------------------------------------------
  const handleUploadServiceContract = () => {
    const newDoc = {
      id: `doc_${Date.now()}`,
      name: `${contractNumber || "Contract"}_Annexure_${Date.now().toString().slice(-4)}.pdf`,
      note: docNote.trim() || "Uploaded contract document",
    };
    setServiceContractsList((prev) => [...prev, newDoc]);
    setDocNote("");
    toast.success("Service contract document uploaded.");
  };

  // -------------------------------------------------------------
  // ACTIONS: Slide 22 (Upload Payment / Proof)
  // -------------------------------------------------------------
  const handleUploadPayment = () => {
    if (!contractInvoiceNumber.trim()) {
      toast.error("Please enter a Contract Invoice Number first.");
      return;
    }

    // Auto calculate planned date based on payment terms (Slide 23)
    const plannedDate = new Date();
    plannedDate.setMonth(plannedDate.getMonth() + (Number(paymentTermMonths) || 3));

    const newPayment: ContractPayment = {
      id: `pmt_${Date.now()}`,
      invoiceNumber: contractInvoiceNumber.trim(),
      dateOfPlannedPayment: plannedDate.toISOString().split("T")[0],
      dateOfPayment: new Date().toISOString().split("T")[0],
      amount: Math.round(Number(contractValue) / Math.max(1, Math.round(12 / (Number(paymentTermMonths) || 3)))),
      status: "Paid",
      note: paymentTermsNote.trim() || "Payment recorded",
      proofOfPaymentName: `Payment_Receipt_${contractInvoiceNumber.trim()}.pdf`,
    };

    setPayments((prev) => [...prev, newPayment]);
    toast.success(`Payment invoice ${newPayment.invoiceNumber} recorded with proof.`);
  };

  // -------------------------------------------------------------
  // ACTIONS: Slide 24 (Add Equipment)
  // -------------------------------------------------------------
  const handleAddEquipment = () => {
    if (!matchedAsset) {
      toast.error("Please select or enter a valid Equipment Number.");
      return;
    }
    if (linkedEquipmentIds.includes(matchedAsset.id)) {
      toast.error("Equipment is already in this contract's coverage list.");
      return;
    }

    setLinkedEquipmentIds((prev) => [...prev, matchedAsset.id]);
    setSelectedEquipmentNumber("");
    setEqContractValue("");
    toast.success(`Added ${matchedAsset.equipmentNumber} to equipment list.`);
  };

  // -------------------------------------------------------------
  // MASTER SAVE ACTION (Slides 20, 22, 24 Save button)
  // -------------------------------------------------------------
  const handleMasterSave = () => {
    if (!contractNumber.trim()) {
      toast.error("Contract Number is required.");
      return;
    }

    const updatedContract: ServiceContract = {
      ...contract,
      contractNumber: contractNumber.trim(),
      contractType,
      contractStatus: "In Contract",
      contractValue: Number(contractValue) || 0,
      contractStartDate,
      contractEndDate,
      contractOrderNumber: contract.contractOrderNumber || undefined,
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
      notes: detailsNote.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onUpdateContract(updatedContract);
    toast.success(`Contract ${updatedContract.contractNumber} saved successfully.`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-5 shadow-xs max-w-7xl mx-auto space-y-6 text-foreground font-sans">
      {/* Top Bar with Back button and Navigation Tabs matching Slides 20, 22, 24 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="h-8 gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Contracts</span>
        </Button>

        {/* TABS (Slide 20, 22, 24: Contract Details | Payment Terms | Equipment List) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Tab 1: Contract Details */}
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={cn(
              "px-4 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer border",
              activeTab === "details"
                ? "border-red-500 text-red-600 bg-red-50/60 dark:bg-red-950/30 dark:text-red-400 font-extrabold ring-1 ring-red-400"
                : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            )}
          >
            Contract Details
          </button>

          {/* Tab 2: Payment Terms */}
          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            className={cn(
              "px-4 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer border",
              activeTab === "payments"
                ? "border-red-500 text-red-600 bg-red-50/60 dark:bg-red-950/30 dark:text-red-400 font-extrabold ring-1 ring-red-400"
                : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            )}
          >
            Payment Terms
          </button>

          {/* Tab 3: Equipment List */}
          <button
            type="button"
            onClick={() => setActiveTab("equipment")}
            className={cn(
              "px-4 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer border",
              activeTab === "equipment"
                ? "border-red-500 text-red-600 bg-red-50/60 dark:bg-red-950/30 dark:text-red-400 font-extrabold ring-1 ring-red-400"
                : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            )}
          >
            Equipment List
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CONTRACT DETAILS (SLIDE 20)                                         */}
      {/* ========================================================================= */}
      {activeTab === "details" && (
        <div className="space-y-6">
          {/* Section: DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-2 flex items-start pt-1">
              <span className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-slate-100">
                DETAILS
              </span>
            </div>

            <div className="md:col-span-10 space-y-4">
              {/* Row 1: Contract Value | Amount Paid | Amount Outstanding */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contract Value
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={contractValue}
                    onChange={(e) => setContractValue(Number(e.target.value) || 0)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Amount Paid
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Amount Outstanding
                  </Label>
                  <Input
                    type="number"
                    readOnly
                    value={amountOutstanding}
                    className="h-9 text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-bold"
                  />
                </div>
              </div>

              {/* Row 2: Contract Type | Contract Number | Contract Start date | Contract end date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contract Type
                  </Label>
                  <Select
                    value={contractType}
                    onValueChange={(val) => setContractType(val as ContractType)}
                  >
                    <SelectTrigger className="h-9 text-xs border-slate-300 dark:border-slate-700 font-bold">
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

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contract Number
                  </Label>
                  <Input
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700 font-bold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contract Start date
                  </Label>
                  <Input
                    type="date"
                    value={contractStartDate}
                    onChange={(e) => setContractStartDate(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contract end date
                  </Label>
                  <Input
                    type="date"
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section: SERVICE CONTRACT */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-2 flex items-start pt-1">
              <span className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-slate-100">
                SERVICE CONTRACT
              </span>
            </div>

            <div className="md:col-span-10 flex flex-col lg:flex-row gap-4">
              {/* Table (Columns: S/N, Service contract, Note) */}
              <div className="flex-1 rounded border border-slate-300 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#d9e1f2] dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold uppercase text-[11px] border-b border-slate-300 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 w-16 text-center border-r border-slate-300 dark:border-slate-700">
                        S/N
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700">
                        Service contract
                      </th>
                      <th className="py-2.5 px-3">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-[#fff2cc]/40 dark:bg-amber-950/20">
                    {serviceContractsList.map((doc, idx) => (
                      <tr key={doc.id}>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-800 font-mono font-semibold">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 font-medium text-blue-700 dark:text-blue-400">
                          {doc.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          {doc.note}
                        </td>
                      </tr>
                    ))}
                    {serviceContractsList.length < 2 && (
                      <tr>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-800 font-mono text-slate-400">
                          2
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-slate-400 italic">
                          —
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 italic">—</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Upload service contract control on right (Slide 20) */}
              <div className="w-full lg:w-48 flex flex-col gap-2 shrink-0">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Upload service contract
                </span>
                <Input
                  placeholder="Document note..."
                  value={docNote}
                  onChange={(e) => setDocNote(e.target.value)}
                  className="h-8 text-xs border-slate-300 dark:border-slate-700"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUploadServiceContract}
                  className="h-9 text-xs font-semibold gap-1.5 border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMasterSave}
                  className="h-9 text-xs font-semibold border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section: Note (Bottom textarea) */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Note
            </Label>
            <Textarea
              rows={4}
              value={detailsNote}
              onChange={(e) => setDetailsNote(e.target.value)}
              placeholder="Enter contract notes here..."
              className="border-slate-300 dark:border-slate-700 text-xs"
            />
          </div>

          {/* Bottom Buttons: Save & Close (Slide 20) */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleMasterSave}
              className="h-9 px-6 text-xs font-bold border-slate-400 dark:border-slate-600 cursor-pointer"
            >
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="h-9 px-6 text-xs font-bold border-slate-400 dark:border-slate-600 cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAYMENT TERMS (SLIDE 22 & 23)                                       */}
      {/* ========================================================================= */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          {/* Section: FINANCIAL */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-2 flex items-start pt-1">
              <span className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-slate-100">
                FINANCIAL
              </span>
            </div>

            <div className="md:col-span-10 space-y-4">
              {/* Row 1: Contract Invoice Number | Contract PO Number | Payment term (months) | Total Amount Paid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contract Invoice Number
                  </Label>
                  <Input
                    value={contractInvoiceNumber}
                    onChange={(e) => setContractInvoiceNumber(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contract PO Number
                  </Label>
                  <Input
                    value={contractPoNumber}
                    onChange={(e) => setContractPoNumber(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Payment term (months)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={paymentTermMonths}
                    onChange={(e) => setPaymentTermMonths(Number(e.target.value) || 1)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Total Amount Paid
                  </Label>
                  <Input
                    type="number"
                    readOnly
                    value={totalAmountPaidCalculated || amountPaid}
                    className="h-9 text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-bold font-mono text-emerald-600"
                  />
                </div>
              </div>

              {/* Row 2: Payment start date | Payment end date | Next Payment date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Payment start date
                  </Label>
                  <Input
                    type="date"
                    value={paymentStartDate}
                    onChange={(e) => setPaymentStartDate(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Payment end date
                  </Label>
                  <Input
                    type="date"
                    value={paymentEndDate}
                    onChange={(e) => setPaymentEndDate(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Next Payment date
                  </Label>
                  <Input
                    type="date"
                    value={nextPaymentDate}
                    onChange={(e) => setNextPaymentDate(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section: PAYMENT HISTORY (Slide 22) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-2 flex items-start pt-1">
              <span className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-slate-100">
                PAYMENT HISTORY
              </span>
            </div>

            <div className="md:col-span-10 space-y-3">
              {/* Table (Strictly 7 columns from Slide 22) */}
              <div className="rounded border border-slate-300 dark:border-slate-700 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                  <thead className="bg-[#d9e1f2] dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold uppercase text-[11px] border-b border-slate-300 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 w-14 text-center border-r border-slate-300 dark:border-slate-700">
                        S/N
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700">
                        Invoice Number
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700">
                        Date of planned payment
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700">
                        Date of payment
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700 text-right">
                        Amount
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700">
                        Note
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        View proof of payment
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-[#fff2cc]/40 dark:bg-amber-950/20">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                          No payments recorded yet. Click "Upload" below to add a payment record.
                        </td>
                      </tr>
                    ) : (
                      payments.map((pmt, idx) => (
                        <tr key={pmt.id}>
                          <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-800 font-mono font-semibold">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-800 dark:text-slate-100">
                            {pmt.invoiceNumber}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 font-mono">
                            {pmt.dateOfPlannedPayment || "—"}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 font-mono">
                            {pmt.dateOfPayment || "—"}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-right font-mono font-bold">
                            ₦{Number(pmt.amount || 0).toLocaleString("en-US")}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                            {pmt.note || "—"}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {pmt.proofOfPaymentName ? (
                              <button
                                type="button"
                                onClick={() =>
                                  toast.info(`Viewing proof: ${pmt.proofOfPaymentName}`)
                                }
                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="h-3 w-3" />
                                <span>View</span>
                              </button>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action buttons below table on right (Slide 22) */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Update payment
                </span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUploadPayment}
                  className="h-9 px-4 text-xs font-semibold gap-1.5 border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload</span>
                </Button>
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section: Note (Bottom textarea) */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Note
            </Label>
            <Textarea
              rows={4}
              value={paymentTermsNote}
              onChange={(e) => setPaymentTermsNote(e.target.value)}
              placeholder="Enter payment terms notes here..."
              className="border-slate-300 dark:border-slate-700 text-xs"
            />
          </div>

          {/* Bottom Buttons: Save & Close (Slide 22) */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleMasterSave}
              className="h-9 px-6 text-xs font-bold border-slate-400 dark:border-slate-600 cursor-pointer"
            >
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="h-9 px-6 text-xs font-bold border-slate-400 dark:border-slate-600 cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EQUIPMENT LIST (SLIDE 24 & 25)                                      */}
      {/* ========================================================================= */}
      {activeTab === "equipment" && (
        <div className="space-y-6">
          {/* Section: EQUIPMENT LIST (Top Form) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-2 flex items-start pt-1">
              <span className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-slate-100">
                EQUIPMENT LIST
              </span>
            </div>

            <div className="md:col-span-10 space-y-4">
              {/* Row 1: Equipment Number | OEM (blue) | Modality (blue) | Serial Number (blue) | Location (blue) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Equipment Number
                  </Label>
                  <Input
                    placeholder="Enter or select EQ..."
                    value={selectedEquipmentNumber}
                    onChange={(e) => setSelectedEquipmentNumber(e.target.value)}
                    list="asset-number-list"
                    className="h-9 text-xs border-slate-300 dark:border-slate-700 font-bold font-mono"
                  />
                  <datalist id="asset-number-list">
                    {allAssets.map((a) => (
                      <option key={a.id} value={a.equipmentNumber}>
                        {a.equipmentNumber} — {a.model}
                      </option>
                    ))}
                  </datalist>
                </div>

                {/* OEM (Blue auto-fill box) */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    OEM
                  </Label>
                  <div className="h-9 px-2.5 rounded border border-[#8ea9db] bg-[#b4c6e7] dark:bg-blue-950/60 text-slate-900 dark:text-blue-100 text-xs font-semibold flex items-center">
                    {matchedAsset?.oem || "—"}
                  </div>
                </div>

                {/* Modality (Blue auto-fill box) */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Modality
                  </Label>
                  <div className="h-9 px-2.5 rounded border border-[#8ea9db] bg-[#b4c6e7] dark:bg-blue-950/60 text-slate-900 dark:text-blue-100 text-xs font-semibold flex items-center">
                    {matchedAsset?.modality || "—"}
                  </div>
                </div>

                {/* Serial Number (Blue auto-fill box) */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Serial Number
                  </Label>
                  <div className="h-9 px-2.5 rounded border border-[#8ea9db] bg-[#b4c6e7] dark:bg-blue-950/60 text-slate-900 dark:text-blue-100 text-xs font-mono font-bold flex items-center">
                    {matchedAsset?.serialNumber || "—"}
                  </div>
                </div>

                {/* Location (Blue auto-fill box) */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Location
                  </Label>
                  <div className="h-9 px-2.5 rounded border border-[#8ea9db] bg-[#b4c6e7] dark:bg-blue-950/60 text-slate-900 dark:text-blue-100 text-xs font-medium flex items-center truncate">
                    {matchedAsset?.location || "—"}
                  </div>
                </div>
              </div>

              {/* Row 2: Contract value | Contract type | Contract start date | Contract end date + Add button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contract value
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Value..."
                    value={eqContractValue}
                    onChange={(e) =>
                      setEqContractValue(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="h-9 text-xs border-slate-300 dark:border-slate-700 font-bold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contract type
                  </Label>
                  <Select
                    value={eqContractType}
                    onValueChange={(val) => setEqContractType(val as ContractType)}
                  >
                    <SelectTrigger className="h-9 text-xs border-slate-300 dark:border-slate-700 font-bold">
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

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contract start date
                  </Label>
                  <Input
                    type="date"
                    value={eqStartDate}
                    onChange={(e) => setEqStartDate(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contract end date
                  </Label>
                  <Input
                    type="date"
                    value={eqEndDate}
                    onChange={(e) => setEqEndDate(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddEquipment}
                    disabled={!isAdmin}
                    className="h-9 w-full text-xs font-bold border-slate-400 dark:border-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section: Equipment List Table (Strictly 11 Columns from Slide 24) */}
          <div className="space-y-3">
            <div className="rounded border border-slate-300 dark:border-slate-700 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                <thead className="bg-[#d9e1f2] dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold uppercase text-[11px] border-b border-slate-300 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center border-r border-slate-300 dark:border-slate-700">
                      S/N
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700">
                      Equipment Number
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700">
                      OEM
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700">
                      Modality
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700">
                      Model
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700">
                      Serial Number
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700">
                      Location
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700 text-right">
                      Contract value
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700">
                      Contract Type
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700">
                      Contract start date
                    </th>
                    <th className="py-2.5 px-3">
                      Contract end date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-[#fff2cc]/40 dark:bg-amber-950/20">
                  {coveredEquipment.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-6 text-center text-slate-500 italic">
                        No equipment linked yet. Use the form above to add covered equipment.
                      </td>
                    </tr>
                  ) : (
                    coveredEquipment.map((eq, idx) => (
                      <tr key={eq.id}>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-800 font-mono font-semibold">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {eq.equipmentNumber}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                          {eq.oem}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                          {eq.modality}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                          {eq.model}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 font-mono">
                          {eq.serialNumber}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                          {eq.location}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-right font-mono font-bold">
                          ₦{(eq.contractValue || contractValue).toLocaleString("en-US")}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                          {eq.contractType || contractType}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                          {eq.contractStartDate || contractStartDate}
                        </td>
                        <td className="py-2.5 px-3">
                          {eq.contractEndDate || contractEndDate}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Actions below table on right (Slide 24: Update equipment list, Add) */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Update equipment list
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddEquipment}
                disabled={!isAdmin}
                className="h-9 px-4 text-xs font-semibold gap-1 border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </Button>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section: Note (Bottom textarea) */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Note
            </Label>
            <Textarea
              rows={4}
              value={equipmentListNote}
              onChange={(e) => setEquipmentListNote(e.target.value)}
              placeholder="Enter equipment list notes here..."
              className="border-slate-300 dark:border-slate-700 text-xs"
            />
          </div>

          {/* Bottom Buttons: Save & Close (Slide 24) */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleMasterSave}
              className="h-9 px-6 text-xs font-bold border-slate-400 dark:border-slate-600 cursor-pointer"
            >
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="h-9 px-6 text-xs font-bold border-slate-400 dark:border-slate-600 cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
