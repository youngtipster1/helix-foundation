import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { debriefService } from "@/modules/debrief/services/debrief-service";
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
} from "@/modules/debrief/types";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Wrench,
  Clock,
  Boxes,
  Receipt,
  FileCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Search,
  Upload,
  Calendar,
  Building2,
  Navigation,
  MapPin,
  Check,
  Save,
  PauseCircle,
  Play,
  Edit2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/debrief/workspace/$jobId")({
  head: () => ({
    meta: [
      { title: "Job Workspace — Debrief | HEMP" },
      {
        name: "description",
        content: "Engineer execution workspace for logging service labour, parts, expenses, documents, and tools.",
      },
    ],
  }),
  component: DebriefJobWorkspacePage,
});

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

const TOOL_REGISTRY = [
  { toolId: "TL-CAL-001", serialNumber: "SN-FLUKE-9901", description: "Fluke ESA620 Electrical Safety Analyzer", oem: "Fluke Biomedical", calibrationDate: "2026-01-10", calibrationDueDate: "2027-01-10" },
  { toolId: "TL-CAL-002", serialNumber: "SN-RIGEL-4421", description: "Rigel 288+ Defibrillator Analyzer", oem: "Rigel Medical", calibrationDate: "2025-11-15", calibrationDueDate: "2026-11-15" },
  { toolId: "TL-CAL-003", serialNumber: "SN-BC-8812", description: "BC Biomedical Ultrasound Power Meter", oem: "BC Biomedical", calibrationDate: "2026-02-01", calibrationDueDate: "2027-02-01" },
  { toolId: "TL-CAL-004", serialNumber: "SN-FLUKE-7720", description: "Fluke ProSim 8 Vital Signs Simulator", oem: "Fluke Biomedical", calibrationDate: "2025-12-05", calibrationDueDate: "2026-12-05" },
];

