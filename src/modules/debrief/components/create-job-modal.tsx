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
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated?: (job: DebriefJob) => void;
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
}: CreateJobModalProps) {
  // External data sources
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [assetSearchOpen, setAssetSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Left Card: Equipment Fields
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

  // Right Card: Job Details Fields
  const [jobType, setJobType] = useState("Corrective Maintenance");
  const [jobOpenDate, setJobOpenDate] = useState("");
  const [complaintDate, setComplaintDate] = useState("");
  const [complaintTime, setComplaintTime] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [assistedByIds, setAssistedByIds] = useState<string[]>([]);
  const [jobEquipmentStatus, setJobEquipmentStatus] = useState<EquipmentStatus>("Down");
  const [jobPriority, setJobPriority] = useState<JobPriority>("High");

  // Distinct separated dates
  const [assignedDate, setAssignedDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [reportedIssue, setReportedIssue] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Reset and load sources when opened
  useEffect(() => {
    if (open) {
      setErrors({});
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
      setAssignedToId("");
      setAssistedByIds([]);
      setReportedIssue("");

      const todayStr = new Date().toISOString().split("T")[0];
      const timeStr = new Date().toTimeString().slice(0, 5);

      setJobOpenDate(todayStr);
      setComplaintDate(todayStr);
      setComplaintTime(timeStr);
      setAssignedDate(todayStr);
      setEndDate("");

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
    }
  }, [open]);

  // Close asset search dropdown on outside click
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

  // Filter assets as user types in assetNumber
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
      .slice(0, 6);
  }, [assetNumber, allAssets]);

  // Handle asset auto-population
  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setAssetNumber(asset.equipmentNumber);
    setModality(asset.modality || "");
    setOem(asset.oem || "");
    setLocation(asset.location || "");
    setAddress(asset.address || "");
    setWarrantyStartDate(asset.warrantyStartDate || "");
    setWarrantyEndDate(asset.warrantyEndDate || "");
    setModel(asset.model || "");
    setSerialNumber(asset.serialNumber || "");
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
    setContractEndDate(asset.contractEndDate || "");
    if (!contactName && asset.customerContact) setContactName(asset.customerContact);
    if (!contactEmail && asset.email) setContactEmail(asset.email);

    setAssetSearchOpen(false);
    toast.info(`Auto-populated details for ${asset.equipmentNumber}`);
  };

  const handleToggleAssistant = (id: string) => {
    setAssistedByIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!assetNumber.trim()) errs.assetNumber = "Asset Number is required.";
    if (!modality.trim()) errs.modality = "Modality is required.";
    if (!oem.trim()) errs.oem = "OEM is required.";
    if (!model.trim()) errs.model = "Model is required.";
    if (!serialNumber.trim()) errs.serialNumber = "Serial Number is required.";

    if (!jobType.trim()) errs.jobType = "Job Type is required.";
    if (!jobOpenDate.trim()) errs.jobOpenDate = "Job Open Date is required.";
    if (!assignedToId) errs.assignedToId = "Primary engineer is required.";
    if (!jobPriority) errs.jobPriority = "Job Priority is required.";
    if (!assignedDate.trim()) errs.assignedDate = "Assigned / Start Date is required.";
    if (!reportedIssue.trim()) errs.reportedIssue = "Reported issue description is required.";

    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      errs.contactEmail = "Please enter a valid email address.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedPrimaryEngineer = personnelList.find((p) => p.id === assignedToId);
      const selectedAssistants = personnelList.filter((p) =>
        assistedByIds.includes(p.id)
      );

      const primaryName = selectedPrimaryEngineer
        ? `${selectedPrimaryEngineer.firstName} ${selectedPrimaryEngineer.lastName}`
        : "Unassigned";

      const assistantNames = selectedAssistants.map(
        (a) => `${a.firstName} ${a.lastName}`
      );

      const payload: CreateJobInput = {
        assetNumber,
        modality,
        oem,
        location,
        address,
        warrantyStartDate,
        warrantyEndDate,
        model,
        serialNumber,
        yearOfManufacture: yearOfManufacture || "2023",
        equipmentStatus,
        contractType: contractType || "COMPREHENSIVE",
        contractEndDate,
        jobType,
        jobOpenDate,
        complaintDate,
        complaintTime,
        contactName,
        contactEmail,
        assignedToId,
        assignedToName: primaryName,
        assistedByIds,
        assistedByNames: assistantNames,
        jobEquipmentStatus,
        jobPriority,
        jobStartDate: assignedDate,
        endDate: endDate || "—",
        reportedIssue,
      };

      const createdJob = await debriefService.create(payload);
      toast.success(`Job ${createdJob.jobNumber} created and dispatched!`);
      onJobCreated?.(createdJob);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to create job", err);
      toast.error("An error occurred while creating the job.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[94vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Modal Header */}
        <DialogHeader className="p-5 pb-4 border-b border-border bg-card/60">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Create New Service Job
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Search equipment to auto-populate specifications, then configure service dispatch details.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Form Body — Two Horizontal Cards Layout */}
        <form onSubmit={handleCreateJob} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {/* ================= LEFT HORIZONTAL CARD: EQUIPMENT DETAILS ================= */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
                    <Stethoscope className="size-3.5" />
                  </span>
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Equipment Identification
                  </span>
                </div>
                {selectedAsset && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="size-3" /> Auto-populated
                  </span>
                )}
              </div>

              {/* Asset Search Field */}
              <div className="relative" ref={searchContainerRef}>
                <Label htmlFor="assetNumber" className="text-xs font-semibold text-foreground">
                  Asset Number (Search) <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="assetNumber"
                    placeholder="Type equipment number (e.g. EQ-RAD-001)..."
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
                      errors.assetNumber && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  <Search className="size-3.5 absolute right-2.5 top-3 text-muted-foreground pointer-events-none" />
                </div>

                {errors.assetNumber && (
                  <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3" /> {errors.assetNumber}
                  </p>
                )}

                {/* Autocomplete Dropdown */}
                {assetSearchOpen && matchingAssets.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-md border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                    <div className="p-1.5 text-[11px] font-semibold text-muted-foreground bg-muted/50 border-b border-border/60">
                      Matching Equipment Registry ({matchingAssets.length})
                    </div>
                    {matchingAssets.map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => handleSelectAsset(asset)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-accent/80 transition-colors flex items-center justify-between border-b border-border/40 last:border-0 cursor-pointer"
                      >
                        <div>
                          <span className="font-mono font-bold text-primary">{asset.equipmentNumber}</span>
                          <span className="mx-2 text-muted-foreground">•</span>
                          <span className="font-medium text-foreground">{asset.model}</span>
                          <span className="text-[11px] text-muted-foreground block">
                            {asset.oem} ({asset.modality}) — {asset.location}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                          Select
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Equipment Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="modality" className="text-[11px]">
                    Modality <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="modality"
                    placeholder="e.g. Radiology"
                    value={modality}
                    onChange={(e) => setModality(e.target.value)}
                    className={cn("h-8 text-xs", errors.modality && "border-destructive")}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="oem" className="text-[11px]">
                    OEM <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="oem"
                    placeholder="e.g. GE Healthcare"
                    value={oem}
                    onChange={(e) => setOem(e.target.value)}
                    className={cn("h-8 text-xs", errors.oem && "border-destructive")}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="model" className="text-[11px]">
                    Model <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="model"
                    placeholder="e.g. Optima CT660"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className={cn("h-8 text-xs", errors.model && "border-destructive")}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="serialNumber" className="text-[11px]">
                    Serial Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="serialNumber"
                    placeholder="e.g. SN-98241-GE"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className={cn("h-8 text-xs font-mono", errors.serialNumber && "border-destructive")}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="location" className="text-[11px]">Location / Ward</Label>
                  <Input
                    id="location"
                    placeholder="e.g. Main Radiology Complex"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="address" className="text-[11px]">Address</Label>
                  <Input
                    id="address"
                    placeholder="e.g. Garki, Abuja"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="warrantyStartDate" className="text-[11px]">Warranty Start Date</Label>
                  <Input
                    id="warrantyStartDate"
                    type="date"
                    value={warrantyStartDate}
                    onChange={(e) => setWarrantyStartDate(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="warrantyEndDate" className="text-[11px]">Warranty End Date</Label>
                  <Input
                    id="warrantyEndDate"
                    type="date"
                    value={warrantyEndDate}
                    onChange={(e) => setWarrantyEndDate(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="yearOfManufacture" className="text-[11px]">Year of Manufacture</Label>
                  <Input
                    id="yearOfManufacture"
                    placeholder="e.g. 2023"
                    value={yearOfManufacture}
                    onChange={(e) => setYearOfManufacture(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="equipmentStatus" className="text-[11px]">
                    Equipment Status <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={equipmentStatus}
                    onValueChange={(val) => setEquipmentStatus(val as EquipmentStatus)}
                  >
                    <SelectTrigger id="equipmentStatus" className="h-8 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_STATUSES.map((st) => (
                        <SelectItem key={st} value={st} className="text-xs">
                          {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="contractType" className="text-[11px]">Contract Type</Label>
                  <Input
                    id="contractType"
                    placeholder="e.g. COMPREHENSIVE"
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="contractEndDate" className="text-[11px]">Contract End Date</Label>
                  <Input
                    id="contractEndDate"
                    type="date"
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* ================= RIGHT HORIZONTAL CARD: JOB DETAILS & DISPATCH ================= */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
                    <ClipboardList className="size-3.5" />
                  </span>
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Job Details & Assignment
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Job Type */}
                <div className="space-y-1">
                  <Label htmlFor="jobType" className="text-[11px]">
                    Job Type <span className="text-destructive">*</span>
                  </Label>
                  <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger id="jobType" className="h-8 text-xs">
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

                {/* Job Priority */}
                <div className="space-y-1">
                  <Label htmlFor="jobPriority" className="text-[11px]">
                    Job Priority <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={jobPriority}
                    onValueChange={(val) => setJobPriority(val as JobPriority)}
                  >
                    <SelectTrigger id="jobPriority" className="h-8 text-xs">
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

                {/* Job Open Date */}
                <div className="space-y-1">
                  <Label htmlFor="jobOpenDate" className="text-[11px]">
                    Job Open Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="jobOpenDate"
                    type="date"
                    value={jobOpenDate}
                    onChange={(e) => setJobOpenDate(e.target.value)}
                    className={cn("h-8 text-xs font-mono", errors.jobOpenDate && "border-destructive")}
                  />
                </div>

                {/* Equipment Status in Job */}
                <div className="space-y-1">
                  <Label htmlFor="jobEquipmentStatus" className="text-[11px]">
                    Equipment Status (Job)
                  </Label>
                  <Select
                    value={jobEquipmentStatus}
                    onValueChange={(val) => setJobEquipmentStatus(val as EquipmentStatus)}
                  >
                    <SelectTrigger id="jobEquipmentStatus" className="h-8 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_STATUSES.map((st) => (
                        <SelectItem key={st} value={st} className="text-xs">
                          {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Separated Date Field 1: Assigned / Start Date */}
                <div className="space-y-1">
                  <Label htmlFor="assignedDate" className="text-[11px] font-semibold text-primary">
                    Assigned / Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="assignedDate"
                    type="date"
                    value={assignedDate}
                    onChange={(e) => setAssignedDate(e.target.value)}
                    className={cn("h-8 text-xs font-mono", errors.assignedDate && "border-destructive")}
                  />
                  {errors.assignedDate && (
                    <p className="text-[10px] text-destructive">{errors.assignedDate}</p>
                  )}
                </div>

                {/* Separated Date Field 2: Estimated End Date */}
                <div className="space-y-1">
                  <Label htmlFor="endDate" className="text-[11px] font-semibold text-foreground">
                    Estimated End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                {/* Complaint Date */}
                <div className="space-y-1">
                  <Label htmlFor="complaintDate" className="text-[11px]">Complaint Date</Label>
                  <Input
                    id="complaintDate"
                    type="date"
                    value={complaintDate}
                    onChange={(e) => setComplaintDate(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                {/* Complaint Time */}
                <div className="space-y-1">
                  <Label htmlFor="complaintTime" className="text-[11px]">Complaint Time</Label>
                  <Input
                    id="complaintTime"
                    type="time"
                    value={complaintTime}
                    onChange={(e) => setComplaintTime(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                {/* Contact Name */}
                <div className="space-y-1">
                  <Label htmlFor="contactName" className="text-[11px]">Site Contact Name</Label>
                  <Input
                    id="contactName"
                    placeholder="e.g. Dr. Alabi Kunle"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                {/* Contact Email */}
                <div className="space-y-1">
                  <Label htmlFor="contactEmail" className="text-[11px]">Site Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="e.g. alabi.k@hospital.gov.ng"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className={cn("h-8 text-xs", errors.contactEmail && "border-destructive")}
                  />
                </div>

                {/* Primary Assignee */}
                <div className="space-y-1 col-span-1 sm:col-span-2">
                  <Label htmlFor="assignedToId" className="text-[11px] font-semibold">
                    Assign To (Primary Engineer) <span className="text-destructive">*</span>
                  </Label>
                  <Select value={assignedToId} onValueChange={setAssignedToId}>
                    <SelectTrigger
                      id="assignedToId"
                      className={cn("h-8 text-xs", errors.assignedToId && "border-destructive")}
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
                    <p className="text-[10px] text-destructive">{errors.assignedToId}</p>
                  )}
                </div>
              </div>

              {/* Assisted By Checklist */}
              <div className="space-y-1 pt-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  Assisted By (Optional Assistants)
                </Label>
                <div className="p-2.5 rounded-lg border border-border bg-muted/20 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
                  {personnelList
                    .filter((p) => p.id !== assignedToId)
                    .map((p) => {
                      const isChecked = assistedByIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          onClick={() => handleToggleAssistant(p.id)}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors cursor-pointer border",
                            isChecked
                              ? "bg-primary/10 border-primary/40 text-primary font-semibold"
                              : "bg-background border-border/60 hover:bg-accent text-foreground"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="size-3 rounded border-primary text-primary pointer-events-none"
                          />
                          <span className="truncate text-[11px]">
                            {p.firstName} {p.lastName}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>

          {/* ================= FULL WIDTH: REPORTED ISSUE ================= */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-2 shadow-2xs">
            <Label htmlFor="reportedIssue" className="text-xs font-bold text-foreground uppercase tracking-wider block">
              Reported Issue Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reportedIssue"
              rows={3}
              placeholder="Describe the breakdown symptoms, error codes, client request, or preliminary fault notes in detail..."
              value={reportedIssue}
              onChange={(e) => setReportedIssue(e.target.value)}
              className={cn(
                "text-xs leading-relaxed resize-none",
                errors.reportedIssue && "border-destructive"
              )}
            />
            {errors.reportedIssue && (
              <p className="text-[11px] text-destructive">{errors.reportedIssue}</p>
            )}
          </div>

          {/* Modal Footer Controls */}
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
              <span>{submitting ? "Creating Job..." : "Create Job"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
