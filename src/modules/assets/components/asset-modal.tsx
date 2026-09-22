import React, { useState, useEffect, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Stepper, type StepItem } from "@/components/ui/stepper";
import { cn } from "@/lib/utils";
import {
  Stethoscope,
  Network,
  Wrench,
  DollarSign,
  Plus,
  FileText,
  Upload,
  Calendar,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import {
  Asset,
  AssetJob,
  AssetNetworkDiagram,
  EquipmentStatus,
  WarrantyStatus,
  ContractStatus,
  ContractType,
  OwnershipType,
} from "../types";
import { EquipmentStatusBadge, ContractStatusBadge } from "./status-badges";
import { assetService } from "../services/asset-service";
import { useAuth } from "@/features/auth/auth-context";
import { toast } from "sonner";

const OEM_OPTIONS = [
  "GE",
  "Philips",
  "Siemens",
  "Canon",
  "Tenacore",
  "Toshiba",
  "Mindray",
  "Other",
];

const MODALITY_OPTIONS = [
  "Radiology",
  "IVD",
  "Endoscopy",
  "CT Scanner",
  "MRI Scanner",
  "Ultrasound",
  "X-Ray / Fluoroscopy",
  "Mammography",
  "Anesthesia Machine",
  "Patient Monitor",
  "Linear Accelerator (LINAC)",
];

const MODEL_OPTIONS = [
  "Revolution Apex 512",
  "Signa Explorer 1.5T",
  "Artis Q Ceiling",
  "EPIQ 7G Ultrasound",
  "Alinity ci-series",
  "Defigard Touch 7",
  "Other Model",
];

const EQUIPMENT_STATUS_OPTIONS: EquipmentStatus[] = [
  "Up",
  "Partially Up",
  "Down",
  "Unknown",
];

const WARRANTY_STATUS_OPTIONS: WarrantyStatus[] = [
  "Warranty",
  "Out of Warranty",
];

const CONTRACT_STATUS_OPTIONS: ContractStatus[] = [
  "In Contract",
  "Out of Contract",
];

const OWNERSHIP_TYPE_OPTIONS: OwnershipType[] = [
  "Purchased / Owned",
  "Leased",
  "Donated",
  "Rented",
];

const TECHNICIAN_OPTIONS = [
  "Engr. Nnamdi Kanu (GE Certified)",
  "Engr. Peter Obi (Siemens Specialist)",
  "Engr. Wale Shittu",
  "Engr. Sunday Daniel",
  "Engr. Emeka UNTH",
  "Amara Okoye (Biomedical Engineer)",
  "Marcus Vance (Biomedical Specialist)",
  "Engr. Biomedical Tech",
];

const ASSET_CREATE_STEPS: StepItem[] = [
  {
    id: "general",
    title: "General",
    description: "Equipment & Customer",
    icon: Stethoscope,
  },
  {
    id: "data",
    title: "Data & IT",
    description: "Network & Diagrams",
    icon: Network,
  },
  {
    id: "service",
    title: "Equipment Service",
    description: "PPM & Service Jobs",
    icon: Wrench,
  },
  {
    id: "financial",
    title: "Financial",
    description: "Warranty & Contract",
    icon: DollarSign,
  },
];

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: Asset | null;
  mode: "view" | "edit" | "create";
  onSave: (assetData: Partial<Asset>) => void;
}

