import React, { useState, useEffect } from "react";
import {
  Wrench,
  Truck,
  MapPin,
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ArrowLeft,
  X,
  Building2,
  Calendar,
  DollarSign,
  Phone,
} from "lucide-react";
import { StepperModal } from "@/components/ui/stepper-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { type StepItem } from "@/components/ui/stepper";
import { Part, Supplier, PartDocument } from "../types";
import { partsService } from "../services/parts-service";
import { cn } from "@/lib/utils";

export interface PartFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partToEdit?: Part | null;
  onSaved?: (part: Part) => void;
}

const STEPS: StepItem[] = [
  { id: "general", title: "General Details", description: "Part ID, specs & shelf life", icon: Wrench },
  { id: "order", title: "Order Info", description: "Supplier & pricing", icon: Truck },
  { id: "location", title: "Location & Picture", description: "Bin coords & certificates", icon: MapPin },
];

const CATEGORIES = [
  "Generator Board",
  "Cryogenics",
  "Transducer",
  "X-Ray Tube",
  "Slip Ring",
  "Detector",
  "Filter",
  "Power Supply",
  "RF Coil",
  "Patient Table",
  "Cable / Harness",
  "Valve / Fluidics",
];

const OEMS = [
  "GE Healthcare",
  "Siemens Healthineers",
  "Philips",
  "Canon Medical",
  "Hologic",
  "Fujifilm",
  "Shimadzu",
  "Other",
];

const MODALITIES = [
  "CT",
  "MRI",
  "Ultrasound",
  "X-Ray",
  "Cath Lab",
  "Nuclear Medicine",
  "Mammography",
  "Biomed General",
];

