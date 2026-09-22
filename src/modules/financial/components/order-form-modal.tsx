import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  DollarSign,
  Layers,
  Save,
  Plus,
  Trash2,
  Paperclip,
  CheckCircle2,
  Building2,
  Wrench,
  Calendar,
  AlertCircle,
  HelpCircle,
  Package,
} from "lucide-react";
import { StepperModal } from "@/components/ui/stepper-modal";
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
import { type StepItem } from "@/components/ui/stepper";
import {
  Order,
  OrderCategory,
  CreateOrderItemInput,
  CreateOrderInput,
  OrderDocument,
} from "../types";
import { Supplier, Part } from "@/modules/parts/types";
import { partsService } from "@/modules/parts/services/parts-service";
import { toolsJobService } from "@/modules/tools/services/tools-job-service";
import { toolsService } from "@/modules/tools/services/tools-service";
import { ToolJob, Tool } from "@/modules/tools/types";
import { personnelService } from "@/modules/settings/services/personnel-service";
import { Personnel } from "@/modules/settings/types";
import { useAuth } from "@/features/auth/auth-context";
import { OrderStatusBadge } from "./order-status-badge";
import { cn } from "@/lib/utils";

export interface OrderFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderToEdit?: Order | null;
  onSaved?: (order: Order) => void;
}

// Exactly THREE sections as mandated by section 9
const STEPS: StepItem[] = [
  { id: "general", title: "General", description: "Order details, job & dates", icon: FileText },
  { id: "financial", title: "Financial Information", description: "Supplier, parts & pricing", icon: DollarSign },
  { id: "items", title: "Items on Order", description: "Manifest of items", icon: Layers },
];

const ORDER_CATEGORIES: { id: OrderCategory; label: string; description: string }[] = [
  { id: "PARTS", label: "Parts", description: "Biomedical equipment spare parts & components" },
  { id: "TOOLS", label: "Tools", description: "Biomedical testing, safety, & maintenance tools" },
  { id: "LABOUR", label: "Labour", description: "Internal or specialized technical engineering hours" },
  { id: "THIRD_PARTY_SERVICE", label: "Third-Party Service", description: "External OEM servicing, accredited calibration & audits" },
];

interface FormErrors {
  form?: string | undefined;
  targetDeliveryDate?: string | undefined;
  jobId?: string | undefined;
  itemDescription?: string | undefined;
  itemSupplier?: string | undefined;
  itemPrice?: string | undefined;
  items?: string | undefined;
}