export const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  onClose,
  asset,
  mode: initialMode,
  onSave,
}) => {
  const { user } = useAuth();
  const userRole = user?.role || "User";
  const isSuperAdmin = userRole === "Super Admin";
  const isAdmin = userRole === "Admin" || userRole === "Asset Admin" || isSuperAdmin;

  const [mode, setMode] = useState<"view" | "edit" | "create">(initialMode);
  const [activeTab, setActiveTab] = useState("general");

  const currentStepIndex = Math.max(
    0,
    ASSET_CREATE_STEPS.findIndex((s) => s.id === activeTab)
  );

  useEffect(() => {
    setMode(initialMode);
    setActiveTab("general");
  }, [initialMode, isOpen]);

  const customers = assetService.getCustomers();
  const allContracts = assetService.getContracts();

  // Network schematic upload state (Slide 11)
  const networkFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDiagramFile, setPendingDiagramFile] = useState<File | null>(null);
  const [pendingDiagramComment, setPendingDiagramComment] = useState("");
  const [selectedDiagramIds, setSelectedDiagramIds] = useState<string[]>([]);

  // Jobs state (Slide 13 & 14)
  const [jobs, setJobs] = useState<AssetJob[]>([]);
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [newJob, setNewJob] = useState({
    jobNumber: `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    jobType: "Planned Preventive Maintenance (PPM)",
    jobStatus: "In Progress" as const,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    costOfService: 150000,
    technician: TECHNICIAN_OPTIONS[0],
    notes: "",
  });

  // Form State matching Slide 9, 11, 13, 15
  const [formData, setFormData] = useState<Partial<Asset>>({
    equipmentNumber: "",
    serialNumber: "",
    oem: "GE",
    modality: "Radiology",
    model: "Revolution Apex 512",
    equipmentStatus: "Up",
    installationDate: new Date().toISOString().split("T")[0],
    warrantyStatus: "Warranty",
    warrantyStartDate: new Date().toISOString().split("T")[0],
    warrantyEndDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    contractStatus: "In Contract",
    contractEndDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    nextPpmDate: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
    ppmSchedule: "Quarterly (every 90 days)",
    ppmScheduleMonths: "3",
    swVersion: "v1.0.0",
    customer: customers[0]?.customer || "National Hospital Abuja",
    location: customers[0]?.location || "Main Radiology Complex, Garki",
    customerContact: customers[0]?.customerContact || "Dr. Alabi Kunle",
    email: customers[0]?.email || "alabi.k@nationalhospital.gov.ng",
    phoneNumber: customers[0]?.phoneNumber || "+234 802 300 1122",
    region: customers[0]?.region || "North Central",
    notes: "",
    generalNote: "",
    ipAddress: "192.168.10.10",
    macAddress: "00:1A:2B:3C:4D:5E",
    aeTitle: "MODALITY_PACS",
    portNumber: 104,
    subnetMask: "255.255.255.0",
    itNote: "",
    networkDiagrams: [],
    ownershipType: "Purchased / Owned",
    contractNumber: allContracts[0]?.contractNumber || "CTR-2026-881",
    contractStartDate: allContracts[0]?.contractStartDate || "",
    contractValue: allContracts[0]?.contractValue || 0,
    contractType: allContracts[0]?.contractType || "PM + LABOUR",
    contractOrderNumber: allContracts[0]?.contractOrderNumber || "ORD-2026-092",
    contractPoNumber: allContracts[0]?.poNumber || "PO-MED-9941",
    financialNote: "",
  });

  useEffect(() => {
    setMode(initialMode);
    setActiveTab("general");
    setIsAddingJob(false);
    setPendingDiagramFile(null);
    setPendingDiagramComment("");
    setSelectedDiagramIds([]);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (asset && mode !== "create") {
      setFormData(asset);
      setJobs(assetService.getJobs(asset.id));
    } else if (mode === "create") {
      const defaultCustomer = customers[0];
      const defaultContract = allContracts[0];
      setFormData({
        equipmentNumber: `EQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        serialNumber: `SN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        oem: "GE",
        modality: "Radiology",
        model: "Revolution Apex 512",
        equipmentStatus: "Up",
        installationDate: new Date().toISOString().split("T")[0],
        warrantyStatus: "Warranty",
        warrantyStartDate: new Date().toISOString().split("T")[0],
        warrantyEndDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
        contractStatus: "In Contract",
        contractEndDate: defaultContract?.contractEndDate || new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
        nextPpmDate: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
        ppmSchedule: "Quarterly (every 90 days)",
        ppmScheduleMonths: "3",
        swVersion: "v1.0.0",
        customer: defaultCustomer?.customer || "National Hospital Abuja",
        location: defaultCustomer?.location || "Main Radiology Complex, Garki",
        customerContact: defaultCustomer?.customerContact || "Dr. Alabi Kunle",
        email: defaultCustomer?.email || "alabi.k@nationalhospital.gov.ng",
        phoneNumber: defaultCustomer?.phoneNumber || "+234 802 300 1122",
        region: defaultCustomer?.region || "North Central",
        notes: "",
        generalNote: "",
        ipAddress: "192.168.10.10",
        macAddress: "00:1A:2B:3C:4D:5E",
        aeTitle: "MODALITY_PACS",
        portNumber: 104,
        subnetMask: "255.255.255.0",
        itNote: "",
        networkDiagrams: [],
        ownershipType: "Purchased / Owned",
        contractNumber: defaultContract?.contractNumber || "CTR-2026-881",
        contractStartDate: defaultContract?.contractStartDate || "",
        contractValue: defaultContract?.contractValue || 0,
        contractType: defaultContract?.contractType || "PM + LABOUR",
        contractOrderNumber: defaultContract?.contractOrderNumber || "ORD-2026-092",
        contractPoNumber: defaultContract?.poNumber || "PO-MED-9941",
        financialNote: "",
      });
      setJobs([]);
    }
  }, [asset, mode, isOpen]);

  // Customer selection handler (Slide 10: auto-fills blue boxes)
  const handleCustomerChange = (customerName: string) => {
    const found = customers.find((c) => c.customer === customerName);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        customer: found.customer,
        location: found.location,
        customerContact: found.customerContact,
        email: found.email,
        phoneNumber: found.phoneNumber,
        region: found.region,
      }));
    } else {
      setFormData((prev) => ({ ...prev, customer: customerName }));
    }
  };

  // Contract selection handler (Slide 16: auto-fills blue boxes)
  const handleContractChange = (contractNum: string) => {
    const found = allContracts.find((c) => c.contractNumber === contractNum);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        contractId: found.id,
        contractNumber: found.contractNumber,
        contractStatus: found.contractStatus || "In Contract",
        contractStartDate: found.contractStartDate,
        contractEndDate: found.contractEndDate,
        contractValue: found.contractValue,
        contractType: found.contractType,
        contractOrderNumber: found.contractOrderNumber || prev.contractOrderNumber || "",
        contractPoNumber: found.poNumber || prev.contractPoNumber || "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, contractNumber: contractNum }));
    }
  };

  // Add network diagram from upload box (Slide 11)
  const handleSaveNetworkDiagram = () => {
    if (!pendingDiagramFile) {
      toast.error("Please click 'Upload' to select a network diagram file first.");
      return;
    }
    const newDiagram: AssetNetworkDiagram = {
      id: `diag_${Date.now()}`,
      fileName: pendingDiagramFile.name,
      comment: pendingDiagramComment.trim() || "Network schematic",
      uploadDate: new Date().toISOString().split("T")[0],
      size: `${(pendingDiagramFile.size / (1024 * 1024)).toFixed(1)} MB`,
    };
    setFormData((prev) => ({
      ...prev,
      networkDiagrams: [...(prev.networkDiagrams || []), newDiagram],
    }));
    toast.success(`Attached ${pendingDiagramFile.name} to network diagram register.`);
    setPendingDiagramFile(null);
    setPendingDiagramComment("");
  };

  // Toggle select checkbox for network diagram (Slide 11)
  const handleToggleSelectDiagram = (id: string) => {
    setSelectedDiagramIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Add Job (Slide 13 & 14)
  const handleAddJobSubmit = () => {
    if (!newJob.jobNumber.trim()) {
      toast.error("Please provide a Job Number.");
      return;
    }
    const createdJob: AssetJob = {
      id: `job_${Date.now()}`,
      jobNumber: newJob.jobNumber.trim(),
      assetId: asset?.id || `ast_temp_${Date.now()}`,
      equipmentNumber: formData.equipmentNumber || "EQ-NEW",
      contractId: formData.contractId,
      jobType: newJob.jobType,
      jobStatus: newJob.jobStatus,
      startDate: newJob.startDate,
      endDate: newJob.endDate,
      costOfService: Number(newJob.costOfService) || 0,
      technician: newJob.technician,
      notes: newJob.notes,
      createdAt: new Date().toISOString(),
    };
    setJobs((prev) => [...prev, createdJob]);
    toast.success(`Job ${createdJob.jobNumber} added.`);
    setIsAddingJob(false);
    setNewJob({
      jobNumber: `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      jobType: "Planned Preventive Maintenance (PPM)",
      jobStatus: "In Progress",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      costOfService: 150000,
      technician: TECHNICIAN_OPTIONS[0],
      notes: "",
    });
  };

  const handleSave = () => {
    if (!formData.equipmentNumber?.trim()) {
      toast.error("Equipment Number is required.");
      return;
    }
    onSave(formData);
    toast.success("Equipment details saved successfully.");
    onClose();
  };

  const isReadOnly = mode === "view";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex flex-col w-[96vw] sm:w-[94vw] lg:max-w-5xl h-[90vh] max-h-[90vh] overflow-hidden p-0 gap-0 border border-border bg-card rounded-2xl shadow-2xl">
        {/* Header - Compact System Design */}
        <DialogHeader
          className={cn(
            "border-b border-border bg-card flex-shrink-0",
            mode === "create" ? "p-4 sm:p-5 space-y-3" : "p-3.5 sm:p-4"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8.5 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Stethoscope className="size-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                    {mode === "create"
                      ? "Add Equipment"
                      : `${formData.equipmentNumber || "Asset Details"} — ${formData.oem || ""} ${formData.model || ""}`}
                  </DialogTitle>
                  {formData.equipmentStatus && mode !== "create" && (
                    <EquipmentStatusBadge status={formData.equipmentStatus} />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {mode === "create"
                    ? "Step-by-step biomedical equipment onboarding, networking, service schedule & contract"
                    : `Serial: ${formData.serialNumber || "N/A"} • Modality: ${formData.modality || "General"}`}
                </p>
              </div>
            </div>

            {mode === "view" && isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode("edit")}
                className="text-xs h-7"
              >
                Edit Equipment
              </Button>
            )}
          </div>

          {/* Stepper for Asset Creation */}
          {mode === "create" && (
            <div className="pt-2">
              <Stepper
                steps={ASSET_CREATE_STEPS}
                currentStep={currentStepIndex}
                onStepClick={(idx) => {
                  if (currentStepIndex === 0 && idx > 0 && !formData.equipmentNumber?.trim()) {
                    toast.error("Please enter an Equipment Number before proceeding.");
                    return;
                  }
                  setActiveTab(ASSET_CREATE_STEPS[idx].id);
                }}
                allowStepClick={true}
              />
            </div>
          )}
        </DialogHeader>

        {/* Modal Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* TabsList for View/Edit Modes */}
          {mode !== "create" && (
            <div className="px-4 py-2.5 bg-card border-b border-border">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="general">
                  <Stethoscope className="size-3.5 mr-1" /> General
                </TabsTrigger>
                <TabsTrigger value="data">
                  <Network className="size-3.5 mr-1" /> Data & IT
                </TabsTrigger>
                <TabsTrigger value="service">
                  <Wrench className="size-3.5 mr-1" /> Equipment Service
                </TabsTrigger>
                <TabsTrigger value="financial">
                  <DollarSign className="size-3.5 mr-1" /> Financial
                </TabsTrigger>
              </TabsList>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
            {/* ========================================================= */}
            {/* TAB 1: GENERAL (4 Cards Structure) */}
            {/* ========================================================= */}
            <TabsContent value="general" className="m-0 space-y-4 animate-in fade-in-50 duration-150">
              {/* SECTION: EQUIPMENT DETAILS (Slide 9) */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3.5">
                <div className="border-b border-border/60 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    EQUIPMENT DETAILS
                  </h3>
                </div>

                {/* Row 1: Equipment Number, Serial Number, OEM (v), Modality (v), Model (v) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Equipment Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.equipmentNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, equipmentNumber: e.target.value })
                      }
                      className="h-8 text-xs font-mono font-bold bg-background border-border"
                      placeholder="e.g. EQ-2026-001"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Serial Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.serialNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, serialNumber: e.target.value })
                      }
                      className="h-8 text-xs font-mono font-bold bg-background border-border"
                      placeholder="e.g. SN-982104"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">OEM</Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.oem || "GE"}
                      onValueChange={(val) => setFormData({ ...formData, oem: val })}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background border-border">
                        <SelectValue placeholder="Select OEM" />
                      </SelectTrigger>
                      <SelectContent>
                        {OEM_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o} className="text-xs">
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Modality</Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.modality || "Radiology"}
                      onValueChange={(val) => setFormData({ ...formData, modality: val })}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background border-border">
                        <SelectValue placeholder="Select Modality" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODALITY_OPTIONS.map((m) => (
                          <SelectItem key={m} value={m} className="text-xs">
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Model</Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.model || "Revolution Apex 512"}
                      onValueChange={(val) => setFormData({ ...formData, model: val })}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background border-border">
                        <SelectValue placeholder="Select Model" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODEL_OPTIONS.map((md) => (
                          <SelectItem key={md} value={md} className="text-xs">
                            {md}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Equipment Status (v), Installation date, Warranty Status (v), Warranty start Date, Warranty end date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Equipment Status</Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.equipmentStatus || "Up"}
                      onValueChange={(val: EquipmentStatus) =>
                        setFormData({ ...formData, equipmentStatus: val })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EQUIPMENT_STATUS_OPTIONS.map((st) => (
                          <SelectItem key={st} value={st} className="text-xs">
                            {st}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Installation date</Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.installationDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, installationDate: e.target.value })
                      }
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Warranty Status</Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.warrantyStatus || "Warranty"}
                      onValueChange={(val: WarrantyStatus) =>
                        setFormData({ ...formData, warrantyStatus: val })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WARRANTY_STATUS_OPTIONS.map((w) => (
                          <SelectItem key={w} value={w} className="text-xs">
                            {w}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Warranty start Date</Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.warrantyStartDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, warrantyStartDate: e.target.value })
                      }
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Warranty end date</Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.warrantyEndDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, warrantyEndDate: e.target.value })
                      }
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>
                </div>

                {/* Row 3: Contract Status (v), Contract end date, Next PPM Date, PPM schedule, SW Version */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Contract Status</Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.contractStatus || "In Contract"}
                      onValueChange={(val: ContractStatus) =>
                        setFormData({ ...formData, contractStatus: val })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTRACT_STATUS_OPTIONS.map((cs) => (
                          <SelectItem key={cs} value={cs} className="text-xs">
                            {cs}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Contract end date</Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.contractEndDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, contractEndDate: e.target.value })
                      }
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Next PPM Date</Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.nextPpmDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, nextPpmDate: e.target.value })
                      }
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">PPM schedule</Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.ppmSchedule || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, ppmSchedule: e.target.value })
                      }
                      placeholder="e.g. Quarterly"
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">SW Version</Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.swVersion || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, swVersion: e.target.value })
                      }
                      placeholder="e.g. v2.4.1"
                      className="h-8 text-xs font-mono bg-background border-border"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: CUSTOMER DETAILS (Slide 9 & 10: Blue boxes auto-fill on supplier/customer selection) */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3.5">
                <div className="border-b border-border/60 pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    CUSTOMER DETAILS
                  </h3>
                  <span className="text-[11px] text-muted-foreground italic">
                    Selecting customer auto-fills highlighted blue fields
                  </span>
                </div>

                {/* Row 1: Customer, Location (blue), Customer Contact (blue), Email (blue), Phone Number (blue) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Customer</Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.customer || ""}
                      onValueChange={handleCustomerChange}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background border-border">
                        <SelectValue placeholder="Select Customer" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {customers.map((c) => (
                          <SelectItem key={c.customer} value={c.customer} className="text-xs">
                            {c.customer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Location</Label>
                    <div className="h-8 px-3 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs font-medium flex items-center truncate shadow-2xs">
                      {formData.location || "—"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Customer Contact</Label>
                    <div className="h-8 px-3 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs font-medium flex items-center truncate shadow-2xs">
                      {formData.customerContact || "—"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Email</Label>
                    <div className="h-8 px-3 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs font-mono flex items-center truncate shadow-2xs">
                      {formData.email || "—"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Phone Number</Label>
                    <div className="h-8 px-3 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs font-mono flex items-center truncate shadow-2xs">
                      {formData.phoneNumber || "—"}
                    </div>
                  </div>
                </div>

                {/* Row 2: Region */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs pt-1">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Region</Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.region || ""}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      placeholder="e.g. North Central"
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>
                </div>
              </div>

              {/* Note (Full-Width Bottom Textarea per Slide 9) */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-2">
                <Label className="text-xs font-bold text-foreground">Note</Label>
                <Textarea
                  rows={3}
                  disabled={isReadOnly}
                  value={formData.notes || formData.generalNote || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value, generalNote: e.target.value })
                  }
                  placeholder="Enter administrative notes, warranty comments, or commissioning observations..."
                  className="text-xs bg-background border-border resize-none"
                />
              </div>
            </TabsContent>

            {/* ========================================================= */}
            {/* TAB 2: DATA (SLIDE 11 & 12)                               */}
            {/* ========================================================= */}
            <TabsContent value="data" className="m-0 space-y-4 animate-in fade-in-50 duration-150">
              {/* SECTION: I.T. DETAILS */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3.5">
                <div className="border-b border-border/60 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    I.T. DETAILS
                  </h3>
                </div>

                {/* Row 1: I.P Address, Mac address, AE Title, Port Number, Subnet mask */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">I.P Address</Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.ipAddress || ""}
                      onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                      className="h-8 text-xs font-mono bg-background border-border"
                      placeholder="192.168.10.10"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Mac address</Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.macAddress || ""}
                      onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                      className="h-8 text-xs font-mono bg-background border-border"
                      placeholder="00:1A:2B:3C:4D:5E"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">AE Title</Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.aeTitle || ""}
                      onChange={(e) => setFormData({ ...formData, aeTitle: e.target.value })}
                      className="h-8 text-xs font-mono bg-background border-border"
                      placeholder="MODALITY_PACS"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Port Number</Label>
                    <Input
                      type="number"
                      disabled={isReadOnly}
                      value={formData.portNumber || 104}
                      onChange={(e) =>
                        setFormData({ ...formData, portNumber: parseInt(e.target.value) || 104 })
                      }
                      className="h-8 text-xs font-mono bg-background border-border"
                      placeholder="104"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Subnet mask</Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.subnetMask || ""}
                      onChange={(e) => setFormData({ ...formData, subnetMask: e.target.value })}
                      className="h-8 text-xs font-mono bg-background border-border"
                      placeholder="255.255.255.0"
                    />
                  </div>
                </div>

                {/* Note across the middle */}
                <div className="space-y-1.5 pt-1">
                  <Label className="text-[11px] font-semibold text-foreground">Note</Label>
                  <Textarea
                    rows={3}
                    disabled={isReadOnly}
                    value={formData.itNote || ""}
                    onChange={(e) => setFormData({ ...formData, itNote: e.target.value })}
                    placeholder="Enter VLAN configuration, gateway hops, PACS routing filters, or firewall rules..."
                    className="text-xs bg-background border-border resize-none"
                  />
                </div>
              </div>

              {/* SECTION: NETWORK DIAGRAM (Slide 11: Table with S/N, Network Diagram, Comment, Select + Right Upload & Save) */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3.5">
                <div className="border-b border-border/60 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    NETWORK DIAGRAM
                  </h3>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 items-start">
                  {/* Table (Left / Middle) */}
                  <div className="flex-1 w-full rounded-lg border border-border overflow-hidden bg-background">
                    <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                      <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider border-b border-border">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center">S/N</th>
                          <th className="py-2.5 px-3 font-bold text-foreground">Network Diagram</th>
                          <th className="py-2.5 px-3">Comment</th>
                          <th className="py-2.5 px-3 w-16 text-center">Select</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {(formData.networkDiagrams || []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-muted-foreground">
                              <p className="font-medium text-xs text-foreground">No network diagrams</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Use the upload panel to attach network schematics or topology diagrams.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          formData.networkDiagrams?.map((diagram, idx) => (
                            <tr key={diagram.id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-foreground">
                                <div className="flex items-center gap-2">
                                  <FileText className="size-3.5 text-primary shrink-0" />
                                  <span className="font-mono text-xs">{diagram.fileName}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground">
                                {diagram.comment || "—"}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <Checkbox
                                  checked={selectedDiagramIds.includes(diagram.id)}
                                  onCheckedChange={() => handleToggleSelectDiagram(diagram.id)}
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Upload side panel (Slide 11: Upload network diagram, Upload button, Save button) */}
                  <div className="w-full lg:w-64 p-4 rounded-lg border border-border bg-muted/20 space-y-3 shrink-0 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <span className="text-xs font-bold text-foreground block">
                        Upload network diagram
                      </span>

                      <input
                        type="file"
                        ref={networkFileInputRef}
                        accept=".pdf,.png,.jpg,.jpeg,.svg,.vsd,.vsdx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setPendingDiagramFile(file);
                            toast.info(`Selected ${file.name}. Click "Save" to add to table.`);
                            e.target.value = "";
                          }
                        }}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        disabled={isReadOnly}
                        onClick={() => networkFileInputRef.current?.click()}
                        className="h-8 w-full text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs border-border hover:bg-muted/80"
                      >
                        <Upload className="size-3.5 text-primary" />
                        <span className="truncate">{pendingDiagramFile ? pendingDiagramFile.name : "Upload"}</span>
                      </Button>

                      {pendingDiagramFile && (
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground font-semibold">Comment</Label>
                          <Input
                            placeholder="Diagram comment..."
                            value={pendingDiagramComment}
                            onChange={(e) => setPendingDiagramComment(e.target.value)}
                            className="h-7 text-xs bg-background border-border"
                          />
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      disabled={isReadOnly || !pendingDiagramFile}
                      onClick={handleSaveNetworkDiagram}
                      className="h-8 w-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs disabled:opacity-50 mt-2"
                    >
                      <Save className="size-3.5 mr-1" />
                      <span>Save</span>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ========================================================= */}
            {/* TAB 3: EQUIPMENT SERVICE (SLIDE 13 & 14)                   */}
            {/* ========================================================= */}
            <TabsContent value="service" className="m-0 space-y-4 animate-in fade-in-50 duration-150">
              {/* Top Row Inputs (Slide 13: Next PPM Date, PPM schedule (Months)) */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Next PPM Date</Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.nextPpmDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, nextPpmDate: e.target.value })
                      }
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">
                      PPM schedule (Months)
                    </Label>
                    <Input
                      type="text"
                      disabled={isReadOnly}
                      value={formData.ppmScheduleMonths || formData.ppmSchedule || "3"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ppmScheduleMonths: e.target.value,
                          ppmSchedule: e.target.value,
                        })
                      }
                      placeholder="e.g. 3, 6, 12"
                      className="h-8 text-xs font-mono font-bold bg-background border-border"
                    />
                  </div>
                </div>
              </div>

              {/* SERVICE DETAILS Table (Slide 13: SN, JOB NUMBER, JOB TYPE, JOB STATUS, START DATE, END DATE, COST OF SERVICE) */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3.5">
                <div className="border-b border-border/60 pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    SERVICE DETAILS
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    Logged service orders & maintenance interventions ({jobs.length})
                  </span>
                </div>

                <div className="rounded-lg border border-border overflow-hidden bg-background">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse whitespace-nowrap min-w-[680px]">
                      <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider border-b border-border">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center">SN</th>
                          <th className="py-2.5 px-3 font-bold text-foreground">JOB NUMBER</th>
                          <th className="py-2.5 px-3">JOB TYPE</th>
                          <th className="py-2.5 px-3">JOB STATUS</th>
                          <th className="py-2.5 px-3 font-mono">START DATE</th>
                          <th className="py-2.5 px-3 font-mono">END DATE</th>
                          <th className="py-2.5 px-3 text-right">COST OF SERVICE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {jobs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-muted-foreground">
                              <p className="font-medium text-xs text-foreground">No service jobs recorded</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Click "Add Job" below to log preventive or corrective maintenance.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          jobs.map((job, idx) => (
                            <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-primary">
                                {job.jobNumber}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-foreground">{job.jobType}</td>
                              <td className="py-2.5 px-3">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] py-0 px-1.5 ${
                                    job.jobStatus === "Completed"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                                  }`}
                                >
                                  {job.jobStatus}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                {job.startDate}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                {job.endDate}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-foreground text-right">
                                ₦{Number(job.costOfService || 0).toLocaleString("en-US")}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add Job Form / Button (Slide 13 & 14: User/Admin can add or create jobs) */}
                {isAddingJob ? (
                  <div className="p-3.5 rounded-xl border border-primary/30 bg-muted/30 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <Wrench className="size-3.5 text-primary" />
                        <span>Create Service Job ({newJob.jobNumber})</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-foreground">Job Type</Label>
                        <Select
                          value={newJob.jobType}
                          onValueChange={(val) => setNewJob({ ...newJob, jobType: val })}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Planned Preventive Maintenance (PPM)">PPM</SelectItem>
                            <SelectItem value="Corrective Repair / Breakdown">Breakdown / Repair</SelectItem>
                            <SelectItem value="Calibration & Safety Test">Calibration</SelectItem>
                            <SelectItem value="Software Upgrade">Software Upgrade</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-foreground">Job Status</Label>
                        <Select
                          value={newJob.jobStatus}
                          onValueChange={(val: any) => setNewJob({ ...newJob, jobStatus: val })}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Pending Parts">Pending Parts</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-foreground">Cost of Service (₦)</Label>
                        <Input
                          type="number"
                          value={newJob.costOfService}
                          onChange={(e) =>
                            setNewJob({ ...newJob, costOfService: parseFloat(e.target.value) || 0 })
                          }
                          className="h-8 text-xs font-mono font-bold bg-background border-border"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-foreground">Start Date</Label>
                        <Input
                          type="date"
                          value={newJob.startDate}
                          onChange={(e) => setNewJob({ ...newJob, startDate: e.target.value })}
                          className="h-8 text-xs bg-background border-border"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-foreground">End Date</Label>
                        <Input
                          type="date"
                          value={newJob.endDate}
                          onChange={(e) => setNewJob({ ...newJob, endDate: e.target.value })}
                          className="h-8 text-xs bg-background border-border"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-foreground">Technician</Label>
                        <Select
                          value={newJob.technician}
                          onValueChange={(val) => setNewJob({ ...newJob, technician: val })}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background border-border">
                            <SelectValue placeholder="Select technician" />
                          </SelectTrigger>
                          <SelectContent>
                            {TECHNICIAN_OPTIONS.map((tech) => (
                              <SelectItem key={tech} value={tech} className="text-xs">
                                {tech}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddingJob(false)}
                        className="h-8 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddJobSubmit}
                        className="h-8 text-xs bg-primary text-primary-foreground font-bold"
                      >
                        Save Job
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingJob(true)}
                      className="h-8 px-4 text-xs font-bold gap-1.5 border-border hover:bg-muted/80 shadow-2xs"
                    >
                      <Plus className="size-3.5 text-primary" />
                      <span>Add Job</span>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ========================================================= */}
            {/* TAB 4: FINANCIAL (SLIDE 15 & 16)                          */}
            {/* ========================================================= */}
            <TabsContent value="financial" className="m-0 space-y-4 animate-in fade-in-50 duration-150">
              <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3.5">
                <div className="border-b border-border/60 pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    FINANCIAL
                  </h3>
                  <span className="text-[11px] text-muted-foreground italic">
                    Entering Contract Number auto-fills highlighted blue contract boxes
                  </span>
                </div>

                {/* Row 1: Ownership Type (v), Warranty Status (v), Warranty Start Date, Warranty end date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Ownership Type</Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.ownershipType || "Purchased / Owned"}
                      onValueChange={(val: OwnershipType) =>
                        setFormData({ ...formData, ownershipType: val })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OWNERSHIP_TYPE_OPTIONS.map((ot) => (
                          <SelectItem key={ot} value={ot} className="text-xs">
                            {ot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Warranty Status</Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.warrantyStatus || "Warranty"}
                      onValueChange={(val: WarrantyStatus) =>
                        setFormData({ ...formData, warrantyStatus: val })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WARRANTY_STATUS_OPTIONS.map((w) => (
                          <SelectItem key={w} value={w} className="text-xs">
                            {w}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Warranty Start Date</Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.warrantyStartDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, warrantyStartDate: e.target.value })
                      }
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Warranty end date</Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.warrantyEndDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, warrantyEndDate: e.target.value })
                      }
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>
                </div>

                {/* Row 2: Contract status (v), Contract Number, Contract start date (blue), Contract end date (blue), Contract value (blue), Contract type (blue) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs pt-1">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Contract status</Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.contractStatus || "In Contract"}
                      onValueChange={(val: ContractStatus) =>
                        setFormData({ ...formData, contractStatus: val })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTRACT_STATUS_OPTIONS.map((cs) => (
                          <SelectItem key={cs} value={cs} className="text-xs">
                            {cs}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Contract Number</Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.contractNumber || ""}
                      onValueChange={handleContractChange}
                    >
                      <SelectTrigger className="h-8 text-xs font-mono font-bold bg-background border-border">
                        <SelectValue placeholder="Contract #" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {allContracts.map((c) => (
                          <SelectItem key={c.id} value={c.contractNumber} className="text-xs">
                            <span className="font-mono font-bold text-primary">{c.contractNumber}</span>
                            <span className="text-muted-foreground ml-1.5">— {c.vendorName}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Contract start date</Label>
                    <div className="h-8 px-3 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs font-mono flex items-center truncate shadow-2xs">
                      {formData.contractStartDate || "—"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Contract end date</Label>
                    <div className="h-8 px-3 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs font-mono flex items-center truncate shadow-2xs">
                      {formData.contractEndDate || "—"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Contract value</Label>
                    <div className="h-8 px-3 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs font-mono font-bold flex items-center truncate shadow-2xs">
                      {formData.contractValue
                        ? `₦${Number(formData.contractValue).toLocaleString()}`
                        : "—"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Contract type</Label>
                    <div className="h-8 px-3 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs font-medium flex items-center truncate shadow-2xs">
                      {formData.contractType || "—"}
                    </div>
                  </div>
                </div>

                {/* Row 3: Contract Order Number, Contract PO Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Contract Order Number</Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.contractOrderNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, contractOrderNumber: e.target.value })
                      }
                      placeholder="e.g. ORD-2026-118"
                      className="h-8 text-xs font-mono bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Contract PO Number</Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.contractPoNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, contractPoNumber: e.target.value })
                      }
                      placeholder="e.g. PO-MED-9955"
                      className="h-8 text-xs font-mono bg-background border-border"
                    />
                  </div>
                </div>
              </div>

              {/* Note (Full-Width Bottom Textarea per Slide 15) */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-2">
                <Label className="text-xs font-bold text-foreground">Note</Label>
                <Textarea
                  rows={3}
                  disabled={isReadOnly}
                  value={formData.financialNote || ""}
                  onChange={(e) => setFormData({ ...formData, financialNote: e.target.value })}
                  placeholder="Enter depreciation details, capital asset funding codes, or procurement ledger terms..."
                  className="text-xs bg-background border-border resize-none"
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* MODAL FOOTER */}
        {mode === "create" ? (
          <DialogFooter className="p-3 sm:p-4 border-t border-border bg-card flex items-center justify-between sm:justify-between gap-2.5 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 px-4 sm:px-5 text-xs font-semibold cursor-pointer border-border"
            >
              <X className="size-3.5 mr-1.5 text-muted-foreground" />
              <span>Cancel</span>
            </Button>

            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab(ASSET_CREATE_STEPS[currentStepIndex - 1].id)}
                  className="h-9 px-3.5 text-xs font-medium cursor-pointer"
                >
                  <ChevronLeft className="size-3.5 mr-1" />
                  <span>Back</span>
                </Button>
              )}

              {currentStepIndex < ASSET_CREATE_STEPS.length - 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSave}
                  className="h-9 px-3.5 text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground hidden sm:inline-flex"
                  title="Save progress and close"
                >
                  <Save className="size-3.5 mr-1.5" />
                  <span>Save & Exit</span>
                </Button>
              )}

              {currentStepIndex < ASSET_CREATE_STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => {
                    if (currentStepIndex === 0 && !formData.equipmentNumber?.trim()) {
                      toast.error("Please enter an Equipment Number before proceeding.");
                      return;
                    }
                    setActiveTab(ASSET_CREATE_STEPS[currentStepIndex + 1].id);
                  }}
                  className="h-9 px-5 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                >
                  <span>Next: {ASSET_CREATE_STEPS[currentStepIndex + 1].title}</span>
                  <ChevronRight className="size-3.5 ml-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSave}
                  className="h-9 px-6 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
                >
                  <Check className="size-3.5 mr-1.5" />
                  <span>Create Equipment</span>
                </Button>
              )}
            </div>
          </DialogFooter>
        ) : (
          <DialogFooter className="p-3 sm:p-4 border-t border-border bg-card flex items-center justify-between sm:justify-end gap-2.5 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 px-4 sm:px-5 text-xs font-semibold cursor-pointer border-border flex-1 sm:flex-initial"
            >
              <X className="size-3.5 mr-1.5 text-muted-foreground" />
              <span>Close</span>
            </Button>

            {!isReadOnly && (
              <Button
                type="button"
                onClick={handleSave}
                className="h-9 px-5 sm:px-6 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs flex-1 sm:flex-initial"
              >
                <Save className="size-3.5 mr-1.5" />
                <span>Save</span>
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
