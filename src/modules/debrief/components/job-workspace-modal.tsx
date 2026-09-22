import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { debriefService } from "../services/debrief-service";
import type {
  DebriefJob,
  EquipmentStatus,
  JobStatus,
  RootCause,
  Resolution,
  DebriefPartUsed,
  DebriefExpense,
  ExpenseType,
  DebriefDocument,
  DebriefDocumentType,
  DebriefToolUsed,
} from "../types";
import { toast } from "sonner";
import {
  FileText,
  Clock,
  Boxes,
  Receipt,
  FileCheck,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Search,
  Upload,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JobWorkspaceModalProps {
  job: DebriefJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobUpdated?: (updatedJob: DebriefJob) => void;
}

const ROOT_CAUSES: RootCause[] = [
  "User error",
  "Power supply",
  "Software",
  "Hardware",
  "Consumable",
];

const RESOLUTIONS: Resolution[] = [
  "Calibration",
  "Software reload",
  "Hardware error",
  "Accessory",
  "End user training",
  "Consumable",
];

const EXPENSE_TYPES: ExpenseType[] = [
  "Lodging",
  "Transport (flight)",
  "Transport (taxi)",
  "Feeding",
];

const DOCUMENT_TYPES: DebriefDocumentType[] = [
  "Equipment checklist",
  "Installation checklist",
  "Delivery note",
  "3rd party service report",
  "Others",
];

// Mock tool registry for Tools section lookup
const TOOL_REGISTRY = [
  { toolId: "TL-CAL-001", serialNumber: "SN-FLUKE-9901", description: "Fluke ESA620 Electrical Safety Analyzer", oem: "Fluke Biomedical", calibrationDate: "2026-01-10", calibrationDueDate: "2027-01-10" },
  { toolId: "TL-CAL-002", serialNumber: "SN-RIGEL-4421", description: "Rigel 288+ Defibrillator Analyzer", oem: "Rigel Medical", calibrationDate: "2025-11-15", calibrationDueDate: "2026-11-15" },
  { toolId: "TL-CAL-003", serialNumber: "SN-BC-8812", description: "BC Biomedical Ultrasound Power Meter", oem: "BC Biomedical", calibrationDate: "2026-02-01", calibrationDueDate: "2027-02-01" },
  { toolId: "TL-CAL-004", serialNumber: "SN-FLUKE-7720", description: "Fluke ProSim 8 Vital Signs Simulator", oem: "Fluke Biomedical", calibrationDate: "2025-12-05", calibrationDueDate: "2026-12-05" },
];

export function JobWorkspaceModal({
  job,
  open,
  onOpenChange,
  onJobUpdated,
}: JobWorkspaceModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "labour" | "parts" | "expenses" | "documents" | "tools">("labour");

  // Labour Tab state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelStartTime, setTravelStartTime] = useState("");
  const [travelEndTime, setTravelEndTime] = useState("");
  const [labourStartTime, setLabourStartTime] = useState("");
  const [labourEndTime, setLabourEndTime] = useState("");
  const [workDone, setWorkDone] = useState("");
  const [equipmentStatus, setEquipmentStatus] = useState<EquipmentStatus>("UP");
  const [jobStatus, setJobStatus] = useState<JobStatus>("In Progress");
  const [holdReason, setHoldReason] = useState("Awaiting Part");
  const [rootCause, setRootCause] = useState<RootCause>("");
  const [resolution, setResolution] = useState<Resolution>("");

  // Parts Tab state
  const [partsUsed, setPartsUsed] = useState<DebriefPartUsed[]>([]);
  const [partSearchQuery, setPartSearchQuery] = useState("");
  const [partQtyUsed, setPartQtyUsed] = useState("1");
  const [partUnitCost, setPartUnitCost] = useState("45000");
  const [partDescription, setPartDescription] = useState("");
  const [partNumber, setPartNumber] = useState("");

  // Expenses Tab state
  const [expenses, setExpenses] = useState<DebriefExpense[]>([]);
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseType, setExpenseType] = useState<ExpenseType>("Transport (taxi)");
  const [expenseReceiptAvailable, setExpenseReceiptAvailable] = useState(true);
  const [expenseReceiptFileName, setExpenseReceiptFileName] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [expenseCode, setExpenseCode] = useState("FIN-EXP-2026-088");
  const [expenseAmount, setExpenseAmount] = useState("15000");

  // Documents Tab state
  const [documents, setDocuments] = useState<DebriefDocument[]>([]);
  const [docType, setDocType] = useState<DebriefDocumentType>("Equipment checklist");
  const [docComment, setDocComment] = useState("");
  const [docFileName, setDocFileName] = useState("");

  // Tools Tab state
  const [toolsUsed, setToolsUsed] = useState<DebriefToolUsed[]>([]);
  const [toolSearchQuery, setToolSearchQuery] = useState("");
  const [toolDateOfUse, setToolDateOfUse] = useState("");

  const [saving, setSaving] = useState(false);

  // Initialize workspace when job loads
  useEffect(() => {
    if (job && open) {
      setActiveTab("labour");
      const todayStr = new Date().toISOString().split("T")[0];

      setStartDate(job.jobStartDate || job.startDate || todayStr);
      setEndDate(job.endDate !== "—" ? job.endDate || todayStr : todayStr);
      setTravelStartTime("08:00");
      setTravelEndTime("09:00");
      setLabourStartTime("09:15");
      setLabourEndTime("16:30");
      setWorkDone(job.labour?.workDone || "Inspected unit, diagnosed power supply fluctuations, replaced degraded capacitor array, executed manufacturer calibration protocol, and verified output parameters.");
      setEquipmentStatus(job.equipmentStatus || "UP");
      setJobStatus(job.jobStatus || "In Progress");
      setHoldReason(job.holdReason || "Awaiting Part");
      setRootCause(job.rootCause && job.rootCause !== "—" ? job.rootCause : "Hardware");
      setResolution(job.resolution && job.resolution !== "—" ? job.resolution : "Calibration");

      // Initial mock parts, expenses, docs, tools if none
      setPartsUsed(job.partsUsed || [
        {
          id: "p_1",
          partNumber: "PRT-PWR-882",
          serialNumber: "SN-CAP-9912",
          description: "High Voltage Capacitor 450V 100uF",
          modality: job.modality,
          oem: job.oem,
          model: job.model,
          unitCost: 35000,
          quantityUsed: 2,
          totalCost: 70000,
        },
      ]);

      setExpenses(job.expenses || [
        {
          id: "exp_1",
          dateOfExpense: todayStr,
          typeOfExpense: "Transport (taxi)",
          receiptAvailable: true,
          receiptFileName: "taxi_receipt_uber_0922.pdf",
          note: "Travel to hospital facility site for emergency service dispatch",
          expenseCode: "FIN-EXP-2026-088",
          amount: 8500,
        },
      ]);

      setDocuments(job.documents || [
        {
          id: "doc_1",
          documentType: "Equipment checklist",
          comment: "Pre-service inspection and electrical safety checklist signed by hospital engineer.",
          fileName: "Pre_Service_Checklist_Signed.pdf",
          fileUrl: "#",
          fileSize: "1.4 MB",
          uploadDate: todayStr,
        },
      ]);

      setToolsUsed(job.toolsUsed || [
        {
          id: "t_1",
          toolId: "TL-CAL-001",
          serialNumber: "SN-FLUKE-9901",
          description: "Fluke ESA620 Electrical Safety Analyzer",
          oem: "Fluke Biomedical",
          dateOfUse: todayStr,
          calibrationDate: "2026-01-10",
          calibrationDueDate: "2027-01-10",
        },
      ]);

      setExpenseDate(todayStr);
      setToolDateOfUse(todayStr);
    }
  }, [job, open]);

  if (!job) return null;

  // Add Part handler
  const handleAddPart = () => {
    if (!partNumber.trim() || !partDescription.trim()) {
      toast.error("Please enter Part Number and Description.");
      return;
    }
    const qty = Math.max(1, parseInt(partQtyUsed) || 1);
    const cost = parseFloat(partUnitCost) || 0;

    const newPart: DebriefPartUsed = {
      id: `part_${Date.now()}`,
      partNumber: partNumber.trim(),
      serialNumber: `SN-${Date.now().toString().slice(-6)}`,
      description: partDescription.trim(),
      modality: job.modality,
      oem: job.oem,
      model: job.model,
      unitCost: cost,
      quantityUsed: qty,
      totalCost: cost * qty,
    };

    setPartsUsed((prev) => [...prev, newPart]);
    setPartNumber("");
    setPartDescription("");
    setPartQtyUsed("1");
    toast.success(`Part ${newPart.partNumber} added to parts list.`);
  };

  const handleRemovePart = (id: string) => {
    setPartsUsed((prev) => prev.filter((p) => p.id !== id));
  };

  // Add Expense handler
  const handleAddExpense = () => {
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      toast.error("Please enter a valid expense amount.");
      return;
    }

    const newExpense: DebriefExpense = {
      id: `exp_${Date.now()}`,
      dateOfExpense: expenseDate || new Date().toISOString().split("T")[0],
      typeOfExpense: expenseType,
      receiptAvailable: expenseReceiptAvailable,
      receiptFileName: expenseReceiptAvailable ? expenseReceiptFileName || "receipt_attached.pdf" : undefined,
      note: expenseNote || "Site service expenses logged by engineer.",
      expenseCode: expenseCode || "FIN-EXP-GEN",
      amount: parseFloat(expenseAmount) || 0,
    };

    setExpenses((prev) => [...prev, newExpense]);
    setExpenseNote("");
    setExpenseReceiptFileName("");
    toast.success("Expense logged successfully.");
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Add Document handler
  const handleAddDocument = () => {
    if (!docFileName.trim()) {
      toast.error("Please specify a document file name or select a file.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const newDoc: DebriefDocument = {
      id: `doc_${Date.now()}`,
      documentType: docType,
      comment: docComment || "Service report attachment.",
      fileName: docFileName.trim(),
      fileUrl: "#",
      fileSize: "1.8 MB",
      uploadDate: todayStr,
    };

    setDocuments((prev) => [...prev, newDoc]);
    setDocFileName("");
    setDocComment("");
    toast.success("Document attached to service job.");
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Add Tool handler
  const handleAddTool = (tool: typeof TOOL_REGISTRY[0]) => {
    if (toolsUsed.some((t) => t.toolId === tool.toolId)) {
      toast.info("Tool is already linked to this job.");
      return;
    }

    const newTool: DebriefToolUsed = {
      id: `tool_${Date.now()}`,
      toolId: tool.toolId,
      serialNumber: tool.serialNumber,
      description: tool.description,
      oem: tool.oem,
      dateOfUse: toolDateOfUse || new Date().toISOString().split("T")[0],
      calibrationDate: tool.calibrationDate,
      calibrationDueDate: tool.calibrationDueDate,
    };

    setToolsUsed((prev) => [...prev, newTool]);
    setToolSearchQuery("");
    toast.success(`Tool ${tool.toolId} verified and linked.`);
  };

  const handleRemoveTool = (id: string) => {
    setToolsUsed((prev) => prev.filter((t) => t.id !== id));
  };

  // Save all workspace sections
  const handleSaveWorkspace = async (targetJobStatus?: JobStatus) => {
    setSaving(true);
    try {
      const finalJobStatus = targetJobStatus || jobStatus;

      const updatedJob: Partial<DebriefJob> = {
        equipmentStatus,
        jobStatus: finalJobStatus,
        holdReason: finalJobStatus === "On Hold" ? holdReason : undefined,
        rootCause: finalJobStatus === "Completed" ? rootCause : rootCause || "—",
        resolution: finalJobStatus === "Completed" ? resolution : resolution || "—",
        startDate,
        endDate: finalJobStatus === "Completed" ? endDate : endDate || "—",
        labour: {
          startDate,
          endDate,
          travelStartTime,
          travelEndTime,
          labourStartTime,
          labourEndTime,
          workDone,
          equipmentStatus,
          jobStatus: finalJobStatus,
          holdReason: finalJobStatus === "On Hold" ? holdReason : undefined,
          rootCause,
          resolution,
        },
        partsUsed,
        expenses,
        documents,
        toolsUsed,
      };

      const result = await debriefService.update(job.id, updatedJob);
      if (result) {
        if (finalJobStatus === "Completed") {
          toast.success(`Job ${job.jobNumber} marked as Completed!`);
        } else if (finalJobStatus === "On Hold") {
          toast.warning(`Job ${job.jobNumber} placed On Hold (${holdReason})`);
        } else {
          toast.success("Job workspace records saved successfully.");
        }
        onJobUpdated?.(result);
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Failed to update workspace", err);
      toast.error("Failed to save workspace records.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[94vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Workspace Top Header */}
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Wrench className="size-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-foreground font-mono">
                    {job.jobNumber}
                  </DialogTitle>
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border",
                      jobStatus === "In Progress"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        : jobStatus === "On Hold"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    )}
                  >
                    {jobStatus === "On Hold" ? `On Hold: ${holdReason}` : jobStatus}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {job.assetNumber} ({job.model})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveWorkspace("In Progress")}
                disabled={saving}
                className="h-8 text-xs font-semibold cursor-pointer"
              >
                Save Draft
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveWorkspace("Completed")}
                disabled={saving}
                className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Complete Job</span>
              </Button>
            </div>
          </div>

          {/* 6 Workspace Tab Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pt-3 border-t border-border/50 scrollbar-none">
            {[
              { id: "general", label: "1. General", icon: FileText },
              { id: "labour", label: "2. Labour", icon: Clock },
              { id: "parts", label: "3. Parts", icon: Boxes },
              { id: "expenses", label: "4. Expenses", icon: Receipt },
              { id: "documents", label: "5. Documents", icon: FileCheck },
              { id: "tools", label: "6. Tools", icon: Wrench },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </DialogHeader>

        {/* Workspace Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* ================= TAB 1: GENERAL (READ-ONLY) ================= */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60">
                  Equipment Specifications
                </h4>
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground font-medium">Asset Number</dt>
                    <dd className="font-mono font-bold text-primary mt-0.5">{job.assetNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Modality</dt>
                    <dd className="font-semibold text-foreground mt-0.5">{job.modality}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">OEM</dt>
                    <dd className="font-semibold text-foreground mt-0.5">{job.oem}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Model</dt>
                    <dd className="font-semibold text-foreground mt-0.5">{job.model}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Serial Number</dt>
                    <dd className="font-mono text-foreground mt-0.5">{job.serialNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Location</dt>
                    <dd className="text-foreground mt-0.5">{job.location || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Facility Address</dt>
                    <dd className="text-foreground mt-0.5">{job.address || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Year of Mfg</dt>
                    <dd className="text-foreground mt-0.5">{job.yearOfManufacture || "—"}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60">
                  Dispatch & Contact Details
                </h4>
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground font-medium">Job Type</dt>
                    <dd className="font-semibold text-foreground mt-0.5">{job.jobType}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Priority</dt>
                    <dd className="font-semibold text-foreground mt-0.5">{job.jobPriority}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Primary Engineer</dt>
                    <dd className="font-bold text-foreground mt-0.5">{job.assignedToName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Site Contact</dt>
                    <dd className="text-foreground mt-0.5">{job.contactName || "—"}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 space-y-2 shadow-2xs">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Reported Issue Description
                </h4>
                <p className="text-xs text-foreground bg-muted/30 p-3 rounded-md border border-border/60 leading-relaxed">
                  {job.reportedIssue || "No initial fault notes logged."}
                </p>
              </div>
            </div>
          )}

          {/* ================= TAB 2: LABOUR ================= */}
          {activeTab === "labour" && (
            <div className="space-y-4">
              {/* Schedule and Timers */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60">
                  Service Schedule & Time Tracking
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Travel Start Time</Label>
                    <Input
                      type="time"
                      value={travelStartTime}
                      onChange={(e) => setTravelStartTime(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Travel End Time</Label>
                    <Input
                      type="time"
                      value={travelEndTime}
                      onChange={(e) => setTravelEndTime(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Labour Start Time</Label>
                    <Input
                      type="time"
                      value={labourStartTime}
                      onChange={(e) => setLabourStartTime(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Labour End Time</Label>
                    <Input
                      type="time"
                      value={labourEndTime}
                      onChange={(e) => setLabourEndTime(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Equipment Status</Label>
                    <Select
                      value={equipmentStatus}
                      onValueChange={(val) => setEquipmentStatus(val as EquipmentStatus)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Equipment Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UP" className="text-xs">UP</SelectItem>
                        <SelectItem value="Partially UP" className="text-xs">Partially UP</SelectItem>
                        <SelectItem value="Down" className="text-xs">Down</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Job Status</Label>
                    <Select
                      value={jobStatus}
                      onValueChange={(val) => setJobStatus(val as JobStatus)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Job Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="In Progress" className="text-xs">In Progress</SelectItem>
                        <SelectItem value="On Hold" className="text-xs">On Hold</SelectItem>
                        <SelectItem value="Completed" className="text-xs">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* On Hold Reason if status is On Hold */}
                {jobStatus === "On Hold" && (
                  <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Hold Reason:
                      </span>
                    </div>
                    <Select value={holdReason} onValueChange={setHoldReason}>
                      <SelectTrigger className="h-8 text-xs w-56 bg-background">
                        <SelectValue placeholder="Select Reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Awaiting Part" className="text-xs">Awaiting Part</SelectItem>
                        <SelectItem value="Awaiting Access to Site" className="text-xs">Awaiting Access to Site</SelectItem>
                        <SelectItem value="Awaiting Specialist Tool" className="text-xs">Awaiting Specialist Tool</SelectItem>
                        <SelectItem value="Client Decision Pending" className="text-xs">Client Decision Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Work Done Description */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-2 shadow-2xs">
                <Label htmlFor="workDone" className="text-xs font-bold uppercase tracking-wider">
                  Work Done
                </Label>
                <Textarea
                  id="workDone"
                  rows={3}
                  placeholder="Record service actions performed, diagnostics executed, and tests verified..."
                  value={workDone}
                  onChange={(e) => setWorkDone(e.target.value)}
                  className="text-xs leading-relaxed"
                />
              </div>

              {/* Root Cause & Resolution */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60">
                  Root Cause & Resolution
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Root Cause</Label>
                    <Select value={rootCause} onValueChange={setRootCause}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select Root Cause" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOT_CAUSES.map((rc) => (
                          <SelectItem key={rc} value={rc} className="text-xs">
                            {rc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Resolution</Label>
                    <Select value={resolution} onValueChange={setResolution}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select Resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOLUTIONS.map((res) => (
                          <SelectItem key={res} value={res} className="text-xs">
                            {res}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: PARTS ================= */}
          {activeTab === "parts" && (
            <div className="space-y-4">
              {/* Add Part Section */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60">
                  Search & Add Part Used
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs font-semibold">Part Number</Label>
                    <Input
                      placeholder="e.g. PRT-PWR-882"
                      value={partNumber}
                      onChange={(e) => setPartNumber(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs font-semibold">Description</Label>
                    <Input
                      placeholder="e.g. High Voltage Power Supply Module"
                      value={partDescription}
                      onChange={(e) => setPartDescription(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Unit Cost (NGN)</Label>
                    <Input
                      type="number"
                      value={partUnitCost}
                      onChange={(e) => setPartUnitCost(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Quantity Used</Label>
                    <Input
                      type="number"
                      min="1"
                      value={partQtyUsed}
                      onChange={(e) => setPartQtyUsed(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2 flex items-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddPart}
                      className="h-8 w-full text-xs font-bold gap-1.5 cursor-pointer bg-primary text-primary-foreground"
                    >
                      <Plus className="size-3.5" />
                      <span>Add Part to List</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Parts List Table */}
              <div className="rounded-lg border border-border bg-card shadow-2xs overflow-hidden">
                <div className="p-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Parts Used List ({partsUsed.length})
                  </span>
                  <span className="text-xs font-mono font-bold text-primary">
                    Total: NGN {partsUsed.reduce((acc, p) => acc + p.totalCost, 0).toLocaleString()}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/60 text-muted-foreground uppercase font-bold text-left">
                        <th className="px-3 py-2">Part No</th>
                        <th className="px-3 py-2">Description</th>
                        <th className="px-3 py-2">OEM / Model</th>
                        <th className="px-3 py-2 text-right">Unit Cost</th>
                        <th className="px-3 py-2 text-center">Qty</th>
                        <th className="px-3 py-2 text-right">Total</th>
                        <th className="px-3 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partsUsed.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                            No replacement parts recorded for this job.
                          </td>
                        </tr>
                      ) : (
                        partsUsed.map((p) => (
                          <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-accent/40">
                            <td className="px-3 py-2.5 font-mono font-bold text-primary">{p.partNumber}</td>
                            <td className="px-3 py-2.5 text-foreground">{p.description}</td>
                            <td className="px-3 py-2.5 text-muted-foreground">{p.oem} ({p.model})</td>
                            <td className="px-3 py-2.5 text-right font-mono">NGN {p.unitCost.toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-center font-bold">{p.quantityUsed}</td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground">
                              NGN {p.totalCost.toLocaleString()}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemovePart(p.id)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: EXPENSES ================= */}
          {activeTab === "expenses" && (
            <div className="space-y-4">
              {/* Add Expense Form */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60">
                  Record Service Expense
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Date of Expense</Label>
                    <Input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Type of Expense</Label>
                    <Select
                      value={expenseType}
                      onValueChange={(val) => setExpenseType(val as ExpenseType)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Expense Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Amount (NGN)</Label>
                    <Input
                      type="number"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Finance Expense Code</Label>
                    <Input
                      value={expenseCode}
                      onChange={(e) => setExpenseCode(e.target.value)}
                      placeholder="e.g. FIN-EXP-2026-088"
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Receipt Upload / File</Label>
                    <Input
                      placeholder="e.g. flight_ticket_ek.pdf"
                      value={expenseReceiptFileName}
                      onChange={(e) => setExpenseReceiptFileName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Note / Comment</Label>
                    <Input
                      placeholder="e.g. Taxi transport from airport to facility"
                      value={expenseNote}
                      onChange={(e) => setExpenseNote(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-3 flex justify-end pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddExpense}
                      className="h-8 px-4 text-xs font-bold gap-1.5 cursor-pointer bg-primary text-primary-foreground"
                    >
                      <Plus className="size-3.5" />
                      <span>Add Expense</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Logged Expenses Table */}
              <div className="rounded-lg border border-border bg-card shadow-2xs overflow-hidden">
                <div className="p-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Logged Expenses ({expenses.length})
                  </span>
                  <span className="text-xs font-mono font-bold text-primary">
                    Total: NGN {expenses.reduce((acc, e) => acc + (e.amount || 0), 0).toLocaleString()}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/60 text-muted-foreground uppercase font-bold text-left">
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Expense Code</th>
                        <th className="px-3 py-2">Receipt</th>
                        <th className="px-3 py-2">Note</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                        <th className="px-3 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                            No expenses logged for this service assignment.
                          </td>
                        </tr>
                      ) : (
                        expenses.map((exp) => (
                          <tr key={exp.id} className="border-b border-border/50 last:border-0 hover:bg-accent/40">
                            <td className="px-3 py-2.5 font-mono">{exp.dateOfExpense}</td>
                            <td className="px-3 py-2.5 font-semibold text-foreground">{exp.typeOfExpense}</td>
                            <td className="px-3 py-2.5 font-mono text-muted-foreground">{exp.expenseCode}</td>
                            <td className="px-3 py-2.5 text-xs text-primary underline truncate max-w-[140px]">
                              {exp.receiptFileName || "No Receipt"}
                            </td>
                            <td className="px-3 py-2.5 text-foreground truncate max-w-[180px]">{exp.note}</td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground">
                              NGN {(exp.amount || 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveExpense(exp.id)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: DOCUMENTS ================= */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              {/* Document Upload Form */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60">
                  Attach Service Document
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Document Type</Label>
                    <Select
                      value={docType}
                      onValueChange={(val) => setDocType(val as DebriefDocumentType)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Document Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((d) => (
                          <SelectItem key={d} value={d} className="text-xs">
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">File Name</Label>
                    <Input
                      placeholder="e.g. 3rd_Party_Calibration_Cert.pdf"
                      value={docFileName}
                      onChange={(e) => setDocFileName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Comment</Label>
                    <Input
                      placeholder="e.g. Signed service checklist and delivery note"
                      value={docComment}
                      onChange={(e) => setDocComment(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-3 flex justify-end pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddDocument}
                      className="h-8 px-4 text-xs font-bold gap-1.5 cursor-pointer bg-primary text-primary-foreground"
                    >
                      <Upload className="size-3.5" />
                      <span>Attach Document</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Documents Table */}
              <div className="rounded-lg border border-border bg-card shadow-2xs overflow-hidden">
                <div className="p-3 border-b border-border/60 bg-muted/30">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Attached Documents ({documents.length})
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/60 text-muted-foreground uppercase font-bold text-left">
                        <th className="px-3 py-2">Document Type</th>
                        <th className="px-3 py-2">File Name</th>
                        <th className="px-3 py-2">Comment</th>
                        <th className="px-3 py-2">Date of Upload</th>
                        <th className="px-3 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                            No documents attached yet.
                          </td>
                        </tr>
                      ) : (
                        documents.map((doc) => (
                          <tr key={doc.id} className="border-b border-border/50 last:border-0 hover:bg-accent/40">
                            <td className="px-3 py-2.5 font-semibold text-foreground">{doc.documentType}</td>
                            <td className="px-3 py-2.5 font-mono text-primary font-bold">{doc.fileName}</td>
                            <td className="px-3 py-2.5 text-foreground">{doc.comment}</td>
                            <td className="px-3 py-2.5 font-mono text-muted-foreground">{doc.uploadDate}</td>
                            <td className="px-3 py-2.5 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveDocument(doc.id)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 6: TOOLS ================= */}
          {activeTab === "tools" && (
            <div className="space-y-4">
              {/* Tool Search / Registry Connection */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider pb-2 border-b border-border/60">
                  Search & Link Calibrated Tools (Tools Module)
                </h4>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Search Tool by ID / OEM / Description
                  </Label>
                  <Input
                    placeholder="Type to search (e.g. Fluke, Safety Analyzer, TL-CAL-001)..."
                    value={toolSearchQuery}
                    onChange={(e) => setToolSearchQuery(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />

                  {/* Matching tools list */}
                  {toolSearchQuery.trim() && (
                    <div className="rounded-md border border-border bg-popover text-popover-foreground p-2 space-y-1.5 shadow-md">
                      {TOOL_REGISTRY.filter(
                        (t) =>
                          t.toolId.toLowerCase().includes(toolSearchQuery.toLowerCase()) ||
                          t.description.toLowerCase().includes(toolSearchQuery.toLowerCase()) ||
                          t.oem.toLowerCase().includes(toolSearchQuery.toLowerCase())
                      ).map((tool) => (
                        <div
                          key={tool.toolId}
                          className="flex items-center justify-between p-2 rounded hover:bg-accent text-xs border border-border/40"
                        >
                          <div>
                            <span className="font-mono font-bold text-primary">{tool.toolId}</span>
                            <span className="mx-2">•</span>
                            <span className="font-medium text-foreground">{tool.description}</span>
                            <span className="text-xs text-muted-foreground block">
                              Calibration Due: {tool.calibrationDueDate}
                            </span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddTool(tool)}
                            className="h-7 text-xs px-2.5 font-semibold cursor-pointer"
                          >
                            Select Tool
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Linked Tools Table */}
              <div className="rounded-lg border border-border bg-card shadow-2xs overflow-hidden">
                <div className="p-3 border-b border-border/60 bg-muted/30">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Tools Used for this Service ({toolsUsed.length})
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/60 text-muted-foreground uppercase font-bold text-left">
                        <th className="px-3 py-2">Tool ID</th>
                        <th className="px-3 py-2">Serial Number</th>
                        <th className="px-3 py-2">Description</th>
                        <th className="px-3 py-2">Date of Use</th>
                        <th className="px-3 py-2">Calibration Date</th>
                        <th className="px-3 py-2">Calibration Due</th>
                        <th className="px-3 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {toolsUsed.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                            No calibrated tools linked to this job yet.
                          </td>
                        </tr>
                      ) : (
                        toolsUsed.map((tool) => (
                          <tr key={tool.id} className="border-b border-border/50 last:border-0 hover:bg-accent/40">
                            <td className="px-3 py-2.5 font-mono font-bold text-primary">{tool.toolId}</td>
                            <td className="px-3 py-2.5 font-mono text-muted-foreground">{tool.serialNumber}</td>
                            <td className="px-3 py-2.5 text-foreground">{tool.description}</td>
                            <td className="px-3 py-2.5 font-mono">{tool.dateOfUse}</td>
                            <td className="px-3 py-2.5 font-mono">{tool.calibrationDate}</td>
                            <td className="px-3 py-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {tool.calibrationDueDate}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveTool(tool.id)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-border bg-card flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-9 cursor-pointer"
          >
            Close
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => handleSaveWorkspace()}
            disabled={saving}
            className="text-xs h-9 font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer shadow-sm px-5"
          >
            <CheckCircle2 className="size-4" />
            <span>{saving ? "Saving..." : "Save Workspace"}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
