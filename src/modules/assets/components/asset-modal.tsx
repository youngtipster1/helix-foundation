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
  Stethoscope,
  Network,
  Wrench,
  DollarSign,
  Plus,
  FileText,
  Upload,
  Building2,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  FileUp,
} from "lucide-react";
import {
  Asset,
  AssetJob,
  AssetNetworkDiagram,
  EquipmentStatus,
  WarrantyStatus,
  OwnershipType,
  SupplierDirectoryEntry,
} from "../types";
import { EquipmentStatusBadge, ContractStatusBadge } from "./status-badges";
import { assetService } from "../services/asset-service";
import { useAuth } from "@/features/auth/auth-context";

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

  useEffect(() => {
    setMode(initialMode);
    setActiveTab("general");
  }, [initialMode, isOpen]);

  // Suppliers directory for auto-fill card
  const suppliers = assetService.getSuppliers();

  // Form State
  const [formData, setFormData] = useState<Partial<Asset>>({
    equipmentNumber: "",
    serialNumber: "",
    oem: "",
    modality: "CT Scanner",
    model: "",
    assetType: "Fixed Asset",
    equipmentStatus: "Up",
    installationDate: new Date().toISOString().split("T")[0],
    warrantyStatus: "Warranty",
    warrantyStartDate: new Date().toISOString().split("T")[0],
    warrantyEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    ppmSchedule: "Quarterly (every 90 days)",
    nextPpmDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    swVersion: "v1.0.0",
    dicVersion: "DICOM 3.0 Standard",
    supplier: suppliers[0]?.supplier || "GE Healthcare Direct",
    supplierCode: suppliers[0]?.supplierCode || "GEHC-EU-44",
    supplierContact: suppliers[0]?.supplierContact || "Klaus Hoffmann / Engr. Tunde Adeleke",
    email: suppliers[0]?.email || "spares.emea@gehealthcare.com",
    phoneNumber: suppliers[0]?.phoneNumber || "+44 800 032 5050",
    address: suppliers[0]?.address || "Pollards Wood, UK (Lagos Depot: Ikoyi)",
    region: "South West",
    location: "Main Radiology Complex, Suite A",
    ipAddress: "192.168.10.10",
    macAddress: "00:1A:2B:3C:4D:5E",
    aeTitle: "MODALITY_PACS",
    portNumber: 104,
    subnetMask: "255.255.255.0",
    itNote: "",
    networkDiagrams: [],
    ownershipType: "Purchased / Owned",
    financialNote: "",
    contractStatus: "Out of Contract",
  });

  // Selected supplier details for the auto-populated card
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDirectoryEntry | null>(
    suppliers[0] || null
  );

  // Jobs state
  const [jobs, setJobs] = useState<AssetJob[]>([]);
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [newJob, setNewJob] = useState({
    jobNumber: `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    jobType: "Planned Preventive Maintenance (PPM)",
    jobStatus: "In Progress" as const,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    costOfService: 150000,
    technician: user?.name || "Engr. Biomedical Tech",
    notes: "",
  });

  // Network diagram upload simulation
  const [isAddingDiagram, setIsAddingDiagram] = useState(false);
  const [diagramFileName, setDiagramFileName] = useState("");
  const [diagramComment, setDiagramComment] = useState("");

  useEffect(() => {
    if (asset && mode !== "create") {
      setFormData(asset);
      setJobs(assetService.getJobs(asset.id));
      const matched = suppliers.find(
        (s) => s.supplier === (asset.supplier || asset.customer)
      ) || suppliers[0];
      setSelectedSupplier(matched || null);
    } else if (mode === "create") {
      const defaultSupplier = suppliers[0];
      setFormData({
        equipmentNumber: `EQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        serialNumber: `SN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        oem: "GE Healthcare",
        modality: "CT Scanner",
        model: "",
        assetType: "Fixed Asset",
        equipmentStatus: "Up",
        installationDate: new Date().toISOString().split("T")[0],
        warrantyStatus: "Warranty",
        warrantyStartDate: new Date().toISOString().split("T")[0],
        warrantyEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        ppmSchedule: "Quarterly (every 90 days)",
        nextPpmDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        swVersion: "v1.0.0",
        dicVersion: "DICOM 3.0 Standard",
        supplier: defaultSupplier?.supplier || "GE Healthcare Direct",
        supplierCode: defaultSupplier?.supplierCode || "GEHC-EU-44",
        supplierContact: defaultSupplier?.supplierContact || "Klaus Hoffmann",
        email: defaultSupplier?.email || "spares.emea@gehealthcare.com",
        phoneNumber: defaultSupplier?.phoneNumber || "+44 800 032 5050",
        address: defaultSupplier?.address || "Pollards Wood, UK (Lagos Depot: Ikoyi)",
        region: "South West",
        location: "Main Radiology Wing, Suite A",
        ipAddress: "192.168.1.100",
        macAddress: "00:1A:2B:3C:4D:5E",
        aeTitle: "MODALITY_PACS",
        portNumber: 104,
        subnetMask: "255.255.255.0",
        itNote: "",
        networkDiagrams: [],
        ownershipType: "Purchased / Owned",
        financialNote: "",
        contractStatus: "Out of Contract",
      });
      setSelectedSupplier(defaultSupplier || null);
      setJobs([]);
    }
  }, [asset, mode, isOpen]);

  // Supplier selection handler (auto-populates supplier card instead of form inputs)
  const handleSupplierChange = (supplierName: string) => {
    const found = suppliers.find((s) => s.supplier === supplierName);
    if (found) {
      setSelectedSupplier(found);
      setFormData((prev) => ({
        ...prev,
        supplier: found.supplier,
        supplierCode: found.supplierCode,
        supplierContact: found.supplierContact,
        email: found.email,
        phoneNumber: found.phoneNumber,
        address: found.address,
      }));
    } else {
      setFormData((prev) => ({ ...prev, supplier: supplierName }));
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleAddJobSubmit = () => {
    if (!asset) return;
    const createdJob = assetService.createJob({
      ...newJob,
      assetId: asset.id,
      equipmentNumber: asset.equipmentNumber,
      contractId: asset.contractId,
    });
    setJobs([createdJob, ...jobs]);
    setIsAddingJob(false);
  };

  const handleAddDiagramSubmit = () => {
    if (!diagramFileName) return;
    const newDiagram: AssetNetworkDiagram = {
      id: `diag_${Date.now()}`,
      fileName: diagramFileName,
      uploadDate: new Date().toISOString().split("T")[0],
      comment: diagramComment || "Network schematic",
      size: "1.2 MB",
    };
    const updatedDiagrams = [...(formData.networkDiagrams || []), newDiagram];
    setFormData((prev) => ({ ...prev, networkDiagrams: updatedDiagrams }));
    setDiagramFileName("");
    setDiagramComment("");
    setIsAddingDiagram(false);
  };

  const isReadOnly = mode === "view";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        {/* Header - Compact System Design */}
        <DialogHeader className="p-3.5 sm:p-4 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Stethoscope className="size-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                    {mode === "create"
                      ? "Add Equipment"
                      : `${formData.equipmentNumber || "Asset Details"} — ${formData.oem || ""} ${formData.model || ""}`}
                  </DialogTitle>
                  {formData.equipmentStatus && (
                    <EquipmentStatusBadge status={formData.equipmentStatus} />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {mode === "create"
                    ? "Register new biomedical device into equipment catalog"
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
        </DialogHeader>

        {/* Modal Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-4 pt-2.5 bg-card border-b border-border">
            <TabsList className="grid grid-cols-4 w-full sm:w-auto sm:inline-flex h-8 bg-muted p-0.5">
              <TabsTrigger value="general" className="text-xs gap-1 py-1">
                <Stethoscope className="size-3" /> General
              </TabsTrigger>
              <TabsTrigger value="data" className="text-xs gap-1 py-1">
                <Network className="size-3" /> Data & IT
              </TabsTrigger>
              <TabsTrigger value="service" className="text-xs gap-1 py-1">
                <Wrench className="size-3" /> Equipment Service
              </TabsTrigger>
              <TabsTrigger value="financial" className="text-xs gap-1 py-1">
                <DollarSign className="size-3" /> Financial
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
            {/* ========================================================= */}
            {/* TAB 1: GENERAL (4 Cards Structure) */}
            {/* ========================================================= */}
            <TabsContent value="general" className="m-0 space-y-3.5">
              {/* Card 1: Equipment Identification */}
              <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-2xs space-y-2.5">
                <div className="border-b border-border/60 pb-1.5 flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <span className="flex size-4 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 items-center justify-center text-[9px] font-bold">
                      1
                    </span>
                    Equipment Identification
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Equipment # *
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.equipmentNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, equipmentNumber: e.target.value })
                      }
                      className="mt-1 h-7 text-xs font-mono"
                      placeholder="e.g. EQ-2026-001"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Serial Number *
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.serialNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, serialNumber: e.target.value })
                      }
                      className="mt-1 h-7 text-xs font-mono"
                      placeholder="e.g. SN-982104"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      OEM / Manufacturer *
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.oem || ""}
                      onChange={(e) => setFormData({ ...formData, oem: e.target.value })}
                      className="mt-1 h-7 text-xs"
                      placeholder="e.g. GE Healthcare, Siemens"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Modality *
                    </Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.modality || "CT Scanner"}
                      onValueChange={(val) => setFormData({ ...formData, modality: val })}
                    >
                      <SelectTrigger className="mt-1 h-7 text-xs">
                        <SelectValue placeholder="Select Modality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CT Scanner">CT Scanner</SelectItem>
                        <SelectItem value="MRI Scanner">MRI Scanner</SelectItem>
                        <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                        <SelectItem value="X-Ray / Fluoroscopy">X-Ray / Fluoroscopy</SelectItem>
                        <SelectItem value="Mammography">Mammography</SelectItem>
                        <SelectItem value="Anesthesia Machine">Anesthesia Machine</SelectItem>
                        <SelectItem value="Patient Monitor">Patient Monitor</SelectItem>
                        <SelectItem value="Linear Accelerator (LINAC)">Linear Accelerator (LINAC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Model *
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.model || ""}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="mt-1 h-7 text-xs"
                      placeholder="e.g. Revolution Apex 512"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Asset Type
                    </Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.assetType || "Fixed Asset"}
                      onValueChange={(val) => setFormData({ ...formData, assetType: val })}
                    >
                      <SelectTrigger className="mt-1 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fixed Asset">Fixed Asset</SelectItem>
                        <SelectItem value="Mobile / Portable">Mobile / Portable</SelectItem>
                        <SelectItem value="Transportable">Transportable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Card 2: Status & Lifecycle */}
              <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-2xs space-y-2.5">
                <div className="border-b border-border/60 pb-1.5 flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <span className="flex size-4 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 items-center justify-center text-[9px] font-bold">
                      2
                    </span>
                    Status & Lifecycle
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Equipment Status *
                    </Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.equipmentStatus || "Up"}
                      onValueChange={(val: EquipmentStatus) =>
                        setFormData({ ...formData, equipmentStatus: val })
                      }
                    >
                      <SelectTrigger className="mt-1 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Up">Up (Operational)</SelectItem>
                        <SelectItem value="Partially Up">Partially Up (Degraded)</SelectItem>
                        <SelectItem value="Down">Down (Inoperable)</SelectItem>
                        <SelectItem value="Unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Installation Date * (Manual)
                    </Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.installationDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, installationDate: e.target.value })
                      }
                      className="mt-1 h-7 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Warranty Status *
                    </Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.warrantyStatus || "Warranty"}
                      onValueChange={(val: WarrantyStatus) =>
                        setFormData({ ...formData, warrantyStatus: val })
                      }
                    >
                      <SelectTrigger className="mt-1 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Warranty">In Warranty</SelectItem>
                        <SelectItem value="Out of Warranty">Out of Warranty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Warranty Start Date (Manual)
                    </Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.warrantyStartDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, warrantyStartDate: e.target.value })
                      }
                      className="mt-1 h-7 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Warranty End Date (Manual)
                    </Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.warrantyEndDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, warrantyEndDate: e.target.value })
                      }
                      className="mt-1 h-7 text-xs"
                    />
                  </div>

                  {/* Read-only Contract Reference */}
                  <div className="sm:col-span-3 rounded-lg border border-border/60 bg-muted/30 p-2.5 mt-0.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-foreground">
                        Service Contract Reference (Read-Only)
                      </span>
                      <ContractStatusBadge status={formData.contractStatus || "Out of Contract"} />
                    </div>
                    {formData.contractNumber ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-muted-foreground">
                        <div>
                          Contract #: <span className="font-mono font-semibold text-foreground">{formData.contractNumber}</span>
                        </div>
                        <div>
                          Type: <span className="font-semibold text-foreground">{formData.contractType}</span>
                        </div>
                        <div>
                          PO #: <span className="font-mono text-foreground">{formData.contractPoNumber || "N/A"}</span>
                        </div>
                        <div>
                          Period: {formData.contractStartDate} to {formData.contractEndDate}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        Equipment is currently not covered under an active service contract.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: Service & Software */}
              <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-2xs space-y-2.5">
                <div className="border-b border-border/60 pb-1.5 flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <span className="flex size-4 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 items-center justify-center text-[9px] font-bold">
                      3
                    </span>
                    Service & Software
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      PPM Schedule
                    </Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.ppmSchedule || "Quarterly (every 90 days)"}
                      onValueChange={(val) => setFormData({ ...formData, ppmSchedule: val })}
                    >
                      <SelectTrigger className="mt-1 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly (every 90 days)">Quarterly (every 90 days)</SelectItem>
                        <SelectItem value="Bi-Annual (every 180 days)">Bi-Annual (every 180 days)</SelectItem>
                        <SelectItem value="Annual (every 365 days)">Annual (every 365 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Next PPM Date (Manual)
                    </Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.nextPpmDate || ""}
                      onChange={(e) => setFormData({ ...formData, nextPpmDate: e.target.value })}
                      className="mt-1 h-7 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Software (SW) Version
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.swVersion || ""}
                      onChange={(e) => setFormData({ ...formData, swVersion: e.target.value })}
                      className="mt-1 h-7 text-xs font-mono"
                      placeholder="e.g. v24.2 SP1"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      DICOM (DIC) Version
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.dicVersion || ""}
                      onChange={(e) => setFormData({ ...formData, dicVersion: e.target.value })}
                      className="mt-1 h-7 text-xs font-mono"
                      placeholder="e.g. DICOM 3.0 Standard"
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Supplier & Location with Auto-Populating Supplier Card (Replaced Form Inputs per user request) */}
              <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-2xs space-y-2.5">
                <div className="border-b border-border/60 pb-1.5 flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <span className="flex size-4 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 items-center justify-center text-[9px] font-bold">
                      4
                    </span>
                    Supplier & Facility Location
                  </h4>
                  <span className="text-[10px] text-primary">
                    Auto-populates supplier details card
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {/* Supplier Selector */}
                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Select Supplier / Vendor *
                    </Label>
                    {!isReadOnly ? (
                      <Select
                        value={formData.supplier || ""}
                        onValueChange={handleSupplierChange}
                      >
                        <SelectTrigger className="mt-1 h-7 text-xs">
                          <SelectValue placeholder="Select supplier..." />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.supplier}>
                              {s.supplier} ({s.supplierCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        disabled
                        value={formData.supplier || ""}
                        className="mt-1 h-7 text-xs font-medium"
                      />
                    )}
                  </div>

                  {/* Physical Location in Hospital */}
                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Hospital Facility / Room Location *
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.location || ""}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="mt-1 h-7 text-xs"
                      placeholder="e.g. Radiology Suite A, Room 102"
                    />
                  </div>
                </div>

                {/* Auto-Populated Supplier Information Card (instead of form inputs) */}
                <div className="rounded-lg border border-border/80 bg-muted/30 p-3 mt-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="size-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground">
                        {selectedSupplier?.supplier || formData.supplier || "Supplier Details"}
                      </span>
                    </div>
                    {selectedSupplier?.supplierCode && (
                      <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5">
                        {selectedSupplier.supplierCode}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                    <div className="flex items-start gap-1.5">
                      <Phone className="size-3 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Phone</span>
                        <span className="font-mono text-foreground">{selectedSupplier?.phoneNumber || formData.phoneNumber || "+234 1 277 8000"}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <Mail className="size-3 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Email</span>
                        <span className="text-foreground">{selectedSupplier?.email || formData.email || "support@biomed.com"}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <MapPin className="size-3 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Address / Region</span>
                        <span className="text-foreground line-clamp-1">{selectedSupplier?.address || formData.address || "Lagos Depot, Nigeria"}</span>
                      </div>
                    </div>
                  </div>

                  {selectedSupplier?.supportTier && (
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-0.5 font-medium">
                      <ShieldCheck className="size-3" />
                      <span>{selectedSupplier.supportTier}</span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ========================================================= */}
            {/* TAB 2: DATA & IT */}
            {/* ========================================================= */}
            <TabsContent value="data" className="m-0 space-y-3.5">
              <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-2xs space-y-2.5">
                <div className="border-b border-border/60 pb-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                    Network & PACS Connectivity
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">IP Address</Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.ipAddress || ""}
                      onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                      className="mt-1 h-7 text-xs font-mono"
                      placeholder="192.168.1.100"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">MAC Address</Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.macAddress || ""}
                      onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                      className="mt-1 h-7 text-xs font-mono"
                      placeholder="00:1A:2B:3C:4D:5E"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">Subnet Mask</Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.subnetMask || ""}
                      onChange={(e) => setFormData({ ...formData, subnetMask: e.target.value })}
                      className="mt-1 h-7 text-xs font-mono"
                      placeholder="255.255.255.0"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">Application Entity (AE) Title</Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.aeTitle || ""}
                      onChange={(e) => setFormData({ ...formData, aeTitle: e.target.value })}
                      className="mt-1 h-7 text-xs font-mono"
                      placeholder="e.g. GE_REVOLUTION_CT"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">DICOM Port Number</Label>
                    <Input
                      type="number"
                      disabled={isReadOnly}
                      value={formData.portNumber || 104}
                      onChange={(e) =>
                        setFormData({ ...formData, portNumber: parseInt(e.target.value) || 104 })
                      }
                      className="mt-1 h-7 text-xs font-mono"
                      placeholder="104"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] font-medium text-muted-foreground">IT & Integration Notes</Label>
                  <Textarea
                    disabled={isReadOnly}
                    rows={2}
                    value={formData.itNote || ""}
                    onChange={(e) => setFormData({ ...formData, itNote: e.target.value })}
                    className="mt-1 text-xs"
                    placeholder="VLAN assignments, PACS routing destinations, firewall ports..."
                  />
                </div>
              </div>

              {/* Schematics Section */}
              <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                      Network Diagrams & Topology Attachments
                    </h4>
                  </div>
                  {!isReadOnly && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAddingDiagram(true)}
                      className="text-xs h-6 gap-1"
                    >
                      <Upload className="size-3" /> Attach Schematic
                    </Button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {(formData.networkDiagrams || []).length === 0 ? (
                    <div className="py-4 text-center text-muted-foreground text-xs">
                      No network schematics uploaded for this equipment.
                    </div>
                  ) : (
                    formData.networkDiagrams?.map((diagram) => (
                      <div
                        key={diagram.id}
                        className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/20 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="size-3.5 text-blue-500" />
                          <div>
                            <div className="font-semibold text-foreground text-xs">
                              {diagram.fileName}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {diagram.comment} • {diagram.uploadDate}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6 text-primary hover:underline"
                          onClick={() => alert(`Downloading ${diagram.fileName}...`)}
                        >
                          Download
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {isAddingDiagram && (
                  <div className="p-2.5 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
                    <div className="font-semibold text-xs text-primary flex items-center gap-1">
                      <FileUp className="size-3" /> Attach Schematic File
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <Label className="text-[10px]">File Name</Label>
                        <Input
                          placeholder="e.g. topology_schematic_v2.pdf"
                          value={diagramFileName}
                          onChange={(e) => setDiagramFileName(e.target.value)}
                          className="h-7 text-xs mt-0.5"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Comment</Label>
                        <Input
                          placeholder="e.g. PACS LAN topology switch 4"
                          value={diagramComment}
                          onChange={(e) => setDiagramComment(e.target.value)}
                          className="h-7 text-xs mt-0.5"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsAddingDiagram(false)}
                        className="text-xs h-6"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddDiagramSubmit}
                        className="text-xs h-6 bg-primary text-primary-foreground"
                      >
                        Save Attachment
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ========================================================= */}
            {/* TAB 3: EQUIPMENT SERVICE */}
            {/* ========================================================= */}
            <TabsContent value="service" className="m-0 space-y-3.5">
              <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                      Service & Maintenance History
                    </h4>
                  </div>
                  {asset && (
                    <Button
                      size="sm"
                      onClick={() => setIsAddingJob(true)}
                      className="text-xs h-7 gap-1 bg-primary text-primary-foreground font-semibold"
                    >
                      <Plus className="size-3" /> Log Service Job
                    </Button>
                  )}
                </div>

                {isAddingJob && (
                  <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                        <Wrench className="size-3" /> Log Service Job ({newJob.jobNumber})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px]">Job Type</Label>
                        <Select
                          value={newJob.jobType}
                          onValueChange={(val) => setNewJob({ ...newJob, jobType: val })}
                        >
                          <SelectTrigger className="mt-0.5 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Planned Preventive Maintenance (PPM)">
                              Planned Preventive Maintenance (PPM)
                            </SelectItem>
                            <SelectItem value="Corrective Repair / Breakdown">
                              Corrective Repair / Breakdown
                            </SelectItem>
                            <SelectItem value="Calibration & Safety Test">
                              Calibration & Safety Test
                            </SelectItem>
                            <SelectItem value="Software Upgrade">Software Upgrade</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-[10px]">Status</Label>
                        <Select
                          value={newJob.jobStatus}
                          onValueChange={(val: any) => setNewJob({ ...newJob, jobStatus: val })}
                        >
                          <SelectTrigger className="mt-0.5 h-7 text-xs">
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

                      <div>
                        <Label className="text-[10px]">Technician</Label>
                        <Input
                          value={newJob.technician}
                          onChange={(e) => setNewJob({ ...newJob, technician: e.target.value })}
                          className="mt-0.5 h-7 text-xs"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px]">Start Date</Label>
                        <Input
                          type="date"
                          value={newJob.startDate}
                          onChange={(e) => setNewJob({ ...newJob, startDate: e.target.value })}
                          className="mt-0.5 h-7 text-xs"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px]">End Date</Label>
                        <Input
                          type="date"
                          value={newJob.endDate}
                          onChange={(e) => setNewJob({ ...newJob, endDate: e.target.value })}
                          className="mt-0.5 h-7 text-xs"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px]">Cost (₦)</Label>
                        <Input
                          type="number"
                          value={newJob.costOfService}
                          onChange={(e) =>
                            setNewJob({ ...newJob, costOfService: parseFloat(e.target.value) || 0 })
                          }
                          className="mt-0.5 h-7 text-xs font-mono"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <Label className="text-[10px]">Notes</Label>
                        <Input
                          value={newJob.notes}
                          onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                          placeholder="Action taken, replaced parts..."
                          className="mt-0.5 h-7 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsAddingJob(false)}
                        className="text-xs h-6"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddJobSubmit}
                        className="text-xs h-6 bg-primary text-primary-foreground"
                      >
                        Save Job
                      </Button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground text-[10px]">
                        <th className="py-2 px-2.5">Job #</th>
                        <th className="py-2 px-2.5">Type</th>
                        <th className="py-2 px-2.5">Status</th>
                        <th className="py-2 px-2.5">Dates</th>
                        <th className="py-2 px-2.5">Technician</th>
                        <th className="py-2 px-2.5 text-right">Cost (₦)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {jobs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-muted-foreground text-xs">
                            No service jobs logged for this equipment.
                          </td>
                        </tr>
                      ) : (
                        jobs.map((job) => (
                          <tr key={job.id} className="hover:bg-muted/30">
                            <td className="py-2 px-2.5 font-mono font-semibold text-foreground whitespace-nowrap">
                              {job.jobNumber}
                            </td>
                            <td className="py-2 px-2.5 text-muted-foreground">{job.jobType}</td>
                            <td className="py-2 px-2.5 whitespace-nowrap">
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
                            <td className="py-2 px-2.5 text-[10px] text-muted-foreground whitespace-nowrap">
                              {job.startDate} to {job.endDate}
                            </td>
                            <td className="py-2 px-2.5 text-muted-foreground whitespace-nowrap">
                              {job.technician}
                            </td>
                            <td className="py-2 px-2.5 font-mono text-foreground text-right whitespace-nowrap">
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

            {/* ========================================================= */}
            {/* TAB 4: FINANCIAL */}
            {/* ========================================================= */}
            <TabsContent value="financial" className="m-0 space-y-3.5">
              <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 shadow-2xs space-y-2.5">
                <div className="border-b border-border/60 pb-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                    Ownership & Commercial Arrangement
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Ownership Type *
                    </Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.ownershipType || "Purchased / Owned"}
                      onValueChange={(val: OwnershipType) =>
                        setFormData({ ...formData, ownershipType: val })
                      }
                    >
                      <SelectTrigger className="mt-1 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Purchased / Owned">Purchased / Owned</SelectItem>
                        <SelectItem value="Leased">Leased</SelectItem>
                        <SelectItem value="Donated">Donated</SelectItem>
                        <SelectItem value="Rented">Rented</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Contract Value (Read-Only)
                    </Label>
                    <Input
                      disabled
                      value={
                        formData.contractValue
                          ? `₦${formData.contractValue.toLocaleString("en-US")}`
                          : "No active contract"
                      }
                      className="mt-1 h-7 text-xs font-mono bg-muted/40"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Financial / Depreciation Notes
                    </Label>
                    <Textarea
                      disabled={isReadOnly}
                      rows={2}
                      value={formData.financialNote || ""}
                      onChange={(e) => setFormData({ ...formData, financialNote: e.target.value })}
                      placeholder="Asset tag number, capital expenditure funding source..."
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <DialogFooter className="p-2.5 sm:p-3 border-t border-border bg-card flex items-center justify-between sm:justify-between flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-7">
            {mode === "view" ? "Close" : "Cancel"}
          </Button>

          {mode !== "view" && (
            <Button
              size="sm"
              onClick={handleSave}
              className="text-xs h-7 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {mode === "create" ? "Save Equipment" : "Save Changes"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