export function PartFormModal({
  open,
  onOpenChange,
  partToEdit,
  onSaved,
}: PartFormModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<Partial<Part>>({
    partNumber: "",
    oemVendorPartNumber: "",
    brand: "",
    category: CATEGORIES[0],
    oem: OEMS[0],
    modality: MODALITIES[0],
    model: "",
    description: "",
    note: "",
    quantityInStock: 1,
    minStockLevel: 1,
    maxStockLevel: 5,
    quantityOnOrder: 0,
    dateOfPurchase: new Date().toISOString().split("T")[0],
    shelfLifeMonths: 24,
    doesNotExpire: false,
    contactPhone: "",
    supplierId: "",
    supplierName: "",
    quantityInPack: 1,
    leadTimeWeeks: 2,
    listPrice: 0,
    vatPercent: 20,
    grossPrice: 0,
    unitPrice: 0,
    listPriceDate: new Date().toISOString().split("T")[0],
    orderNote: "",
    location: "Main Depot",
    binCode: "BIN-01",
    binNumber: "01",
    column: "A",
    row: "1",
    locationNote: "",
    pictureUrl: "",
    documents: [],
  });

  // Selected supplier details for blue auto-fill boxes
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    partsService.getSuppliers().then((sups) => {
      setSuppliers(sups);
      if (!partToEdit && sups.length > 0 && !formData.supplierId) {
        setFormData((prev) => ({
          ...prev,
          supplierId: sups[0].id,
          supplierName: sups[0].name,
        }));
        setSelectedSupplier(sups[0]);
      }
    });
  }, [partToEdit]);

  useEffect(() => {
    if (partToEdit) {
      setFormData(partToEdit);
      partsService.getSupplierById(partToEdit.supplierId).then((sup) => {
        if (sup) setSelectedSupplier(sup);
      });
    } else {
      setFormData({
        partNumber: `PRT-${Date.now().toString().slice(-4)}`,
        oemVendorPartNumber: "",
        brand: "",
        category: CATEGORIES[0],
        oem: OEMS[0],
        modality: MODALITIES[0],
        model: "",
        description: "",
        note: "",
        quantityInStock: 1,
        minStockLevel: 1,
        maxStockLevel: 5,
        quantityOnOrder: 0,
        dateOfPurchase: new Date().toISOString().split("T")[0],
        shelfLifeMonths: 24,
        doesNotExpire: false,
        contactPhone: "",
        supplierId: suppliers[0]?.id || "",
        supplierName: suppliers[0]?.name || "",
        quantityInPack: 1,
        leadTimeWeeks: 2,
        listPrice: 1000,
        vatPercent: 20,
        grossPrice: 1200,
        unitPrice: 1000,
        listPriceDate: new Date().toISOString().split("T")[0],
        orderNote: "",
        location: "Main Depot",
        binCode: "BIN-A1",
        binNumber: "01",
        column: "A",
        row: "1",
        locationNote: "",
        pictureUrl: "",
        documents: [],
      });
      if (suppliers[0]) setSelectedSupplier(suppliers[0]);
    }
    setCurrentStep(0);
    setErrors({});
  }, [open, partToEdit, suppliers]);

  // Handle supplier change
  const handleSupplierChange = (supId: string) => {
    const sup = suppliers.find((s) => s.id === supId);
    setSelectedSupplier(sup || null);
    setFormData((prev) => ({
      ...prev,
      supplierId: supId,
      supplierName: sup?.name || "",
    }));
  };

  // Recalculate gross and unit prices when listPrice or vatPercent changes
  const handlePriceChange = (field: "listPrice" | "vatPercent" | "quantityInPack", value: number) => {
    setFormData((prev) => {
      const listPrice = field === "listPrice" ? value : prev.listPrice || 0;
      const vatPercent = field === "vatPercent" ? value : prev.vatPercent || 0;
      const pack = field === "quantityInPack" ? value : prev.quantityInPack || 1;
      const grossPrice = Math.round(listPrice * (1 + vatPercent / 100) * 100) / 100;
      const unitPrice = pack > 0 ? Math.round((grossPrice / pack) * 100) / 100 : grossPrice;

      return {
        ...prev,
        [field]: value,
        grossPrice,
        unitPrice,
      };
    });
  };

  // Validation before proceeding to next step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.partNumber?.trim()) newErrors.partNumber = "Part Number is required";
      if (!formData.oemVendorPartNumber?.trim()) newErrors.oemVendorPartNumber = "OEM Part # is required";
      if (!formData.category) newErrors.category = "Category is required";
      if (!formData.oem) newErrors.oem = "OEM is required";
      if (!formData.modality) newErrors.modality = "Modality is required";
      if (!formData.model?.trim()) newErrors.model = "Model is required";
      if ((formData.quantityInStock ?? -1) < 0) newErrors.quantityInStock = "Stock cannot be negative";
    }

    if (step === 1) {
      if (!formData.supplierId) newErrors.supplierId = "Supplier is required";
      if ((formData.listPrice ?? 0) <= 0) newErrors.listPrice = "List price must be greater than 0";
    }

    if (step === 2) {
      if (!formData.location?.trim()) newErrors.location = "Location is required";
      if (!formData.binCode?.trim()) newErrors.binCode = "Bin Code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Pure validation checker for button disabled state without triggering setErrors during render
  const isStepValid = (step: number): boolean => {
    if (step === 0) {
      return Boolean(
        formData.partNumber?.trim() &&
        formData.oemVendorPartNumber?.trim() &&
        formData.category &&
        formData.oem &&
        formData.modality &&
        formData.model?.trim() &&
        (formData.quantityInStock ?? -1) >= 0
      );
    }
    if (step === 1) {
      return Boolean(
        formData.supplierId &&
        (formData.listPrice ?? 0) > 0
      );
    }
    if (step === 2) {
      return Boolean(
        formData.location?.trim() &&
        formData.binCode?.trim()
      );
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(STEPS.length - 1, prev + 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setSaving(true);
    try {
      let expiryDate: string | null = null;
      if (!formData.doesNotExpire && formData.dateOfPurchase && formData.shelfLifeMonths) {
        const d = new Date(formData.dateOfPurchase);
        d.setMonth(d.getMonth() + Number(formData.shelfLifeMonths));
        expiryDate = d.toISOString().split("T")[0];
      }

      const payload = {
        ...formData,
        expiryDate,
      } as Part;

      let savedPart: Part;
      if (partToEdit) {
        savedPart = await partsService.updatePart(partToEdit.id, payload);
      } else {
        savedPart = await partsService.createPart(payload);
      }

      onSaved?.(savedPart);
      onOpenChange(false);
    } catch (e) {
      console.error("Failed to save part:", e);
    } finally {
      setSaving(false);
    }
  };

  // Document upload simulation
  const handleAddDocument = () => {
    const newDoc: PartDocument = {
      id: `doc_${Date.now()}`,
      name: `Certificate_of_Conformance_${Date.now().toString().slice(-4)}.pdf`,
      comment: "Manufacturer CoC Inspection Pass",
      uploadDate: new Date().toISOString().split("T")[0],
      selected: true,
    };
    setFormData((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), newDoc],
    }));
  };

  const handleRemoveDocument = (docId: string) => {
    setFormData((prev) => ({
      ...prev,
      documents: (prev.documents || []).filter((d) => d.id !== docId),
    }));
  };

  return (
    <StepperModal
      open={open}
      onOpenChange={onOpenChange}
      title={partToEdit ? "Edit Spare Part" : "Add New Spare Part"}
      description="Step-by-step biomedical spare part registry, supplier contracts, and bin storage allocation."
      steps={STEPS}
      currentStep={currentStep}
      onStepClick={(step) => {
        if (step < currentStep || validateStep(currentStep)) {
          setCurrentStep(step);
        }
      }}
      onBack={handleBack}
      onNext={handleNext}
      onSubmit={handleSubmit}
      isSubmitting={saving}
      canProceed={isStepValid(currentStep)}
      canSubmit={isStepValid(0) && isStepValid(1) && isStepValid(2)}
      submitLabel={partToEdit ? "Save Changes" : "Create Part"}
      submitIcon={CheckCircle2}
    >
          {/* ═══════════════════════════════════════════════════════════════════
              STEP 1: GENERAL DETAILS ("TOOLS DETAILS" / Part Info)
              ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="partNumber" className="text-xs font-semibold">
                    Part Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="partNumber"
                    value={formData.partNumber || ""}
                    onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                    placeholder="e.g. PRT-CT-1021"
                    className="h-9 text-xs font-mono"
                  />
                  {errors.partNumber && <p className="text-[11px] text-destructive">{errors.partNumber}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="oemVendorPartNumber" className="text-xs font-semibold">
                    OEM or Vendor Part # <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="oemVendorPartNumber"
                    value={formData.oemVendorPartNumber || ""}
                    onChange={(e) => setFormData({ ...formData, oemVendorPartNumber: e.target.value })}
                    placeholder="e.g. GE-8849-01"
                    className="h-9 text-xs font-mono"
                  />
                  {errors.oemVendorPartNumber && (
                    <p className="text-[11px] text-destructive">{errors.oemVendorPartNumber}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="brand" className="text-xs font-semibold">
                    Brand
                  </Label>
                  <Input
                    id="brand"
                    value={formData.brand || ""}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. GE Healthcare"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Classification dropdowns: Category, OEM, Modality, Model */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-3 rounded-lg border border-border bg-muted/10">
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-semibold">
                    Part Category <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="oem" className="text-xs font-semibold">
                    OEM <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="oem"
                    value={formData.oem}
                    onChange={(e) => setFormData({ ...formData, oem: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                  >
                    {OEMS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modality" className="text-xs font-semibold">
                    Modality <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="modality"
                    value={formData.modality}
                    onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                  >
                    {MODALITIES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="model" className="text-xs font-semibold">
                    Model <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="model"
                    value={formData.model || ""}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g. Revolution CT"
                    className="h-9 text-xs"
                  />
                  {errors.model && <p className="text-[11px] text-destructive">{errors.model}</p>}
                </div>
              </div>

              {/* Description & Internal Note */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed part functionality, electrical rating, compatibility notes..."
                  className="min-h-[60px] text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="note" className="text-xs font-semibold">
                  Engineering Notes
                </Label>
                <Input
                  id="note"
                  value={formData.note || ""}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Handling instructions, ESD precautions, coldhead specs..."
                  className="h-9 text-xs"
                />
              </div>

              {/* Quantities & Shelf Life */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="quantityInStock" className="text-xs font-semibold">
                    {partToEdit ? "Current Stock (Ledger Tracked)" : "Initial Opening Stock"}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="quantityInStock"
                    type="number"
                    min="0"
                    disabled={Boolean(partToEdit)}
                    value={formData.quantityInStock ?? 0}
                    onChange={(e) =>
                      setFormData({ ...formData, quantityInStock: parseInt(e.target.value, 10) || 0 })
                    }
                    className={cn(
                      "h-9 text-xs font-mono font-bold",
                      partToEdit && "bg-muted/50 text-muted-foreground cursor-not-allowed"
                    )}
                  />
                  {partToEdit ? (
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Managed via <strong>Stock Movements</strong> ledger or <strong>Physical Audit</strong>.
                    </p>
                  ) : (
                    errors.quantityInStock && (
                      <p className="text-[11px] text-destructive">{errors.quantityInStock}</p>
                    )
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="minStockLevel" className="text-xs font-semibold">
                    Min Stock Level (Reorder)
                  </Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    min="0"
                    value={formData.minStockLevel ?? 1}
                    onChange={(e) =>
                      setFormData({ ...formData, minStockLevel: parseInt(e.target.value, 10) || 0 })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="maxStockLevel" className="text-xs font-semibold">
                    Max Stock Level
                  </Label>
                  <Input
                    id="maxStockLevel"
                    type="number"
                    min="1"
                    value={formData.maxStockLevel ?? 5}
                    onChange={(e) =>
                      setFormData({ ...formData, maxStockLevel: parseInt(e.target.value, 10) || 1 })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="quantityOnOrder" className="text-xs font-semibold">
                    Quantity on Order
                  </Label>
                  <Input
                    id="quantityOnOrder"
                    type="number"
                    min="0"
                    value={formData.quantityOnOrder ?? 0}
                    onChange={(e) =>
                      setFormData({ ...formData, quantityOnOrder: parseInt(e.target.value, 10) || 0 })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Purchase Date & Shelf Life */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 rounded-lg border border-border bg-muted/10 items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="dateOfPurchase" className="text-xs font-semibold">
                    Date of Purchase
                  </Label>
                  <Input
                    id="dateOfPurchase"
                    type="date"
                    value={formData.dateOfPurchase || ""}
                    onChange={(e) => setFormData({ ...formData, dateOfPurchase: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="shelfLifeMonths" className="text-xs font-semibold">
                    Shelf Life (months)
                  </Label>
                  <Input
                    id="shelfLifeMonths"
                    type="number"
                    min="1"
                    disabled={formData.doesNotExpire}
                    value={formData.shelfLifeMonths ?? 24}
                    onChange={(e) =>
                      setFormData({ ...formData, shelfLifeMonths: parseInt(e.target.value, 10) || 0 })
                    }
                    className="h-9 text-xs font-mono disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center space-x-2 h-9">
                  <Checkbox
                    id="doesNotExpire"
                    checked={formData.doesNotExpire}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, doesNotExpire: Boolean(checked) })
                    }
                  />
                  <Label
                    htmlFor="doesNotExpire"
                    className="text-xs font-semibold text-foreground cursor-pointer select-none"
                  >
                    Part does not expire
                  </Label>
                </div>
              </div>

              <div className="space-y-1.5 max-w-xs">
                <Label htmlFor="contactPhone" className="text-xs font-semibold">
                  Contact Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone || ""}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+44 800 032 5050"
                    className="h-9 pl-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              STEP 2: ORDER INFORMATION ("SUPPLIER DETAILS")
              ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="supplierSelect" className="text-xs font-semibold">
                  Supplier <span className="text-destructive">*</span>
                </Label>
                <select
                  id="supplierSelect"
                  value={formData.supplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground font-medium focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.supplierCode})
                    </option>
                  ))}
                </select>
                {errors.supplierId && <p className="text-[11px] text-destructive">{errors.supplierId}</p>}
              </div>

              {/* Blue auto-filled lookup boxes matching Page 9/10 in specification */}
              <div className="rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 text-xs font-bold">
                  <Building2 className="size-4" />
                  <span>Selected Supplier Profile (Auto-Populated)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2 rounded bg-blue-100/60 dark:bg-blue-900/40">
                    <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 block">
                      Supplier ID
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {selectedSupplier?.supplierCode || "—"}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-blue-100/60 dark:bg-blue-900/40 sm:col-span-2">
                    <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 block">
                      Supplier Address
                    </span>
                    <span className="font-medium text-foreground truncate block">
                      {selectedSupplier?.address || "—"}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-blue-100/60 dark:bg-blue-900/40">
                    <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 block">
                      Supplier Contact
                    </span>
                    <span className="font-medium text-foreground">
                      {selectedSupplier?.contactPerson || "—"}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded bg-blue-100/60 dark:bg-blue-900/40 text-xs">
                  <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 block">
                    Supplier Email
                  </span>
                  <span className="font-mono text-foreground">{selectedSupplier?.email || "—"}</span>
                </div>
              </div>

              {/* Pricing, VAT, and Pack Sizing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="quantityInPack" className="text-xs font-semibold">
                    Quantity in Pack
                  </Label>
                  <Input
                    id="quantityInPack"
                    type="number"
                    min="1"
                    value={formData.quantityInPack ?? 1}
                    onChange={(e) =>
                      handlePriceChange("quantityInPack", parseInt(e.target.value, 10) || 1)
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="leadTimeWeeks" className="text-xs font-semibold">
                    Lead Time (weeks)
                  </Label>
                  <Input
                    id="leadTimeWeeks"
                    type="number"
                    min="1"
                    value={formData.leadTimeWeeks ?? 2}
                    onChange={(e) =>
                      setFormData({ ...formData, leadTimeWeeks: parseInt(e.target.value, 10) || 1 })
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="listPrice" className="text-xs font-semibold">
                    List Price (₦) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="listPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.listPrice ?? 0}
                    onChange={(e) => handlePriceChange("listPrice", parseFloat(e.target.value) || 0)}
                    className="h-9 text-xs font-mono font-bold"
                  />
                  {errors.listPrice && <p className="text-[11px] text-destructive">{errors.listPrice}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vatPercent" className="text-xs font-semibold">
                    VAT (%)
                  </Label>
                  <Input
                    id="vatPercent"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.vatPercent ?? 20}
                    onChange={(e) => handlePriceChange("vatPercent", parseFloat(e.target.value) || 0)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Calculated Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 rounded-lg border border-border bg-muted/20">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Gross Price (incl. VAT)
                  </span>
                  <div className="text-sm font-mono font-bold text-foreground">
                    ₦{formData.grossPrice?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Unit Price (per item)
                  </span>
                  <div className="text-sm font-mono font-bold text-primary">
                    ₦{formData.unitPrice?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    List Price Effective Date
                  </span>
                  <Input
                    type="date"
                    value={formData.listPriceDate || ""}
                    onChange={(e) => setFormData({ ...formData, listPriceDate: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="orderNote" className="text-xs font-semibold">
                  Order & Freight Notes
                </Label>
                <Input
                  id="orderNote"
                  value={formData.orderNote || ""}
                  onChange={(e) => setFormData({ ...formData, orderNote: e.target.value })}
                  placeholder="e.g. Requires chilled transport container, special import duty exemption..."
                  className="h-9 text-xs"
                />
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              STEP 3: LOCATION AND PICTURE
              ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Storage Location Coordinates */}
              <div className="p-3.5 rounded-lg border border-border bg-muted/10 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <MapPin className="size-4 text-primary" />
                  <span>Depot & Shelf Location Coordinates</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="location" className="text-xs font-semibold">
                      Depot Location <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="location"
                      value={formData.location || ""}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Main Biomedical Depot"
                      className="h-9 text-xs"
                    />
                    {errors.location && <p className="text-[11px] text-destructive">{errors.location}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="binCode" className="text-xs font-semibold">
                      Bin Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="binCode"
                      value={formData.binCode || ""}
                      onChange={(e) => setFormData({ ...formData, binCode: e.target.value })}
                      placeholder="e.g. BIN-CT"
                      className="h-9 text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="binNumber" className="text-xs font-semibold">
                      Bin Number
                    </Label>
                    <Input
                      id="binNumber"
                      value={formData.binNumber || ""}
                      onChange={(e) => setFormData({ ...formData, binNumber: e.target.value })}
                      placeholder="e.g. 12"
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Col / Row</Label>
                    <div className="flex gap-1.5">
                      <Input
                        value={formData.column || ""}
                        onChange={(e) => setFormData({ ...formData, column: e.target.value })}
                        placeholder="C"
                        className="h-9 text-xs font-mono text-center uppercase"
                        maxLength={2}
                      />
                      <Input
                        value={formData.row || ""}
                        onChange={(e) => setFormData({ ...formData, row: e.target.value })}
                        placeholder="3"
                        className="h-9 text-xs font-mono text-center"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="locationNote" className="text-xs font-semibold">
                    Location Instructions / Access Note
                  </Label>
                  <Input
                    id="locationNote"
                    value={formData.locationNote || ""}
                    onChange={(e) => setFormData({ ...formData, locationNote: e.target.value })}
                    placeholder="e.g. Keycard required for vault, ESD wristband required on rack 3"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Picture Upload Area */}
              <div className="p-3.5 rounded-lg border border-border bg-muted/10 space-y-2">
                <Label className="text-xs font-semibold">Part Picture</Label>
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
                    {formData.pictureUrl ? (
                      <img
                        src={formData.pictureUrl}
                        alt="Part Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-muted-foreground text-[10px]">
                        <Upload className="size-5 mx-auto mb-1 opacity-50" />
                        <span>No image</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          pictureUrl:
                            "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80",
                        })
                      }
                      className="h-8 text-xs gap-1.5 cursor-pointer"
                    >
                      <Upload className="size-3.5 text-primary" />
                      <span>Upload Picture</span>
                    </Button>
                    <p className="text-[11px] text-muted-foreground">
                      PNG, JPG or WebP. Max 5MB. Shows on technician mobile scan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Conformance Certificate & Document Table */}
              <div className="p-3.5 rounded-lg border border-border bg-muted/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <FileText className="size-4 text-primary" />
                    <span>Conformance Certificates (CoC) & Documents</span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddDocument}
                    className="h-8 text-xs gap-1 cursor-pointer"
                  >
                    <Plus className="size-3 text-primary" />
                    <span>Upload Certificate</span>
                  </Button>
                </div>

                {(formData.documents || []).length === 0 ? (
                  <div className="p-4 text-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                    No certificates attached yet. Click "Upload Certificate" to add factory QA or CoC.
                  </div>
                ) : (
                  <div className="rounded-md border border-border bg-background overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase">
                        <tr>
                          <th className="px-3 py-2 w-12">S/N</th>
                          <th className="px-3 py-2">Document</th>
                          <th className="px-3 py-2">Comment</th>
                          <th className="px-3 py-2 w-16 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {formData.documents?.map((doc, idx) => (
                          <tr key={doc.id} className="hover:bg-muted/20">
                            <td className="px-3 py-2 font-mono text-muted-foreground">{idx + 1}</td>
                            <td className="px-3 py-2 font-medium text-foreground flex items-center gap-1.5">
                              <FileText className="size-3.5 text-primary shrink-0" />
                              <span className="truncate max-w-[180px]">{doc.name}</span>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">
                              {doc.comment || "—"}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveDocument(doc.id)}
                                className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                title="Remove file"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
    </StepperModal>
  );
}