function formatTimeNow(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDateNow(): string {
  return new Date().toISOString().split("T")[0];
}

function DebriefJobWorkspacePage() {
  const { jobId } = Route.useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<DebriefJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Labour state
  const [startDate, setStartDate] = useState(formatDateNow());
  const [endDate, setEndDate] = useState(formatDateNow());
  const [travelStartTime, setTravelStartTime] = useState("");
  const [travelEndTime, setTravelEndTime] = useState("");
  const [labourStartTime, setLabourStartTime] = useState("");
  const [labourEndTime, setLabourEndTime] = useState("");
  const [workDone, setWorkDone] = useState("");
  const [equipmentStatus, setEquipmentStatus] = useState<EquipmentStatus>("UP");
  const [jobStatus, setJobStatus] = useState<JobStatus>("In Progress");
  const [holdReason, setHoldReason] = useState("Awaiting Part");
  const [rootCause, setRootCause] = useState<RootCause>("Hardware");
  const [resolution, setResolution] = useState<Resolution>("Calibration");

  // Sub-items state
  const [partsUsed, setPartsUsed] = useState<DebriefPartUsed[]>([]);
  const [expenses, setExpenses] = useState<DebriefExpense[]>([]);
  const [documents, setDocuments] = useState<DebriefDocument[]>([]);
  const [toolsUsed, setToolsUsed] = useState<DebriefToolUsed[]>([]);

  // Modal Dialogs state
  const [editWorkDoneOpen, setEditWorkDoneOpen] = useState(false);
  const [addPartOpen, setAddPartOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [addToolOpen, setAddToolOpen] = useState(false);
  const [holdDialogOpen, setHoldDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  // Form states for modals
  const [partNumber, setPartNumber] = useState("");
  const [partDescription, setPartDescription] = useState("");
  const [partUnitCost, setPartUnitCost] = useState("45000");
  const [partQtyUsed, setPartQtyUsed] = useState("1");

  const [expenseDate, setExpenseDate] = useState(formatDateNow());
  const [expenseType, setExpenseType] = useState<ExpenseType>("Transport (taxi)");
  const [expenseAmount, setExpenseAmount] = useState("15000");
  const [expenseCode, setExpenseCode] = useState("FIN-EXP-2026-088");
  const [expenseReceiptFileName, setExpenseReceiptFileName] = useState("");
  const [expenseNote, setExpenseNote] = useState("");

  const [docType, setDocType] = useState<DebriefDocumentType>("Equipment checklist");
  const [docFileName, setDocFileName] = useState("");
  const [docComment, setDocComment] = useState("");

  const [toolSearchQuery, setToolSearchQuery] = useState("");
  const [toolDateOfUse, setToolDateOfUse] = useState(formatDateNow());

  useEffect(() => {
    async function loadJob() {
      setLoading(true);
      try {
        const found = await debriefService.getById(jobId);
        if (found) {
          setJob(found);
          const today = formatDateNow();
          setStartDate(found.labour?.startDate || found.jobStartDate || found.startDate || today);
          setEndDate(found.labour?.endDate || (found.endDate !== "—" ? found.endDate || today : today));
          setTravelStartTime(found.labour?.travelStartTime || "");
          setTravelEndTime(found.labour?.travelEndTime || "");
          setLabourStartTime(found.labour?.labourStartTime || "");
          setLabourEndTime(found.labour?.labourEndTime || "");
          setWorkDone(found.labour?.workDone || found.reportedIssue || "");
          setEquipmentStatus(found.equipmentStatus || "UP");
          setJobStatus(found.jobStatus || "In Progress");
          setHoldReason(found.holdReason || "Awaiting Part");
          setRootCause(found.rootCause && found.rootCause !== "—" ? found.rootCause : "Hardware");
          setResolution(found.resolution && found.resolution !== "—" ? found.resolution : "Calibration");

          setPartsUsed(found.partsUsed || []);
          setExpenses(found.expenses || []);
          setDocuments(found.documents || []);
          setToolsUsed(found.toolsUsed || []);
        } else {
          toast.error("Job record not found.");
        }
      } catch (err) {
        console.error("Failed to load job workspace", err);
        toast.error("Error loading job details.");
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [jobId]);

  // Stepper Action Handlers
  const handleStartTravel = () => {
    const timeNow = formatTimeNow();
    setTravelStartTime(timeNow);
    toast.success(`Travel started at ${timeNow}`);
  };

  const handleMarkOnSite = () => {
    const timeNow = formatTimeNow();
    if (!travelStartTime) {
      setTravelStartTime(timeNow);
    }
    setTravelEndTime(timeNow);
    setLabourStartTime(timeNow);
    toast.success(`Arrived on site at ${timeNow}. Labour active.`);
  };

  const handleConfirmHold = async () => {
    setJobStatus("On Hold");
    setHoldDialogOpen(false);
    await handleSaveWorkspace("On Hold");
  };

  const handleResumeWork = async () => {
    setJobStatus("In Progress");
    await handleSaveWorkspace("In Progress");
  };

  // Add Item Handlers
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
      modality: job?.modality,
      oem: job?.oem,
      model: job?.model,
      unitCost: cost,
      quantityUsed: qty,
      totalCost: cost * qty,
    };

    setPartsUsed((prev) => [...prev, newPart]);
    setPartNumber("");
    setPartDescription("");
    setPartQtyUsed("1");
    setAddPartOpen(false);
    toast.success(`Part ${newPart.partNumber} added.`);
  };

  const handleRemovePart = (id: string) => {
    setPartsUsed((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddExpense = () => {
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      toast.error("Please enter a valid expense amount.");
      return;
    }

    const newExpense: DebriefExpense = {
      id: `exp_${Date.now()}`,
      dateOfExpense: expenseDate || formatDateNow(),
      typeOfExpense: expenseType,
      receiptAvailable: Boolean(expenseReceiptFileName.trim()),
      receiptFileName: expenseReceiptFileName.trim() || undefined,
      note: expenseNote || "Service expense logged by engineer.",
      expenseCode: expenseCode || "FIN-EXP-2026-088",
      amount: parseFloat(expenseAmount) || 0,
    };

    setExpenses((prev) => [...prev, newExpense]);
    setExpenseNote("");
    setExpenseReceiptFileName("");
    setAddExpenseOpen(false);
    toast.success("Expense logged.");
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAddDocument = () => {
    if (!docFileName.trim()) {
      toast.error("Please enter a document file name.");
      return;
    }

    const newDoc: DebriefDocument = {
      id: `doc_${Date.now()}`,
      documentType: docType,
      comment: docComment || "Service attachment.",
      fileName: docFileName.trim(),
      fileUrl: "#",
      fileSize: "1.5 MB",
      uploadDate: formatDateNow(),
    };

    setDocuments((prev) => [...prev, newDoc]);
    setDocFileName("");
    setDocComment("");
    setAddDocOpen(false);
    toast.success("Document attached.");
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

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
      dateOfUse: toolDateOfUse || formatDateNow(),
      calibrationDate: tool.calibrationDate,
      calibrationDueDate: tool.calibrationDueDate,
    };

    setToolsUsed((prev) => [...prev, newTool]);
    setToolSearchQuery("");
    setAddToolOpen(false);
    toast.success(`Tool ${tool.toolId} linked.`);
  };

  const handleRemoveTool = (id: string) => {
    setToolsUsed((prev) => prev.filter((t) => t.id !== id));
  };

  // Save / Complete Handler
  const handleSaveWorkspace = async (targetJobStatus?: JobStatus) => {
    if (!job) return;

    const finalJobStatus = targetJobStatus || jobStatus;

    if (finalJobStatus === "Completed") {
      if (!workDone.trim()) {
        toast.error("Please describe the Work Done before completing the job.");
        return;
      }
      if (!labourEndTime) {
        setLabourEndTime(formatTimeNow());
      }
    }

    setSaving(true);
    try {
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
          labourEndTime: labourEndTime || (finalJobStatus === "Completed" ? formatTimeNow() : undefined),
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
        setJob(result);
        setJobStatus(finalJobStatus);
        if (finalJobStatus === "Completed") {
          toast.success(`Job ${job.jobNumber} submitted and completed!`);
          navigate({ to: "/app/debrief/my-work" });
        } else if (finalJobStatus === "On Hold") {
          toast.warning(`Job ${job.jobNumber} placed On Hold (${holdReason})`);
        } else {
          toast.success("Job workspace draft saved.");
        }
      }
    } catch (err) {
      console.error("Failed to save workspace", err);
      toast.error("Failed to save workspace records.");
    } finally {
      setSaving(false);
      setCompleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground">
        Loading Job Workspace...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center space-y-3">
        <h3 className="text-sm font-bold text-foreground">Job Not Found</h3>
        <p className="text-xs text-muted-foreground">
          The requested service job was not found.
        </p>
        <Link to="/app/debrief/my-work">
          <Button variant="outline" size="sm" className="text-xs mt-2">
            Back to My Work
          </Button>
        </Link>
      </div>
    );
  }

  const partsTotalCost = partsUsed.reduce((acc, p) => acc + (p.totalCost || 0), 0);
  const expensesTotalAmount = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  const isTravelDone = Boolean(travelStartTime);
  const isLabourStarted = Boolean(labourStartTime);
  const isOnHold = jobStatus === "On Hold";

  return (
    <div className="w-full space-y-5 max-w-4xl mx-auto pb-16">
      {/* Top Header Bar */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link to="/app/debrief/my-work">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs font-semibold gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                <span>My Work</span>
              </Button>
            </Link>
            <span className="text-muted-foreground">•</span>
            <span className="font-mono font-bold text-base text-primary">
              {job.jobNumber}
            </span>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border",
                isOnHold
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
              )}
            >
              {isOnHold ? `On Hold · ${holdReason}` : jobStatus}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSaveWorkspace("In Progress")}
              disabled={saving}
              className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Save className="size-3.5" />
              <span>Save Draft</span>
            </Button>
          </div>
        </div>

        {/* Equipment Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2.5 border-t border-border/50 text-xs">
          <div>
            <span className="text-muted-foreground block">Equipment:</span>
            <span className="font-bold text-foreground">{job.model}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Asset No:</span>
            <span className="font-mono font-semibold text-foreground">{job.assetNumber}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Location:</span>
            <span className="font-medium text-foreground">{job.location || "Main Ward"}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Priority:</span>
            <span className={cn("font-bold", job.jobPriority === "High" ? "text-rose-600" : "text-amber-600")}>
              {job.jobPriority} Priority
            </span>
          </div>
        </div>
      </div>

      {/* ================= 1. SERVICE STAGE CONTROLLER ================= */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Service Stage Controller
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Auto-stamped lifecycle events
          </span>
        </div>

        {/* Stepper Progress Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div
            className={cn(
              "p-3 rounded-lg border flex items-center gap-2.5",
              isTravelDone
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                : "bg-muted/40 border-border text-muted-foreground"
            )}
          >
            <div className={cn("size-5 rounded-full grid place-items-center text-xs font-bold shrink-0", isTravelDone ? "bg-emerald-600 text-white" : "bg-muted-foreground/30 text-muted-foreground")}>
              {isTravelDone ? "✓" : "1"}
            </div>
            <div>
              <span className="font-bold block">1. Travel / Dispatch</span>
              <span className="text-xs opacity-90">
                {travelStartTime ? `Started at ${travelStartTime}` : "Not started"}
              </span>
            </div>
          </div>

          <div
            className={cn(
              "p-3 rounded-lg border flex items-center gap-2.5",
              isLabourStarted
                ? "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200"
                : "bg-muted/40 border-border text-muted-foreground"
            )}
          >
            <div className={cn("size-5 rounded-full grid place-items-center text-xs font-bold shrink-0", isLabourStarted ? "bg-blue-600 text-white" : "bg-muted-foreground/30 text-muted-foreground")}>
              {isLabourStarted ? "✓" : "2"}
            </div>
            <div>
              <span className="font-bold block">2. On-Site Labour</span>
              <span className="text-xs opacity-90">
                {labourStartTime ? `Active since ${labourStartTime}` : "Pending arrival"}
              </span>
            </div>
          </div>

          <div
            className={cn(
              "p-3 rounded-lg border flex items-center gap-2.5",
              jobStatus === "Completed"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                : "bg-muted/40 border-border text-muted-foreground"
            )}
          >
            <div className={cn("size-5 rounded-full grid place-items-center text-xs font-bold shrink-0", jobStatus === "Completed" ? "bg-emerald-600 text-white" : "bg-muted-foreground/30 text-muted-foreground")}>
              {jobStatus === "Completed" ? "✓" : "3"}
            </div>
            <div>
              <span className="font-bold block">3. Final Submission</span>
              <span className="text-xs opacity-90">
                {jobStatus === "Completed" ? "Submitted & Closed" : "Ready for review"}
              </span>
            </div>
          </div>
        </div>

        {/* Current Active Action Buttons */}
        <div className="p-3.5 rounded-lg bg-muted/20 border border-border/60 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-bold text-foreground block">
              {isOnHold
                ? "Job is currently On Hold"
                : !isTravelDone
                ? "Step 1: Start your travel to the hospital site"
                : !isLabourStarted
                ? "Step 2: Mark arrival at site to start labour"
                : "Step 3: Service is active — record actions and submit when done"}
            </span>
            <span className="text-muted-foreground">
              {isOnHold
                ? `Hold Reason: ${holdReason}`
                : "Timestamp will be recorded automatically."}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isOnHold ? (
              <Button
                size="sm"
                onClick={handleResumeWork}
                className="h-8.5 text-xs font-bold gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play className="size-3.5" />
                <span>Resume Work</span>
              </Button>
            ) : !isTravelDone ? (
              <Button
                size="sm"
                onClick={handleStartTravel}
                className="h-8.5 text-xs font-bold gap-1.5 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Navigation className="size-3.5" />
                <span>Start Travel</span>
              </Button>
            ) : !isLabourStarted ? (
              <Button
                size="sm"
                onClick={handleMarkOnSite}
                className="h-8.5 text-xs font-bold gap-1.5 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <MapPin className="size-3.5" />
                <span>Mark On Site</span>
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHoldDialogOpen(true)}
                  className="h-8.5 text-xs font-semibold text-amber-600 border-amber-500/30 hover:bg-amber-500/10 gap-1.5 cursor-pointer"
                >
                  <PauseCircle className="size-3.5" />
                  <span>Put On Hold</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => setCompleteDialogOpen(true)}
                  className="h-8.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>Finish Work & Submit Job</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ================= 2. RECORDED JOB SUMMARY & ACTIONS ================= */}
      <div className="space-y-4">
        {/* Section: Work Done & Diagnosis */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Work Done & Diagnosis
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditWorkDoneOpen(true)}
              className="h-7 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Edit2 className="size-3" />
              <span>Edit Diagnosis & Notes</span>
            </Button>
          </div>

          <div className="space-y-2 text-xs">
            <p className="p-3 rounded-md bg-muted/30 border border-border/60 text-foreground leading-relaxed">
              {workDone || "No work description recorded yet. Click 'Edit Diagnosis & Notes' to log service actions performed."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <span className="text-muted-foreground block">Root Cause:</span>
                <span className="font-semibold text-foreground">{rootCause}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Resolution:</span>
                <span className="font-semibold text-foreground">{resolution}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Equipment Status:</span>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border mt-0.5",
                    equipmentStatus === "UP"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : equipmentStatus === "Partially UP"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                  )}
                >
                  {equipmentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Parts Used */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Boxes className="size-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Parts Used ({partsUsed.length})
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-primary hidden sm:inline">
                Total: NGN {partsTotalCost.toLocaleString()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddPartOpen(true)}
                className="h-7 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Plus className="size-3" />
                <span>Add Part</span>
              </Button>
            </div>
          </div>

          {partsUsed.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">
              No parts recorded for this job.
            </p>
          ) : (
            <div className="divide-y divide-border/40 text-xs">
              {partsUsed.map((p) => (
                <div key={p.id} className="py-2 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-mono font-bold text-primary mr-2">{p.partNumber}</span>
                    <span className="font-medium text-foreground">{p.description}</span>
                    <span className="text-muted-foreground block sm:inline sm:ml-2">
                      (Qty: {p.quantityUsed} × NGN {p.unitCost.toLocaleString()})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-foreground">
                      NGN {p.totalCost.toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePart(p.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Service Expenses */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Receipt className="size-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Service Expenses ({expenses.length})
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-primary hidden sm:inline">
                Total: NGN {expensesTotalAmount.toLocaleString()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddExpenseOpen(true)}
                className="h-7 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Plus className="size-3" />
                <span>Log Expense</span>
              </Button>
            </div>
          </div>

          {expenses.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">
              No service expenses logged.
            </p>
          ) : (
            <div className="divide-y divide-border/40 text-xs">
              {expenses.map((exp) => (
                <div key={exp.id} className="py-2 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-foreground mr-2">{exp.typeOfExpense}</span>
                    <span className="text-muted-foreground font-mono mr-2">[{exp.expenseCode}]</span>
                    <span className="text-muted-foreground">{exp.note}</span>
                    {exp.receiptFileName && (
                      <span className="text-primary underline ml-2 block sm:inline">
                        Receipt: {exp.receiptFileName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-foreground">
                      NGN {(exp.amount || 0).toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExpense(exp.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Service Documents */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <FileCheck className="size-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Service Documents ({documents.length})
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddDocOpen(true)}
              className="h-7 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Plus className="size-3" />
              <span>Attach Document</span>
            </Button>
          </div>

          {documents.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">
              No documents attached.
            </p>
          ) : (
            <div className="divide-y divide-border/40 text-xs">
              {documents.map((doc) => (
                <div key={doc.id} className="py-2 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-foreground mr-2">{doc.documentType}</span>
                    <span className="font-mono text-primary font-bold mr-2">{doc.fileName}</span>
                    <span className="text-muted-foreground">{doc.comment}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-muted-foreground">{doc.uploadDate}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDocument(doc.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Calibrated Tools */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Wrench className="size-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Calibrated Tools ({toolsUsed.length})
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddToolOpen(true)}
              className="h-7 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Plus className="size-3" />
              <span>Link Tool</span>
            </Button>
          </div>

          {toolsUsed.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">
              No calibrated tools linked to this job.
            </p>
          ) : (
            <div className="divide-y divide-border/40 text-xs">
              {toolsUsed.map((tool) => (
                <div key={tool.id} className="py-2 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-mono font-bold text-primary mr-2">{tool.toolId}</span>
                    <span className="font-medium text-foreground mr-2">{tool.description}</span>
                    <span className="text-muted-foreground font-mono">({tool.serialNumber})</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Due: {tool.calibrationDueDate}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTool(tool.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sticky Action Footer */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 sticky bottom-4 z-10">
        <Link to="/app/debrief/my-work">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs font-semibold cursor-pointer"
          >
            ← Back to My Work
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSaveWorkspace("In Progress")}
            disabled={saving}
            className="h-9 text-xs font-semibold gap-1.5 cursor-pointer px-4"
          >
            <Save className="size-3.5" />
            <span>Save Draft</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCompleteDialogOpen(true)}
            disabled={saving}
            className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-sm px-5"
          >
            <CheckCircle2 className="size-4" />
            <span>Finish Work & Submit Job</span>
          </Button>
        </div>
      </div>

      {/* ================= MODAL: EDIT WORK DONE & DIAGNOSIS ================= */}
      <Dialog open={editWorkDoneOpen} onOpenChange={setEditWorkDoneOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">
              Edit Work Done & Diagnosis
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Work Done Description</Label>
              <Textarea
                rows={4}
                value={workDone}
                onChange={(e) => setWorkDone(e.target.value)}
                placeholder="Describe actions performed, diagnostics executed, and tests verified..."
                className="text-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Root Cause</Label>
                <Select value={rootCause} onValueChange={setRootCause}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Root Cause" />
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
                    <SelectValue placeholder="Resolution" />
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

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Final Equipment Status</Label>
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
          </div>
          <DialogFooter>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditWorkDoneOpen(false);
                toast.success("Diagnosis updated.");
              }}
              className="h-8 text-xs font-bold"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: ADD PART ================= */}
      <Dialog open={addPartOpen} onOpenChange={setAddPartOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">
              Add Part Used
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Part Number</Label>
              <Input
                placeholder="e.g. PRT-PWR-882"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Description</Label>
              <Input
                placeholder="e.g. High Voltage Power Module"
                value={partDescription}
                onChange={(e) => setPartDescription(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <Label className="text-xs font-semibold">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={partQtyUsed}
                  onChange={(e) => setPartQtyUsed(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              size="sm"
              onClick={handleAddPart}
              className="h-8 text-xs font-bold"
            >
              Add Part to List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: LOG EXPENSE ================= */}
      <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">
              Log Service Expense
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Date</Label>
                <Input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Type</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <Label className="text-xs font-semibold">Finance Code</Label>
                <Input
                  value={expenseCode}
                  onChange={(e) => setExpenseCode(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Receipt File Name / Ref</Label>
              <Input
                placeholder="e.g. uber_receipt.pdf"
                value={expenseReceiptFileName}
                onChange={(e) => setExpenseReceiptFileName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Note</Label>
              <Input
                placeholder="e.g. Travel to hospital site"
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              size="sm"
              onClick={handleAddExpense}
              className="h-8 text-xs font-bold"
            >
              Log Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: ATTACH DOCUMENT ================= */}
      <Dialog open={addDocOpen} onOpenChange={setAddDocOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">
              Attach Service Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
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
                placeholder="e.g. Service_Checklist_Signed.pdf"
                value={docFileName}
                onChange={(e) => setDocFileName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Comment / Note</Label>
              <Input
                placeholder="e.g. Signed checklist and delivery note"
                value={docComment}
                onChange={(e) => setDocComment(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              size="sm"
              onClick={handleAddDocument}
              className="h-8 text-xs font-bold"
            >
              Attach Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: LINK TOOL ================= */}
      <Dialog open={addToolOpen} onOpenChange={setAddToolOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">
              Link Calibrated Tool
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Search Tool Registry</Label>
              <Input
                placeholder="Type tool name or ID (e.g. Fluke, Safety Analyzer)..."
                value={toolSearchQuery}
                onChange={(e) => setToolSearchQuery(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {TOOL_REGISTRY.filter(
                (t) =>
                  !toolSearchQuery.trim() ||
                  t.toolId.toLowerCase().includes(toolSearchQuery.toLowerCase()) ||
                  t.description.toLowerCase().includes(toolSearchQuery.toLowerCase()) ||
                  t.oem.toLowerCase().includes(toolSearchQuery.toLowerCase())
              ).map((tool) => (
                <div
                  key={tool.toolId}
                  className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/20 text-xs hover:bg-accent cursor-pointer"
                  onClick={() => handleAddTool(tool)}
                >
                  <div>
                    <span className="font-mono font-bold text-primary mr-2">{tool.toolId}</span>
                    <span className="font-medium text-foreground">{tool.description}</span>
                    <span className="text-muted-foreground block text-xs">
                      Cal Due: {tool.calibrationDueDate}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs font-bold text-primary">
                    Select
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: PUT ON HOLD ================= */}
      <Dialog open={holdDialogOpen} onOpenChange={setHoldDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-amber-600 flex items-center gap-2">
              <AlertTriangle className="size-4" />
              Put Job On Hold
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground">
              Select the primary hold reason preventing further work on this job:
            </p>
            <Select value={holdReason} onValueChange={setHoldReason}>
              <SelectTrigger className="h-8 text-xs">
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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHoldDialogOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmHold}
              className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              Confirm Hold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: CONFIRM FINISH & SUBMIT ================= */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              Finish Work & Submit Job
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground">
              Review and confirm the completion of service job <strong>{job.jobNumber}</strong>:
            </p>

            <div className="p-3 rounded-md bg-muted/40 border border-border/60 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parts Used:</span>
                <span className="font-bold text-foreground">{partsUsed.length} item(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expenses Logged:</span>
                <span className="font-bold text-foreground">{expenses.length} item(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Documents Attached:</span>
                <span className="font-bold text-foreground">{documents.length} file(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Calibrated Tools:</span>
                <span className="font-bold text-foreground">{toolsUsed.length} tool(s)</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/40">
                <span className="text-muted-foreground">Equipment Status:</span>
                <span className="font-bold text-emerald-600">{equipmentStatus}</span>
              </div>
            </div>

            {!workDone.trim() && (
              <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
                ⚠️ Work Done notes are required before submitting.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCompleteDialogOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleSaveWorkspace("Completed")}
              disabled={!workDone.trim() || saving}
              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              Submit & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
