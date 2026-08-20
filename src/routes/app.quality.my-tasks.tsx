import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import {
  ClipboardCheck,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  FileText,
  Download,
  Plus,
  Trash2,
  Upload,
  PlusCircle,
  Check,
  X,
  Minus,
  PlayCircle,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable, RowActionsMenu } from "@/components/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { qualityService } from "@/modules/quality/services/quality-service";
import { ChecklistDetailModal } from "@/components/quality/checklist-detail-modal";
import type { ChecklistItem } from "@/modules/quality/types";

export const Route = createFileRoute("/app/quality/my-tasks")({
  head: () => ({
    meta: [
      { title: "My Tasks — HEMP" },
      { name: "description", content: "View, revise, and execute unapproved quality tasks assigned to you." },
    ],
  }),
  component: MyTasksPage,
});

function MyTasksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewTask, setViewTask] = useState<any | null>(null);

  // Fast Vertical Execution modal state (Read-Only step cards + Vertical Pass/Fail/NA + 1 Final Remarks box)
  const [executingTask, setExecutingTask] = useState<any | null>(null);
  const [executingItems, setExecutingItems] = useState<ChecklistItem[]>([]);
  const [executingStepIndex, setExecutingStepIndex] = useState(0);
  const [executingSummary, setExecutingSummary] = useState("");
  const [showExecSummary, setShowExecSummary] = useState(false);

  // Revision / Authoring modal state (Full text editing + Add/Remove steps + Adopt admin additions)
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [revisedDescription, setRevisedDescription] = useState("");
  const [revisedFileName, setRevisedFileName] = useState("");
  const [revisedExecutionSummary, setRevisedExecutionSummary] = useState("");
  const [revisedItems, setRevisedItems] = useState<ChecklistItem[]>([]);
  const [adminSuggestedItems, setAdminSuggestedItems] = useState<ChecklistItem[]>([]);
  const [formStepIndex, setFormStepIndex] = useState(0);
  const [formShowSummary, setFormShowSummary] = useState(false);
  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const fullName = `${user.firstName} ${user.lastName}`;
      const data = await qualityService.getMyTasks(fullName);
      setTasks(data);
    } catch (err) {
      console.error("Error loading tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // --- Fast Vertical Execution Handler ---
  const handleOpenExecuteModal = (task: any) => {
    setExecutingTask(task);
    setExecutingSummary(task.rawChecklist?.executionSummary || task.executionSummary || "");

    const existingItems: ChecklistItem[] = task.items ? JSON.parse(JSON.stringify(task.items)) : [];
    setExecutingItems(
      existingItems.length > 0
        ? existingItems
        : [
            {
              id: `item_${Date.now()}_1`,
              description: "Initial mechanical and visual safety inspection",
              requirement: "All fasteners secure, no cracks or insulation damage.",
              status: null,
            },
          ]
    );
    setExecutingStepIndex(0);
    setShowExecSummary(false);
  };

  const handleExecStatusChange = (id: string, status: "pass" | "fail" | "na") => {
    setExecutingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: item.status === status ? null : status } : item))
    );
  };

  const handleSubmitExecution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!executingTask || !user) return;
    const fullName = `${user.firstName} ${user.lastName}`;
    try {
      if (executingTask.type === "checklist") {
        await qualityService.resubmitChecklist(
          executingTask.id,
          {
            executionSummary: executingSummary,
            items: executingItems,
          },
          fullName
        );
      }
      setExecutingTask(null);
      loadData();
    } catch (err) {
      console.error("Error submitting checklist execution", err);
    }
  };

  // --- Authoring / Revision Modal Handlers ---
  const handleOpenReviseModal = (task: any) => {
    setEditingTask(task);
    setRevisedDescription(task.description || "");
    setRevisedFileName(task.fileName || "");
    setRevisedExecutionSummary(task.rawChecklist?.executionSummary || task.executionSummary || "");

    const existingItems: ChecklistItem[] = task.items ? JSON.parse(JSON.stringify(task.items)) : [];
    const suggested: ChecklistItem[] = task.rawChecklist?.additionalRecommendedItems || task.additionalRecommendedItems || [];

    setAdminSuggestedItems(suggested);
    setRevisedItems(
      existingItems.length > 0
        ? existingItems
        : [
            {
              id: `item_${Date.now()}_1`,
              description: "Initial equipment visual inspection & power verification",
              requirement: "Chassis intact, power cable secure, indicator LEDs illuminate.",
              status: null,
            },
          ]
    );
    setFormStepIndex(0);
    setFormShowSummary(false);
  };

  const handleAdoptAdminItem = (suggestedItem: ChecklistItem) => {
    const newItem: ChecklistItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      description: suggestedItem.description,
      requirement: suggestedItem.requirement,
      status: "pass",
    };
    setRevisedItems((prev) => [...prev, newItem]);
    setAdminSuggestedItems((prev) => prev.filter((item) => item.id !== suggestedItem.id));
    setFormStepIndex(revisedItems.length);
    setFormShowSummary(false);
  };

  const handleAddNewStep = () => {
    const newItem: ChecklistItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      description: "",
      requirement: "",
      status: null,
    };
    setRevisedItems((prev) => [...prev, newItem]);
    setFormStepIndex(revisedItems.length);
    setFormShowSummary(false);
  };

  const handleRemoveStep = (indexToRemove: number) => {
    setRevisedItems((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (formStepIndex >= revisedItems.length - 1) {
      setFormStepIndex(Math.max(0, revisedItems.length - 2));
    }
  };

  const handleItemFieldChange = (id: string, field: "description" | "requirement", value: string) => {
    setRevisedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleItemStatusToggle = (id: string, status: "pass" | "fail" | "na") => {
    setRevisedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: item.status === status ? null : status } : item))
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRevisedFileName(e.target.files[0].name);
    }
  };

  const handleResubmitForApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !user) return;
    const fullName = `${user.firstName} ${user.lastName}`;
    try {
      if (editingTask.type === "checklist") {
        await qualityService.resubmitChecklist(
          editingTask.id,
          {
            description: revisedDescription,
            fileName: editingTask.checklistType === "upload" ? revisedFileName : undefined,
            executionSummary: revisedExecutionSummary,
            items: editingTask.checklistType === "structured" ? revisedItems : undefined,
          },
          fullName
        );
      }
      setEditingTask(null);
      loadData();
    } catch (err) {
      console.error("Error resubmitting task", err);
    }
  };

  const handleResolveTask = async (row: any) => {
    try {
      if (row.role === "Reviewer") {
        if (row.type === "document") {
          const docs = await qualityService.listDocuments(true);
          const doc = docs.find((d) => d.id === row.id);
          if (doc) await qualityService.updateDocument(doc.id, { ...doc, status: "Pending Approval" });
        } else {
          const chks = await qualityService.listChecklists(true);
          const chk = chks.find((c) => c.id === row.id);
          if (chk) await qualityService.updateChecklist(chk.id, { ...chk, status: "Pending Approval" });
        }
      } else {
        if (row.type === "document") {
          const docs = await qualityService.listDocuments(true);
          const doc = docs.find((d) => d.id === row.id);
          if (doc) await qualityService.updateDocument(doc.id, { ...doc, status: "Approved" });
        } else {
          const chks = await qualityService.listChecklists(true);
          const chk = chks.find((c) => c.id === row.id);
          if (chk) await qualityService.updateChecklist(chk.id, { ...chk, status: "Approved" });
        }
      }
      loadData();
    } catch (err) {
      console.error("Error resolving task", err);
    }
  };

  // Execution stats for Executing modal
  const execPassCount = executingItems.filter((it) => it.status === "pass").length;
  const execFailCount = executingItems.filter((it) => it.status === "fail").length;
  const execNaCount = executingItems.filter((it) => it.status === "na").length;
  const execDoneCount = execPassCount + execFailCount + execNaCount;
  const execTotalCount = executingItems.length;
  const execProgressPercent = execTotalCount > 0 ? Math.round((execDoneCount / execTotalCount) * 100) : 0;
  const currentExecItem = executingItems[executingStepIndex] || executingItems[0];

  // Revision stats for Editing modal
  const revPassCount = revisedItems.filter((it) => it.status === "pass").length;
  const revFailCount = revisedItems.filter((it) => it.status === "fail").length;
  const revNaCount = revisedItems.filter((it) => it.status === "na").length;
  const revTotalCount = revisedItems.length;
  const currentRevItem = revisedItems[formStepIndex] || revisedItems[0];

  const currentFullName = user ? `${user.firstName} ${user.lastName}` : "";

  const columns: DataTableColumn<any>[] = [
    {
      key: "description",
      header: "Task Subject / Item",
      value: (row) => row.description,
      cell: (row) => (
        <div className="flex items-start gap-2.5 max-w-sm">
          <ClipboardCheck className="size-4.5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-foreground leading-snug">{row.description}</p>
            <span className="text-[10px] text-muted-foreground font-mono">
              {row.identifier} ({row.type === "checklist" ? (row.checklistType === "structured" ? "Custom Protocol" : "Uploaded File") : "Document"})
            </span>
          </div>
        </div>
      ),
      filterable: false,
    },
    {
      key: "role",
      header: "Your Assignment",
      value: (row) => row.role,
      cell: (row) => (
        <span className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-foreground border border-border">
          {row.role}
        </span>
      ),
      filterable: true,
    },
    {
      key: "actionRequired",
      header: "Action Required",
      value: (row) => row.actionRequired,
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {row.status === "Needs Revision" && (
            <AlertCircle className="size-3.5 text-rose-500 shrink-0" />
          )}
          <span className="text-xs font-medium text-foreground">{row.actionRequired}</span>
        </div>
      ),
      filterable: true,
    },
    {
      key: "status",
      header: "Current Status",
      value: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} label={row.status} />,
      filterable: true,
    },
    {
      key: "lastUpdated",
      header: "Last Activity",
      value: (row) => row.lastUpdated,
      filterable: false,
      className: "font-mono text-xs text-muted-foreground",
    },
  ];

  const renderRowActions = (row: any) => {
    const isChecklist = row.type === "checklist";
    const isAuthor = row.preparedBy === currentFullName;
    const isNeedsRevision = row.status === "Needs Revision";

    return (
      <RowActionsMenu
        actions={[
          {
            label: "View Checklist",
            icon: Eye,
            onClick: () => setViewTask(row),
          },
          isChecklist
            ? {
                label: "Execute Checklist",
                icon: PlayCircle,
                variant: "success",
                onClick: () => handleOpenExecuteModal(row),
              }
            : null,
          isChecklist && (isAuthor || isNeedsRevision)
            ? {
                label: isNeedsRevision ? "Revise Checklist" : "Edit Checklist",
                icon: Edit2,
                onClick: () => handleOpenReviseModal(row),
              }
            : null,
          row.role === "Reviewer" || row.role === "Approver"
            ? {
                label: row.role === "Reviewer" ? "Submit Review" : "Submit Approval",
                icon: CheckCircle2,
                variant: "success",
                onClick: () => handleResolveTask(row),
              }
            : null,
        ]}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="size-6 text-primary animate-pulse" />
          My Tasks
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Execute and tick assigned equipment checklists, monitor validation status, and revise tasks returned with admin notes.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={tasks}
        loading={loading}
        searchPlaceholder="Search assigned tasks..."
        emptyTitle="No tasks pending"
        emptyDescription="Great job! Your quality validation queue is completely empty."
        rowActions={renderRowActions}
      />

      {/* 1. FULL TASK DETAILS MODAL (Action center) */}
      <ChecklistDetailModal
        open={!!viewTask}
        onOpenChange={(open) => !open && setViewTask(null)}
        data={viewTask}
        onExecute={
          viewTask?.type === "checklist"
            ? () => {
                const target = viewTask;
                setViewTask(null);
                handleOpenExecuteModal(target);
              }
            : undefined
        }
        onRevise={
          viewTask?.type === "checklist" && (viewTask.status === "Needs Revision" || viewTask.preparedBy === currentFullName)
            ? () => {
                const target = viewTask;
                setViewTask(null);
                handleOpenReviseModal(target);
              }
            : undefined
        }
      />

      {/* 2. DEDICATED VERTICAL EXECUTION MODAL (Read-Only Checkpoints + Vertical Pass/Fail/NA + Single Remarks Box) */}
      <Dialog open={!!executingTask} onOpenChange={(open) => !open && setExecutingTask(null)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto w-[calc(100%-1.5rem)] sm:w-full p-4 sm:p-6">
          <DialogHeader className="border-b border-border pb-3 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <DialogTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg font-bold leading-snug">
                <PlayCircle className="size-5 text-primary shrink-0" />
                Execute Checklist Protocol
              </DialogTitle>
              <div className="shrink-0 self-start sm:self-auto">
                <StatusBadge status={executingTask?.status || "Pending"} label={executingTask?.status || "Pending"} />
              </div>
            </div>
            <div className="text-xs text-muted-foreground font-mono pt-1">
              Checklist: <strong className="text-foreground">{executingTask?.description}</strong> ({executingTask?.identifier})
            </div>
          </DialogHeader>

          {executingTask && (
            <form onSubmit={handleSubmitExecution} className="space-y-3 py-1">
              {/* Step Tracker Header & Progress Bar (Visible in Stepper mode) */}
              {!showExecSummary && (
                <div className="space-y-2 p-2.5 sm:p-3 bg-muted/40 rounded-xl border border-border">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                        Execution Progress
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 font-mono">
                        Step {executingStepIndex + 1} of {execTotalCount}
                      </span>
                    </div>

                    {/* Live Breakdown Stats */}
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {execPassCount} Pass
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {execFailCount} Fail
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                        {execNaCount} N/A
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden border border-border/50">
                    <div
                      className="bg-primary h-full transition-all duration-300 rounded-full"
                      style={{ width: `${execProgressPercent}%` }}
                    />
                  </div>

                  {/* Step Navigation Pill Dots & Action Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/60">
                    {/* Scrollable Step Numbers */}
                    <div className="flex items-center gap-1 overflow-x-auto py-1 flex-1 min-w-0 scrollbar-thin">
                      {executingItems.map((item, idx) => {
                        const isCurrent = executingStepIndex === idx;
                        const isPass = item.status === "pass";
                        const isFail = item.status === "fail";
                        const isNa = item.status === "na";

                        return (
                          <button
                            key={item.id || idx}
                            type="button"
                            onClick={() => {
                              setExecutingStepIndex(idx);
                              setShowExecSummary(false);
                            }}
                            className={`size-7 rounded-md text-xs font-bold flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                              isCurrent
                                ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                                : "opacity-80 hover:opacity-100"
                            } ${
                              isPass
                                ? "bg-emerald-600 text-white"
                                : isFail
                                  ? "bg-rose-600 text-white"
                                  : isNa
                                    ? "bg-slate-600 text-white"
                                    : "bg-background border border-border text-foreground hover:bg-muted"
                            }`}
                            title={`Step ${idx + 1}`}
                          >
                            {isPass ? <Check className="size-3.5" /> : isFail ? <X className="size-3.5" /> : isNa ? <Minus className="size-3.5" /> : idx + 1}
                          </button>
                        );
                      })}
                    </div>

                    {/* Pinned Action Controls */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 px-2.5 text-xs font-semibold shrink-0"
                        onClick={() => setShowExecSummary(true)}
                      >
                        Review All
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* READ-ONLY STEP SLIDE CARD (Zero Text Entry - Pure Tap Execution) */}
              {!showExecSummary && currentExecItem && (
                <div className="p-3.5 sm:p-4 rounded-xl border border-primary/30 bg-card space-y-3.5 shadow-sm animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex size-5.5 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs">
                        {executingStepIndex + 1}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-foreground">
                        Step {executingStepIndex + 1} of {execTotalCount}
                      </span>
                    </div>
                    {currentExecItem.status && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        currentExecItem.status === "pass"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : currentExecItem.status === "fail"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            : "bg-muted text-muted-foreground"
                      }`}>
                        Marked: {currentExecItem.status}
                      </span>
                    )}
                  </div>

                  {/* Read-only Checkpoint Information */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-0.5">
                        Inspection Target / Task:
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                        {currentExecItem.description || "Checkpoint procedure"}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-0.5">
                        Passing Criteria / Requirement:
                      </span>
                      <p className="font-mono text-xs text-foreground/90 leading-relaxed">
                        {currentExecItem.requirement || "Verify standard operating threshold."}
                      </p>
                    </div>
                  </div>

                  {/* LARGE VERTICAL EXECUTION BUTTONS */}
                  <div className="space-y-1.5 pt-1 border-t border-border">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Select Verification Result:
                    </Label>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleExecStatusChange(currentExecItem.id, "pass")}
                        className={`w-full h-11 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border shadow-2xs ${
                          currentExecItem.status === "pass"
                            ? "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/30"
                            : "bg-background hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        <Check className="size-4.5" />
                        Pass
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExecStatusChange(currentExecItem.id, "fail")}
                        className={`w-full h-11 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border shadow-2xs ${
                          currentExecItem.status === "fail"
                            ? "bg-rose-600 text-white border-rose-600 ring-2 ring-rose-500/30"
                            : "bg-background hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        }`}
                      >
                        <X className="size-4.5" />
                        Fail
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExecStatusChange(currentExecItem.id, "na")}
                        className={`w-full h-11 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border shadow-2xs ${
                          currentExecItem.status === "na"
                            ? "bg-slate-600 text-white border-slate-600 ring-2 ring-slate-500/30"
                            : "bg-background hover:bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        <Minus className="size-4.5" />
                        N/A
                      </button>
                    </div>
                  </div>

                  {/* Stepper Navigation */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={executingStepIndex === 0}
                      onClick={() => setExecutingStepIndex((prev) => Math.max(0, prev - 1))}
                      className="w-1/2 sm:w-auto text-xs h-8"
                    >
                      <ChevronLeft className="size-3.5 mr-1" />
                      Previous Step
                    </Button>

                    {executingStepIndex < execTotalCount - 1 ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setExecutingStepIndex((prev) => prev + 1)}
                        className="w-1/2 sm:w-auto text-xs h-8"
                      >
                        Next Step
                        <ChevronRight className="size-3.5 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowExecSummary(true)}
                        className="w-1/2 sm:w-auto text-xs h-8 font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                      >
                        Review & Complete
                        <ArrowRight className="size-3.5 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* SUMMARY & FINAL REMARKS VIEW (Optimized Mobile Layout) */}
              {showExecSummary && (
                <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-card space-y-3 shadow-sm animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-foreground block">
                        Checklist Execution Scorecard
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {execDoneCount} of {execTotalCount} executed ({execProgressPercent}%) • {execPassCount} Pass, {execFailCount} Fail, {execNaCount} N/A
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => setShowExecSummary(false)}
                    >
                      <ArrowLeft className="size-3 mr-1" />
                      Back to Steps
                    </Button>
                  </div>

                  {/* Scorecard items list (Scrollable) */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {executingItems.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        onClick={() => {
                          setExecutingStepIndex(idx);
                          setShowExecSummary(false);
                        }}
                        className="flex items-start justify-between gap-2 p-2 rounded-lg border bg-muted/30 hover:bg-muted/60 cursor-pointer text-xs transition-colors w-full"
                      >
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <span className="inline-flex size-5 items-center justify-center rounded bg-muted text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-foreground text-xs leading-snug break-words">
                            {item.description || "Checkpoint"}
                          </span>
                        </div>
                        <div className="shrink-0 ml-1.5">
                          {item.status === "pass" && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <Check className="size-3" /> Pass
                            </span>
                          )}
                          {item.status === "fail" && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <X className="size-3" /> Fail
                            </span>
                          )}
                          {item.status === "na" && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-500/15 text-muted-foreground border border-border">
                              <Minus className="size-3" /> N/A
                            </span>
                          )}
                          {!item.status && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-amber-600 bg-amber-500/10 border border-amber-500/20 italic">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Single Unified Execution Remarks & Findings Field */}
                  <div className="space-y-1 border-t border-border pt-2.5">
                    <Label htmlFor="execSummary" className="text-xs font-semibold text-foreground">
                      Overall Execution Remarks & Findings
                    </Label>
                    <Textarea
                      id="execSummary"
                      value={executingSummary}
                      onChange={(e) => setExecutingSummary(e.target.value)}
                      placeholder="Enter summary notes, test observations, calibrated values, or reasons for failure..."
                      rows={2}
                      className="text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2 pt-2.5 border-t border-border mt-2">
                <Button type="button" variant="outline" className="w-full sm:w-auto text-xs h-9" onClick={() => setExecutingTask(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto text-xs h-9 bg-primary text-primary-foreground font-semibold">
                  <CheckCircle2 className="size-3.5 mr-1" />
                  Submit Execution for Approval
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 3. REVISION / AUTHORING MODAL (Full Checklist Editor & Admin Recommendations Adoption) */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto w-[calc(100%-1.5rem)] sm:w-full p-4 sm:p-6">
          <DialogHeader className="border-b border-border pb-3 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <DialogTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg font-bold leading-snug">
                <Edit2 className="size-5 text-primary shrink-0" />
                {editingTask?.status === "Needs Revision" ? "Revise Checklist Protocol" : "Edit Checklist Protocol"}
              </DialogTitle>
              <div className="shrink-0 self-start sm:self-auto">
                <StatusBadge status={editingTask?.status || "Draft"} label={editingTask?.status || "Draft"} />
              </div>
            </div>
            <div className="text-xs text-muted-foreground font-mono pt-1">
              Code: <strong className="text-foreground">{editingTask?.identifier}</strong> • Form: <strong className="text-foreground">{editingTask?.checklistType === "structured" ? "Custom Form" : "File Upload"}</strong>
            </div>
          </DialogHeader>

          {editingTask && (
            <form onSubmit={handleResubmitForApproval} className="space-y-3.5 py-1">
              {/* Admin rejection reason note */}
              {editingTask.rejectionNotes && (
                <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 space-y-1">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                    <AlertCircle className="size-4 shrink-0" />
                    Admin Rejection Reason & Instructions
                  </div>
                  <p className="text-xs text-foreground bg-background/90 p-2 rounded border border-rose-500/20 leading-relaxed break-words">
                    {editingTask.rejectionNotes}
                  </p>
                </div>
              )}

              {/* Admin Recommended Additions Adoption */}
              {adminSuggestedItems.length > 0 && (
                <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-wider">
                      <PlusCircle className="size-3.5 shrink-0" />
                      Admin Recommended Additions ({adminSuggestedItems.length})
                    </span>
                    <span className="text-[10px] text-muted-foreground">Click adopt to merge into checklist</span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {adminSuggestedItems.map((sug, i) => (
                      <div key={sug.id || i} className="flex flex-col gap-2 p-2.5 rounded-lg border border-primary/20 bg-background text-xs shadow-2xs">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-foreground break-words text-xs leading-snug">{sug.description}</div>
                          <div className="text-[11px] text-muted-foreground font-mono break-words leading-relaxed">Criteria: {sug.requirement}</div>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 w-full"
                          onClick={() => handleAdoptAdminItem(sug)}
                        >
                          <Plus className="size-3 mr-1" />
                          Adopt to Checklist
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist Title */}
              <div className="space-y-1">
                <Label htmlFor="revDesc" className="text-xs font-semibold text-foreground">
                  Checklist Description / Title
                </Label>
                <Input
                  id="revDesc"
                  value={revisedDescription}
                  onChange={(e) => setRevisedDescription(e.target.value)}
                  className="bg-background text-xs font-medium h-9"
                  required
                />
              </div>

              {/* Upload file revision */}
              {editingTask.checklistType === "upload" && (
                <div className="space-y-1.5 border-t border-border pt-3">
                  <Label className="text-xs font-semibold">Updated Document File</Label>
                  <div className="flex gap-2">
                    <input
                      key={fileInputKey}
                      id="revFile"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start font-normal text-xs"
                      onClick={() => document.getElementById("revFile")?.click()}
                    >
                      <Upload className="size-3.5 mr-2" />
                      {revisedFileName ? revisedFileName : "Choose Revised Document File"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step-by-Step Structured Item Builder */}
              {editingTask.checklistType === "structured" && (
                <div className="space-y-3 border-t border-border pt-3">
                  {/* Step Tracker Header & Progress Bar */}
                  <div className="space-y-2 p-2.5 sm:p-3 bg-muted/40 rounded-xl border border-border">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                          Checklist Steps
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 font-mono">
                          {!formShowSummary ? `Step ${formStepIndex + 1} of ${revTotalCount}` : `${revTotalCount} Steps`}
                        </span>
                      </div>

                      {/* Initial status counts */}
                      <div className="flex items-center gap-1 text-[10px] font-bold">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {revPassCount} Pass
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          {revFailCount} Fail
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                          {revNaCount} N/A
                        </span>
                      </div>
                    </div>

                    {/* Step Navigation Pill Dots & Action Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/60">
                      {/* Scrollable Step Numbers */}
                      <div className="flex items-center gap-1 overflow-x-auto py-1 flex-1 min-w-0 scrollbar-thin">
                        {revisedItems.map((item, idx) => {
                          const isCurrent = !formShowSummary && formStepIndex === idx;
                          const isPass = item.status === "pass";
                          const isFail = item.status === "fail";
                          const isNa = item.status === "na";

                          return (
                            <button
                              key={item.id || idx}
                              type="button"
                              onClick={() => {
                                setFormStepIndex(idx);
                                setFormShowSummary(false);
                              }}
                              className={`size-7 rounded-md text-xs font-bold flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                isCurrent
                                  ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                                  : "opacity-80 hover:opacity-100"
                              } ${
                                isPass
                                  ? "bg-emerald-600 text-white"
                                  : isFail
                                    ? "bg-rose-600 text-white"
                                    : isNa
                                      ? "bg-slate-600 text-white"
                                      : "bg-background border border-border text-foreground hover:bg-muted"
                              }`}
                              title={`Step ${idx + 1}`}
                            >
                              {isPass ? <Check className="size-3.5" /> : isFail ? <X className="size-3.5" /> : isNa ? <Minus className="size-3.5" /> : idx + 1}
                            </button>
                          );
                        })}
                      </div>

                      {/* Fixed Pinned Actions (Always visible and clickable) */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs font-semibold shrink-0 border-dashed bg-background hover:bg-accent"
                          onClick={handleAddNewStep}
                          title="Add next checkpoint slide"
                        >
                          <Plus className="size-3.5 mr-1" />
                          + Add Checklist
                        </Button>

                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-7 px-2.5 text-xs font-semibold shrink-0"
                          onClick={() => setFormShowSummary(!formShowSummary)}
                        >
                          {formShowSummary ? "Stepper" : "Review All"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE STEP CARD (Editing Slide) */}
                  {!formShowSummary && currentRevItem && (
                    <div className="p-3.5 sm:p-4 rounded-xl border border-primary/30 bg-card space-y-3 shadow-sm animate-in fade-in-50 duration-200">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex size-5.5 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs">
                            {formStepIndex + 1}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-foreground">
                            Step {formStepIndex + 1} of {revTotalCount}
                          </span>
                        </div>
                        {revTotalCount > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2"
                            onClick={() => handleRemoveStep(formStepIndex)}
                            title="Delete this checkpoint"
                          >
                            <Trash2 className="size-3.5 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>

                      {/* Checkpoint Inputs */}
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Test Description / Activity
                          </Label>
                          <Input
                            value={currentRevItem.description}
                            onChange={(e) => handleItemFieldChange(currentRevItem.id, "description", e.target.value)}
                            placeholder={`e.g. Visual inspection of cables and interlocks`}
                            className="bg-background text-xs font-semibold h-8.5"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Passing Criteria / Acceptance Threshold
                          </Label>
                          <Input
                            value={currentRevItem.requirement}
                            onChange={(e) => handleItemFieldChange(currentRevItem.id, "requirement", e.target.value)}
                            placeholder="e.g. Delivered energy within ±15% tolerance"
                            className="bg-background text-xs text-muted-foreground font-mono h-8"
                            required
                          />
                        </div>
                      </div>

                      {/* Optional Initial Result Toggles */}
                      <div className="space-y-1.5 pt-2 border-t border-border">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Initial Result (Optional):
                        </Label>

                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => handleItemStatusToggle(currentRevItem.id, "pass")}
                            className={`h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                              currentRevItem.status === "pass"
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                : "bg-background hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            <Check className="size-3.5" />
                            Pass
                          </button>

                          <button
                            type="button"
                            onClick={() => handleItemStatusToggle(currentRevItem.id, "fail")}
                            className={`h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                              currentRevItem.status === "fail"
                                ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                                : "bg-background hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                            }`}
                          >
                            <X className="size-3.5" />
                            Fail
                          </button>

                          <button
                            type="button"
                            onClick={() => handleItemStatusToggle(currentRevItem.id, "na")}
                            className={`h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                              currentRevItem.status === "na"
                                ? "bg-slate-600 text-white border-slate-600 shadow-sm"
                                : "bg-background hover:bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            <Minus className="size-3.5" />
                            N/A
                          </button>
                        </div>
                      </div>

                      {/* Step Navigation Bar */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={formStepIndex === 0}
                          onClick={() => setFormStepIndex((prev) => Math.max(0, prev - 1))}
                          className="w-1/2 sm:w-auto text-xs h-8"
                        >
                          <ChevronLeft className="size-3.5 mr-1" />
                          Previous
                        </Button>

                        {formStepIndex < revTotalCount - 1 ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setFormStepIndex((prev) => prev + 1)}
                            className="w-1/2 sm:w-auto text-xs h-8"
                          >
                            Next Step
                            <ChevronRight className="size-3.5 ml-1" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setFormShowSummary(true)}
                            className="w-1/2 sm:w-auto text-xs h-8 font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                          >
                            Review All
                            <ArrowRight className="size-3.5 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUMMARY & SUBMISSION VIEW */}
                  {formShowSummary && (
                    <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-card space-y-3.5 shadow-sm animate-in fade-in-50 duration-200">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <span className="font-bold text-xs sm:text-sm text-foreground block">
                          All Checkpoints Overview ({revTotalCount} Steps)
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setFormShowSummary(false)}
                        >
                          <ArrowLeft className="size-3 mr-1" />
                          Back to Stepper
                        </Button>
                      </div>

                      {/* Items mini list */}
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {revisedItems.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            onClick={() => {
                              setFormStepIndex(idx);
                              setFormShowSummary(false);
                            }}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-muted/30 hover:bg-muted/60 cursor-pointer text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="inline-flex size-4.5 items-center justify-center rounded bg-muted text-[10px] font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <span className="truncate font-semibold text-foreground">{item.description || "Untitled Checkpoint"}</span>
                            </div>
                            <div className="shrink-0">
                              {item.status === "pass" && <span className="text-[10px] font-bold text-emerald-600 uppercase">Pass</span>}
                              {item.status === "fail" && <span className="text-[10px] font-bold text-rose-600 uppercase">Fail</span>}
                              {item.status === "na" && <span className="text-[10px] font-bold text-muted-foreground uppercase">N/A</span>}
                              {!item.status && <span className="text-[10px] text-muted-foreground italic">Pending</span>}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1 border-t border-border pt-2.5">
                        <Label htmlFor="revExecSummary" className="text-xs font-semibold text-foreground">
                          Overall Execution Remarks & Findings
                        </Label>
                        <Textarea
                          id="revExecSummary"
                          value={revisedExecutionSummary}
                          onChange={(e) => setRevisedExecutionSummary(e.target.value)}
                          placeholder="Enter summary test remarks, measured values, calibration readings, or failure notes..."
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="gap-2 pt-3 border-t border-border mt-3">
                <Button type="button" variant="outline" className="w-full sm:w-auto text-xs" onClick={() => setEditingTask(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto text-xs">
                  {editingTask.status === "Needs Revision" ? "Resubmit for Approval" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
