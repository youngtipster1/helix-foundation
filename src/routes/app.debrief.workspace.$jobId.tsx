import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { debriefService, computeJobCosts } from "@/modules/debrief/services/debrief-service";
import { partsService } from "@/modules/parts/services/parts-service";
import type { Part } from "@/modules/parts/types";
import { toolsService } from "@/modules/tools/services/tools-service";
import type { Tool } from "@/modules/tools/types";
import type {
  DebriefJob,
  EquipmentStatus,
  JobStatus,
  JobStage,
  RootCause,
  Resolution,
  DebriefPartUsed,
  DebriefExpense,
  ExpenseType,
  DebriefDocument,
  DebriefDocumentType,
  DebriefToolUsed,
} from "@/modules/debrief/types";
import { useAuth } from "@/features/auth/auth-context";
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
  DialogDescription,
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
  ShieldCheck,
  Lock,
  Unlock,
  UserCheck,
  Calendar,
  Building2,
  Phone,
  Mail,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/debrief/workspace/$jobId")({
  head: () => ({
    meta: [
      { title: "Job Workspace — Debrief | HEMP" },
      {
        name: "description",
        content: "Guided engineer execution journey for active biomedical service jobs.",
      },
    ],
  }),
  component: DebriefJobWorkspacePage,
});

const ROOT_CAUSES: RootCause[] = [
  "Hardware",
  "Software",
  "Consumable",
  "Power supply",
  "User error",
  "Calibration drift",
  "Environmental",
];

const RESOLUTIONS: Resolution[] = [
  "Component replacement",
  "Calibration",
  "Software reload",
  "Hardware error",
  "Accessory replacement",
  "End user training",
  "Consumable replenishment",
  "Preventive maintenance protocol",
];

const EXPENSE_TYPES: ExpenseType[] = [
  "Transport (taxi)",
  "Transport (flight)",
  "Lodging",
  "Feeding",
];

