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
  RotateCcw,
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
  const [rootCause, setRootCause] = useState<RootCause>("");
  const [resolution, setResolution] = useState<Resolution>("");

  // Parts state
  const [partsUsed, setPartsUsed] = useState<DebriefPartUsed[]>([]);
  const [partNumber, setPartNumber] = useState("");
  const [partDescription, setPartDescription] = useState("");
  const [partUnitCost, setPartUnitCost] = useState("45000");
  const [partQtyUsed, setPartQtyUsed] = useState("1");

  // Expenses state
  const [expenses, setExpenses] = useState<DebriefExpense[]>([]);
  const [expenseDate, setExpenseDate] = useState(formatDateNow());
  const [expenseType, setExpenseType] = useState<ExpenseType>("Transport (taxi)");
  const [expenseAmount, setExpenseAmount] = useState("15000");
  const [expenseCode, setExpenseCode] = useState("FIN-EXP-2026-088");
  const [expenseReceiptFileName, setExpenseReceiptFileName] = useState("");
  const [expenseNote, setExpenseNote] = useState("");

  // Documents state
  const [documents, setDocuments] = useState<DebriefDocument[]>([]);
  const [docType, setDocType] = useState<DebriefDocumentType>("Equipment checklist");
  const [docFileName, setDocFileName] = useState("");
  const [docComment, setDocComment] = useState("");

  // Tools state
  const [toolsUsed, setToolsUsed] = useState<DebriefToolUsed[]>([]);
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

  // Step Action Triggers
  const handleStartTravel = () => {
    const timeNow = formatTimeNow();
    setTravelStartTime(timeNow);
    toast.success(`Travel start time stamped at ${timeNow}`);
  };

  const handleMarkOnSite = () => {
    const timeNow = formatTimeNow();
    if (!travelStartTime) {
      setTravelStartTime("08:00");
    }
    setTravelEndTime(timeNow);
    setLabourStartTime(timeNow);
    toast.success(`Arrived on site stamped at ${timeNow}. Labour started.`);
  };

  const handleFinishWork = () => {
    const timeNow = formatTimeNow();
    if (!labourStartTime) {
      setLabourStartTime("09:00");
    }
    setLabourEndTime(timeNow);
    toast.success(`Labour end time stamped at ${timeNow}. Please complete work summary.`);
  };

  // Parts Handlers
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
    toast.success(`Part ${newPart.partNumber} added to parts list.`);
  };

  const handleRemovePart = (id: string) => {
    setPartsUsed((prev) => prev.filter((p) => p.id !== id));
  };

  // Expenses Handlers
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
      note: expenseNote || "Site service expenses logged by engineer.",
      expenseCode: expenseCode || "FIN-EXP-2026-088",
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

  // Documents Handlers
  const handleAddDocument = () => {
    if (!docFileName.trim()) {
      toast.error("Please specify a document file name.");
      return;
    }

    const newDoc: DebriefDocument = {
      id: `doc_${Date.now()}`,
      documentType: docType,
      comment: docComment || "Service report attachment.",
      fileName: docFileName.trim(),
      fileUrl: "#",
      fileSize: "1.5 MB",
      uploadDate: formatDateNow(),
    };

    setDocuments((prev) => [...prev, newDoc]);
    setDocFileName("");
    setDocComment("");
    toast.success("Document attached to service job.");
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Tools Handlers
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
    toast.success(`Tool ${tool.toolId} verified and linked.`);
  };

  const handleRemoveTool = (id: string) => {
    setToolsUsed((prev) => prev.filter((t) => t.id !== id));
  };

  // Save / Update Handler
  const handleSaveWorkspace = async (targetJobStatus?: JobStatus) => {
    if (!job) return;

    const finalJobStatus = targetJobStatus || jobStatus;

    if (finalJobStatus === "Completed" && !workDone.trim()) {
      toast.error("Please enter a summary of Work Done before completing the job.");
      return;
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
        setJob(result);
        setJobStatus(finalJobStatus);
        if (finalJobStatus === "Completed") {
          toast.success(`Job ${job.jobNumber} marked as Completed!`);
          navigate({ to: "/app/debrief/my-work" });
        } else if (finalJobStatus === "On Hold") {
          toast.warning(`Job ${job.jobNumber} placed On Hold (${holdReason})`);
        } else {
          toast.success("Job workspace records saved.");
        }
      }
    } catch (err) {
      console.error("Failed to save workspace", err);
      toast.error("Failed to save workspace records.");
    } finally {
      setSaving(false);
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
          The requested service job was not found or has been removed.
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

  return (
    <div className="w-full space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header Bar */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base text-primary">
                {job.jobNumber}
              </span>
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
                {jobStatus === "On Hold" ? `On Hold · ${holdReason}` : jobStatus}
              </span>
            </div>
          </div>

          {/* Top Actions */}
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

            {jobStatus !== "On Hold" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveWorkspace("On Hold")}
                disabled={saving}
                className="h-8 text-xs font-semibold text-amber-600 border-amber-500/30 hover:bg-amber-500/10 gap-1.5 cursor-pointer"
              >
                <PauseCircle className="size-3.5" />
                <span>Put On Hold</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveWorkspace("In Progress")}
                disabled={saving}
                className="h-8 text-xs font-semibold text-blue-600 border-blue-500/30 hover:bg-blue-500/10 gap-1.5 cursor-pointer"
              >
                <Play className="size-3.5" />
                <span>Resume Work</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => handleSaveWorkspace("Completed")}
              disabled={saving}
              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="size-3.5" />
              <span>Complete Job</span>
            </Button>
          </div>
        </div>

        {/* Equipment & Dispatch Quick Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/60 text-xs">
          <div>
            <span className="text-muted-foreground block font-medium">Asset Number</span>
            <span className="font-mono font-bold text-foreground">{job.assetNumber}</span>
          </div>
          <div>
            <span className="text-muted-foreground block font-medium">Equipment</span>
            <span className="font-semibold text-foreground">{job.modality} · {job.oem} ({job.model})</span>
          </div>
          <div>
            <span className="text-muted-foreground block font-medium">Location</span>
            <span className="text-foreground">{job.location || "Main Hospital Ward"}</span>
          </div>
          <div>
            <span className="text-muted-foreground block font-medium">Primary Engineer</span>
            <span className="font-bold text-foreground">{job.assignedToName}</span>
          </div>
        </div>
      </div>

      {/* ================= SECTION 1: GENERAL (READ-ONLY) ================= */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
          <FileText className="size-4 text-primary" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            1. General Equipment & Dispatch Info
          </h3>
        </div>

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
            <dt className="text-muted-foreground font-medium">Year of Mfg</dt>
            <dd className="text-foreground mt-0.5">{job.yearOfManufacture || "—"}</dd>
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
            <dt className="text-muted-foreground font-medium">Job Type</dt>
            <dd className="font-semibold text-foreground mt-0.5">{job.jobType}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Job Priority</dt>
            <dd className="font-semibold text-foreground mt-0.5">{job.jobPriority}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Primary Engineer</dt>
            <dd className="font-bold text-foreground mt-0.5">{job.assignedToName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Assistant Engineer</dt>
            <dd className="text-foreground mt-0.5">{job.assistedBy || "—"}</dd>
          </div>
        </dl>

        <div className="pt-2 border-t border-border/50 space-y-1">
          <span className="text-xs font-semibold text-muted-foreground block">
            Reported Issue Description
          </span>
          <p className="text-xs text-foreground bg-muted/30 p-3 rounded-md border border-border/60 leading-relaxed">
            {job.reportedIssue || "No initial fault description provided."}
          </p>
        </div>
      </div>

      {/* ================= SECTION 2: LABOUR ================= */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              2. Labour & Time Tracking Steps
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Click step buttons to stamp timestamps automatically
          </span>
        </div>

        {/* 3 Step Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Step 1: Start Travel */}
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Step 1: Dispatch</span>
              {travelStartTime && (
                <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="size-3" /> Stamped
                </span>
              )}
            </div>
            <Button
              type="button"
              variant={travelStartTime ? "outline" : "default"}
              size="sm"
              onClick={handleStartTravel}
              className="w-full text-xs font-semibold gap-1.5 cursor-pointer h-8"
            >
              <Navigation className="size-3.5" />
              <span>{travelStartTime ? "Re-stamp Travel Start" : "Start Travel"}</span>
            </Button>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
              <span className="text-muted-foreground">Travel Start:</span>
              <Input
                type="time"
                value={travelStartTime}
                onChange={(e) => setTravelStartTime(e.target.value)}
                className="h-6 w-24 text-xs font-mono text-right p-1"
              />
            </div>
          </div>

          {/* Step 2: Mark On Site */}
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Step 2: On Site</span>
              {labourStartTime && (
                <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="size-3" /> Stamped
                </span>
              )}
            </div>
            <Button
              type="button"
              variant={labourStartTime ? "outline" : "default"}
              size="sm"
              onClick={handleMarkOnSite}
              className="w-full text-xs font-semibold gap-1.5 cursor-pointer h-8"
            >
              <MapPin className="size-3.5" />
              <span>{labourStartTime ? "Re-stamp On Site" : "Mark On Site"}</span>
            </Button>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
              <span className="text-muted-foreground">Labour Start:</span>
              <Input
                type="time"
                value={labourStartTime}
                onChange={(e) => setLabourStartTime(e.target.value)}
                className="h-6 w-24 text-xs font-mono text-right p-1"
              />
            </div>
          </div>

          {/* Step 3: Finish Work */}
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Step 3: Completion</span>
              {labourEndTime && (
                <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="size-3" /> Stamped
                </span>
              )}
            </div>
            <Button
              type="button"
              variant={labourEndTime ? "outline" : "default"}
              size="sm"
              onClick={handleFinishWork}
              className="w-full text-xs font-semibold gap-1.5 cursor-pointer h-8"
            >
              <CheckCircle2 className="size-3.5" />
              <span>{labourEndTime ? "Re-stamp Finish Work" : "Finish Work"}</span>
            </Button>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
              <span className="text-muted-foreground">Labour End:</span>
              <Input
                type="time"
                value={labourEndTime}
                onChange={(e) => setLabourEndTime(e.target.value)}
                className="h-6 w-24 text-xs font-mono text-right p-1"
              />
            </div>
          </div>
        </div>

        {/* Dates & Status Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
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

        {/* Hold Reason Banner (if status is On Hold) */}
        {jobStatus === "On Hold" && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Hold Reason:
              </span>
            </div>
            <Select value={holdReason} onValueChange={setHoldReason}>
              <SelectTrigger className="h-8 text-xs w-60 bg-background">
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

        {/* Work Done Textarea */}
        <div className="space-y-1.5 pt-1">
          <Label htmlFor="workDone" className="text-xs font-bold uppercase tracking-wider">
            Work Done / Actions Performed
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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

      {/* ================= SECTION 3: PARTS ================= */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Boxes className="size-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              3. Parts Used ({partsUsed.length})
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-primary">
            Total Parts Cost: NGN {partsTotalCost.toLocaleString()}
          </span>
        </div>

        {/* Add Part Form */}
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

        {/* Parts Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground uppercase font-bold text-left">
                  <th className="px-3 py-2">Part No</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2 text-right">Unit Cost</th>
                  <th className="px-3 py-2 text-center">Qty</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {partsUsed.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      No replacement parts recorded for this job.
                    </td>
                  </tr>
                ) : (
                  partsUsed.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-accent/40">
                      <td className="px-3 py-2.5 font-mono font-bold text-primary">{p.partNumber}</td>
                      <td className="px-3 py-2.5 text-foreground">{p.description}</td>
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

      {/* ================= SECTION 4: EXPENSES ================= */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              4. Service Expenses ({expenses.length})
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-primary">
            Total Expenses: NGN {expensesTotalAmount.toLocaleString()}
          </span>
        </div>

        {/* Add Expense Form */}
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
            <Label className="text-xs font-semibold">Receipt File Name / Ref</Label>
            <Input
              placeholder="e.g. flight_ticket_ek.pdf"
              value={expenseReceiptFileName}
              onChange={(e) => setExpenseReceiptFileName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Note / Justification</Label>
            <Input
              placeholder="e.g. Emergency taxi transport to facility"
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

        {/* Expenses Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground uppercase font-bold text-left">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Finance Code</th>
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
                      No service expenses logged.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-border/50 last:border-0 hover:bg-accent/40">
                      <td className="px-3 py-2.5 font-mono">{exp.dateOfExpense}</td>
                      <td className="px-3 py-2.5 font-semibold text-foreground">{exp.typeOfExpense}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{exp.expenseCode}</td>
                      <td className="px-3 py-2.5 text-xs text-primary underline truncate max-w-[130px]">
                        {exp.receiptFileName || "No Receipt"}
                      </td>
                      <td className="px-3 py-2.5 text-foreground truncate max-w-[160px]">{exp.note}</td>
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

      {/* ================= SECTION 5: DOCUMENTS ================= */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <FileCheck className="size-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              5. Service Documents ({documents.length})
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Checklists, delivery notes, and service reports
          </span>
        </div>

        {/* Add Document Form */}
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
              placeholder="e.g. Pre_Service_Inspection_Signed.pdf"
              value={docFileName}
              onChange={(e) => setDocFileName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Comment</Label>
            <Input
              placeholder="e.g. Signed checklist and delivery note"
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

        {/* Documents Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground uppercase font-bold text-left">
                  <th className="px-3 py-2">Document Type</th>
                  <th className="px-3 py-2">File Name</th>
                  <th className="px-3 py-2">Comment</th>
                  <th className="px-3 py-2">Upload Date</th>
                  <th className="px-3 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      No documents attached to this job.
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

      {/* ================= SECTION 6: TOOLS ================= */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Wrench className="size-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              6. Calibrated Tools Used ({toolsUsed.length})
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Linked to Tools Module registry & calibration schedule
          </span>
        </div>

        {/* Search tool */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">
            Search Calibrated Tool by ID / OEM / Description
          </Label>
          <div className="relative">
            <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Type to search (e.g. Fluke, Safety Analyzer, TL-CAL-001)..."
              value={toolSearchQuery}
              onChange={(e) => setToolSearchQuery(e.target.value)}
              className="h-8 text-xs font-mono pl-8"
            />
          </div>

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

        {/* Tools Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground uppercase font-bold text-left">
                  <th className="px-3 py-2">Tool ID</th>
                  <th className="px-3 py-2">Serial Number</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Date of Use</th>
                  <th className="px-3 py-2">Calibration Due</th>
                  <th className="px-3 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {toolsUsed.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      No calibrated tools linked to this job.
                    </td>
                  </tr>
                ) : (
                  toolsUsed.map((tool) => (
                    <tr key={tool.id} className="border-b border-border/50 last:border-0 hover:bg-accent/40">
                      <td className="px-3 py-2.5 font-mono font-bold text-primary">{tool.toolId}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{tool.serialNumber}</td>
                      <td className="px-3 py-2.5 text-foreground">{tool.description}</td>
                      <td className="px-3 py-2.5 font-mono">{tool.dateOfUse}</td>
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
            onClick={() => handleSaveWorkspace("Completed")}
            disabled={saving}
            className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-sm px-5"
          >
            <CheckCircle2 className="size-4" />
            <span>Complete Job</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
