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
  Calendar,
  Building,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileUp,
} from "lucide-react";
import {
  Asset,
  AssetJob,
  AssetNetworkDiagram,
  EquipmentStatus,
  WarrantyStatus,
  OwnershipType,
} from "../types";
import { EquipmentStatusBadge, ContractStatusBadge, WarrantyStatusBadge } from "./status-badges";
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
    customer: "",
    region: "",
    location: "",
    customerContact: "",
    email: "",
    phoneNumber: "",
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

  // Customers for auto-fill
  const customers = assetService.getCustomers();

  useEffect(() => {
    if (asset && mode !== "create") {
      setFormData(asset);
      setJobs(assetService.getJobs(asset.id));
    } else if (mode === "create") {
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
        customer: customers[0]?.customer || "",
        region: customers[0]?.region || "",
        location: customers[0]?.location || "",
        customerContact: customers[0]?.customerContact || "",
        email: customers[0]?.email || "",
        phoneNumber: customers[0]?.phoneNumber || "",
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
      setJobs([]);
    }
  }, [asset, mode, isOpen]);

  // Customer selection auto-fill handler
  const handleCustomerChange = (customerName: string) => {
    const selected = customers.find((c) => c.customer === customerName);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        customer: selected.customer,
        region: selected.region,
        location: selected.location,
        customerContact: selected.customerContact,
        email: selected.email,
        phoneNumber: selected.phoneNumber,
      }));
    } else {
      setFormData((prev) => ({ ...prev, customer: customerName }));
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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Stethoscope className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                    {mode === "create"
                      ? "Add New Equipment"
                      : `${formData.equipmentNumber || "Asset Details"} - ${formData.oem || ""} ${formData.model || ""}`}
                  </DialogTitle>
                  {formData.equipmentStatus && (
                    <EquipmentStatusBadge status={formData.equipmentStatus} />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {mode === "create"
                    ? "Register new medical device and configure service specifications"
                    : `Serial: ${formData.serialNumber || "N/A"} | Modality: ${formData.modality || "General"}`}
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
          <div className="px-5 pt-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <TabsList className="grid grid-cols-4 w-full sm:w-auto sm:inline-flex h-9 bg-slate-100 dark:bg-slate-800 p-1">
              <TabsTrigger value="general" className="text-xs gap-1.5">
                <Stethoscope className="size-3.5" /> General
              </TabsTrigger>
              <TabsTrigger value="data" className="text-xs gap-1.5">
                <Network className="size-3.5" /> Data & IT
              </TabsTrigger>
              <TabsTrigger value="service" className="text-xs gap-1.5">
                <Wrench className="size-3.5" /> Equipment Service
              </TabsTrigger>
              <TabsTrigger value="financial" className="text-xs gap-1.5">
                <DollarSign className="size-3.5" /> Financial
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* ========================================================= */}
            {/* TAB 1: GENERAL (4 Cards Structure) */}
            {/* ========================================================= */}
            <TabsContent value="general" className="m-0 space-y-5">
              {/* Card 1: Equipment Identification */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="flex size-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 items-center justify-center text-[10px]">
                      1
                    </span>
                    Equipment Identification
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Equipment # *
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.equipmentNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, equipmentNumber: e.target.value })
                      }
                      className="mt-1 h-8 text-xs font-mono"
                      placeholder="e.g. EQ-2026-001"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Serial Number *
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.serialNumber || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, serialNumber: e.target.value })
                      }
                      className="mt-1 h-8 text-xs font-mono"
                      placeholder="e.g. SN-982104"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      OEM / Manufacturer *
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.oem || ""}
                      onChange={(e) => setFormData({ ...formData, oem: e.target.value })}
                      className="mt-1 h-8 text-xs"
                      placeholder="e.g. GE Healthcare, Siemens"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Modality *
                    </Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.modality || "CT Scanner"}
                      onValueChange={(val) => setFormData({ ...formData, modality: val })}
                    >
                      <SelectTrigger className="mt-1 h-8 text-xs">
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
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Model *
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.model || ""}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="mt-1 h-8 text-xs"
                      placeholder="e.g. Revolution Apex 512"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Asset Type
                    </Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.assetType || "Fixed Asset"}
                      onValueChange={(val) => setFormData({ ...formData, assetType: val })}
                    >
                      <SelectTrigger className="mt-1 h-8 text-xs">
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
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="flex size-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 items-center justify-center text-[10px]">
                      2
                    </span>
                    Status & Lifecycle
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Equipment Status *
                    </Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.equipmentStatus || "Up"}
                      onValueChange={(val: EquipmentStatus) =>
                        setFormData({ ...formData, equipmentStatus: val })
                      }
                    >
                      <SelectTrigger className="mt-1 h-8 text-xs">
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
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Installation Date * (Manual)
                    </Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.installationDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, installationDate: e.target.value })
                      }
                      className="mt-1 h-8 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Warranty Status *
                    </Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.warrantyStatus || "Warranty"}
                      onValueChange={(val: WarrantyStatus) =>
                        setFormData({ ...formData, warrantyStatus: val })
                      }
                    >
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Warranty">Warranty</SelectItem>
                        <SelectItem value="Out of Warranty">Out of Warranty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Warranty Start Date (Manual)
                    </Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.warrantyStartDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, warrantyStartDate: e.target.value })
                      }
                      className="mt-1 h-8 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Warranty End Date (Manual)
                    </Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.warrantyEndDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, warrantyEndDate: e.target.value })
                      }
                      className="mt-1 h-8 text-xs"
                    />
                  </div>

                  {/* Read-only Contract Reference */}
                  <div className="sm:col-span-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 mt-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Service Contract Coverage Reference (Read-Only)
                      </span>
                      <ContractStatusBadge status={formData.contractStatus || "Out of Contract"} />
                    </div>
                    {formData.contractNumber ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                        <div>
                          Contract #: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formData.contractNumber}</span>
                        </div>
                        <div>
                          Type: <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.contractType}</span>
                        </div>
                        <div>
                          PO #: <span className="font-mono text-slate-800 dark:text-slate-200">{formData.contractPoNumber || "N/A"}</span>
                        </div>
                        <div>
                          Period: {formData.contractStartDate} to {formData.contractEndDate}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        This equipment is not currently bound to an active Service Contract. To attach it, link this asset from the Service Contracts screen.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: Service & Software */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="flex size-5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 items-center justify-center text-[10px]">
                      3
                    </span>
                    Service & Software
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      PPM Schedule
                    </Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.ppmSchedule || "Quarterly (every 90 days)"}
                      onValueChange={(val) => setFormData({ ...formData, ppmSchedule: val })}
                    >
                      <SelectTrigger className="mt-1 h-8 text-xs">
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
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Next PPM Date (Manual)
                    </Label>
                    <Input
                      type="date"
                      disabled={isReadOnly}
                      value={formData.nextPpmDate || ""}
                      onChange={(e) => setFormData({ ...formData, nextPpmDate: e.target.value })}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Software (SW) Version
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.swVersion || ""}
                      onChange={(e) => setFormData({ ...formData, swVersion: e.target.value })}
                      className="mt-1 h-8 text-xs font-mono"
                      placeholder="e.g. v24.2 SP1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      DICOM (DIC) Version
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.dicVersion || ""}
                      onChange={(e) => setFormData({ ...formData, dicVersion: e.target.value })}
                      className="mt-1 h-8 text-xs font-mono"
                      placeholder="e.g. DICOM 3.0 Standard"
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Customer & Location with Auto-Fill */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="flex size-5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 items-center justify-center text-[10px]">
                      4
                    </span>
                    Customer & Location (Auto-Fill Supported)
                  </h4>
                  <span className="text-[11px] text-primary font-normal">
                    Select customer to auto-fill contact & facility details
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Customer / Hospital Organization *
                    </Label>
                    {!isReadOnly ? (
                      <Select
                        value={formData.customer || ""}
                        onValueChange={handleCustomerChange}
                      >
                        <SelectTrigger className="mt-1 h-8 text-xs">
                          <SelectValue placeholder="Select or type hospital name" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((c) => (
                            <SelectItem key={c.customer} value={c.customer}>
                              {c.customer} ({c.region})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        disabled
                        value={formData.customer || ""}
                        className="mt-1 h-8 text-xs"
                      />
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Region / State
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.region || ""}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="mt-1 h-8 text-xs"
                      placeholder="e.g. South West"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Specific Location / Department *
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.location || ""}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="mt-1 h-8 text-xs"
                      placeholder="e.g. Radiology Suite A, Ground Floor"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Contact Person
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.customerContact || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, customerContact: e.target.value })
                      }
                      className="mt-1 h-8 text-xs"
                      placeholder="e.g. Dr. Adeyemi Adeleke"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Contact Email
                    </Label>
                    <Input
                      type="email"
                      disabled={isReadOnly}
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 h-8 text-xs"
                      placeholder="e.g. radiology@hospital.ng"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Phone Number
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.phoneNumber || ""}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="mt-1 h-8 text-xs font-mono"
                      placeholder="e.g. +234 803 123 4567"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ========================================================= */}
            {/* TAB 2: DATA & IT (Network & PACS Details) */}
            {/* ========================================================= */}
            <TabsContent value="data" className="m-0 space-y-5">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Network & PACS Connectivity
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      IP Address
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.ipAddress || ""}
                      onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                      className="mt-1 h-8 text-xs font-mono"
                      placeholder="192.168.1.100"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      MAC Address
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.macAddress || ""}
                      onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                      className="mt-1 h-8 text-xs font-mono"
                      placeholder="00:1A:2B:3C:4D:5E"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Subnet Mask
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.subnetMask || ""}
                      onChange={(e) => setFormData({ ...formData, subnetMask: e.target.value })}
                      className="mt-1 h-8 text-xs font-mono"
                      placeholder="255.255.255.0"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Application Entity (AE) Title
                    </Label>
                    <Input
                      disabled={isReadOnly}
                      value={formData.aeTitle || ""}
                      onChange={(e) => setFormData({ ...formData, aeTitle: e.target.value })}
                      className="mt-1 h-8 text-xs font-mono"
                      placeholder="e.g. GE_REVOLUTION_CT"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      DICOM Port Number
                    </Label>
                    <Input
                      type="number"
                      disabled={isReadOnly}
                      value={formData.portNumber || 104}
                      onChange={(e) =>
                        setFormData({ ...formData, portNumber: parseInt(e.target.value) || 104 })
                      }
                      className="mt-1 h-8 text-xs font-mono"
                      placeholder="104"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    IT & Integration Notes
                  </Label>
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

              {/* Network Diagrams & Schematics Section */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Network Diagrams & Topology Attachments
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Architectural diagrams, wiring schematics, and port maps
                    </p>
                  </div>
                  {!isReadOnly && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAddingDiagram(true)}
                      className="text-xs h-7 gap-1"
                    >
                      <Upload className="size-3" /> Attach Schematic
                    </Button>
                  )}
                </div>

                {/* List of uploaded diagrams */}
                <div className="space-y-2">
                  {(formData.networkDiagrams || []).length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      No network schematics uploaded for this equipment yet.
                    </div>
                  ) : (
                    formData.networkDiagrams?.map((diagram) => (
                      <div
                        key={diagram.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="size-4 text-blue-500" />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {diagram.fileName}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {diagram.comment} • Uploaded: {diagram.uploadDate} ({diagram.size || "1.2 MB"})
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-primary hover:underline"
                          onClick={() => alert(`Downloading ${diagram.fileName}...`)}
                        >
                          Download
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Sub-form to attach a diagram */}
                {isAddingDiagram && (
                  <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-3 mt-2">
                    <div className="font-semibold text-xs text-primary flex items-center gap-1.5">
                      <FileUp className="size-3.5" /> Attach Network Schematic
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <Label className="text-[11px]">File Name</Label>
                        <Input
                          placeholder="e.g. topology_schematic_v2.pdf"
                          value={diagramFileName}
                          onChange={(e) => setDiagramFileName(e.target.value)}
                          className="h-7 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Description / Comment</Label>
                        <Input
                          placeholder="e.g. PACS LAN topology switch 4"
                          value={diagramComment}
                          onChange={(e) => setDiagramComment(e.target.value)}
                          className="h-7 text-xs mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsAddingDiagram(false)}
                        className="text-xs h-7"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddDiagramSubmit}
                        className="text-xs h-7 bg-primary text-white"
                      >
                        Save Attachment
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ========================================================= */}
            {/* TAB 3: EQUIPMENT SERVICE (Option A: Jobs Ledger) */}
            {/* ========================================================= */}
            <TabsContent value="service" className="m-0 space-y-5">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Maintenance & Service Job History
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Jobs natively belong to this asset and automatically reflect in any linked contract
                    </p>
                  </div>
                  {/* Both User and Admin can log a maintenance job */}
                  {asset && (
                    <Button
                      size="sm"
                      onClick={() => setIsAddingJob(true)}
                      className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-semibold"
                    >
                      <Plus className="size-3.5" /> Log Maintenance Job
                    </Button>
                  )}
                </div>

                {/* Sub-form to log a new job */}
                {isAddingJob && (
                  <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                        <Wrench className="size-3.5" /> Log New Service / Maintenance Job
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {newJob.jobNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <Label className="text-[11px]">Job Type</Label>
                        <Select
                          value={newJob.jobType}
                          onValueChange={(val) => setNewJob({ ...newJob, jobType: val })}
                        >
                          <SelectTrigger className="mt-1 h-8 text-xs">
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
                            <SelectItem value="Emergency Response">Emergency Response</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-[11px]">Job Status</Label>
                        <Select
                          value={newJob.jobStatus}
                          onValueChange={(val: any) => setNewJob({ ...newJob, jobStatus: val })}
                        >
                          <SelectTrigger className="mt-1 h-8 text-xs">
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
                        <Label className="text-[11px]">Technician / Assigned Engineer</Label>
                        <Input
                          value={newJob.technician}
                          onChange={(e) => setNewJob({ ...newJob, technician: e.target.value })}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>

                      <div>
                        <Label className="text-[11px]">Start Date (Manual)</Label>
                        <Input
                          type="date"
                          value={newJob.startDate}
                          onChange={(e) => setNewJob({ ...newJob, startDate: e.target.value })}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>

                      <div>
                        <Label className="text-[11px]">End Date (Manual)</Label>
                        <Input
                          type="date"
                          value={newJob.endDate}
                          onChange={(e) => setNewJob({ ...newJob, endDate: e.target.value })}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>

                      <div>
                        <Label className="text-[11px]">Cost of Service (₦)</Label>
                        <Input
                          type="number"
                          value={newJob.costOfService}
                          onChange={(e) =>
                            setNewJob({ ...newJob, costOfService: parseFloat(e.target.value) || 0 })
                          }
                          className="mt-1 h-8 text-xs font-mono"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <Label className="text-[11px]">Job Details & Corrective Action Notes</Label>
                        <Textarea
                          rows={2}
                          value={newJob.notes}
                          onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                          placeholder="Describe symptom, replaced parts, calibration test results..."
                          className="mt-1 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsAddingJob(false)}
                        className="text-xs h-7"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddJobSubmit}
                        className="text-xs h-7 bg-primary text-white"
                      >
                        Save Job Record
                      </Button>
                    </div>
                  </div>
                )}

                {/* Table of Jobs */}
                <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 text-[11px]">
                        <th className="py-2.5 px-3">Job #</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Dates</th>
                        <th className="py-2.5 px-3">Technician</th>
                        <th className="py-2.5 px-3 text-right">Cost (₦)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {jobs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            No service jobs recorded for this equipment yet.
                          </td>
                        </tr>
                      ) : (
                        jobs.map((job) => (
                          <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              {job.jobNumber}
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

            {/* ========================================================= */}
            {/* TAB 4: FINANCIAL (Ownership & Contract Reference) */}
            {/* ========================================================= */}
            <TabsContent value="financial" className="m-0 space-y-5">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Ownership & Commercial Arrangements
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Ownership Type *
                    </Label>
                    <Select
                      disabled={isReadOnly}
                      value={formData.ownershipType || "Purchased / Owned"}
                      onValueChange={(val: OwnershipType) =>
                        setFormData({ ...formData, ownershipType: val })
                      }
                    >
                      <SelectTrigger className="mt-1 h-8 text-xs">
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
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Contract Value (Read-Only)
                    </Label>
                    <Input
                      disabled
                      value={
                        formData.contractValue
                          ? `₦${formData.contractValue.toLocaleString("en-US")}`
                          : "No active contract"
                      }
                      className="mt-1 h-8 text-xs font-mono bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Financial / Depreciation Notes
                    </Label>
                    <Textarea
                      disabled={isReadOnly}
                      rows={3}
                      value={formData.financialNote || ""}
                      onChange={(e) => setFormData({ ...formData, financialNote: e.target.value })}
                      placeholder="Asset tag number, capital expenditure funding source, residual salvage value notes..."
                      className="mt-1 text-xs"
                    />
                  </div>
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
              {mode === "create" ? "Save Equipment" : "Save Changes"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
