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
  Sparkles,
  AlertCircle,
  Building2,
  Calendar,
  User,
  ShieldAlert,
  Check,
  Search,
  ChevronDown,
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

  // Equipment Fields
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
  const [complaintDate, setComplaintDate] = useState("");
  const [complaintTime, setComplaintTime] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [assistedByIds, setAssistedByIds] = useState<string[]>([]);
  const [jobEquipmentStatus, setJobEquipmentStatus] = useState<EquipmentStatus>("Down");
  const [jobPriority, setJobPriority] = useState<JobPriority>("High");
  const [jobStartDate, setJobStartDate] = useState("");
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
      setJobStartDate(todayStr);

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

    // Normalize equipment status
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
    if (!jobStartDate.trim()) errs.jobStartDate = "Job Start Date is required.";
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
        jobStartDate,
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
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Modal Header */}
        <DialogHeader className="p-5 pb-4 border-b border-border bg-card/60">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Create New Service Job
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Search equipment to auto-populate specifications, then set job scope and engineer assignments.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Scrollable Form Body */}
        <form onSubmit={handleCreateJob} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ================= 1. EQUIPMENT SEARCH & AUTO-POPULATED CARD ================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Stethoscope className="size-3.5 text-primary" />
                1. Equipment Identification
              </Label>
              {selectedAsset && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="size-3" /> Auto-populated
                </span>
              )}
            </div>

            {/* Asset Number Live Search Input */}
            <div className="relative" ref={searchContainerRef}>
              <div className="relative">
                <Input
                  placeholder="Type equipment number (e.g. EQ-RAD-001, EQ-CARD)..."
                  value={assetNumber}
                  onChange={(e) => {
                    setAssetNumber(e.target.value);
                    setAssetSearchOpen(true);
                  }}
                  onFocus={() => {
                    if (assetNumber.trim()) setAssetSearchOpen(true);
                  }}
                  className={cn(
                    "h-10 text-xs font-mono pr-9 bg-background",
                    errors.assetNumber && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <Search className="size-4 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
              </div>

              {errors.assetNumber && (
                <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3" /> {errors.assetNumber}
                </p>
              )}

              {/* Live Autocomplete Dropdown */}
              {assetSearchOpen && matchingAssets.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-md border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden max-h-56 overflow-y-auto">
                  <div className="p-1.5 text-[11px] font-semibold text-muted-foreground bg-muted/40 border-b border-border/60">
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

            {/* Auto-Populated Equipment Details Card */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    {assetNumber || "No Equipment Selected"}
                  </span>
                  {modality && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                      {modality}
                    </span>
                  )}
                </div>
                <span
                  className={
                    equipmentStatus === "UP"
                      ? "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : equipmentStatus === "Partially UP"
                      ? "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      : "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                  }
                >
                  Status: {equipmentStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono block">OEM</span>
                  <span className="font-medium text-foreground">{oem || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono block">Model</span>
                  <span className="font-semibold text-foreground">{model || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono block">Serial No</span>
                  <span className="font-mono text-muted-foreground">{serialNumber || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono block">Year of Mfg</span>
                  <span className="text-foreground">{yearOfManufacture || "—"}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono block">Location / Ward</span>
                  <span className="text-foreground truncate block">{location || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono block">Warranty End</span>
                  <span className="font-mono text-muted-foreground">{warrantyEndDate || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono block">Contract</span>
                  <span className="text-foreground">{contractType || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= 2. JOB DETAILS & ASSIGNMENT ================= */}
          <div className="space-y-4 pt-2">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <ClipboardList className="size-3.5 text-primary" />
              2. Job Details & Dispatch
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Job Type */}
              <div className="space-y-1.5">
                <Label htmlFor="jobType" className="text-xs">
                  Job Type <span className="text-destructive">*</span>
                </Label>
                <Select value={jobType} onValueChange={setJobType}>
                  <SelectTrigger id="jobType" className="h-9 text-xs">
                    <SelectValue placeholder="Select Job Type" />
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
              <div className="space-y-1.5">
                <Label htmlFor="jobPriority" className="text-xs">
                  Job Priority <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={jobPriority}
                  onValueChange={(val) => setJobPriority(val as JobPriority)}
                >
                  <SelectTrigger id="jobPriority" className="h-9 text-xs">
                    <SelectValue placeholder="Select priority" />
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
              <div className="space-y-1.5">
                <Label htmlFor="jobOpenDate" className="text-xs">
                  Job Open Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="jobOpenDate"
                  type="date"
                  value={jobOpenDate}
                  onChange={(e) => setJobOpenDate(e.target.value)}
                  className={cn("h-9 text-xs", errors.jobOpenDate && "border-destructive")}
                />
              </div>

              {/* Planned Job Start Date */}
              <div className="space-y-1.5">
                <Label htmlFor="jobStartDate" className="text-xs">
                  Planned Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="jobStartDate"
                  type="date"
                  value={jobStartDate}
                  onChange={(e) => setJobStartDate(e.target.value)}
                  className={cn("h-9 text-xs", errors.jobStartDate && "border-destructive")}
                />
              </div>

              {/* Complaint Date */}
              <div className="space-y-1.5">
                <Label htmlFor="complaintDate" className="text-xs">
                  Complaint Date
                </Label>
                <Input
                  id="complaintDate"
                  type="date"
                  value={complaintDate}
                  onChange={(e) => setComplaintDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Complaint Time */}
              <div className="space-y-1.5">
                <Label htmlFor="complaintTime" className="text-xs">
                  Complaint Time
                </Label>
                <Input
                  id="complaintTime"
                  type="time"
                  value={complaintTime}
                  onChange={(e) => setComplaintTime(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Contact Name */}
              <div className="space-y-1.5">
                <Label htmlFor="contactName" className="text-xs">
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

              {/* Contact Email */}
              <div className="space-y-1.5">
                <Label htmlFor="contactEmail" className="text-xs">
                  Site Contact Email
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="e.g. alabi.k@hospital.gov.ng"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className={cn("h-9 text-xs", errors.contactEmail && "border-destructive")}
                />
                {errors.contactEmail && (
                  <p className="text-[11px] text-destructive">{errors.contactEmail}</p>
                )}
              </div>

              {/* Primary Assignee (Assign To) */}
              <div className="space-y-1.5">
                <Label htmlFor="assignedToId" className="text-xs">
                  Assign To (Primary Engineer) <span className="text-destructive">*</span>
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
                  <p className="text-[11px] text-destructive">{errors.assignedToId}</p>
                )}
              </div>

              {/* Equipment Status in Job Details */}
              <div className="space-y-1.5">
                <Label htmlFor="jobEquipmentStatus" className="text-xs">
                  Equipment Status
                </Label>
                <Select
                  value={jobEquipmentStatus}
                  onValueChange={(val) => setJobEquipmentStatus(val as EquipmentStatus)}
                >
                  <SelectTrigger id="jobEquipmentStatus" className="h-9 text-xs">
                    <SelectValue placeholder="Select status" />
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
            </div>

            {/* Assisted By Checklist */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold text-foreground">
                Assisted By (Optional Assisting Engineers)
              </Label>
              <div className="p-3 rounded-lg border border-border bg-muted/20 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {personnelList
                  .filter((p) => p.id !== assignedToId)
                  .map((p) => {
                    const isChecked = assistedByIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        onClick={() => handleToggleAssistant(p.id)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md text-xs transition-colors cursor-pointer border",
                          isChecked
                            ? "bg-primary/10 border-primary/40 text-primary font-semibold"
                            : "bg-background border-border/60 hover:bg-accent text-foreground"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="size-3.5 rounded border-primary text-primary focus:ring-primary pointer-events-none"
                        />
                        <span className="truncate">
                          {p.firstName} {p.lastName}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>

            {/* Reported Issue Description */}
            <div className="space-y-1.5">
              <Label htmlFor="reportedIssue" className="text-xs font-semibold text-foreground">
                Reported Issue & Complaint Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reportedIssue"
                rows={3}
                placeholder="Describe the complaint, breakdown symptoms, error codes, or customer request in detail..."
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
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
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
              className="text-xs h-9 font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer shadow-sm px-4"
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
