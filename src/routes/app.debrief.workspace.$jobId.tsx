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
  Navigation,
  MapPin,
  Check,
  Save,
  PauseCircle,
  Play,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/debrief/workspace/$jobId")({
  head: () => ({
    meta: [
      { title: "Job Workspace — Debrief | HEMP" },
      {
        name: "description",
        content: "Event-driven engineer execution workspace for active service jobs.",
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

interface TimelineEvent {
  id: string;
  time?: string;
  title: string;
  subtitle?: string;
  type: "travel" | "labour" | "part" | "expense" | "doc" | "tool" | "hold" | "complete";
}

function DebriefJobWorkspacePage() {
  const { jobId } = Route.useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<DebriefJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFullSpecs, setShowFullSpecs] = useState(false);

  // Labour & Timestamps state
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

  // Supporting items state
  const [partsUsed, setPartsUsed] = useState<DebriefPartUsed[]>([]);
  const [expenses, setExpenses] = useState<DebriefExpense[]>([]);
  const [documents, setDocuments] = useState<DebriefDocument[]>([]);
  const [toolsUsed, setToolsUsed] = useState<DebriefToolUsed[]>([]);

  // Modal Dialogs state
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

  // Derive Current Lifecycle Stage
  const currentStage = useMemo<"assigned" | "travel" | "working" | "on_hold" | "completed">(() => {
    if (jobStatus === "Completed") return "completed";
    if (jobStatus === "On Hold") return "on_hold";
    if (labourStartTime) return "working";
    if (travelStartTime) return "travel";
    return "assigned";
  }, [jobStatus, labourStartTime, travelStartTime]);

  // Event Stamping Actions
  const handleStartTravel = async () => {
    const timeNow = formatTimeNow();
    setTravelStartTime(timeNow);
    await debriefService.update(jobId, {
      jobStatus: "In Progress",
      labour: {
        startDate: job?.jobStartDate || formatDateNow(),
        endDate: formatDateNow(),
        travelStartTime: timeNow,
        workDone,
        equipmentStatus,
        jobStatus: "In Progress",
      },
    });
    toast.success(`Travel started at ${timeNow}`);
  };

  const handleArrivedOnSite = async () => {
    const timeNow = formatTimeNow();
    const travelStart = travelStartTime || "08:00";
    setTravelEndTime(timeNow);
    setLabourStartTime(timeNow);
    await debriefService.update(jobId, {
      jobStatus: "In Progress",
      labour: {
        startDate: job?.jobStartDate || formatDateNow(),
        endDate: formatDateNow(),
        travelStartTime: travelStart,
        travelEndTime: timeNow,
        labourStartTime: timeNow,
        workDone,
        equipmentStatus,
        jobStatus: "In Progress",
      },
    });
    toast.success(`Arrived on site at ${timeNow}. Labour started.`);
  };

  const handleConfirmHold = async () => {
    setJobStatus("On Hold");
    setHoldDialogOpen(false);
    await handleSaveAll("On Hold");
    toast.warning(`Job placed On Hold (${holdReason})`);
  };

  const handleResumeWork = async () => {
    setJobStatus("In Progress");
    await handleSaveAll("In Progress");
    toast.success("Job resumed. Work in progress.");
  };

  // Add Item Handlers
  const handleAddPart = async () => {
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

    const updated = [...partsUsed, newPart];
    setPartsUsed(updated);
    setPartNumber("");
    setPartDescription("");
    setPartQtyUsed("1");
    setAddPartOpen(false);
    await debriefService.update(jobId, { partsUsed: updated });
    toast.success(`Part ${newPart.partNumber} recorded.`);
  };

  const handleRemovePart = async (id: string) => {
    const updated = partsUsed.filter((p) => p.id !== id);
    setPartsUsed(updated);
    await debriefService.update(jobId, { partsUsed: updated });
  };

  const handleAddExpense = async () => {
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

    const updated = [...expenses, newExpense];
    setExpenses(updated);
    setExpenseNote("");
    setExpenseReceiptFileName("");
    setAddExpenseOpen(false);
    await debriefService.update(jobId, { expenses: updated });
    toast.success("Expense logged.");
  };

  const handleRemoveExpense = async (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    await debriefService.update(jobId, { expenses: updated });
  };

  const handleAddDocument = async () => {
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

    const updated = [...documents, newDoc];
    setDocuments(updated);
    setDocFileName("");
    setDocComment("");
    setAddDocOpen(false);
    await debriefService.update(jobId, { documents: updated });
    toast.success("Document attached.");
  };

  const handleRemoveDocument = async (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    setDocuments(updated);
    await debriefService.update(jobId, { documents: updated });
  };

  const handleAddTool = async (tool: typeof TOOL_REGISTRY[0]) => {
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

    const updated = [...toolsUsed, newTool];
    setToolsUsed(updated);
    setToolSearchQuery("");
    setAddToolOpen(false);
    await debriefService.update(jobId, { toolsUsed: updated });
    toast.success(`Tool ${tool.toolId} linked.`);
  };

  const handleRemoveTool = async (id: string) => {
    const updated = toolsUsed.filter((t) => t.id !== id);
    setToolsUsed(updated);
    await debriefService.update(jobId, { toolsUsed: updated });
  };

  // General Save
  const handleSaveAll = async (targetJobStatus?: JobStatus) => {
    if (!job) return;

    const finalStatus = targetJobStatus || jobStatus;
    setSaving(true);
    try {
      const finishTime = finalStatus === "Completed" ? (labourEndTime || formatTimeNow()) : labourEndTime;

      const updatedJob: Partial<DebriefJob> = {
        equipmentStatus,
        jobStatus: finalStatus,
        holdReason: finalStatus === "On Hold" ? holdReason : undefined,
        rootCause: finalStatus === "Completed" ? rootCause : rootCause || "—",
        resolution: finalStatus === "Completed" ? resolution : resolution || "—",
        endDate: finalStatus === "Completed" ? formatDateNow() : "—",
        labour: {
          startDate: job.jobStartDate || formatDateNow(),
          endDate: formatDateNow(),
          travelStartTime,
          travelEndTime,
          labourStartTime,
          labourEndTime: finishTime,
          workDone,
          equipmentStatus,
          jobStatus: finalStatus,
          holdReason: finalStatus === "On Hold" ? holdReason : undefined,
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
        setJobStatus(finalStatus);
        if (finalStatus === "Completed") {
          toast.success(`Job ${job.jobNumber} completed!`);
          navigate({ to: "/app/debrief/my-work" });
        }
      }
    } catch (err) {
      console.error("Failed to save workspace", err);
      toast.error("Failed to update job records.");
    } finally {
      setSaving(false);
      setCompleteDialogOpen(false);
    }
  };

  // Construct Chronological Timeline Events
  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const list: TimelineEvent[] = [];

    if (travelStartTime) {
      list.push({
        id: "ev_travel",
        time: travelStartTime,
        title: "Travel Dispatched",
        subtitle: `Travel started towards customer site (${job?.location || "Facility"})`,
        type: "travel",
      });
    }

    if (labourStartTime) {
      list.push({
        id: "ev_arrive",
        time: labourStartTime,
        title: "Arrived On Site & Labour Started",
        subtitle: "Diagnostic checks and service execution initiated",
        type: "labour",
      });
    }

    partsUsed.forEach((p) => {
      list.push({
        id: p.id,
        title: `Part Logged: ${p.partNumber}`,
        subtitle: `${p.description} (Qty: ${p.quantityUsed} · NGN ${p.totalCost.toLocaleString()})`,
        type: "part",
      });
    });

    expenses.forEach((e) => {
      list.push({
        id: e.id,
        time: e.dateOfExpense,
        title: `Expense: ${e.typeOfExpense}`,
        subtitle: `NGN ${(e.amount || 0).toLocaleString()} · [${e.expenseCode}] ${e.note}`,
        type: "expense",
      });
    });

    toolsUsed.forEach((t) => {
      list.push({
        id: t.id,
        title: `Tool Linked: ${t.toolId}`,
        subtitle: `${t.description} (Cal Due: ${t.calibrationDueDate})`,
        type: "tool",
      });
    });

    documents.forEach((d) => {
      list.push({
        id: d.id,
        time: d.uploadDate,
        title: `Doc Attached: ${d.documentType}`,
        subtitle: `${d.fileName} — ${d.comment}`,
        type: "doc",
      });
    });

    if (jobStatus === "On Hold") {
      list.push({
        id: "ev_hold",
        title: "Job Placed On Hold",
        subtitle: `Reason: ${holdReason}`,
        type: "hold",
      });
    }

    if (jobStatus === "Completed") {
      list.push({
        id: "ev_done",
        time: labourEndTime || formatTimeNow(),
        title: "Job Completed & Closed",
        subtitle: `Equipment Status: ${equipmentStatus} · Root Cause: ${rootCause}`,
        type: "complete",
      });
    }

    return list;
  }, [
    travelStartTime,
    labourStartTime,
    labourEndTime,
    partsUsed,
    expenses,
    toolsUsed,
    documents,
    jobStatus,
    holdReason,
    equipmentStatus,
    rootCause,
    job?.location,
  ]);

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
                currentStage === "on_hold"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : currentStage === "completed"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
              )}
            >
              {currentStage === "on_hold"
                ? `On Hold · ${holdReason}`
                : currentStage === "completed"
                ? "Completed"
                : currentStage === "working"
                ? "Working On Site"
                : currentStage === "travel"
                ? "In Transit"
                : "Assigned"}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFullSpecs(!showFullSpecs)}
            className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
          >
            <Info className="size-3.5" />
            <span>{showFullSpecs ? "Hide Job Specs" : "View Job Specs"}</span>
            {showFullSpecs ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </Button>
        </div>

        {/* Compact Equipment Summary */}
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
            <span className="text-muted-foreground block">Job Type:</span>
            <span className="font-semibold text-foreground">{job.jobType}</span>
          </div>
        </div>

        {/* Collapsible Full Job & Asset Specification (Slide 6 Spec) */}
        {showFullSpecs && (
          <div className="pt-3 border-t border-border/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-muted/20 p-3 rounded-lg">
            <div className="space-y-1">
              <span className="font-bold text-foreground uppercase tracking-wider block text-xs">
                Equipment Info
              </span>
              <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                <span>Modality: <strong className="text-foreground">{job.modality}</strong></span>
                <span>OEM: <strong className="text-foreground">{job.oem}</strong></span>
                <span>Serial No: <strong className="text-foreground font-mono">{job.serialNumber || "—"}</strong></span>
                <span>Year of Mfg: <strong className="text-foreground">{job.yearOfManufacture || "—"}</strong></span>
                <span>Warranty: <strong className="text-foreground font-mono">{job.warrantyEndDate || "—"}</strong></span>
                <span>Contract: <strong className="text-foreground font-mono">{job.contractEndDate || "—"}</strong></span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-foreground uppercase tracking-wider block text-xs">
                Dispatch Info
              </span>
              <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                <span>Priority: <strong className="text-rose-600">{job.jobPriority}</strong></span>
                <span>Start Date: <strong className="text-foreground font-mono">{job.jobStartDate || "—"}</strong></span>
                <span>Site Contact: <strong className="text-foreground">{job.contactName || "—"}</strong></span>
                <span>Assigned To: <strong className="text-foreground">{job.assignedToName}</strong></span>
                <span className="col-span-2">Address: <strong className="text-foreground">{job.address || "—"}</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= 1. LIVE STAGE TRACKER ================= */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-3">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
          Job Lifecycle Progress
        </span>

        <div className="grid grid-cols-4 gap-2 text-xs">
          <div
            className={cn(
              "p-2.5 rounded-lg border text-center space-y-0.5",
              currentStage === "assigned"
                ? "bg-primary/10 border-primary text-primary font-bold"
                : "bg-muted/30 border-border text-foreground"
            )}
          >
            <span className="block text-xs uppercase tracking-wider">1. Assigned</span>
            <span className="text-xs opacity-75">{travelStartTime ? "✓ Dispatched" : "Ready"}</span>
          </div>

          <div
            className={cn(
              "p-2.5 rounded-lg border text-center space-y-0.5",
              currentStage === "travel"
                ? "bg-blue-600 text-white border-blue-600 font-bold shadow-xs"
                : travelStartTime
                ? "bg-muted/30 border-border text-foreground"
                : "bg-muted/10 border-border/40 text-muted-foreground"
            )}
          >
            <span className="block text-xs uppercase tracking-wider">2. Travel</span>
            <span className="text-xs opacity-90">{travelStartTime ? `Departed ${travelStartTime}` : "Pending"}</span>
          </div>

          <div
            className={cn(
              "p-2.5 rounded-lg border text-center space-y-0.5",
              currentStage === "working" || currentStage === "on_hold"
                ? "bg-blue-600 text-white border-blue-600 font-bold shadow-xs"
                : labourStartTime
                ? "bg-muted/30 border-border text-foreground"
                : "bg-muted/10 border-border/40 text-muted-foreground"
            )}
          >
            <span className="block text-xs uppercase tracking-wider">3. On Site</span>
            <span className="text-xs opacity-90">
              {currentStage === "on_hold" ? "Paused (On Hold)" : labourStartTime ? `Active ${labourStartTime}` : "Pending"}
            </span>
          </div>

          <div
            className={cn(
              "p-2.5 rounded-lg border text-center space-y-0.5",
              currentStage === "completed"
                ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs"
                : "bg-muted/10 border-border/40 text-muted-foreground"
            )}
          >
            <span className="block text-xs uppercase tracking-wider">4. Complete</span>
            <span className="text-xs opacity-75">{currentStage === "completed" ? "Submitted" : "Pending"}</span>
          </div>
        </div>
      </div>

      {/* ================= 2. PRIMARY FOCUS: CURRENT STAGE & NEXT ACTION ================= */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-4">
        {/* Stage A: Assigned */}
        {currentStage === "assigned" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                Current Stage: Job Assigned
              </span>
              <h3 className="text-sm font-bold text-foreground">
                Ready to travel to customer site
              </h3>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-xs space-y-1">
              <span className="font-bold text-muted-foreground block">Reported Issue:</span>
              <p className="text-foreground leading-relaxed">
                {job.reportedIssue || "Diagnostic service inspection required."}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <span className="text-xs text-muted-foreground">
                Next Action: Start travel to auto-record departure time.
              </span>
              <Button
                size="sm"
                onClick={handleStartTravel}
                className="h-9 px-5 text-xs font-bold gap-1.5 cursor-pointer bg-primary text-primary-foreground shadow-xs"
              >
                <Navigation className="size-3.5" />
                <span>Start Travel</span>
              </Button>
            </div>
          </div>
        )}

        {/* Stage B: Travel In Progress */}
        {currentStage === "travel" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
                Current Stage: Travel In Progress
              </span>
              <h3 className="text-sm font-bold text-foreground">
                En route to {job.location || "Facility"} (Departed at {travelStartTime})
              </h3>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-xs space-y-1">
              <span className="font-bold text-muted-foreground block">Destination & Contact:</span>
              <p className="text-foreground">
                {job.address || job.location || "Hospital Site"} · Contact: {job.contactName || "Site Officer"}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <span className="text-xs text-muted-foreground">
                Next Action: Mark arrival on site to begin labour timer.
              </span>
              <Button
                size="sm"
                onClick={handleArrivedOnSite}
                className="h-9 px-5 text-xs font-bold gap-1.5 cursor-pointer bg-primary text-primary-foreground shadow-xs"
              >
                <MapPin className="size-3.5" />
                <span>Arrived On Site / Start Work</span>
              </Button>
            </div>
          </div>
        )}

        {/* Stage C: Working On Site */}
        {currentStage === "working" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                  Current Stage: Working On Site
                </span>
                <h3 className="text-sm font-bold text-foreground">
                  Labour Active (Started at {labourStartTime})
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                LIVE
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Record Work Performed & Findings
              </Label>
              <Textarea
                rows={3}
                value={workDone}
                onChange={(e) => setWorkDone(e.target.value)}
                placeholder="Describe diagnostics performed, repairs executed, and test verification..."
                className="text-xs leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHoldDialogOpen(true)}
                className="h-9 text-xs font-semibold text-amber-600 border-amber-500/30 hover:bg-amber-500/10 gap-1.5 cursor-pointer"
              >
                <PauseCircle className="size-3.5" />
                <span>Put On Hold (e.g. Awaiting Part)</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setCompleteDialogOpen(true)}
                className="h-9 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Finish Work & Submit Job</span>
              </Button>
            </div>
          </div>
        )}

        {/* Stage D: On Hold */}
        {currentStage === "on_hold" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
                Current Stage: Job On Hold
              </span>
              <h3 className="text-sm font-bold text-foreground">
                Work paused due to: <strong>{holdReason}</strong>
              </h3>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
              When the required spare part, site access, or client authorization arrives, tap <strong>Resume Work</strong> to reactivate the labour session.
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-border/40">
              <Button
                size="sm"
                onClick={handleResumeWork}
                className="h-9 px-5 text-xs font-bold gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                <Play className="size-3.5" />
                <span>Resume Work</span>
              </Button>
            </div>
          </div>
        )}

        {/* Stage E: Completed */}
        {currentStage === "completed" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                Job Completed
              </span>
              <h3 className="text-sm font-bold text-foreground">
                Service closed and submitted successfully
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200">
              All labour events, parts, expenses, and attached documents have been filed to the permanent register.
            </div>
          </div>
        )}
      </div>

      {/* ================= 3. SUPPORTING ACTIONS (ONE-TAP MICRO-ACTIONS) ================= */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-border/40">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Record Job Items
          </span>
          <span className="text-xs text-muted-foreground">
            Log events as they occur
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAddPartOpen(true)}
            className="h-9 text-xs font-semibold gap-1.5 cursor-pointer justify-start"
          >
            <Boxes className="size-3.5 text-primary" />
            <span>+ Add Part ({partsUsed.length})</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAddExpenseOpen(true)}
            className="h-9 text-xs font-semibold gap-1.5 cursor-pointer justify-start"
          >
            <Receipt className="size-3.5 text-primary" />
            <span>+ Log Expense ({expenses.length})</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAddDocOpen(true)}
            className="h-9 text-xs font-semibold gap-1.5 cursor-pointer justify-start"
          >
            <FileCheck className="size-3.5 text-primary" />
            <span>+ Attach Doc ({documents.length})</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAddToolOpen(true)}
            className="h-9 text-xs font-semibold gap-1.5 cursor-pointer justify-start"
          >
            <Wrench className="size-3.5 text-primary" />
            <span>+ Link Tool ({toolsUsed.length})</span>
          </Button>
        </div>
      </div>

      {/* ================= 4. JOB ACTIVITY & EVENT TIMELINE ================= */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Job Activity Timeline ({timelineEvents.length} Events)
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            Auto-calculated log
          </span>
        </div>

        {timelineEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-3 text-center">
            No events logged yet. Tap "Start Travel" to record your departure.
          </p>
        ) : (
          <div className="divide-y divide-border/40 text-xs">
            {timelineEvents.map((ev) => (
              <div key={ev.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {ev.time && (
                      <span className="font-mono font-bold text-xs text-primary px-1.5 py-0.5 rounded bg-primary/10">
                        {ev.time}
                      </span>
                    )}
                    <span className="font-bold text-foreground">{ev.title}</span>
                  </div>
                  {ev.subtitle && (
                    <p className="text-muted-foreground text-xs pl-0.5">{ev.subtitle}</p>
                  )}
                </div>

                {/* Remove button for supporting item rows */}
                {ev.type === "part" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePart(ev.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
                {ev.type === "expense" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveExpense(ev.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
                {ev.type === "doc" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDocument(ev.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
                {ev.type === "tool" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTool(ev.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= MODAL: ADD PART ================= */}
      <Dialog open={addPartOpen} onOpenChange={setAddPartOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">
              Record Part Used
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
              Add Part to Log
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
              <Label className="text-xs font-semibold">Receipt File / Ref</Label>
              <Input
                placeholder="e.g. taxi_receipt.pdf"
                value={expenseReceiptFileName}
                onChange={(e) => setExpenseReceiptFileName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Note</Label>
              <Input
                placeholder="e.g. Transport to facility"
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
              Save Expense
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
                placeholder="e.g. Signed_Service_Report.pdf"
                value={docFileName}
                onChange={(e) => setDocFileName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Comment</Label>
              <Input
                placeholder="e.g. Signed by biomedical head"
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
              Attach to Job
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              Final Service Sign-Off & Close Job
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider">
                Work Done / Corrective Actions Performed *
              </Label>
              <Textarea
                rows={3}
                value={workDone}
                onChange={(e) => setWorkDone(e.target.value)}
                placeholder="Detail the technical fix, adjustments, and test protocols executed..."
                className="text-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Root Cause *</Label>
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
                <Label className="text-xs font-semibold">Resolution *</Label>
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
              <Label className="text-xs font-semibold">Final Equipment Status *</Label>
              <Select
                value={equipmentStatus}
                onValueChange={(val) => setEquipmentStatus(val as EquipmentStatus)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Equipment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UP" className="text-xs">UP (Fully Operational)</SelectItem>
                  <SelectItem value="Partially UP" className="text-xs">Partially UP</SelectItem>
                  <SelectItem value="Down" className="text-xs">Down (Non-functional)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              onClick={() => handleSaveAll("Completed")}
              disabled={!workDone.trim() || saving}
              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs px-4"
            >
              Confirm & Submit Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