const DOCUMENT_TYPES: DebriefDocumentType[] = [
  "Equipment checklist",
  "Installation checklist",
  "Delivery note",
  "3rd party service report",
  "Others",
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

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function DebriefJobWorkspacePage() {
  const { jobId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState<DebriefJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specsModalOpen, setSpecsModalOpen] = useState(false);

  // Labour & Timestamps state
  const [travelStartTime, setTravelStartTime] = useState("");
  const [travelEndTime, setTravelEndTime] = useState("");
  const [labourStartTime, setLabourStartTime] = useState("");
  const [labourEndTime, setLabourEndTime] = useState("");
  const [workDone, setWorkDone] = useState("");
  const [equipmentStatus, setEquipmentStatus] = useState<EquipmentStatus>("UP");
  const [jobStatus, setJobStatus] = useState<JobStatus>("Open");
  const [stage, setStage] = useState<JobStage>("assigned");
  const [holdReason, setHoldReason] = useState("Awaiting Part");
  const [rootCause, setRootCause] = useState<RootCause>("Hardware");
  const [resolution, setResolution] = useState<Resolution>("Component replacement");

  // Supporting items state
  const [partsUsed, setPartsUsed] = useState<DebriefPartUsed[]>([]);
  const [expenses, setExpenses] = useState<DebriefExpense[]>([]);
  const [documents, setDocuments] = useState<DebriefDocument[]>([]);
  const [toolsUsed, setToolsUsed] = useState<DebriefToolUsed[]>([]);

  // Sign-off State
  const [clientSignoffName, setClientSignoffName] = useState("");
  const [clientSignoffDesignation, setClientSignoffDesignation] = useState("");
  const [signoffConfirmed, setSignoffConfirmed] = useState(false);

  // Modal Dialogs state
  const [addPartOpen, setAddPartOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [addToolOpen, setAddToolOpen] = useState(false);
  const [holdDialogOpen, setHoldDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  // Live Parts Inventory & Tools Registry from modules
  const [inventoryParts, setInventoryParts] = useState<Part[]>([]);
  const [toolsRegistry, setToolsRegistry] = useState<Tool[]>([]);

  // Form states for Part modal with Live Inventory Search & Lock
  const [partSearchQuery, setPartSearchQuery] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [partSerialNumber, setPartSerialNumber] = useState("");
  const [partDescription, setPartDescription] = useState("");
  const [partModality, setPartModality] = useState("");
  const [partOem, setPartOem] = useState("");
  const [partModel, setPartModel] = useState("");
  const [partUnitCost, setPartUnitCost] = useState("150000");
  const [partQtyUsed, setPartQtyUsed] = useState("1");
  const [isPartLocked, setIsPartLocked] = useState(false);

  // Form states for Tool modal with Live Registry Search & Lock
  const [toolSearchQuery, setToolSearchQuery] = useState("");
  const [toolId, setToolId] = useState("");
  const [toolSerialNumber, setToolSerialNumber] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [toolOem, setToolOem] = useState("");
  const [toolCalibrationDate, setToolCalibrationDate] = useState("");
  const [toolCalibrationDueDate, setToolCalibrationDueDate] = useState("");
  const [isToolLocked, setIsToolLocked] = useState(false);

  // Form states for Expense modal
  const [expenseDate, setExpenseDate] = useState(formatDateNow());
  const [expenseType, setExpenseType] = useState<ExpenseType>("Transport (taxi)");
  const [expenseAmount, setExpenseAmount] = useState("45000");
  const [expenseCode, setExpenseCode] = useState("FIN-EXP-2026-088");
  const [expenseReceiptFileName, setExpenseReceiptFileName] = useState("");
  const [expenseNote, setExpenseNote] = useState("");

  // Form states for Document modal
  const [docType, setDocType] = useState<DebriefDocumentType>("Equipment checklist");
  const [docFileName, setDocFileName] = useState("");
  const [docComment, setDocComment] = useState("");

  useEffect(() => {
    async function loadResources() {
      try {
        const [partsList, toolsList] = await Promise.all([
          partsService.getParts(),
          toolsService.list(),
        ]);
        setInventoryParts(partsList || []);
        setToolsRegistry(toolsList || []);
      } catch (err) {
        console.error("Failed to load inventory parts and tools", err);
      }
    }
    loadResources();
  }, []);

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
          setJobStatus(found.jobStatus || "Open");
          setStage(
            found.stage ||
              (found.jobStatus === "Completed"
                ? "completed"
                : found.jobStatus === "On Hold"
                ? "on_hold"
                : found.labour?.labourStartTime
                ? "working"
                : found.labour?.travelStartTime
                ? "traveling"
                : "assigned")
          );
          setHoldReason(found.holdReason || "Awaiting Part");
          setRootCause(found.rootCause && found.rootCause !== "—" ? found.rootCause : "Hardware");
          setResolution(found.resolution && found.resolution !== "—" ? found.resolution : "Component replacement");

          setPartsUsed(found.partsUsed || []);
          setExpenses(found.expenses || []);
          setDocuments(found.documents || []);
          setToolsUsed(found.toolsUsed || []);

          setClientSignoffName(found.clientSignoffName || found.contactName || "");
          setClientSignoffDesignation(found.clientSignoffDesignation || "Facility In-Charge");
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

  // Inventory Search Suggestions from Parts Module
  const filteredInventoryParts = useMemo(() => {
    if (!partSearchQuery.trim()) return [];
    const q = partSearchQuery.toLowerCase().trim();
    return inventoryParts
      .filter(
        (p) =>
          p.partNumber.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.model && p.model.toLowerCase().includes(q)) ||
          (p.oem && p.oem.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [partSearchQuery, inventoryParts]);

  const handleSelectInventoryPart = (inv: Part) => {
    setPartNumber(inv.partNumber);
    setPartDescription(inv.description);
    setPartModality(inv.modality || "");
    setPartOem(inv.oem || inv.brand || "");
    setPartModel(inv.model || "");
    setPartUnitCost(String(inv.unitPrice || inv.listPrice || 0));
    setPartSerialNumber(inv.oemVendorPartNumber || "");
    setIsPartLocked(true);
    setPartSearchQuery("");
  };

  const handleResetPartFields = () => {
    setPartNumber("");
    setPartSerialNumber("");
    setPartDescription("");
    setPartModality("");
    setPartOem("");
    setPartModel("");
    setPartUnitCost("150000");
    setPartQtyUsed("1");
    setIsPartLocked(false);
    setPartSearchQuery("");
  };

  // Tool Registry Search Suggestions from Tools Module
  const filteredToolsRegistry = useMemo(() => {
    if (!toolSearchQuery.trim()) return [];
    const q = toolSearchQuery.toLowerCase().trim();
    return toolsRegistry
      .filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          (t.category && t.category.toLowerCase().includes(q)) ||
          (t.model && t.model.toLowerCase().includes(q)) ||
          (t.serialNumber && t.serialNumber.toLowerCase().includes(q)) ||
          (t.oem && t.oem.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [toolSearchQuery, toolsRegistry]);

  const handleSelectRegistryTool = (t: Tool) => {
    setToolId(t.id);
    setToolSerialNumber(t.serialNumber || "");
    setToolDescription(`${t.category || ""} ${t.model ? `• ${t.model}` : ""}`.trim() || t.id);
    setToolOem(t.oem || "");
    setToolCalibrationDate(t.lastCalibrationDate || formatDateNow());
    setToolCalibrationDueDate(t.nextCalibrationDate || "2027-01-01");
    setIsToolLocked(true);
    setToolSearchQuery("");
  };

  const handleResetToolFields = () => {
    setToolId("");
    setToolSerialNumber("");
    setToolDescription("");
    setToolOem("");
    setToolCalibrationDate("");
    setToolCalibrationDueDate("");
    setIsToolLocked(false);
    setToolSearchQuery("");
  };

  // Real-time Cost Rollup calculations
  const { totalPartsCost, totalExpensesCost, totalJobCost } = useMemo(() => {
    return computeJobCosts({ partsUsed, expenses });
  }, [partsUsed, expenses]);

  // Stage Handlers
  const handleStartTravel = async () => {
    const timeNow = formatTimeNow();
    setTravelStartTime(timeNow);
    setStage("traveling");
    setJobStatus("In Progress");

    await debriefService.update(jobId, {
      jobStatus: "In Progress",
      stage: "traveling",
      labour: {
        startDate: job?.jobStartDate || formatDateNow(),
        endDate: "—",
        travelStartTime: timeNow,
        workDone,
        equipmentStatus,
        jobStatus: "In Progress",
        stage: "traveling",
      },
    });
    toast.success(`Travel started at ${timeNow}. Safe journey!`);
  };

  const handleArrivedOnSite = async () => {
    const timeNow = formatTimeNow();
    const travelStart = travelStartTime || "08:00";
    setTravelEndTime(timeNow);
    setLabourStartTime(timeNow);
    setStage("working");
    setJobStatus("In Progress");

    await debriefService.update(jobId, {
      jobStatus: "In Progress",
      stage: "working",
      labour: {
        startDate: job?.jobStartDate || formatDateNow(),
        endDate: "—",
        travelStartTime: travelStart,
        travelEndTime: timeNow,
        labourStartTime: timeNow,
        workDone,
        equipmentStatus,
        jobStatus: "In Progress",
        stage: "working",
      },
    });
    toast.success(`Arrived on site at ${timeNow}. Full workspace unlocked!`);
  };

  const handleConfirmHold = async () => {
    setJobStatus("On Hold");
    setStage("on_hold");
    setHoldDialogOpen(false);

    await debriefService.update(jobId, {
      jobStatus: "On Hold",
      stage: "on_hold",
      holdReason,
      labour: {
        startDate: job?.jobStartDate || formatDateNow(),
        endDate: "—",
        travelStartTime,
        travelEndTime,
        labourStartTime,
        workDone,
        equipmentStatus,
        jobStatus: "On Hold",
        stage: "on_hold",
        holdReason,
      },
      partsUsed,
      expenses,
      documents,
      toolsUsed,
    });
    toast.warning(`Job placed On Hold (${holdReason})`);
  };

  const handleResumeWork = async () => {
    setJobStatus("In Progress");
    setStage("working");

    await debriefService.update(jobId, {
      jobStatus: "In Progress",
      stage: "working",
      labour: {
        startDate: job?.jobStartDate || formatDateNow(),
        endDate: "—",
        travelStartTime,
        travelEndTime,
        labourStartTime: labourStartTime || formatTimeNow(),
        workDone,
        equipmentStatus,
        jobStatus: "In Progress",
        stage: "working",
      },
    });
    toast.success("Job resumed. Active workspace unlocked.");
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
      serialNumber: partSerialNumber.trim() || `SN-${Date.now().toString().slice(-6)}`,
      description: partDescription.trim(),
      modality: partModality.trim() || job?.modality,
      oem: partOem.trim() || job?.oem,
      model: partModel.trim() || job?.model,
      unitCost: cost,
      quantityUsed: qty,
      totalCost: cost * qty,
    };

    const updated = [...partsUsed, newPart];
    setPartsUsed(updated);
    handleResetPartFields();
    setAddPartOpen(false);
    await debriefService.update(jobId, { partsUsed: updated });
    toast.success(`Part ${newPart.partNumber} recorded (${formatNaira(newPart.totalCost)}).`);
  };

  const handleRemovePart = async (id: string) => {
    const updated = partsUsed.filter((p) => p.id !== id);
    setPartsUsed(updated);
    await debriefService.update(jobId, { partsUsed: updated });
    toast.info("Part removed.");
  };

  const handleAddExpense = async () => {
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      toast.error("Please enter a valid expense amount.");
      return;
    }

    const cost = parseFloat(expenseAmount) || 0;
    const newExpense: DebriefExpense = {
      id: `exp_${Date.now()}`,
      dateOfExpense: expenseDate || formatDateNow(),
      typeOfExpense: expenseType,
      receiptAvailable: Boolean(expenseReceiptFileName.trim()),
      receiptFileName: expenseReceiptFileName.trim() || undefined,
      note: expenseNote || "Service expense logged by engineer.",
      expenseCode: expenseCode || "FIN-EXP-2026-088",
      amount: cost,
    };

    const updated = [...expenses, newExpense];
    setExpenses(updated);
    setExpenseNote("");
    setExpenseReceiptFileName("");
    setAddExpenseOpen(false);
    await debriefService.update(jobId, { expenses: updated });
    toast.success(`Expense logged (${formatNaira(cost)}).`);
  };

  const handleRemoveExpense = async (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    await debriefService.update(jobId, { expenses: updated });
    toast.info("Expense removed.");
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
    toast.info("Document removed.");
  };

  const handleAddToolSubmit = async () => {
    if (!toolId.trim() || !toolDescription.trim()) {
      toast.error("Please select or enter a Tool ID and Description.");
      return;
    }

    if (toolsUsed.some((t) => t.toolId === toolId.trim())) {
      toast.info("This tool is already linked to this job.");
      return;
    }

    const newTool: DebriefToolUsed = {
      id: `tool_${Date.now()}`,
      toolId: toolId.trim(),
      serialNumber: toolSerialNumber.trim() || `SN-${Date.now().toString().slice(-6)}`,
      description: toolDescription.trim(),
      oem: toolOem.trim() || "Calibrated Tooling",
      dateOfUse: job?.jobStartDate || formatDateNow(),
      calibrationDate: toolCalibrationDate || formatDateNow(),
      calibrationDueDate: toolCalibrationDueDate || "2027-01-01",
    };

    const updated = [...toolsUsed, newTool];
    setToolsUsed(updated);
    handleResetToolFields();
    setAddToolOpen(false);
    await debriefService.update(jobId, { toolsUsed: updated });
    toast.success(`Tool ${newTool.toolId} linked.`);
  };

  const handleRemoveTool = async (id: string) => {
    const updated = toolsUsed.filter((t) => t.id !== id);
    setToolsUsed(updated);
    await debriefService.update(jobId, { toolsUsed: updated });
    toast.info("Tool removed.");
  };

  // Submit & Final Debrief Completion
  const handleFinalSubmitDebrief = async () => {
    if (!workDone.trim()) {
      toast.error("Please enter a summary of the work performed.");
      return;
    }
    if (!clientSignoffName.trim()) {
      toast.error("Please enter the Client / Hospital Representative Name for sign-off.");
      return;
    }

    setSaving(true);
    try {
      const nowTime = formatTimeNow();
      const nowDate = formatDateNow();
      const fullTimestamp = `${nowDate} ${nowTime}`;

      await debriefService.update(jobId, {
        jobStatus: "Completed",
        stage: "completed",
        equipmentStatus,
        rootCause,
        resolution,
        endDate: nowDate,
        clientSignoffName: clientSignoffName.trim(),
        clientSignoffDesignation: clientSignoffDesignation.trim() || "Hospital In-Charge",
        clientSignoffDate: fullTimestamp,
        engineerSignoffDate: fullTimestamp,
        labour: {
          startDate: job?.jobStartDate || nowDate,
          endDate: nowDate,
          travelStartTime,
          travelEndTime,
          labourStartTime,
          labourEndTime: nowTime,
          workDone: workDone.trim(),
          equipmentStatus,
          jobStatus: "Completed",
          stage: "completed",
          rootCause,
          resolution,
          clientSignoffName: clientSignoffName.trim(),
          clientSignoffDesignation: clientSignoffDesignation.trim() || "Hospital In-Charge",
          clientSignoffDate: fullTimestamp,
          engineerSignoffDate: fullTimestamp,
        },
        partsUsed,
        expenses,
        documents,
        toolsUsed,
      });

      setJobStatus("Completed");
      setStage("completed");
      setCompleteDialogOpen(false);
      toast.success("Job debrief submitted and signed off successfully! Moved to Completed.");
      navigate({ to: "/app/debrief/my-work" });
    } catch (err) {
      console.error("Failed to complete job", err);
      toast.error("Failed to submit debrief.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-xs font-semibold">
        Loading Job Workspace...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertTriangle className="size-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-foreground">Job Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested job could not be located.</p>
        <Button size="sm" onClick={() => navigate({ to: "/app/debrief/my-work" })}>
          Back to My Work
        </Button>
      </div>
    );
  }

  const isAssigned = stage === "assigned";
  const isTraveling = stage === "traveling";
  const isWorking = stage === "working";
  const isOnHold = stage === "on_hold";
  const isCompleted = stage === "completed" || jobStatus === "Completed";
  const isLocked = isAssigned || isTraveling;

  return (
    <div className="w-full space-y-5 pb-12">
      {/* Top Breadcrumb & Job Summary Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
        <div className="space-y-2">
          {/* Prominent Visible Back Button */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/app/debrief/my-work"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-foreground text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <ArrowLeft className="size-4 text-primary" />
              <span>Back to My Work</span>
            </Link>

            <span className="text-muted-foreground/40">•</span>
            <span className="font-mono text-sm font-bold text-primary">{job.jobNumber}</span>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border",
                job.equipmentStatus === "UP"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : job.equipmentStatus === "Partially UP"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
              )}
            >
              Equip: {job.equipmentStatus}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="font-bold text-foreground text-sm">{job.model}</span>
            <span className="font-mono text-muted-foreground">({job.assetNumber})</span>
            <span className="text-muted-foreground">• {job.modality} ({job.oem})</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <MapPin className="size-3 text-primary" /> {job.location || "Facility"}
            </span>
          </div>
        </div>

        {/* Live Cumulative Spend Pill & Header Specs Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSpecsModalOpen(true)}
            className="h-10 px-3.5 text-xs font-bold gap-1.5 border-border hover:bg-accent text-foreground cursor-pointer shadow-2xs"
          >
            <Info className="size-3.5 text-primary" />
            <span>View Job Specs</span>
          </Button>

          <div className="flex items-center gap-2 bg-muted/40 border border-border/70 rounded-xl px-3.5 py-2 shrink-0">
            <div className="space-y-0.5 text-right">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Job Spend
              </div>
              <div className="font-mono font-bold text-sm text-foreground">
                {formatNaira(totalJobCost)}
              </div>
            </div>
            <div className="h-7 w-px bg-border/80 mx-1" />
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>Parts: <span className="font-mono font-semibold text-foreground">{formatNaira(totalPartsCost)}</span></div>
              <div>Exp: <span className="font-mono font-semibold text-foreground">{formatNaira(totalExpensesCost)}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Stage Interactive Journey Tracker */}
      <div className="rounded-xl border border-border/80 bg-card p-3 sm:p-4 shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs font-semibold">
          {/* Stage 1: Assigned */}
          <div
            className={cn(
              "p-2.5 rounded-lg border transition-all flex flex-col items-center gap-1",
              isAssigned
                ? "bg-primary/10 border-primary/40 text-primary font-bold shadow-2xs"
                : "bg-muted/20 border-border/50 text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              <span>1. Assigned</span>
            </div>
            <span className="text-[11px] font-normal opacity-80">
              {job.jobStartDate || "Scheduled"}
            </span>
          </div>

          {/* Stage 2: Travel */}
          <div
            className={cn(
              "p-2.5 rounded-lg border transition-all flex flex-col items-center gap-1",
              isTraveling
                ? "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400 font-bold shadow-2xs"
                : travelStartTime
                ? "bg-muted/30 border-border text-foreground"
                : "bg-muted/10 border-border/40 text-muted-foreground/60"
            )}
          >
            <div className="flex items-center gap-1.5">
              <Navigation className="size-3.5" />
              <span>2. In Travel</span>
            </div>
            <span className="text-[11px] font-normal opacity-80">
              {travelStartTime ? `Started ${travelStartTime}` : "Pending Departure"}
            </span>
          </div>

          {/* Stage 3: On Site / Working */}
          <div
            className={cn(
              "p-2.5 rounded-lg border transition-all flex flex-col items-center gap-1",
              isWorking || isOnHold
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold shadow-2xs"
                : labourStartTime
                ? "bg-muted/30 border-border text-foreground"
                : "bg-muted/10 border-border/40 text-muted-foreground/60"
            )}
          >
            <div className="flex items-center gap-1.5">
              <Wrench className="size-3.5" />
              <span>3. On Site / Working</span>
            </div>
            <span className="text-[11px] font-normal opacity-80">
              {isOnHold ? `On Hold (${holdReason})` : labourStartTime ? `Arrived ${labourStartTime}` : "Requires Arrival"}
            </span>
          </div>

          {/* Stage 4: Completed */}
          <div
            className={cn(
              "p-2.5 rounded-lg border transition-all flex flex-col items-center gap-1",
              isCompleted
                ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                : "bg-muted/10 border-border/40 text-muted-foreground/60"
            )}
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              <span>4. Debrief Signed</span>
            </div>
            <span className="text-[11px] font-normal opacity-80">
              {isCompleted ? "Closed & Sign-off" : "Pending Completion"}
            </span>
          </div>
        </div>
      </div>

      {/* Stage 1 Active: Departure & Travel Dispatch Banner */}
      {isAssigned && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                <Navigation className="size-3" /> Step 1: Ready for Departure
              </span>
              <h3 className="text-base font-bold text-foreground">
                You have been dispatched to {job.location || "Facility"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                Address: <span className="font-semibold text-foreground">{job.address || "Main Site"}</span>.
                Review the equipment and job specifications, then click <strong>Start Travel</strong> when departing.
              </p>
            </div>

            {/* Start Travel + View Full Specifications Button next to it */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setSpecsModalOpen(true)}
                className="h-10 px-4 text-xs font-bold gap-2 cursor-pointer border-border hover:bg-accent text-foreground shadow-2xs"
              >
                <Info className="size-4 text-primary" />
                <span>View Job Specs</span>
              </Button>

              <Button
                size="lg"
                onClick={handleStartTravel}
                className="h-10 px-5 text-[13px] font-bold gap-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                <Navigation className="size-4" />
                <span>Start Travel</span>
              </Button>
            </div>
          </div>

          {/* Reported Problem Overview */}
          <div className="p-3 rounded-lg bg-background/80 border border-border/60 text-xs space-y-1">
            <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
              <FileText className="size-3.5 text-primary" /> Reported Issue &amp; Fault Symptoms:
            </span>
            <p className="text-foreground leading-relaxed pl-5">
              {job.reportedIssue || "Diagnostic service inspection required on equipment."}
            </p>
          </div>
        </div>
      )}

      {/* Stage 2 Active: En Route Banner */}
      {isTraveling && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Navigation className="size-3 animate-pulse" /> Step 2: En Route (Started {travelStartTime})
              </span>
              <h3 className="text-base font-bold text-foreground">
                Traveling to {job.location || "Hospital Site"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                Destination: <span className="font-semibold text-foreground">{job.address || "Hospital Address"}</span>.
                Once you arrive on site at the facility, click <strong>Arrived On Site</strong> to unlock full service logging.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSpecsModalOpen(true)}
                className="h-10 px-3 text-xs font-semibold gap-1.5 border-border hover:bg-accent cursor-pointer"
              >
                <Info className="size-3.5 text-primary" />
                <span>Specs</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setHoldDialogOpen(true)}
                className="h-10 px-3.5 text-xs font-semibold gap-1.5 border-border hover:bg-accent cursor-pointer"
              >
                <PauseCircle className="size-3.5 text-amber-500" />
                <span>Delay / Hold</span>
              </Button>

              <Button
                size="lg"
                onClick={handleArrivedOnSite}
                className="h-10 px-5 text-[13px] font-bold gap-2 cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              >
                <MapPin className="size-4" />
                <span>Arrived On Site</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stage Locked Info Notice for Step 1 & 2 */}
      {isLocked && (
        <div className="rounded-xl border border-dashed border-border p-4 bg-muted/20 flex items-center gap-3 text-xs text-muted-foreground">
          <Lock className="size-4 text-muted-foreground shrink-0" />
          <span>
            <strong>Workspace Locked:</strong> Logging parts, expenses, and attachments requires on-site arrival. Once you click <strong>Arrived On Site</strong>, the complete active workspace will be unlocked.
          </span>
        </div>
      )}

      {/* On Hold Alert Banner */}
      {isOnHold && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <PauseCircle className="size-5 text-amber-500 shrink-0" />
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400">
                Job Placed On Hold: {holdReason}
              </h4>
              <p className="text-xs text-muted-foreground">
                Work execution is paused. Click Resume Work once parts or facility access are ready.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleResumeWork}
            className="h-9 px-4 text-xs font-bold gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shrink-0"
          >
            <Play className="size-3.5" />
            <span>Resume Work</span>
          </Button>
        </div>
      )}

      {/* Stage 3 & Completed: Full Active Workspace & Action Logging */}
      {(!isLocked || isCompleted) && (
        <div className="space-y-5">
          {/* Action Bar & Quick Action Triggers */}
          {!isCompleted && !isOnHold && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddPartOpen(true)}
                  className="h-9 px-3 text-xs font-semibold gap-1.5 border-border/80 hover:bg-accent cursor-pointer"
                >
                  <Plus className="size-3.5 text-primary" />
                  <span>Log Part Used</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddExpenseOpen(true)}
                  className="h-9 px-3 text-xs font-semibold gap-1.5 border-border/80 hover:bg-accent cursor-pointer"
                >
                  <Plus className="size-3.5 text-primary" />
                  <span>Log Expense</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddToolOpen(true)}
                  className="h-9 px-3 text-xs font-semibold gap-1.5 border-border/80 hover:bg-accent cursor-pointer"
                >
                  <Plus className="size-3.5 text-primary" />
                  <span>Link Tool</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddDocOpen(true)}
                  className="h-9 px-3 text-xs font-semibold gap-1.5 border-border/80 hover:bg-accent cursor-pointer"
                >
                  <Plus className="size-3.5 text-primary" />
                  <span>Attach Document</span>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setHoldDialogOpen(true)}
                  className="h-9 px-3 text-xs font-semibold gap-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                >
                  <PauseCircle className="size-3.5" />
                  <span>Hold</span>
                </Button>
              </div>

              {/* Primary Final CTA */}
              <Button
                size="sm"
                onClick={() => setCompleteDialogOpen(true)}
                className="h-9 px-4 text-xs font-bold gap-1.5 cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Finish Work &amp; Submit Debrief</span>
              </Button>
            </div>
          )}

          {/* Work Summary & Execution Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Work Performed & Live Log Tables */}
            <div className="lg:col-span-2 space-y-5">
              {/* Work Findings Input / Summary */}
              <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    <span>Work Done &amp; Diagnostic Findings</span>
                  </h3>
                  {isCompleted && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ✓ Debrief Signed
                    </span>
                  )}
                </div>

                {isCompleted ? (
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/60 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                    {workDone || "No work description recorded."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      rows={4}
                      value={workDone}
                      onChange={(e) => setWorkDone(e.target.value)}
                      placeholder="Describe the corrective or preventive maintenance actions performed, faulty components inspected, test results, and final operating condition..."
                      className="text-xs resize-none"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-muted-foreground">
                        Include observations, tests conducted, and verified calibrations.
                      </span>
                      {/* Prominent Visible Quick Save Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await debriefService.update(jobId, {
                            labour: {
                              ...job.labour,
                              workDone,
                              startDate: job.jobStartDate || formatDateNow(),
                              endDate: "—",
                              equipmentStatus,
                              jobStatus,
                            },
                          });
                          toast.success("Work notes saved.");
                        }}
                        className="h-8 px-3 text-xs font-bold text-primary border-primary/30 bg-primary/5 hover:bg-primary/15 gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Save className="size-3.5" />
                        <span>Quick Save Notes</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Logged Parts Section with exact Requested Headers */}
              <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Boxes className="size-4 text-primary" />
                    <span>Parts &amp; Components Used ({partsUsed.length})</span>
                  </h3>
                  <span className="font-mono text-xs font-bold text-primary">
                    Subtotal: {formatNaira(totalPartsCost)}
                  </span>
                </div>

                {partsUsed.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/80 p-5 text-center text-xs text-muted-foreground">
                    No replacement parts logged yet. Click &quot;Log Part Used&quot; to search and record inventory parts.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 bg-muted/20">
                        <tr>
                          <th className="py-2.5 px-3">Part number</th>
                          <th className="py-2.5 px-3">Serial number</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3">Modality</th>
                          <th className="py-2.5 px-3">OEM</th>
                          <th className="py-2.5 px-3">Model</th>
                          <th className="py-2.5 px-3 text-right">Cost</th>
                          <th className="py-2.5 px-3 text-center">Quantity Used</th>
                          <th className="py-2.5 px-3 text-right">Total cost</th>
                          {!isCompleted && <th className="py-2.5 px-2 text-center w-8"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {partsUsed.map((p) => (
                          <tr key={p.id} className="hover:bg-muted/10">
                            <td className="py-2.5 px-3 font-mono font-bold text-primary whitespace-nowrap">{p.partNumber}</td>
                            <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">{p.serialNumber || "—"}</td>
                            <td className="py-2.5 px-3 font-medium text-foreground max-w-[180px] truncate">{p.description}</td>
                            <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{p.modality || "—"}</td>
                            <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{p.oem || "—"}</td>
                            <td className="py-2.5 px-3 text-foreground whitespace-nowrap">{p.model || "—"}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-muted-foreground whitespace-nowrap">{formatNaira(p.unitCost)}</td>
                            <td className="py-2.5 px-3 text-center font-bold">{p.quantityUsed}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground whitespace-nowrap">{formatNaira(p.totalCost)}</td>
                            {!isCompleted && (
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePart(p.id)}
                                  className="text-muted-foreground hover:text-destructive cursor-pointer p-1"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Logged Tools Section with exact Requested Headers */}
              <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    <span>Calibrated Tools &amp; Testing Analyzers ({toolsUsed.length})</span>
                  </h3>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Verified Calibration
                  </span>
                </div>

                {toolsUsed.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/80 p-5 text-center text-xs text-muted-foreground">
                    No calibration tools linked yet. Click &quot;Link Tool&quot; to verify and attach test equipment.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 bg-muted/20">
                        <tr>
                          <th className="py-2.5 px-3">Tool ID</th>
                          <th className="py-2.5 px-3">Serial no</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3">Date use</th>
                          <th className="py-2.5 px-3">Calibration date</th>
                          <th className="py-2.5 px-3">Calibration due date</th>
                          {!isCompleted && <th className="py-2.5 px-2 text-center w-8"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {toolsUsed.map((t) => (
                          <tr key={t.id} className="hover:bg-muted/10">
                            <td className="py-2.5 px-3 font-mono font-bold text-primary whitespace-nowrap">{t.toolId}</td>
                            <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">{t.serialNumber}</td>
                            <td className="py-2.5 px-3 font-medium text-foreground max-w-[200px] truncate">{t.description}</td>
                            <td className="py-2.5 px-3 font-mono text-foreground whitespace-nowrap">{t.dateOfUse || formatDateNow()}</td>
                            <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">{t.calibrationDate}</td>
                            <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">{t.calibrationDueDate}</td>
                            {!isCompleted && (
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTool(t.id)}
                                  className="text-muted-foreground hover:text-destructive cursor-pointer p-1"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Logged Expenses Section */}
              <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Receipt className="size-4 text-primary" />
                    <span>Travel &amp; Job Expenses ({expenses.length})</span>
                  </h3>
                  <span className="font-mono text-xs font-bold text-primary">
                    Subtotal: {formatNaira(totalExpensesCost)}
                  </span>
                </div>

                {expenses.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/80 p-5 text-center text-xs text-muted-foreground">
                    No travel or field expenses logged. Click &quot;Log Expense&quot; to add receipts.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 bg-muted/20">
                        <tr>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Details / Note</th>
                          <th className="py-2 px-3">Receipt</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                          {!isCompleted && <th className="py-2 px-2 text-center w-8"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {expenses.map((e) => (
                          <tr key={e.id} className="hover:bg-muted/10">
                            <td className="py-2.5 px-3 font-semibold text-foreground">{e.typeOfExpense}</td>
                            <td className="py-2.5 px-3 text-muted-foreground max-w-[200px] truncate">{e.note}</td>
                            <td className="py-2.5 px-3">
                              {e.receiptAvailable ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <FileCheck className="size-3" /> Attached
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">No receipt</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">{formatNaira(e.amount || 0)}</td>
                            {!isCompleted && (
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExpense(e.id)}
                                  className="text-muted-foreground hover:text-destructive cursor-pointer p-1"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Attachments & Sign-off Info */}
            <div className="space-y-5">
              {/* Attached Documents */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <FileCheck className="size-3.5 text-primary" /> Attached Docs ({documents.length})
                  </span>
                </h3>

                {documents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No service reports or checklists attached.</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((d) => (
                      <div key={d.id} className="p-2.5 rounded-lg border border-border/60 bg-muted/20 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-foreground">
                          <span>{d.documentType}</span>
                          {!isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDocument(d.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-primary">{d.fileName}</p>
                        <p className="text-muted-foreground text-[11px]">{d.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completed Sign-off Card (When completed) */}
              {isCompleted && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    <span>Official Debrief Sign-Off</span>
                  </div>
                  <div className="space-y-1 text-muted-foreground">
                    <div>Client Rep: <span className="font-semibold text-foreground">{job.clientSignoffName || "—"}</span></div>
                    <div>Designation: <span className="font-semibold text-foreground">{job.clientSignoffDesignation || "—"}</span></div>
                    <div>Date Signed: <span className="font-mono text-foreground">{job.clientSignoffDate || job.endDate || "—"}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* MODAL: Full Equipment & Job Specifications Modal */}
      <Dialog open={specsModalOpen} onOpenChange={setSpecsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Info className="size-5 text-primary" />
              <span>Full Equipment &amp; Job Specifications</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Complete dispatch, warranty, contract, and biomedical equipment parameters for {job.jobNumber}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* 1. Equipment Identification */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                1. Biomedical Equipment Parameters
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Asset Number:</span><div className="font-mono font-bold text-foreground">{job.assetNumber}</div></div>
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Modality:</span><div className="font-semibold text-foreground">{job.modality}</div></div>
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">OEM / Manufacturer:</span><div className="font-semibold text-foreground">{job.oem}</div></div>
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Model:</span><div className="font-semibold text-foreground">{job.model}</div></div>
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Serial Number:</span><div className="font-mono text-foreground">{job.serialNumber}</div></div>
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Year of Mfr:</span><div className="font-mono text-foreground">{job.yearOfManufacture}</div></div>
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Equipment Status:</span><div className="font-bold text-foreground">{job.equipmentStatus}</div></div>
              </div>
            </div>

            {/* 2. Warranty & Contract */}
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                2. Warranty &amp; Service Contract Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Warranty Start:</span><div className="font-mono text-foreground">{job.warrantyStartDate || "—"}</div></div>
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Warranty End:</span><div className="font-mono text-foreground">{job.warrantyEndDate || "—"}</div></div>
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Contract Type:</span><div className="font-semibold text-foreground">{job.contractType || "—"}</div></div>
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Contract Start:</span><div className="font-mono text-foreground">{job.contractStartDate || "—"}</div></div>
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Contract End:</span><div className="font-mono text-foreground">{job.contractEndDate || "—"}</div></div>
              </div>
            </div>

            {/* 3. Dispatch & Hospital Location */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                3. Dispatch, Facility &amp; Contact Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Job Type:</span><div className="font-semibold text-foreground">{job.jobType}</div></div>
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Job Priority:</span><div className="font-bold text-foreground">{job.jobPriority}</div></div>
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Job Open Date:</span><div className="font-mono text-foreground">{job.jobOpenDate}</div></div>
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Job Start Date:</span><div className="font-mono text-foreground">{job.jobStartDate}</div></div>
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Assigned Engineer:</span><div className="font-bold text-foreground">{job.assignedToName}</div></div>
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Assisted By:</span><div className="text-muted-foreground">{job.assistedBy || "—"}</div></div>
                <div className="space-y-0.5 sm:col-span-2"><span className="text-muted-foreground font-medium">Facility Location:</span><div className="font-semibold text-foreground">{job.location || "Main Ward"}</div></div>
                <div className="space-y-0.5 sm:col-span-3"><span className="text-muted-foreground font-medium">Address:</span><div className="font-medium text-foreground">{job.address || "—"}</div></div>
                <div className="space-y-0.5"><span className="text-muted-foreground font-medium">Contact Person:</span><div className="font-semibold text-foreground">{job.contactName || "—"}</div></div>
                <div className="space-y-0.5 sm:col-span-2"><span className="text-muted-foreground font-medium">Contact Email:</span><div className="font-mono text-foreground">{job.contactEmail || "—"}</div></div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSpecsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 1: Log Part Used with Compact Auto-Suggest & Field Lock */}
      <Dialog open={addPartOpen} onOpenChange={setAddPartOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Log Spare Part Used</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Search the central parts inventory or enter replacement details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            {/* Inventory Live Search Bar (Compact dropdown without modal expansion) */}
            <div className="space-y-1.5 p-3 rounded-lg border border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Search className="size-3.5" />
                  <span>Search Parts Inventory</span>
                </Label>
                {isPartLocked && (
                  <button
                    type="button"
                    onClick={handleResetPartFields}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Unlock className="size-3" />
                    <span>Clear &amp; Unlock</span>
                  </button>
                )}
              </div>

              <Input
                placeholder="Search part #, description, model or OEM..."
                value={partSearchQuery}
                onChange={(e) => setPartSearchQuery(e.target.value)}
                className="text-xs bg-background h-8.5"
              />

              {filteredInventoryParts.length > 0 && (
                <div className="mt-1.5 max-h-48 overflow-y-auto border border-border rounded-lg bg-background divide-y divide-border/60 shadow-lg">
                  {filteredInventoryParts.map((inv) => (
                    <button
                      key={inv.id}
                      type="button"
                      onClick={() => handleSelectInventoryPart(inv)}
                      className="w-full text-left px-3 py-2 hover:bg-muted/40 transition-colors text-xs flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary shrink-0">{inv.partNumber}</span>
                          <span className="text-[11px] text-muted-foreground truncate font-medium">
                            {inv.oem || inv.brand} {inv.model ? `• ${inv.model}` : ""}
                          </span>
                        </div>
                        <p className="text-foreground text-[11px] truncate max-w-[360px] sm:max-w-[480px]">
                          {inv.description}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-foreground text-xs shrink-0 text-right">
                        {formatNaira(inv.unitPrice || inv.listPrice || 0)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Fields: Part number, Serial number, Description, Modality, OEM, Model, Cost, Qty */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Part number *</Label>
                  {isPartLocked && <Lock className="size-3 text-muted-foreground" />}
                </div>
                <Input
                  readOnly={isPartLocked}
                  placeholder="e.g. PRT-GE-CT-881"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  className={cn("text-xs font-mono", isPartLocked && "bg-muted/50 text-foreground cursor-not-allowed")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Serial number</Label>
                <Input
                  placeholder="e.g. SN-882190"
                  value={partSerialNumber}
                  onChange={(e) => setPartSerialNumber(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Description *</Label>
                {isPartLocked && <Lock className="size-3 text-muted-foreground" />}
              </div>
              <Input
                readOnly={isPartLocked}
                placeholder="e.g. Slip Ring Carbon Brush Kit"
                value={partDescription}
                onChange={(e) => setPartDescription(e.target.value)}
                className={cn("text-xs", isPartLocked && "bg-muted/50 text-foreground cursor-not-allowed")}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Modality</Label>
                <Input
                  readOnly={isPartLocked}
                  placeholder="e.g. CT"
                  value={partModality}
                  onChange={(e) => setPartModality(e.target.value)}
                  className={cn("text-xs", isPartLocked && "bg-muted/50 text-foreground cursor-not-allowed")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">OEM</Label>
                <Input
                  readOnly={isPartLocked}
                  placeholder="e.g. GE Healthcare"
                  value={partOem}
                  onChange={(e) => setPartOem(e.target.value)}
                  className={cn("text-xs", isPartLocked && "bg-muted/50 text-foreground cursor-not-allowed")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Model</Label>
                <Input
                  readOnly={isPartLocked}
                  placeholder="e.g. Optima CT660"
                  value={partModel}
                  onChange={(e) => setPartModel(e.target.value)}
                  className={cn("text-xs", isPartLocked && "bg-muted/50 text-foreground cursor-not-allowed")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Cost (₦ Unit Price) *</Label>
                  {isPartLocked && <Lock className="size-3 text-muted-foreground" />}
                </div>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  readOnly={isPartLocked}
                  value={partUnitCost}
                  onChange={(e) => setPartUnitCost(e.target.value)}
                  className={cn("text-xs font-mono", isPartLocked && "bg-muted/50 text-foreground cursor-not-allowed")}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Quantity Used *</Label>
                <Input
                  type="number"
                  min="1"
                  value={partQtyUsed}
                  onChange={(e) => setPartQtyUsed(e.target.value)}
                  className="text-xs font-bold"
                />
              </div>
            </div>

            {/* Total Cost preview (Cost × Quantity Used) */}
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                Total Part Spend ({partQtyUsed || 1} × {formatNaira(parseFloat(partUnitCost) || 0)}):
              </span>
              <span className="font-mono font-bold text-sm text-foreground">
                {formatNaira((parseFloat(partUnitCost) || 0) * (parseInt(partQtyUsed) || 1))}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddPartOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddPart} className="bg-primary text-primary-foreground">Add Part</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Log Expense */}
      <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Log Travel &amp; Field Expense</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add travel fares, lodging, or subsistence incurred during this job.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Expense Type</Label>
                <Select value={expenseType} onValueChange={(v) => setExpenseType(v as ExpenseType)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Amount (₦) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Receipt File Name / Ref</Label>
              <Input
                placeholder="e.g. uber_receipt_airport.pdf"
                value={expenseReceiptFileName}
                onChange={(e) => setExpenseReceiptFileName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Expense Note / Purpose</Label>
              <Textarea
                rows={2}
                placeholder="Describe transportation or expense context..."
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddExpenseOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddExpense} className="bg-primary text-primary-foreground">Save Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Link Tool with Compact Auto-Suggest & Field Lock */}
      <Dialog open={addToolOpen} onOpenChange={setAddToolOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Link Verified Test Tool</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Search tool module registry to auto-populate and link calibrated equipment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            {/* Tool Registry Auto-Suggest Search Bar */}
            <div className="space-y-1.5 p-3 rounded-lg border border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Search className="size-3.5" />
                  <span>Search Tools Registry</span>
                </Label>
                {isToolLocked && (
                  <button
                    type="button"
                    onClick={handleResetToolFields}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Unlock className="size-3" />
                    <span>Clear &amp; Unlock</span>
                  </button>
                )}
              </div>

              <Input
                placeholder="Search tool ID, description, category or OEM..."
                value={toolSearchQuery}
                onChange={(e) => setToolSearchQuery(e.target.value)}
                className="text-xs bg-background h-8.5"
              />

              {filteredToolsRegistry.length > 0 && (
                <div className="mt-1.5 max-h-48 overflow-y-auto border border-border rounded-lg bg-background divide-y divide-border/60 shadow-lg">
                  {filteredToolsRegistry.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectRegistryTool(t)}
                      className="w-full text-left px-3 py-2 hover:bg-muted/40 transition-colors text-xs flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary shrink-0">{t.id}</span>
                          <span className="text-[11px] text-muted-foreground truncate font-mono">({t.serialNumber})</span>
                          <span className="text-[11px] text-muted-foreground truncate">• {t.oem}</span>
                        </div>
                        <p className="text-foreground text-[11px] truncate max-w-[360px] sm:max-w-[480px]">
                          {t.category} {t.model ? `• ${t.model}` : ""}
                        </p>
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] shrink-0 text-right">
                        Due: {t.nextCalibrationDate || "—"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Fields: Tool ID, Serial number, Description, Tool OEM */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Tool ID *</Label>
                  {isToolLocked && <Lock className="size-3 text-muted-foreground" />}
                </div>
                <Input
                  readOnly={isToolLocked}
                  placeholder="e.g. TL-00001"
                  value={toolId}
                  onChange={(e) => setToolId(e.target.value)}
                  className={cn("text-xs font-mono", isToolLocked && "bg-muted/50 text-foreground cursor-not-allowed")}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Serial number *</Label>
                  {isToolLocked && <Lock className="size-3 text-muted-foreground" />}
                </div>
                <Input
                  readOnly={isToolLocked}
                  placeholder="e.g. SN-FLUKE-9901"
                  value={toolSerialNumber}
                  onChange={(e) => setToolSerialNumber(e.target.value)}
                  className={cn("text-xs font-mono", isToolLocked && "bg-muted/50 text-foreground cursor-not-allowed")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Description *</Label>
                  {isToolLocked && <Lock className="size-3 text-muted-foreground" />}
                </div>
                <Input
                  readOnly={isToolLocked}
                  placeholder="e.g. Electrical Safety Analyzer"
                  value={toolDescription}
                  onChange={(e) => setToolDescription(e.target.value)}
                  className={cn("text-xs", isToolLocked && "bg-muted/50 text-foreground cursor-not-allowed")}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Tool OEM</Label>
                  {isToolLocked && <Lock className="size-3 text-muted-foreground" />}
                </div>
                <Input
                  readOnly={isToolLocked}
                  placeholder="e.g. Fluke Biomedical"
                  value={toolOem}
                  onChange={(e) => setToolOem(e.target.value)}
                  className={cn("text-xs", isToolLocked && "bg-muted/50 text-foreground cursor-not-allowed")}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddToolOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddToolSubmit} className="bg-primary text-primary-foreground">Link Tool</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: Attach Document */}
      <Dialog open={addDocOpen} onOpenChange={setAddDocOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Attach Service Document</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Upload checklists, delivery notes, or test logs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Document Type</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as DebriefDocumentType)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">File Name *</Label>
              <Input
                placeholder="e.g. ct_calibration_checklist.pdf"
                value={docFileName}
                onChange={(e) => setDocFileName(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Comments / Description</Label>
              <Textarea
                rows={2}
                placeholder="Notes about this document..."
                value={docComment}
                onChange={(e) => setDocComment(e.target.value)}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddDocOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddDocument} className="bg-primary text-primary-foreground">Attach</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 5: Put on Hold Dialog */}
      <Dialog open={holdDialogOpen} onOpenChange={setHoldDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <PauseCircle className="size-4 text-amber-500" />
              <span>Place Job On Hold</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select the operational reason why work on {job.jobNumber} cannot proceed immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Hold Reason *</Label>
              <Select value={holdReason} onValueChange={setHoldReason}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Awaiting Part" className="text-xs">Awaiting Part / Store Dispatch</SelectItem>
                  <SelectItem value="Site Access Denied" className="text-xs">Site Access Denied / Facility Locked</SelectItem>
                  <SelectItem value="Equipment In Clinical Use" className="text-xs">Equipment In Clinical Emergency Use</SelectItem>
                  <SelectItem value="Facility Power Outage" className="text-xs">Facility Power Outage / Generator Fault</SelectItem>
                  <SelectItem value="Customer Authorization Pending" className="text-xs">Customer Authorization Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setHoldDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleConfirmHold} className="bg-amber-600 text-white hover:bg-amber-700">Confirm Hold</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 6: Debrief Final Summary & Sign-off Review Modal */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-500" />
              <span>Debrief Summary &amp; Official Sign-Off</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Review all logged actions, itemized expenses, and client acknowledgement before closing {job.jobNumber}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 1. Final Equipment Condition & Diagnostics */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-3 text-xs">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                1. Final Equipment Condition &amp; Diagnostics
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Final Status *</Label>
                  <Select value={equipmentStatus} onValueChange={(v) => setEquipmentStatus(v as EquipmentStatus)}>
                    <SelectTrigger className="text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UP" className="text-xs font-bold text-emerald-600">UP (Operational)</SelectItem>
                      <SelectItem value="Partially UP" className="text-xs font-bold text-amber-600">Partially UP</SelectItem>
                      <SelectItem value="Down" className="text-xs font-bold text-rose-600">Down (Failed)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Root Cause *</Label>
                  <Select value={rootCause} onValueChange={(v) => setRootCause(v as RootCause)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOT_CAUSES.map((c) => (
                        <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Resolution *</Label>
                  <Select value={resolution} onValueChange={(v) => setResolution(v as Resolution)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOLUTIONS.map((r) => (
                        <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 2. Itemized Financial & Action Table */}
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                  2. Itemized Cost &amp; Operations Summary
                </h4>
                <span className="font-mono text-sm font-bold text-primary">
                  Total: {formatNaira(totalJobCost)}
                </span>
              </div>

              {/* Mini Itemized Breakdown Table */}
              <div className="border border-border/60 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 text-[11px] font-bold uppercase text-muted-foreground border-b border-border/60">
                    <tr>
                      <th className="py-2 px-3 text-left">Category</th>
                      <th className="py-2 px-3 text-left">Details</th>
                      <th className="py-2 px-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr>
                      <td className="py-2 px-3 font-semibold text-foreground">Spare Parts ({partsUsed.length})</td>
                      <td className="py-2 px-3 text-muted-foreground">{partsUsed.map(p => `${p.partNumber} (x${p.quantityUsed})`).join(", ") || "None"}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-foreground">{formatNaira(totalPartsCost)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-foreground">Field Expenses ({expenses.length})</td>
                      <td className="py-2 px-3 text-muted-foreground">{expenses.map(e => `${e.typeOfExpense}`).join(", ") || "None"}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-foreground">{formatNaira(totalExpensesCost)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-foreground">Tools Validated</td>
                      <td className="py-2 px-3 text-muted-foreground" colSpan={2}>{toolsUsed.map(t => `${t.toolId} (${t.serialNumber})`).join(", ") || "Standard Toolset"}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-foreground">Travel &amp; Labour</td>
                      <td className="py-2 px-3 text-muted-foreground" colSpan={2}>
                        Depart: {travelStartTime || "—"} • Arrived: {travelEndTime || "—"} • Finish: {formatTimeNow()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Dual Sign-Off & Customer Acknowledgement */}
            <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-3 text-xs">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <UserCheck className="size-3.5 text-primary" />
                <span>3. Dual Debrief Sign-Off &amp; Client Acknowledgement</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Lead Engineer (You)</Label>
                  <Input
                    disabled
                    value={user ? `${user.firstName} ${user.lastName}` : "Lead Engineer"}
                    className="text-xs bg-muted/40 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Client / Hospital Contact Person *</Label>
                  <Input
                    placeholder="e.g. Dr. Alabi Kunle"
                    value={clientSignoffName}
                    onChange={(e) => setClientSignoffName(e.target.value)}
                    className="text-xs font-medium"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold">Client Representative Designation / Title</Label>
                  <Input
                    placeholder="e.g. Chief Medical Director / Head Bio-Medical Engineer"
                    value={clientSignoffDesignation}
                    onChange={(e) => setClientSignoffDesignation(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-primary/20 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="confirm_sign"
                  checked={signoffConfirmed}
                  onChange={(e) => setSignoffConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-border text-primary cursor-pointer size-3.5"
                />
                <label htmlFor="confirm_sign" className="text-[11px] text-muted-foreground leading-snug cursor-pointer">
                  I certify that the service described above has been completed to biomedical safety standards, and verified with the hospital client representative.
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!signoffConfirmed || saving}
              onClick={handleFinalSubmitDebrief}
              className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold gap-1.5 cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="size-4" />
              <span>{saving ? "Submitting..." : "Confirm & Submit Debrief"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
