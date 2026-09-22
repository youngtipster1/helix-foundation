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
import { Stepper, type StepItem } from "@/components/ui/stepper";
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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Building2,
  Calendar,
  User,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated?: (job: DebriefJob) => void;
}

const STEPS: StepItem[] = [
  {
    id: "equipment",
    title: "Equipment Details",
    description: "Search & link asset",
    icon: Stethoscope,
  },
  {
    id: "job-details",
    title: "Job Details",
    description: "Scope, priority & assignees",
    icon: ClipboardList,
  },
  {
    id: "review",
    title: "Review & Create",
    description: "Verify & confirm",
    icon: CheckCircle2,
  },
];

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
  const [currentStep, setCurrentStep] = useState(0);

  // External data sources
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [assetSearchOpen, setAssetSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Form Step 1: Equipment Details
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

  // Form Step 2: Job Details
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
      setCurrentStep(0);
      setErrors({});
      const todayStr = new Date().toISOString().split("T")[0];
      const timeStr = new Date().toTimeString().slice(0, 5);

      setJobOpenDate(todayStr);
      setComplaintDate(todayStr);
      setComplaintTime(timeStr);
      setJobStartDate(todayStr);

      // Load personnel & assets
      Promise.all([personnelService.list(), assetService.list()])
        .then(([personnel, assets]) => {
          setPersonnelList(personnel.filter((p) => p.status === "active"));
          setAllAssets(assets);
        })
        .catch((err) => console.error("Error loading resources", err));
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

    // Normalize equipment status to UP / Partially UP / Down
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
    setContactName(asset.customerContact || "");
    setContactEmail(asset.email || "");

    setAssetSearchOpen(false);
    toast.info(`Equipment details populated for ${asset.equipmentNumber}`);
  };

  // Step 1 validation
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!assetNumber.trim()) errs.assetNumber = "Asset Number is required.";
    if (!modality.trim()) errs.modality = "Modality is required.";
    if (!oem.trim()) errs.oem = "OEM manufacturer is required.";
    if (!model.trim()) errs.model = "Model is required.";
    if (!serialNumber.trim()) errs.serialNumber = "Serial Number is required.";
    if (!equipmentStatus) errs.equipmentStatus = "Equipment Status is required.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 validation
  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!jobType.trim()) errs.jobType = "Job Type is required.";
    if (!jobOpenDate.trim()) errs.jobOpenDate = "Job Open Date is required.";
    if (!assignedToId) errs.assignedToId = "Primary engineer (Assign To) is required.";
    if (!jobPriority) errs.jobPriority = "Job Priority is required.";
    if (!jobStartDate.trim()) errs.jobStartDate = "Job Start Date is required.";
    if (!reportedIssue.trim()) errs.reportedIssue = "Reported Issue description is required.";

    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      errs.contactEmail = "Please enter a valid email address.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (validateStep1()) {
        setCurrentStep(1);
      }
    } else if (currentStep === 1) {
      if (validateStep2()) {
        setCurrentStep(2);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const selectedPrimaryEngineer = personnelList.find((p) => p.id === assignedToId);
  const selectedAssistants = personnelList.filter((p) =>
    assistedByIds.includes(p.id)
  );

  const handleToggleAssistant = (id: string) => {
    setAssistedByIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreateJob = async () => {
    if (!validateStep1() || !validateStep2()) {
      toast.error("Please review and fix validation errors before creating.");
      return;
    }

    setSubmitting(true);
    try {
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
        yearOfManufacture,
        equipmentStatus,
        contractType,
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
      toast.success(`Job ${createdJob.jobNumber} created successfully!`);
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
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b border-border bg-card/60">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Create New Service Job
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Admin Job Dispatch & Equipment Assignment Wizard
              </DialogDescription>
            </div>
          </div>

          <div className="pt-4">
            <Stepper
              steps={STEPS}
              currentStep={currentStep}
              onStepClick={(idx) => {
                if (idx < currentStep) setCurrentStep(idx);
              }}
            />
          </div>
        </DialogHeader>

        {/* Modal Body with Stepper View */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ================= STEP 1: EQUIPMENT DETAILS ================= */}
          {currentStep === 0 && (
            <div className="space-y-5">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-3">
                <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Smart Asset Auto-Population:</span> Type an equipment number (e.g.{" "}
                  <code className="font-mono text-primary font-bold">EQ-RAD-001</code>) to search and automatically pull technical specifications, OEM dates, and contract terms.
                </div>
              </div>

              {/* Asset Number Live Search Field */}
              <div className="relative" ref={searchContainerRef}>
                <Label htmlFor="assetNumber" className="text-xs font-semibold text-foreground">
                  Asset Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="assetNumber"
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
                      "h-9 text-xs font-mono pr-8",
                      errors.assetNumber && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  <Stethoscope className="size-4 absolute right-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                </div>

                {errors.assetNumber && (
                  <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3" /> {errors.assetNumber}
                  </p>
                )}

                {/* Live Search Autocomplete Dropdown */}
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

              {/* 2-Column Equipment Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modality" className="text-xs">
                    Modality <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="modality"
                    placeholder="e.g. Radiology, Surgical"
                    value={modality}
                    onChange={(e) => setModality(e.target.value)}
                    className={cn("h-9 text-xs", errors.modality && "border-destructive")}
                  />
                  {errors.modality && (
                    <p className="text-[11px] text-destructive">{errors.modality}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="oem" className="text-xs">
                    OEM Manufacturer <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="oem"
                    placeholder="e.g. GE Healthcare, Siemens"
                    value={oem}
                    onChange={(e) => setOem(e.target.value)}
                    className={cn("h-9 text-xs", errors.oem && "border-destructive")}
                  />
                  {errors.oem && (
                    <p className="text-[11px] text-destructive">{errors.oem}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="model" className="text-xs">
                    Model <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="model"
                    placeholder="e.g. Optima CT660"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className={cn("h-9 text-xs", errors.model && "border-destructive")}
                  />
                  {errors.model && (
                    <p className="text-[11px] text-destructive">{errors.model}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="serialNumber" className="text-xs">
                    Serial Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="serialNumber"
                    placeholder="e.g. SN-98241-GE"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className={cn("h-9 text-xs font-mono", errors.serialNumber && "border-destructive")}
                  />
                  {errors.serialNumber && (
                    <p className="text-[11px] text-destructive">{errors.serialNumber}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location" className="text-xs">
                    Location / Hospital Ward
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g. Main Radiology Complex, Garki"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs">
                    Address / Facility
                  </Label>
                  <Input
                    id="address"
                    placeholder="e.g. Plot 132 Central District, Abuja"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="warrantyStartDate" className="text-xs">
                    Warranty Start Date
                  </Label>
                  <Input
                    id="warrantyStartDate"
                    type="date"
                    value={warrantyStartDate}
                    onChange={(e) => setWarrantyStartDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="warrantyEndDate" className="text-xs">
                    Warranty End Date
                  </Label>
                  <Input
                    id="warrantyEndDate"
                    type="date"
                    value={warrantyEndDate}
                    onChange={(e) => setWarrantyEndDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="yearOfManufacture" className="text-xs">
                    Year of Manufacture
                  </Label>
                  <Input
                    id="yearOfManufacture"
                    placeholder="e.g. 2023"
                    value={yearOfManufacture}
                    onChange={(e) => setYearOfManufacture(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="equipmentStatus" className="text-xs">
                    Equipment Status <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={equipmentStatus}
                    onValueChange={(val) => setEquipmentStatus(val as EquipmentStatus)}
                  >
                    <SelectTrigger id="equipmentStatus" className="h-9 text-xs">
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

                <div className="space-y-1.5">
                  <Label htmlFor="contractType" className="text-xs">
                    Contract Type
                  </Label>
                  <Input
                    id="contractType"
                    placeholder="e.g. COMPREHENSIVE, PM ONLY"
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contractEndDate" className="text-xs">
                    Contract End Date
                  </Label>
                  <Input
                    id="contractEndDate"
                    type="date"
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: JOB DETAILS ================= */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {errors.jobOpenDate && (
                    <p className="text-[11px] text-destructive">{errors.jobOpenDate}</p>
                  )}
                </div>

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

                <div className="space-y-1.5">
                  <Label htmlFor="contactName" className="text-xs">
                    Contact Name (Site / Hospital Lead)
                  </Label>
                  <Input
                    id="contactName"
                    placeholder="e.g. Dr. Alabi Kunle"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail" className="text-xs">
                    Contact Email
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

                {/* Primary Assignee */}
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

                {/* Planned Job Start Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="jobStartDate" className="text-xs">
                    Job Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="jobStartDate"
                    type="date"
                    value={jobStartDate}
                    onChange={(e) => setJobStartDate(e.target.value)}
                    className={cn("h-9 text-xs", errors.jobStartDate && "border-destructive")}
                  />
                  {errors.jobStartDate && (
                    <p className="text-[11px] text-destructive">{errors.jobStartDate}</p>
                  )}
                </div>
              </div>

              {/* Assisted By Multi-select Checklist */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-semibold text-foreground">
                  Assisted By (Optional Assisting Engineers)
                </Label>
                <div className="p-3 rounded-lg border border-border bg-muted/20 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
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

              {/* Reported Issue Textarea */}
              <div className="space-y-1.5">
                <Label htmlFor="reportedIssue" className="text-xs font-semibold text-foreground">
                  Reported Issue <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reportedIssue"
                  rows={3}
                  placeholder="Describe the complaint, breakdown symptoms, error codes, or client request in detail..."
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
          )}

          {/* ================= STEP 3: REVIEW & CREATE ================= */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-foreground">
                    Please review job details carefully before generating the job order.
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary text-primary-foreground">
                  Ready to Dispatch
                </span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Equipment Review Card */}
                <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Stethoscope className="size-3.5 text-primary" /> Equipment Details
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(0)}
                      className="h-6 px-2 text-[11px] text-primary"
                    >
                      Edit
                    </Button>
                  </div>

                  <dl className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase font-mono">Asset Number</dt>
                      <dd className="font-bold font-mono text-primary">{assetNumber || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase font-mono">Status</dt>
                      <dd className="font-semibold text-foreground">{equipmentStatus}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase font-mono">Modality</dt>
                      <dd className="text-foreground">{modality || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase font-mono">OEM</dt>
                      <dd className="text-foreground">{oem || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase font-mono">Model</dt>
                      <dd className="text-foreground">{model || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase font-mono">Serial No</dt>
                      <dd className="font-mono text-foreground">{serialNumber || "—"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[10px] text-muted-foreground uppercase font-mono">Location</dt>
                      <dd className="text-foreground truncate">{location || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase font-mono">Contract</dt>
                      <dd className="text-foreground">{contractType || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase font-mono">Contract End</dt>
                      <dd className="text-foreground">{contractEndDate || "—"}</dd>
                    </div>
                  </dl>
                </div>

                {/* Job Details Review Card */}
                <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ClipboardList className="size-3.5 text-primary" /> Job Assignment
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(1)}
                      className="h-6 px-2 text-[11px] text-primary"
                    >
                      Edit
                    </Button>
                  </div>

                  <dl className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase font-mono">Job Type</dt>
                      <dd className="font-bold text-foreground">{jobType}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase font-mono">Priority</dt>
                      <dd className="font-bold text-primary">{jobPriority}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase font-mono">Assign To</dt>
                      <dd className="font-semibold text-foreground">
                        {selectedPrimaryEngineer
                          ? `${selectedPrimaryEngineer.firstName} ${selectedPrimaryEngineer.lastName}`
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase font-mono">Assisted By</dt>
                      <dd className="text-foreground truncate">
                        {selectedAssistants.length > 0
                          ? selectedAssistants.map((a) => a.firstName).join(", ")
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase font-mono">Open Date</dt>
                      <dd className="text-foreground">{jobOpenDate || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase font-mono">Start Date</dt>
                      <dd className="text-foreground">{jobStartDate || "—"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[10px] text-muted-foreground uppercase font-mono">Site Contact</dt>
                      <dd className="text-foreground">
                        {contactName ? `${contactName} (${contactEmail || "No email"})` : "—"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Reported Issue Summary */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-1.5">
                <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                  Reported Issue Description
                </span>
                <p className="text-xs text-foreground leading-relaxed bg-muted/30 p-2.5 rounded border border-border/60">
                  {reportedIssue || "No description provided."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-border bg-card/60 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={currentStep === 0 ? () => onOpenChange(false) : handleBack}
            className="text-xs h-9 cursor-pointer"
          >
            {currentStep === 0 ? (
              "Cancel"
            ) : (
              <>
                <ChevronLeft className="size-3.5 mr-1" /> Back
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < 2 ? (
              <Button
                type="button"
                size="sm"
                onClick={handleNext}
                className="text-xs h-9 font-semibold gap-1.5 cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleCreateJob}
                disabled={submitting}
                className="text-xs h-9 font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="size-4" />
                <span>{submitting ? "Creating Job Order..." : "Create Job"}</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
