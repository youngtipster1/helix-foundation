import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { personnelService } from "@/modules/settings/services/personnel-service";
import { assetService } from "@/modules/assets/services/asset-service";
import { debriefService } from "../services/debrief-service";
import type { DebriefJob, EquipmentStatus, JobPriority, CreateJobInput } from "../types";
import type { Personnel } from "@/modules/settings/types";
import type { Asset } from "@/modules/assets/types";
import { toast } from "sonner";
import {
  Stethoscope,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated?: (job: DebriefJob) => void;
  onJobUpdated?: (job: DebriefJob) => void;
  jobToEdit?: DebriefJob | null;
}

const JOB_TYPES = [
  "Corrective Maintenance",
  "Preventive Maintenance",
  "Installation",
  "Calibration",
  "Inspection",
  "Emergency Breakdown",
  "Decommissioning",
];

const EQUIPMENT_STATUSES: EquipmentStatus[] = ["UP", "Partially UP", "Down"];
const JOB_PRIORITIES: JobPriority[] = ["High", "Mid", "Low"];

export function CreateJobModal({
  open,
  onOpenChange,
  onJobCreated,
  onJobUpdated,
  jobToEdit,
}: CreateJobModalProps) {
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [assetSearchOpen, setAssetSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Equipment Attributes
  const [assetNumber, setAssetNumber] = useState("");
  const [modality, setModality] = useState("");
  const [oem, setOem] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [warrantyStartDate, setWarrantyStartDate] = useState("");
  const [warrantyEndDate, setWarrantyEndDate] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [yearOfManufacture, setYearOfManufacture] = useState("");
  const [equipmentStatus, setEquipmentStatus] = useState<EquipmentStatus>("UP");
  const [contractType, setContractType] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");

  // Job Details Fields
  const [jobType, setJobType] = useState("Corrective Maintenance");
  const [jobOpenDate, setJobOpenDate] = useState("");
  const [assignedDate, setAssignedDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [jobPriority, setJobPriority] = useState<JobPriority>("High");
  const [jobEquipmentStatus, setJobEquipmentStatus] = useState<EquipmentStatus>("Down");
  const [assignedToId, setAssignedToId] = useState("");
  const [assistantEngineerId, setAssistantEngineerId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [reportedIssue, setReportedIssue] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(jobToEdit);

  useEffect(() => {
    if (open) {
      setErrors({});

      try {
        const assets = typeof assetService.getAssets === "function" ? assetService.getAssets() : [];
        setAllAssets(assets);
      } catch (err) {
        console.error("Error loading assets", err);
      }

      personnelService
        .list()
        .then((personnel) => {
          setPersonnelList(personnel.filter((p) => p.status === "active"));
        })
        .catch((err) => console.error("Error loading personnel", err));

      if (jobToEdit) {
        setAssetNumber(jobToEdit.assetNumber || "");
        setModality(jobToEdit.modality || "");
        setOem(jobToEdit.oem || "");
        setLocation(jobToEdit.location || "");
        setAddress(jobToEdit.address || "");
        setWarrantyStartDate(jobToEdit.warrantyStartDate || "");
        setWarrantyEndDate(jobToEdit.warrantyEndDate || "");
        setModel(jobToEdit.model || "");
        setSerialNumber(jobToEdit.serialNumber || "");
        setYearOfManufacture(jobToEdit.yearOfManufacture || "");
        setEquipmentStatus(jobToEdit.equipmentStatus || "UP");
        setContractType(jobToEdit.contractType || "COMPREHENSIVE");
        setContractEndDate(jobToEdit.contractEndDate || "");
        setJobType(jobToEdit.jobType || "Corrective Maintenance");
        setJobOpenDate(jobToEdit.jobOpenDate || "");
        setAssignedDate(jobToEdit.jobStartDate || jobToEdit.startDate || "");
        setEndDate(jobToEdit.endDate && jobToEdit.endDate !== "—" ? jobToEdit.endDate : "");
        setJobPriority(jobToEdit.jobPriority || "Mid");
        setJobEquipmentStatus(jobToEdit.equipmentStatus || "Down");
        setAssignedToId(jobToEdit.assignedToId || "");
        setAssistantEngineerId(jobToEdit.assistedByIds?.[0] || "");
        setContactName(jobToEdit.contactName || "");
        setContactEmail(jobToEdit.contactEmail || "");
        setReportedIssue(jobToEdit.reportedIssue || "");

        // Synthesize or match selected asset
        setSelectedAsset({
          id: `asset_${jobToEdit.assetNumber}`,
          equipmentNumber: jobToEdit.assetNumber,
          model: jobToEdit.model,
          oem: jobToEdit.oem,
          modality: jobToEdit.modality,
          serialNumber: jobToEdit.serialNumber,
          location: jobToEdit.location,
          address: jobToEdit.address,
          warrantyStartDate: jobToEdit.warrantyStartDate,
          warrantyEndDate: jobToEdit.warrantyEndDate,
          equipmentStatus: jobToEdit.equipmentStatus === "Partially UP" ? "Partially Up" : jobToEdit.equipmentStatus === "Down" ? "Down" : "Up",
          contractType: jobToEdit.contractType,
          contractEndDate: jobToEdit.contractEndDate,
          customerContact: jobToEdit.contactName,
          email: jobToEdit.contactEmail,
        } as Asset);
      } else {
        setSelectedAsset(null);
        setAssetNumber("");
        setModality("");
        setOem("");
        setLocation("");
        setAddress("");
        setWarrantyStartDate("");
        setWarrantyEndDate("");
        setModel("");
        setSerialNumber("");
        setYearOfManufacture("");
        setEquipmentStatus("UP");
        setContractType("");
        setContractEndDate("");
        setJobType("Corrective Maintenance");
        setJobPriority("High");
        setJobEquipmentStatus("Down");
        setAssignedToId("");
        setAssistantEngineerId("");
        setContactName("");
        setContactEmail("");
        setReportedIssue("");

        const todayStr = new Date().toISOString().split("T")[0];
        setJobOpenDate(todayStr);
        setAssignedDate(todayStr);
        setEndDate("");
      }
    }
  }, [open, jobToEdit]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setAssetSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const matchingAssets = useMemo(() => {
    if (!assetNumber.trim()) return [];
    const q = assetNumber.toLowerCase().trim();
    return allAssets
      .filter(
        (a) =>
          a.equipmentNumber.toLowerCase().includes(q) ||
          a.model.toLowerCase().includes(q) ||
          a.oem.toLowerCase().includes(q) ||
          a.serialNumber.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [assetNumber, allAssets]);

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setAssetNumber(asset.equipmentNumber);
    setModality(asset.modality || "—");
    setOem(asset.oem || "—");
    setLocation(asset.location || "—");
    setAddress(asset.address || "—");
    setWarrantyStartDate(asset.warrantyStartDate || "—");
    setWarrantyEndDate(asset.warrantyEndDate || "—");
    setModel(asset.model || "—");
    setSerialNumber(asset.serialNumber || "—");
    setYearOfManufacture(
      asset.installationDate ? asset.installationDate.slice(0, 4) : "2023"
    );

    const rawStatus = (asset.equipmentStatus || "Up").toUpperCase();
    if (rawStatus.includes("PARTIAL")) {
      setEquipmentStatus("Partially UP");
      setJobEquipmentStatus("Partially UP");
    } else if (rawStatus.includes("DOWN")) {
      setEquipmentStatus("Down");
      setJobEquipmentStatus("Down");
    } else {
      setEquipmentStatus("UP");
      setJobEquipmentStatus("UP");
    }

    setContractType(asset.contractType || "COMPREHENSIVE");
    setContractEndDate(asset.contractEndDate || "—");
    if (asset.customerContact) setContactName(asset.customerContact);
    if (asset.email) setContactEmail(asset.email);

    setAssetSearchOpen(false);
    toast.info(`Equipment ${asset.equipmentNumber} selected.`);
  };

  const handleClearSelectedAsset = () => {
    setSelectedAsset(null);
    setAssetNumber("");
    setModality("");
    setOem("");
    setLocation("");
    setAddress("");
    setWarrantyStartDate("");
    setWarrantyEndDate("");
    setModel("");
    setSerialNumber("");
    setYearOfManufacture("");
    setEquipmentStatus("UP");
    setContractType("");
    setContractEndDate("");
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!assetNumber.trim() || (!selectedAsset && !jobToEdit)) {
      errs.assetNumber = "Please select equipment from the asset registry.";
    }

    if (!jobType.trim()) errs.jobType = "Job Type is required.";
    if (!assignedToId) errs.assignedToId = "Primary engineer is required.";
    if (!jobPriority) errs.jobPriority = "Job Priority is required.";
    if (!assignedDate.trim()) errs.assignedDate = "Assigned Date is required.";
    if (!reportedIssue.trim()) errs.reportedIssue = "Reported issue is required.";

    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      errs.contactEmail = "Please enter a valid email address.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in the required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const primaryEngineer = personnelList.find((p) => p.id === assignedToId);
      const assistantEngineer = assistantEngineerId && assistantEngineerId !== "none"
        ? personnelList.find((p) => p.id === assistantEngineerId)
        : null;

      const primaryName = primaryEngineer
        ? `${primaryEngineer.firstName} ${primaryEngineer.lastName}`
        : jobToEdit?.assignedToName || "Unassigned";

      const assistantNames = assistantEngineer
        ? [`${assistantEngineer.firstName} ${assistantEngineer.lastName}`]
        : [];

      if (isEditing && jobToEdit) {
        const updates: Partial<DebriefJob> = {
          assetNumber,
          modality: modality || "General",
          oem: oem || "General",
          location: location || "Facility",
          address: address || "Hospital",
          warrantyStartDate: warrantyStartDate || "—",
          warrantyEndDate: warrantyEndDate || "—",
          model: model || "Medical Equipment",
          serialNumber: serialNumber || "SN-UNKNOWN",
          yearOfManufacture: yearOfManufacture || "2023",
          equipmentStatus,
          contractType: contractType || "COMPREHENSIVE",
          contractEndDate: contractEndDate || "—",
          jobType,
          jobOpenDate: jobOpenDate || jobToEdit.jobOpenDate,
          contactName: contactName || "Hospital Contact",
          contactEmail: contactEmail || "contact@hospital.gov.ng",
          assignedToId,
          assignedToName: primaryName,
          assistedByIds: assistantEngineer ? [assistantEngineer.id] : [],
          assistedByNames: assistantNames,
          assistedBy: assistantNames.length > 0 ? assistantNames.join(", ") : "—",
          jobPriority,
          jobStartDate: assignedDate,
          startDate: assignedDate,
          endDate: endDate || "—",
          reportedIssue,
        };

        const updatedJob = await debriefService.update(jobToEdit.id, updates);
        if (updatedJob) {
          toast.success(`Job ${updatedJob.jobNumber} updated!`);
          onJobUpdated?.(updatedJob);
          onOpenChange(false);
        } else {
          toast.error("Failed to update job.");
        }
      } else {
        const payload: CreateJobInput = {
          assetNumber,
          modality: modality || "General",
          oem: oem || "General",
          location: location || "Facility",
          address: address || "Hospital",
          warrantyStartDate: warrantyStartDate || "—",
          warrantyEndDate: warrantyEndDate || "—",
          model: model || "Medical Equipment",
          serialNumber: serialNumber || "SN-UNKNOWN",
          yearOfManufacture: yearOfManufacture || "2023",
          equipmentStatus,
          contractType: contractType || "COMPREHENSIVE",
          contractEndDate: contractEndDate || "—",
          jobType,
          jobOpenDate: jobOpenDate || new Date().toISOString().split("T")[0],
          complaintDate: jobOpenDate || new Date().toISOString().split("T")[0],
          complaintTime: "09:00",
          contactName: contactName || "Hospital Contact",
          contactEmail: contactEmail || "contact@hospital.gov.ng",
          assignedToId,
          assignedToName: primaryName,
          assistedByIds: assistantEngineer ? [assistantEngineer.id] : [],
          assistedByNames: assistantNames,
          jobEquipmentStatus,
          jobPriority,
          jobStartDate: assignedDate,
          endDate: endDate || "—",
          reportedIssue,
        };

        const createdJob = await debriefService.create(payload);
        toast.success(`Job ${createdJob.jobNumber} created!`);
        onJobCreated?.(createdJob);
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Failed to save job", err);
      toast.error("An error occurred while saving the job.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border bg-card">
          <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
            {isEditing && jobToEdit ? `Edit Service Job — ${jobToEdit.jobNumber}` : "Create Service Job"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {isEditing
              ? "Update service job details, assignment, and equipment information."
              : "Select equipment to auto-populate specifications, then set service assignment."}
          </DialogDescription>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Card 1: Equipment Identification */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Stethoscope className="size-4 text-primary" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Equipment
                </span>
              </div>
              {selectedAsset && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="size-3.5" /> Auto-populated
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelectedAsset}
                    className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <RotateCcw className="size-3 mr-1" />
                    Change
                  </Button>
                </div>
              )}
            </div>

            {/* Asset Search */}
            <div className="relative" ref={searchContainerRef}>
              <Label htmlFor="assetNumber" className="text-xs font-bold text-foreground">
                Asset Number <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-1">
                <Input
                  id="assetNumber"
                  placeholder="Type asset number (e.g. EQ-US-004)..."
                  value={assetNumber}
                  onChange={(e) => {
                    setAssetNumber(e.target.value);
                    setAssetSearchOpen(true);
                  }}
                  onFocus={() => {
                    if (assetNumber.trim()) setAssetSearchOpen(true);
                  }}
                  className={cn(
                    "h-9 text-xs font-mono pr-8 bg-background",
                    errors.assetNumber && "border-destructive"
                  )}
                />
                <Search className="size-3.5 absolute right-2.5 top-3 text-muted-foreground pointer-events-none" />
              </div>

              {errors.assetNumber && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3" /> {errors.assetNumber}
                </p>
              )}

              {/* Dropdown */}
              {assetSearchOpen && matchingAssets.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-md border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                  {matchingAssets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => handleSelectAsset(asset)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors flex items-center justify-between border-b border-border/40 last:border-0 cursor-pointer"
                    >
                      <div>
                        <span className="font-mono font-bold text-primary">{asset.equipmentNumber}</span>
                        <span className="mx-2 text-muted-foreground">•</span>
                        <span className="font-medium text-foreground">{asset.model}</span>
                        <span className="text-xs text-muted-foreground block">
                          {asset.oem} ({asset.modality}) — {asset.location}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Asset Complete Spec Display */}
            {selectedAsset && (
              <div className="rounded-md border border-border bg-muted/20 p-3.5 text-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-primary">{assetNumber}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-semibold text-foreground">{model}</span>
                    <span className="text-muted-foreground">({oem})</span>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold",
                      equipmentStatus === "UP"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : equipmentStatus === "Partially UP"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    )}
                  >
                    Status: {equipmentStatus}
                  </span>
                </div>

                <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <dt className="text-muted-foreground font-medium">Modality</dt>
                    <dd className="font-semibold text-foreground mt-0.5">{modality || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">OEM</dt>
                    <dd className="font-semibold text-foreground mt-0.5">{oem || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Model</dt>
                    <dd className="font-semibold text-foreground mt-0.5">{model || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Serial Number</dt>
                    <dd className="font-mono font-semibold text-foreground mt-0.5">{serialNumber || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Location</dt>
                    <dd className="font-medium text-foreground mt-0.5">{location || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Address</dt>
                    <dd className="font-medium text-foreground mt-0.5">{address || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Year of Mfg</dt>
                    <dd className="font-medium text-foreground mt-0.5">{yearOfManufacture || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Equipment Status</dt>
                    <dd className="font-semibold text-foreground mt-0.5">{equipmentStatus || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Warranty Start Date</dt>
                    <dd className="font-mono text-foreground mt-0.5">{warrantyStartDate || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Warranty End Date</dt>
                    <dd className="font-mono text-foreground mt-0.5">{warrantyEndDate || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Contract Type</dt>
                    <dd className="font-medium text-foreground mt-0.5">{contractType || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Contract End Date</dt>
                    <dd className="font-mono text-foreground mt-0.5">{contractEndDate || "—"}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

          {/* Card 2: Service Assignment & Schedule */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <ClipboardList className="size-4 text-primary" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Service Assignment & Schedule
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Job Type */}
              <div className="space-y-1">
                <Label htmlFor="jobType" className="text-xs font-semibold">
                  Job Type <span className="text-destructive">*</span>
                </Label>
                <Select value={jobType} onValueChange={setJobType}>
                  <SelectTrigger id="jobType" className="h-9 text-xs">
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <Label htmlFor="jobPriority" className="text-xs font-semibold">
                  Job Priority <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={jobPriority}
                  onValueChange={(val) => setJobPriority(val as JobPriority)}
                >
                  <SelectTrigger id="jobPriority" className="h-9 text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p} className="text-xs">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned Date */}
              <div className="space-y-1">
                <Label htmlFor="assignedDate" className="text-xs font-semibold text-primary">
                  Assigned / Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="assignedDate"
                  type="date"
                  value={assignedDate}
                  onChange={(e) => setAssignedDate(e.target.value)}
                  className={cn("h-9 text-xs font-mono", errors.assignedDate && "border-destructive")}
                />
              </div>

              {/* Estimated End Date */}
              <div className="space-y-1">
                <Label htmlFor="endDate" className="text-xs font-semibold">
                  Estimated End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              {/* Primary Engineer Dropdown */}
              <div className="space-y-1">
                <Label htmlFor="assignedToId" className="text-xs font-semibold">
                  Primary Engineer <span className="text-destructive">*</span>
                </Label>
                <Select value={assignedToId} onValueChange={setAssignedToId}>
                  <SelectTrigger
                    id="assignedToId"
                    className={cn("h-9 text-xs", errors.assignedToId && "border-destructive")}
                  >
                    <SelectValue placeholder="Select Primary Engineer" />
                  </SelectTrigger>
                  <SelectContent>
                    {personnelList.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.firstName} {p.lastName} — {p.jobTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.assignedToId && (
                  <p className="text-xs text-destructive">{errors.assignedToId}</p>
                )}
              </div>

              {/* Assistant Engineer Dropdown */}
              <div className="space-y-1">
                <Label htmlFor="assistantEngineerId" className="text-xs font-semibold">
                  Assistant Engineer (Optional)
                </Label>
                <Select
                  value={assistantEngineerId}
                  onValueChange={setAssistantEngineerId}
                >
                  <SelectTrigger id="assistantEngineerId" className="h-9 text-xs">
                    <SelectValue placeholder="None (Single Engineer)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs text-muted-foreground">
                      None (Single Engineer)
                    </SelectItem>
                    {personnelList
                      .filter((p) => p.id !== assignedToId)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          {p.firstName} {p.lastName} — {p.jobTitle}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Site Contact Name */}
              <div className="space-y-1">
                <Label htmlFor="contactName" className="text-xs font-semibold">
                  Site Contact Name
                </Label>
                <Input
                  id="contactName"
                  placeholder="e.g. Dr. Alabi Kunle"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Site Contact Email */}
              <div className="space-y-1">
                <Label htmlFor="contactEmail" className="text-xs font-semibold">
                  Site Contact Email
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="e.g. contact@hospital.gov.ng"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className={cn("h-9 text-xs", errors.contactEmail && "border-destructive")}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Reported Issue */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2 shadow-2xs">
            <Label htmlFor="reportedIssue" className="text-xs font-bold text-foreground uppercase tracking-wider block">
              Reported Issue <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reportedIssue"
              rows={3}
              placeholder="Describe breakdown symptoms or maintenance request..."
              value={reportedIssue}
              onChange={(e) => setReportedIssue(e.target.value)}
              className={cn("text-xs leading-relaxed resize-none", errors.reportedIssue && "border-destructive")}
            />
            {errors.reportedIssue && (
              <p className="text-xs text-destructive">{errors.reportedIssue}</p>
            )}
          </div>

          {/* Footer Controls */}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="text-xs h-9 font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer shadow-sm px-5"
            >
              <CheckCircle2 className="size-4" />
              <span>
                {submitting
                  ? isEditing
                    ? "Saving Changes..."
                    : "Creating Job..."
                  : isEditing
                  ? "Save Changes"
                  : "Create Job"}
              </span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