export function OrderFormModal({
  open,
  onOpenChange,
  orderToEdit,
  onSaved,
}: OrderFormModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  // References
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [jobs, setJobs] = useState<ToolJob[]>([]);
  const [assets, setAssets] = useState<Tool[]>([]);
  const [partsList, setPartsList] = useState<Part[]>([]);
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);

  // STEP 1 — GENERAL
  const [category, setCategory] = useState<OrderCategory>("PARTS");
  const [targetDeliveryDate, setTargetDeliveryDate] = useState<string>("");
  const [requestedById, setRequestedById] = useState<string>("");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [notes, setNotes] = useState("");

  // STEP 2 — FINANCIAL INFORMATION (Current Item Builder)
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedPartId, setSelectedPartId] = useState("");
  const [partNumberInput, setPartNumberInput] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [oemInput, setOemInput] = useState("");
  const [modalityInput, setModalityInput] = useState("");
  const [modelInput, setModelInput] = useState("");

  const [quantityInPack, setQuantityInPack] = useState(1);
  const [numberOfPacks, setNumberOfPacks] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [vatPercent, setVatPercent] = useState(7.5);

  // Document attachments
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState<"Quote" | "Invoice" | "Delivery Note" | "Other">("Quote");
  const [documents, setDocuments] = useState<Omit<OrderDocument, "id" | "uploadDate">[]>([]);

  // STEP 3 — ITEMS ON ORDER (Manifest)
  const [items, setItems] = useState<CreateOrderItemInput[]>([]);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Load references
  useEffect(() => {
    async function loadRefs() {
      try {
        const [sups, jbs, tls, prts, pers] = await Promise.all([
          partsService.getSuppliers(),
          toolsJobService.list(),
          toolsService.list(),
          partsService.getParts(),
          personnelService.list(),
        ]);
        setSuppliers(sups);
        setJobs(jbs);
        setAssets(tls);
        setPartsList(prts);
        setPersonnelList(pers);
      } catch (err) {
        console.error("Error loading order form references:", err);
      }
    }
    if (open) {
      loadRefs();
    }
  }, [open]);

  // Sync requestedById if empty
  useEffect(() => {
    if (!requestedById && personnelList.length > 0) {
      const matched = personnelList.find(
        (p) => p.id === user?.id || (user?.username && p.email?.toLowerCase().includes(user.username.toLowerCase())),
      );
      setRequestedById(matched ? matched.id : personnelList[0]?.id || "");
    }
  }, [personnelList, requestedById, user]);

  // Reset or populate for edit
  useEffect(() => {
    if (open) {
      if (orderToEdit) {
        setCategory(orderToEdit.category);
        setTargetDeliveryDate(orderToEdit.targetDeliveryDate ? (orderToEdit.targetDeliveryDate.split("T")[0] ?? "") : "");
        setRequestedById(orderToEdit.requestedById || "");
        setSelectedJobId(orderToEdit.jobId || "");
        setSelectedAssetId(orderToEdit.assetId || "");
        setNotes(orderToEdit.notes || "");
        setItems(
          orderToEdit.items.map((it) => ({
            category: it.category,
            partId: it.partId,
            partNumber: it.partNumber,
            description: it.description,
            specifications: it.specifications,
            supplierId: it.supplierId,
            supplierName: it.supplierName,
            supplierEmail: it.supplierEmail,
            supplierPhone: it.supplierPhone,
            supplierAddress: it.supplierAddress,
            quantityInPack: it.quantityInPack,
            numberOfPacks: it.numberOfPacks,
            totalQuantity: it.totalQuantity,
            unitPrice: it.unitPrice,
            vatPercent: it.vatPercent,
            targetDeliveryDate: it.targetDeliveryDate,
          })),
        );
        setDocuments(
          orderToEdit.documents.map((d) => ({
            type: d.type,
            fileName: d.fileName,
            fileSize: d.fileSize,
            url: d.url,
          })),
        );
      } else {
        const defaultTarget = new Date();
        defaultTarget.setDate(defaultTarget.getDate() + 14);

        setCategory("PARTS");
        setTargetDeliveryDate(defaultTarget.toISOString().split("T")[0] ?? "");
        setSelectedJobId("");
        setSelectedAssetId("");
        setNotes("");
        setItems([]);
        setDocuments([]);
        resetItemBuilder();
      }
      setCurrentStep(0);
      setErrors({});
    }
  }, [open, orderToEdit]);

  const resetItemBuilder = () => {
    setSelectedSupplierId("");
    setSelectedPartId("");
    setPartNumberInput("");
    setItemDescription("");
    setOemInput("");
    setModalityInput("");
    setModelInput("");
    setQuantityInPack(1);
    setNumberOfPacks(1);
    setUnitPrice(0);
    setVatPercent(7.5);
  };

  // Active supplier object
  const activeSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  // Auto-fill on Supplier change
  const handleSupplierSelect = (supId: string) => {
    setSelectedSupplierId(supId);
  };

  // Auto-fill on Part change
  const handlePartSelect = (partId: string) => {
    setSelectedPartId(partId);
    const p = partsList.find((pt) => pt.id === partId);
    if (p) {
      setPartNumberInput(p.partNumber);
      setItemDescription(p.description || p.model);
      setOemInput(p.oem);
      setModalityInput(p.modality);
      setModelInput(p.model);
      setQuantityInPack(p.quantityInPack || 1);
      setUnitPrice(p.unitPrice);
      setVatPercent(p.vatPercent || 7.5);

      // Auto match supplier if part has supplierId
      if (p.supplierId) {
        setSelectedSupplierId(p.supplierId);
      }
    }
  };

  // Step 2 Calculations per specifications:
  // Total Quantity = Quantity in Pack × Number of Packs
  const calculatedTotalQuantity = useMemo(() => {
    const qPack = Math.max(1, Number(quantityInPack) || 1);
    const nPacks = Math.max(1, Number(numberOfPacks) || 1);
    return qPack * nPacks;
  }, [quantityInPack, numberOfPacks]);

  // Total Price = Total Quantity × Unit Price
  const calculatedTotalPrice = useMemo(() => {
    return calculatedTotalQuantity * (Number(unitPrice) || 0);
  }, [calculatedTotalQuantity, unitPrice]);

  // Gross Price = Total Price + (Total Price × VAT)
  const calculatedGrossPrice = useMemo(() => {
    const vat = Number(vatPercent) || 7.5;
    return calculatedTotalPrice + calculatedTotalPrice * (vat / 100);
  }, [calculatedTotalPrice, vatPercent]);

  // Add Item from Step 2 into Manifest (Step 3)
  const handleAddItemToManifest = () => {
    const errs: FormErrors = {};
    if (!itemDescription.trim() && !partNumberInput.trim()) {
      errs.itemDescription = "Part number or description is required.";
    }
    if (!selectedSupplierId) {
      errs.itemSupplier = "Please select a supplier.";
    }
    if (unitPrice <= 0) {
      errs.itemPrice = "Unit price must be greater than 0.";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const supplierName = activeSupplier?.name || "Selected Supplier";

    const newItem: CreateOrderItemInput = {
      category,
      partId: selectedPartId || undefined,
      partNumber: partNumberInput.trim() || undefined,
      description: itemDescription.trim() || partNumberInput.trim(),
      specifications: [oemInput, modalityInput, modelInput].filter(Boolean).join(" - ") || undefined,
      supplierId: selectedSupplierId,
      supplierName,
      supplierEmail: activeSupplier?.email,
      supplierPhone: activeSupplier?.phone,
      supplierAddress: activeSupplier?.address,
      quantityInPack: Number(quantityInPack) || 1,
      numberOfPacks: Number(numberOfPacks) || 1,
      totalQuantity: calculatedTotalQuantity,
      unitPrice: Number(unitPrice) || 0,
      vatPercent: Number(vatPercent) || 7.5,
      targetDeliveryDate,
    };

    setItems((prev) => [...prev, newItem]);
    resetItemBuilder();
    setErrors({});
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddDocument = () => {
    if (!documentName.trim()) return;
    setDocuments((prev) => [
      ...prev,
      {
        type: documentType,
        fileName: documentName.trim(),
        fileSize: "Uploaded File",
      },
    ]);
    setDocumentName("");
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Step Validation
  const validateCurrentStep = (): boolean => {
    const newErrors: FormErrors = {};

    if (currentStep === 0) {
      if (!targetDeliveryDate) {
        newErrors.targetDeliveryDate = "Target delivery date is required.";
      }
      if ((category === "PARTS" || category === "TOOLS") && !selectedJobId) {
        newErrors.jobId = "Job number is compulsory for parts/tools orders.";
      }
    } else if (currentStep === 1) {
      if (items.length === 0 && (!itemDescription.trim() && !partNumberInput.trim())) {
        newErrors.items = "Please add at least one item to the order.";
      }
    } else if (currentStep === 2) {
      if (items.length === 0) {
        newErrors.items = "At least one item must be in the order manifest.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save as Draft or Submit
  const handleSave = async (isDraft: boolean) => {
    // If user is on step 1 and filled item fields but didn't click "Add", auto-commit if valid
    if (items.length === 0) {
      if (selectedSupplierId && (itemDescription.trim() || partNumberInput.trim()) && unitPrice > 0) {
        const autoItem: CreateOrderItemInput = {
          category,
          partId: selectedPartId || undefined,
          partNumber: partNumberInput.trim() || undefined,
          description: itemDescription.trim() || partNumberInput.trim(),
          specifications: [oemInput, modalityInput, modelInput].filter(Boolean).join(" - ") || undefined,
          supplierId: selectedSupplierId,
          supplierName: activeSupplier?.name || "Selected Supplier",
          supplierEmail: activeSupplier?.email,
          supplierPhone: activeSupplier?.phone,
          supplierAddress: activeSupplier?.address,
          quantityInPack: Number(quantityInPack) || 1,
          numberOfPacks: Number(numberOfPacks) || 1,
          totalQuantity: calculatedTotalQuantity,
          unitPrice: Number(unitPrice) || 0,
          vatPercent: Number(vatPercent) || 7.5,
          targetDeliveryDate,
        };
        items.push(autoItem);
      } else if (!isDraft) {
        setErrors({ items: "At least one item must be added to the order." });
        setCurrentStep(1);
        return;
      }
    }

    if (!isDraft && !validateCurrentStep()) {
      return;
    }

    setSaving(true);
    setErrors({});

    const selectedJob = jobs.find((j) => j.id === selectedJobId);
    const selectedAsset = assets.find((a) => a.id === selectedAssetId);

    const selectedPerson = personnelList.find((p) => p.id === requestedById);
    const reqName = selectedPerson
      ? `${selectedPerson.firstName} ${selectedPerson.lastName}`
      : user
      ? `${user.firstName} ${user.lastName}`
      : "Authorized Personnel";

    try {
      const inputData: CreateOrderInput = {
        category,
        targetDeliveryDate: targetDeliveryDate || new Date().toISOString().split("T")[0]!,
        requestedById: requestedById || user?.id,
        requestedByName: reqName,
        jobId: selectedJob ? selectedJob.id : undefined,
        jobNumber: selectedJob ? selectedJob.jobNumber : undefined,
        jobTitle: selectedJob ? selectedJob.issue : undefined,
        assetId: selectedAsset ? selectedAsset.id : undefined,
        assetName: selectedAsset
          ? `${selectedAsset.oem} ${selectedAsset.model} (${selectedAsset.serialNumber})`
          : undefined,
        notes: notes.trim() || undefined,
        items,
        documents,
      };

      const { financialService } = await import("../services/financial-service");
      let savedOrder: Order;

      if (orderToEdit) {
        savedOrder = await financialService.updateOrder(
          orderToEdit.id,
          inputData,
          user!,
          !isDraft && orderToEdit.status === "SENT_BACK",
        );
      } else {
        savedOrder = await financialService.createOrder(inputData, user!, isDraft);
      }

      onSaved?.(savedOrder);
      onOpenChange(false);
    } catch (err: any) {
      setErrors({ form: err.message || "Failed to save order." });
    } finally {
      setSaving(false);
    }
  };

  const totalManifestGross = items.reduce((s, it) => {
    const qty = it.totalQuantity || 1;
    const net = qty * (it.unitPrice || 0);
    const vat = net * ((it.vatPercent || 7.5) / 100);
    return s + net + vat;
  }, 0);

  return (
    <StepperModal
      open={open}
      onOpenChange={onOpenChange}
      title={orderToEdit ? `Edit Order — ${orderToEdit.orderNumber}` : "Create Purchase Order Request"}
      description="Healthcare procurement requisition, vendor pricing breakdown & multi-supplier PO routing."
      steps={STEPS}
      currentStep={currentStep}
      onStepClick={(step) => {
        if (step < currentStep) setCurrentStep(step);
        else if (validateCurrentStep()) setCurrentStep(step);
      }}
      onBack={() => setCurrentStep((s) => s - 1)}
      onNext={() => {
        if (validateCurrentStep()) setCurrentStep((s) => s + 1);
      }}
      onSubmit={() => handleSave(false)}
      isSubmitting={saving}
      canSubmit={items.length > 0}
      submitLabel={orderToEdit ? "Update Order" : "Create Order"}
      headerContent={
        <div className="flex items-center gap-2">
          {orderToEdit && <OrderStatusBadge status={orderToEdit.status} />}
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-muted-foreground bg-background px-3 py-1.5 rounded-md border border-border">
            <span>Date:</span>
            <span className="font-semibold text-foreground">
              {orderToEdit ? new Date(orderToEdit.dateRaised).toLocaleDateString() : new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      }
      footerLeadingContent={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleSave(true)}
          disabled={saving}
          className="text-xs gap-1.5"
        >
          <Save className="size-3.5" />
          <span>Save as Draft</span>
        </Button>
      }
    >
          {/* Sent Back Alert Banner */}
          {orderToEdit?.status === "SENT_BACK" && orderToEdit.sendBackReason && (
            <div className="rounded-xl border border-rose-300 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-400">
                <AlertCircle className="size-4" />
                <span>Admin Return Reason / Correction Instructions:</span>
              </div>
              <p className="text-rose-900 dark:text-rose-200 leading-relaxed pl-6">
                {orderToEdit.sendBackReason}
              </p>
            </div>
          )}

          {errors.form && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium">
              {errors.form}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* STEP 1 — GENERAL                                                  */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 0 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-border pb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  Order Details
                </h3>
                <span className="text-xs text-muted-foreground">
                  Step 1 of 3
                </span>
              </div>

              {/* Row 1: Category, Target Date, Date Raised, Requested By Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-foreground">
                    Order Category <span className="text-destructive">*</span>
                  </Label>
                  <Select value={category} onValueChange={(val: OrderCategory) => setCategory(val)}>
                    <SelectTrigger className="text-sm h-9.5 bg-background">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-foreground">
                    Target Delivery Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={targetDeliveryDate}
                    onChange={(e) => setTargetDeliveryDate(e.target.value)}
                    className="text-sm h-9.5 bg-background"
                  />
                  {errors.targetDeliveryDate && (
                    <p className="text-xs text-destructive">{errors.targetDeliveryDate}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-muted-foreground">Date Raised</Label>
                  <Input
                    readOnly
                    value={
                      orderToEdit
                        ? new Date(orderToEdit.dateRaised).toISOString().split("T")[0]
                        : new Date().toISOString().split("T")[0]
                    }
                    className="text-sm h-9.5 bg-muted/40 font-mono text-muted-foreground select-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-foreground">
                    Requested By <span className="text-destructive">*</span>
                  </Label>
                  <Select value={requestedById} onValueChange={setRequestedById}>
                    <SelectTrigger className="text-sm h-9.5 bg-background">
                      <SelectValue placeholder="Select requesting personnel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {personnelList.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.firstName} {person.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Job Number (From Tools Module) & Asset */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Wrench className="size-4 text-primary" />
                      Job Number
                      {(category === "PARTS" || category === "TOOLS") && (
                        <span className="text-destructive">*</span>
                      )}
                    </Label>
                    {(category === "PARTS" || category === "TOOLS") && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">From Tools Module (Compulsory)</span>
                    )}
                  </div>
                  <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                    <SelectTrigger className="text-sm h-9.5 bg-background">
                      <SelectValue placeholder="Select maintenance job from Tools module..." />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          <span className="font-mono font-bold mr-2 text-primary">{job.jobNumber}</span>
                          <span>{job.issue}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.jobId && <p className="text-xs text-destructive">{errors.jobId}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Building2 className="size-4 text-muted-foreground" />
                    Target Asset / Equipment (Optional)
                  </Label>
                  <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                    <SelectTrigger className="text-sm h-9.5 bg-background">
                      <SelectValue placeholder="Select hospital equipment/asset..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          <span className="font-semibold">{asset.oem} {asset.model}</span>
                          <span className="text-muted-foreground text-xs ml-1.5">({asset.serialNumber})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: Wide Note Box */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-foreground">Note / Justification</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter detailed technical justification, breakdown context, or requisition remarks..."
                  rows={3}
                  className="text-sm bg-background resize-none"
                />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* STEP 2 — FINANCIAL INFORMATION                                    */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-border pb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  Financial Details
                </h3>
                <span className="text-xs text-muted-foreground">
                  Step 2 of 3
                </span>
              </div>

              {/* Vendor Selection & Blue Auto-Fill Boxes */}
              <div className="p-4 bg-muted/25 rounded-xl border border-border/80 space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="supplierSelect" className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Supplier <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedSupplierId} onValueChange={handleSupplierSelect}>
                    <SelectTrigger id="supplierSelect" className="w-full text-xs h-9.5 bg-background">
                      <SelectValue placeholder="Select Supplier from registered vendors..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="font-semibold">{s.name}</span>
                          <span className="text-muted-foreground ml-2 text-xs">({s.supplierCode || s.id})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.itemSupplier && (
                    <p className="text-[10px] text-destructive">{errors.itemSupplier}</p>
                  )}
                </div>

                {/* Auto-populated Supplier Profile Card */}
                <div className="rounded-lg border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 p-3.5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300 text-xs font-bold">
                    <Building2 className="size-4" />
                    <span>Selected Supplier Profile (Auto-Populated)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2 rounded bg-sky-100/60 dark:bg-sky-900/40">
                      <span className="text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400 block">
                        Supplier ID
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {activeSupplier?.id || "—"}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-sky-100/60 dark:bg-sky-900/40 sm:col-span-2">
                      <span className="text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400 block">
                        Supplier Address
                      </span>
                      <span className="font-medium text-foreground truncate block" title={activeSupplier?.address}>
                        {activeSupplier?.address || "—"}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-sky-100/60 dark:bg-sky-900/40">
                      <span className="text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400 block">
                        Supplier Contact
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {activeSupplier?.phone || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-sky-100/60 dark:bg-sky-900/40 text-xs">
                    <span className="text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400 block">
                      Supplier Email
                    </span>
                    <span className="font-mono text-foreground">{activeSupplier?.email || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Part Selection & Equipment Specifications */}
              <div className="p-4 bg-muted/25 rounded-xl border border-border/80 space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="partSelect" className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Part Number / Item <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedPartId} onValueChange={handlePartSelect}>
                    <SelectTrigger id="partSelect" className="w-full text-xs h-9.5 bg-background">
                      <SelectValue placeholder="Select Part from Inventory Catalog..." />
                    </SelectTrigger>
                    <SelectContent>
                      {partsList.map((pt) => (
                        <SelectItem key={pt.id} value={pt.id}>
                          <span className="font-mono font-bold">{pt.partNumber}</span>
                          <span className="text-muted-foreground ml-2 text-xs">
                            — {pt.oem} {pt.model} ({pt.category})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto-populated Part Specs Card */}
                <div className="rounded-lg border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 p-3.5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300 text-xs font-bold">
                    <Wrench className="size-4" />
                    <span>Selected Part Specifications (Auto-Populated)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2 rounded bg-sky-100/60 dark:bg-sky-900/40">
                      <span className="text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400 block">
                        OEM
                      </span>
                      <span className="font-semibold text-foreground">{oemInput || "—"}</span>
                    </div>

                    <div className="p-2 rounded bg-sky-100/60 dark:bg-sky-900/40">
                      <span className="text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400 block">
                        Modality
                      </span>
                      <span className="font-semibold text-foreground">{modalityInput || "—"}</span>
                    </div>

                    <div className="p-2 rounded bg-sky-100/60 dark:bg-sky-900/40">
                      <span className="text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400 block">
                        Model
                      </span>
                      <span className="font-semibold text-foreground">{modelInput || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-semibold text-foreground">
                    Item Description / Service Scope <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="e.g. High-Voltage Inverter Assembly or Certified Calibration Hours"
                    className="text-xs h-9 bg-background"
                  />
                  {errors.itemDescription && (
                    <p className="text-[10px] text-destructive">{errors.itemDescription}</p>
                  )}
                </div>
              </div>

              {/* Packaging, Quantities & Mathematical Calculations */}
              <div className="p-4 bg-muted/25 rounded-xl border border-border/80 space-y-4">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  Quantities & Pricing Breakdown
                </Label>

                {/* Row 1: Pack Sizing & Quantities */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Quantity in pack
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={quantityInPack}
                      onChange={(e) => setQuantityInPack(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-9 text-xs bg-background font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Number of Packs
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={numberOfPacks}
                      onChange={(e) => setNumberOfPacks(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-9 text-xs bg-background font-mono font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Total Quantity (Packs × Qty)
                    </Label>
                    <Input
                      readOnly
                      value={calculatedTotalQuantity}
                      className="h-9 text-xs bg-muted/60 font-mono font-bold text-foreground select-none"
                    />
                  </div>
                </div>

                {/* Row 2: Pricing, VAT and Gross Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Unit price (₦) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={unitPrice || ""}
                      onChange={(e) => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0.00"
                      className="h-9 text-xs bg-background font-mono"
                    />
                    {errors.itemPrice && (
                      <p className="text-[10px] text-destructive">{errors.itemPrice}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Total Price (₦)
                    </Label>
                    <Input
                      readOnly
                      value={`₦${calculatedTotalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                      className="h-9 text-xs bg-muted/60 font-mono font-semibold text-foreground select-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      VAT (%)
                    </Label>
                    <Input
                      type="number"
                      step={0.5}
                      min={0}
                      max={100}
                      value={vatPercent}
                      onChange={(e) => setVatPercent(parseFloat(e.target.value) || 0)}
                      className="h-9 text-xs bg-background font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-primary">
                      Gross Price (Total + VAT)
                    </Label>
                    <Input
                      readOnly
                      value={`₦${calculatedGrossPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                      className="h-9 text-xs bg-primary/10 border-primary/30 font-mono font-bold text-primary select-none"
                    />
                  </div>
                </div>

                {/* Row 3: Add to Manifest Button */}
                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    onClick={handleAddItemToManifest}
                    className="h-9 gap-1.5 text-xs font-semibold cursor-pointer px-4"
                  >
                    <Plus className="size-4" />
                    Add to Items on Order
                  </Button>
                </div>
              </div>

              {/* Upload Quote or Invoice */}
              <div className="p-4 bg-muted/25 rounded-xl border border-border/80 space-y-3">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  Upload Quote or Invoice
                </Label>

                <div className="flex flex-wrap items-center gap-2">
                  <Select value={documentType} onValueChange={(val: any) => setDocumentType(val)}>
                    <SelectTrigger className="w-[140px] text-xs h-8.5 bg-background">
                      <SelectValue placeholder="Doc Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Quote">Quote</SelectItem>
                      <SelectItem value="Invoice">Invoice</SelectItem>
                      <SelectItem value="Delivery Note">Delivery Note</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Quotation / invoice reference or filename..."
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    className="flex-1 min-w-[200px] text-xs h-8.5 bg-background"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddDocument}
                    className="h-8.5 text-xs gap-1.5 cursor-pointer"
                  >
                    <Paperclip className="size-3.5" />
                    Attach Document
                  </Button>
                </div>

                {documents.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {documents.map((doc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-background border border-border font-medium"
                      >
                        <FileText className="size-3 text-primary" />
                        <span>[{doc.type}] {doc.fileName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(idx)}
                          className="text-muted-foreground hover:text-destructive cursor-pointer ml-1"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* STEP 3 — ITEMS ON ORDER                                           */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-border pb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  Items to be Ordered
                </h3>
                <span className="text-xs text-muted-foreground">
                  Step 3 of 3
                </span>
              </div>

              {errors.items && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium">
                  {errors.items}
                </div>
              )}

              {/* Manifest Table matching Slide 13 exactly */}
              <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-sky-100/60 dark:bg-sky-950/50 font-bold text-sky-900 dark:text-sky-200 text-[11px]">
                      <th className="py-2.5 px-3 text-center w-12">S/N</th>
                      <th className="py-2.5 px-3">Part Number</th>
                      <th className="py-2.5 px-3">Vendor</th>
                      <th className="py-2.5 px-3 text-right">Gross Price</th>
                      <th className="py-2.5 px-3 text-center">Quote Attached</th>
                      <th className="py-2.5 px-3 text-center w-14">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          <Package className="size-6 mx-auto mb-1.5 text-muted-foreground/50" />
                          <p className="font-semibold text-foreground">No items added to order manifest yet.</p>
                          <p className="text-[11px] mt-0.5">
                            Click Back to Step 2 to configure and add items with vendor pricing.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      items.map((it, idx) => {
                        const qty = it.totalQuantity || 1;
                        const net = qty * (it.unitPrice || 0);
                        const vat = net * ((it.vatPercent || 7.5) / 100);
                        const itemGross = net + vat;

                        return (
                          <tr key={idx} className="hover:bg-accent/30 transition-colors">
                            <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-mono font-bold text-foreground">
                                {it.partNumber || "Non-Catalog Part"}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                                {it.description}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-foreground">
                              {it.supplierName}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                              ₦{itemGross.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {documents.length > 0 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                  Yes ({documents.length})
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                                  None
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(idx)}
                                className="size-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Order Manifest Totals Summary */}
              {items.length > 0 && (
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">
                      Order Manifest Summary
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      {items.length} line item(s) across {new Set(items.map((i) => i.supplierId)).size} vendor(s).
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Total Gross Value (Inc. VAT)
                    </span>
                    <span className="text-base sm:text-lg font-black text-primary">
                      ₦{totalManifestGross.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
    </StepperModal>
  );
}
