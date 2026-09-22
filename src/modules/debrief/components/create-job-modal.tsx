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
  Building2,
  FileText,
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

  // Equipment Attributes (Auto-populated from Asset Registry)
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
      .slice(0, 8);
  }, [assetNumber, allAssets]);

  // Handle asset auto-population
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
    if (!contactName && asset.customerContact) setContactName(asset.customerContact);
    if (!contactEmail && asset.email) setContactEmail(asset.email);

    setAssetSearchOpen(false);
    toast.info(`Equipment ${asset.equipmentNumber} selected and specifications auto-populated.`);
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

  const handleToggleAssistant = (id: string) => {
    setAssistedByIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!assetNumber.trim() || !selectedAsset) {
      errs.assetNumber = "Please select equipment from the asset registry.";
    }

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
      toast.error("Please complete all required fields correctly.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedPrimaryEngineer = personnelList.find(
        (p) => p.id === assignedToId
      );
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
        jobOpenDate,
        complaintDate: complaintDate || jobOpenDate,
        complaintTime: complaintTime || "09:00",
        contactName: contactName || "Hospital Contact",
        contactEmail: contactEmail || "contact@hospital.gov.ng",
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
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Search and select equipment from the registry to auto-populate specifications on the card, then configure service dispatch details.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Form Body — Full-Width Horizontal Cards Layout */}
        <form onSubmit={handleCreateJob} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* ================= CARD 1: FULL-WIDTH AUTO-POPULATED EQUIPMENT CARD ================= */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Stethoscope className="size-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Equipment Identification & Specifications
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Auto-populated directly from the Assets & Devices registry
                  </p>
                </div>
              </div>

              {selectedAsset && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    <Check className="size-3.5" /> Auto-populated
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearSelectedAsset}
                    className="h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                  >
                    <RotateCcw className="size-3" />
                    <span>Change</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Asset Live Search Input */}
            <div className="relative" ref={searchContainerRef}>
              <Label htmlFor="assetNumber" className="text-xs font-bold text-foreground">
                Search Equipment Number / Model / OEM <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="assetNumber"
                  placeholder="Type equipment number (e.g. EQ-US-004, EQ-RAD-001) or model..."
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
                <p className="text-xs text-destructive mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="size-3.5" /> {errors.assetNumber}
                </p>
              )}

              {/* Autocomplete Dropdown */}
              {assetSearchOpen && matchingAssets.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1.5 rounded-lg border border-border bg-popover text-popover-foreground shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                  <div className="p-2 text-xs font-bold text-muted-foreground bg-muted/60 border-b border-border/60">
                    Matching Equipment Registry ({matchingAssets.length})
                  </div>
                  {matchingAssets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => handleSelectAsset(asset)}
                      className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-accent/80 transition-colors flex items-center justify-between border-b border-border/40 last:border-0 cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary">{asset.equipmentNumber}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="font-semibold text-foreground">{asset.model}</span>
                        </div>
                        <span className="text-xs text-muted-foreground block mt-0.5">
                          {asset.oem} ({asset.modality}) — {asset.location || "Main Hospital"}
                        </span>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded bg-primary/10 text-primary font-bold">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auto-Populated Equipment Specifications Display */}
            {selectedAsset ? (
              <div className="rounded-lg border border-border/70 bg-muted/20 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-primary">
                      {selectedAsset.equipmentNumber}
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      — {selectedAsset.model} ({selectedAsset.oem})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      {selectedAsset.modality || "Biomedical"}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border",
                        equipmentStatus === "UP"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : equipmentStatus === "Partially UP"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      )}
                    >
                      Status: {equipmentStatus}
                    </span>
                  </div>
                </div>

                <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 text-xs">
                  <div>
                    <dt className="text-xs font-bold text-muted-foreground uppercase">Serial Number</dt>
                    <dd className="font-mono font-semibold text-foreground mt-0.5">{serialNumber || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-muted-foreground uppercase">Modality</dt>
                    <dd className="font-medium text-foreground mt-0.5">{modality || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-muted-foreground uppercase">OEM / Manufacturer</dt>
                    <dd className="font-medium text-foreground mt-0.5">{oem || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-muted-foreground uppercase">Location / Ward</dt>
                    <dd className="font-medium text-foreground mt-0.5">{location || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-muted-foreground uppercase">Facility Address</dt>
                    <dd className="font-medium text-foreground mt-0.5">{address || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-muted-foreground uppercase">Year of Mfg</dt>
                    <dd className="font-medium text-foreground mt-0.5">{yearOfManufacture || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-muted-foreground uppercase">Warranty Start</dt>
                    <dd className="font-mono text-foreground mt-0.5">{warrantyStartDate || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-muted-foreground uppercase">Warranty End</dt>
                    <dd className="font-mono text-foreground mt-0.5">{warrantyEndDate || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-muted-foreground uppercase">Contract Type</dt>
                    <dd className="font-medium text-foreground mt-0.5">{contractType || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-muted-foreground uppercase">Contract Expiry</dt>
                    <dd className="font-mono text-foreground mt-0.5">{contractEndDate || "—"}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Select an equipment from the search bar above to auto-populate specifications into this card.
                </p>
              </div>
            )}
          </div>

          {/* ================= CARD 2: FULL-WIDTH HORIZONTAL JOB DETAILS & DISPATCH ================= */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <ClipboardList className="size-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Service Assignment & Dispatch Details
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Define work order type, assigned personnel, priorities, and schedule
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Job Type */}
              <div className="space-y-1.5">
                <Label htmlFor="jobType" className="text-xs font-bold text-foreground">
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

              {/* Job Priority */}
              <div className="space-y-1.5">
                <Label htmlFor="jobPriority" className="text-xs font-bold text-foreground">
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

              {/* Job Open Date */}
              <div className="space-y-1.5">
                <Label htmlFor="jobOpenDate" className="text-xs font-bold text-foreground">
                  Job Open Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="jobOpenDate"
                  type="date"
                  value={jobOpenDate}
                  onChange={(e) => setJobOpenDate(e.target.value)}
                  className={cn("h-9 text-xs font-mono", errors.jobOpenDate && "border-destructive")}
                />
              </div>

              {/* Equipment Status in Job */}
              <div className="space-y-1.5">
                <Label htmlFor="jobEquipmentStatus" className="text-xs font-bold text-foreground">
                  Equipment Status (Job)
                </Label>
                <Select
                  value={jobEquipmentStatus}
                  onValueChange={(val) => setJobEquipmentStatus(val as EquipmentStatus)}
                >
                  <SelectTrigger id="jobEquipmentStatus" className="h-9 text-xs">
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
              <div className="space-y-1.5">
                <Label htmlFor="assignedDate" className="text-xs font-bold text-primary">
                  Assigned / Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="assignedDate"
                  type="date"
                  value={assignedDate}
                  onChange={(e) => setAssignedDate(e.target.value)}
                  className={cn("h-9 text-xs font-mono", errors.assignedDate && "border-destructive")}
                />
                {errors.assignedDate && (
                  <p className="text-xs text-destructive font-medium">{errors.assignedDate}</p>
                )}
              </div>

              {/* Separated Date Field 2: Estimated End Date */}
              <div className="space-y-1.5">
                <Label htmlFor="endDate" className="text-xs font-bold text-foreground">
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

              {/* Complaint Date */}
              <div className="space-y-1.5">
                <Label htmlFor="complaintDate" className="text-xs font-bold text-foreground">
                  Complaint Date
                </Label>
                <Input
                  id="complaintDate"
                  type="date"
                  value={complaintDate}
                  onChange={(e) => setComplaintDate(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              {/* Complaint Time */}
              <div className="space-y-1.5">
                <Label htmlFor="complaintTime" className="text-xs font-bold text-foreground">
                  Complaint Time
                </Label>
                <Input
                  id="complaintTime"
                  type="time"
                  value={complaintTime}
                  onChange={(e) => setComplaintTime(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              {/* Contact Name */}
              <div className="space-y-1.5">
                <Label htmlFor="contactName" className="text-xs font-bold text-foreground">
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
                <Label htmlFor="contactEmail" className="text-xs font-bold text-foreground">
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
              </div>

              {/* Primary Assignee */}
              <div className="space-y-1.5 col-span-1 sm:col-span-2">
                <Label htmlFor="assignedToId" className="text-xs font-bold text-foreground">
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
                  <p className="text-xs text-destructive font-medium">{errors.assignedToId}</p>
                )}
              </div>
            </div>

            {/* Assisted By Checklist */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Assisted By (Optional Assistants)
              </Label>
              <div className="p-3 rounded-lg border border-border bg-muted/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-32 overflow-y-auto">
                {personnelList
                  .filter((p) => p.id !== assignedToId)
                  .map((p) => {
                    const isChecked = assistedByIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        onClick={() => handleToggleAssistant(p.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors cursor-pointer border",
                          isChecked
                            ? "bg-primary/10 border-primary/40 text-primary font-bold"
                            : "bg-background border-border/60 hover:bg-accent text-foreground"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="size-3.5 rounded border-primary text-primary pointer-events-none"
                        />
                        <span className="truncate text-xs">
                          {p.firstName} {p.lastName}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* ================= CARD 3: FULL WIDTH REPORTED ISSUE ================= */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 shadow-2xs">
            <Label htmlFor="reportedIssue" className="text-xs font-bold text-foreground uppercase tracking-wider block">
              Reported Issue Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reportedIssue"
              rows={3}
              placeholder="Describe breakdown symptoms, error codes, customer complaints, or preliminary fault notes in detail..."
              value={reportedIssue}
              onChange={(e) => setReportedIssue(e.target.value)}
              className={cn(
                "text-xs leading-relaxed resize-none",
                errors.reportedIssue && "border-destructive"
              )}
            />
            {errors.reportedIssue && (
              <p className="text-xs text-destructive font-medium">{errors.reportedIssue}</p>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-border flex items-center justify-between">
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
              className="text-xs h-9 font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 cursor-pointer shadow-sm px-6"
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
