import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import {
  Edit2,
  Eye,
  Download,
  Archive,
  Plus,
  Upload,
  ClipboardCheck,
  Trash2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable, RowActionsMenu } from "@/components/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { personnelService } from "@/modules/settings/services/personnel-service";
import { configService } from "@/modules/settings/services/config-service";
import { qualityService, type EquipmentChecklistInput } from "@/modules/quality/services/quality-service";
import type { Personnel, ConfigRecord } from "@/modules/settings/types";
import type { EquipmentChecklist, ChecklistItem } from "@/modules/quality/types";

import { ChecklistDetailModal } from "@/components/quality/checklist-detail-modal";

export const Route = createFileRoute("/app/quality/checklists")({
  head: () => ({
    meta: [
      { title: "Equipment Checklists — HEMP" },
      { name: "description", content: "View, download and configure medical device equipment checklists." },
    ],
  }),
  component: EquipmentChecklistsPage,
});

interface ChecklistFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklist: EquipmentChecklist | null; // null if creating
  creationType?: "upload" | "structured";
  isAdmin: boolean;
  currentUserName?: string;
  personnelList: Personnel[];
  statuses: ConfigRecord[];
  oems: ConfigRecord[];
  modalities: ConfigRecord[];
  models: ConfigRecord[];
  onSubmit: (input: EquipmentChecklistInput) => void;
}

function ChecklistFormModal({
  open,
  onOpenChange,
  checklist,
  creationType = "upload",
  isAdmin = false,
  currentUserName,
  personnelList,
  statuses,
  oems,
  modalities,
  models,
  onSubmit,
}: ChecklistFormModalProps) {
  const [description, setDescription] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [version, setVersion] = useState("");
  const [preparedById, setPreparedById] = useState("");
  const [reviewedById, setReviewedById] = useState("");
  const [approvedById, setApprovedById] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [status, setStatus] = useState("");
  const [equipmentOem, setEquipmentOem] = useState("");
  const [modality, setModality] = useState("");
  const [equipmentModel, setEquipmentModel] = useState("");
  const [creationMethod, setCreationMethod] = useState<"upload" | "structured">("upload");
  const [fileName, setFileName] = useState("");
  const [executionSummary, setExecutionSummary] = useState("");
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [formStepIndex, setFormStepIndex] = useState(0);
  const [formShowSummary, setFormShowSummary] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const passCount = items.filter((it) => it.status === "pass").length;
  const failCount = items.filter((it) => it.status === "fail").length;
  const naCount = items.filter((it) => it.status === "na").length;
  const totalItemsCount = items.length;

  useEffect(() => {
    if (checklist) {
      setCreationMethod(checklist.type);
      setDescription(checklist.description);
      setFormNumber(checklist.formNumber);
      setVersion(checklist.version);
      setPreparedById(checklist.preparedById);
      setReviewedById(checklist.reviewedById);
      setApprovedById(checklist.approvedById);
      setAssignedToId(checklist.assignedToId || "");
      setStatus(checklist.status);
      setEquipmentOem(checklist.equipmentOem);
      setModality(checklist.modality);
      setEquipmentModel(checklist.equipmentModel);
      setFileName(checklist.fileName || "");
      setExecutionSummary(checklist.executionSummary || "");
      setItems(checklist.items || []);
      setFormStepIndex(0);
      setFormShowSummary(false);
    } else {
      setCreationMethod(creationType);
      setDescription("");
      setFormNumber(`FORM-PM-${Math.floor(100 + Math.random() * 900)}`);
      setVersion("v1.0");

      const matchedUser = personnelList.find(
        (p) => `${p.firstName} ${p.lastName}`.toLowerCase() === currentUserName?.toLowerCase()
      );
      setPreparedById(matchedUser?.id || personnelList[0]?.id || "");
      setReviewedById(personnelList[1]?.id || personnelList[0]?.id || "");
      setApprovedById(personnelList[0]?.id || "");
      setAssignedToId("");
      setStatus(isAdmin ? (statuses[0]?.label || "Draft") : "Under Review");
      setEquipmentOem(oems[0]?.label || "");
      setModality(modalities[0]?.label || "");
      setEquipmentModel(models[0]?.label || "");
      setFileName("");
      setExecutionSummary("");
      setItems(creationType === "structured" ? [
        {
          id: `item_${Date.now()}_1`,
          description: "Initial mechanical and visual safety inspection",
          requirement: "All fasteners secure, no cracks or insulation damage.",
          status: null,
        }
      ] : []);
      setFormStepIndex(0);
      setFormShowSummary(false);
      setFileInputKey((k) => k + 1);
    }
  }, [checklist, open, creationType, isAdmin, currentUserName, personnelList, statuses, oems, modalities, models]);

  const handleAddItem = () => {
    const newItem: ChecklistItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      description: "",
      requirement: "",
      status: null,
    };
    setItems((prev) => [...prev, newItem]);
    setFormStepIndex(items.length);
    setFormShowSummary(false);
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (formStepIndex >= items.length - 1) {
      setFormStepIndex(Math.max(0, items.length - 2));
    }
  };

  const handleItemChange = (id: string, field: "description" | "requirement", value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleItemStatusToggle = (id: string, status: "pass" | "fail" | "na") => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: item.status === status ? null : status } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const prep = personnelList.find((p) => p.id === preparedById);
    const rev = personnelList.find((p) => p.id === reviewedById);
    const app = personnelList.find((p) => p.id === approvedById);
    const assigned = personnelList.find((p) => p.id === assignedToId);

    if (!prep || !rev || !app) return;

    onSubmit({
      description,
      formNumber,
      version,
      preparedById,
      preparedByName: `${prep.firstName} ${prep.lastName}`,
      reviewedById,
      reviewedByName: `${rev.firstName} ${rev.lastName}`,
      approvedById,
      approvedByName: `${app.firstName} ${app.lastName}`,
      assignedToId: assignedToId || undefined,
      assignedToName: assigned ? `${assigned.firstName} ${assigned.lastName}` : undefined,
      status,
      equipmentOem,
      modality,
      equipmentModel,
      type: creationMethod,
      fileName: creationMethod === "upload" ? fileName || "uploaded_checklist.pdf" : undefined,
      executionSummary: creationMethod === "structured" ? executionSummary : undefined,
      items: creationMethod === "structured" ? items : undefined,
    });
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const currentFormItem = items[formStepIndex] || items[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto w-[calc(100%-1.5rem)] sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold">
            {checklist
              ? "Edit Equipment Checklist"
              : creationMethod === "upload"
                ? "Add Equipment Checklist (Upload File)"
                : "Create Step-by-Step Equipment Checklist"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-1">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="chkDesc">Checklist Description</Label>
            <Textarea
              id="chkDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Siemens Luminos dRF Max Annual PM Protocol"
              rows={2}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="formNo">Form Identifier / Protocol Code</Label>
            <Input
              id="formNo"
              value={formNumber}
              onChange={(e) => setFormNumber(e.target.value)}
              placeholder="FORM-PM-XRAY"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="chkVer">Version</Label>
            <Input
              id="chkVer"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="v1.0"
              required
            />
          </div>

          {/* Personnel relationships */}
          <div className="space-y-1.5 md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prepSelect" className="text-sm font-medium">Prepared By</Label>
                <select
                  id="prepSelect"
                  value={preparedById}
                  onChange={(e) => setPreparedById(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  {personnelList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="revSelect" className="text-sm font-medium">Reviewer</Label>
                <select
                  id="revSelect"
                  value={reviewedById}
                  onChange={(e) => setReviewedById(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  {personnelList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="appSelect" className="text-sm font-medium">Approver</Label>
                <select
                  id="appSelect"
                  value={approvedById}
                  onChange={(e) => setApprovedById(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  {personnelList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Assigned To (Admin only) */}
          {isAdmin && (
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="assignedSelect" className="text-sm font-medium">Assigned To (Responsible Personnel)</Label>
              <select
                id="assignedSelect"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">-- Unassigned (Available in Pool) --</option>
                {personnelList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.designation})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Equipment Scope */}
          <div className="space-y-1.5">
            <Label htmlFor="oemSelect" className="text-sm font-medium">OEM Manufacturer</Label>
            <select
              id="oemSelect"
              value={equipmentOem}
              onChange={(e) => setEquipmentOem(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              {oems.map((o) => (
                <option key={o.id} value={o.label}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="modSelect" className="text-sm font-medium">Modality</Label>
            <select
              id="modSelect"
              value={modality}
              onChange={(e) => setModality(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              {modalities.map((m) => (
                <option key={m.id} value={m.label}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="modelSelect" className="text-sm font-medium">Equipment Model Scope</Label>
            <select
              id="modelSelect"
              value={equipmentModel}
              onChange={(e) => setEquipmentModel(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              {models.map((m) => (
                <option key={m.id} value={m.label}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Option A file upload UI */}
          {creationMethod === "upload" && (
            <div className="space-y-1.5 md:col-span-2 border-t border-border pt-4">
              <Label className="text-sm font-medium">Checklist Protocol Document (PDF / DOCX)</Label>
              <div className="flex gap-2">
                <input
                  key={fileInputKey}
                  id="chkFile"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  required={!checklist}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start font-normal truncate"
                  onClick={() => document.getElementById("chkFile")?.click()}
                >
                  {fileName ? fileName : "Choose Document"}
                </Button>
              </div>
            </div>
          )}

          {/* Option B Step-by-Step structured items wizard */}
          {creationMethod === "structured" && (
            <div className="space-y-3.5 border-t border-border pt-4 md:col-span-2">
              {/* Step Tracker Header & Progress Bar (Visible in Stepper mode) */}
              {!formShowSummary && (
                <div className="space-y-2 p-2.5 sm:p-3 bg-muted/40 rounded-xl border border-border">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                        Checklist Steps
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 font-mono">
                        Step {formStepIndex + 1} of {totalItemsCount}
                      </span>
                    </div>

                    {/* Breakdown Badges */}
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {passCount} Pass
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {failCount} Fail
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                        {naCount} N/A
                      </span>
                    </div>
                  </div>

                  {/* Step Navigation Pill Dots & Action Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/60">
                    {/* Scrollable Step Numbers */}
                    <div className="flex items-center gap-1 overflow-x-auto py-1 flex-1 min-w-0 scrollbar-thin">
                      {items.map((item, idx) => {
                        const isCurrent = formStepIndex === idx;
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
                        onClick={handleAddItem}
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
                        onClick={() => setFormShowSummary(true)}
                      >
                        Review All
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTIVE STEP CARD */}
              {!formShowSummary && currentFormItem && (
                <div className="p-4 rounded-xl border border-primary/30 bg-card space-y-4 shadow-sm animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between border-b border-border pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs">
                        {formStepIndex + 1}
                      </span>
                      <span className="font-bold text-sm text-foreground">
                        Checkpoint {formStepIndex + 1} of {totalItemsCount}
                      </span>
                    </div>
                    {totalItemsCount > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveItem(formStepIndex)}
                      >
                        <Trash2 className="size-3.5 mr-1" />
                        Remove Step
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Checkpoint Description
                      </Label>
                      <Input
                        value={currentFormItem.description}
                        onChange={(e) => handleItemChange(currentFormItem.id, "description", e.target.value)}
                        placeholder={`e.g. Visual inspection of cables and collimator mount`}
                        className="bg-background text-xs font-semibold h-9"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Passing Criteria / Acceptance Threshold
                      </Label>
                      <Input
                        value={currentFormItem.requirement}
                        onChange={(e) => handleItemChange(currentFormItem.id, "requirement", e.target.value)}
                        placeholder="e.g. No cable insulation cracking; alignment within 1.5%"
                        className="bg-background text-xs text-muted-foreground font-mono h-8"
                        required
                      />
                    </div>
                  </div>

                  {/* Optional Execution State during creation */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Initial Result (Optional):
                    </Label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleItemStatusToggle(currentFormItem.id, "pass")}
                        className={`h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                          currentFormItem.status === "pass"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-background hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        <Check className="size-4" />
                        Pass
                      </button>

                      <button
                        type="button"
                        onClick={() => handleItemStatusToggle(currentFormItem.id, "fail")}
                        className={`h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                          currentFormItem.status === "fail"
                            ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                            : "bg-background hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        }`}
                      >
                        <X className="size-4" />
                        Fail
                      </button>

                      <button
                        type="button"
                        onClick={() => handleItemStatusToggle(currentFormItem.id, "na")}
                        className={`h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                          currentFormItem.status === "na"
                            ? "bg-slate-600 text-white border-slate-600 shadow-sm"
                            : "bg-background hover:bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        <Minus className="size-4" />
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
                      className="w-1/2 sm:w-auto text-xs"
                    >
                      <ChevronLeft className="size-3.5 mr-1" />
                      Previous Step
                    </Button>

                    {formStepIndex < totalItemsCount - 1 ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setFormStepIndex((prev) => prev + 1)}
                        className="w-1/2 sm:w-auto text-xs"
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
                        className="w-1/2 sm:w-auto text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                      >
                        Review All
                        <ArrowRight className="size-3.5 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* All Steps Summary Review */}
              {formShowSummary && (
                <div className="p-4 rounded-xl border border-border bg-card space-y-4 shadow-sm animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between border-b border-border pb-2.5">
                    <span className="font-bold text-sm text-foreground block">
                      All Checkpoints Overview ({totalItemsCount} Steps)
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

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        onClick={() => {
                          setFormStepIndex(idx);
                          setFormShowSummary(false);
                        }}
                        className="flex items-start justify-between gap-2 p-2 rounded-lg border bg-muted/30 hover:bg-muted/60 cursor-pointer text-xs transition-colors w-full"
                      >
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <span className="inline-flex size-5 items-center justify-center rounded bg-muted text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-foreground text-xs leading-snug break-words">
                            {item.description || "Untitled Checkpoint"}
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

                  {/* Execution remarks */}
                  <div className="space-y-1.5 border-t border-border pt-3">
                    <Label htmlFor="chkExecSummary" className="text-xs font-semibold text-foreground">
                      Overall Execution Remarks & Findings (Optional)
                    </Label>
                    <Textarea
                      id="chkExecSummary"
                      value={executionSummary}
                      onChange={(e) => setExecutionSummary(e.target.value)}
                      placeholder="Enter general test remarks, measured values, calibration readings, or failure notes for the entire test..."
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-3 border-t border-border md:col-span-2 mt-2">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {checklist ? "Save Changes" : "Save Checklist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EquipmentChecklistsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Quality Admin";

  const [checklists, setChecklists] = useState<EquipmentChecklist[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [statuses, setStatuses] = useState<ConfigRecord[]>([]);
  const [oems, setOems] = useState<ConfigRecord[]>([]);
  const [modalities, setModalities] = useState<ConfigRecord[]>([]);
  const [models, setModels] = useState<ConfigRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editingChecklist, setEditingChecklist] = useState<EquipmentChecklist | null>(null);
  const [viewingChecklist, setViewingChecklist] = useState<EquipmentChecklist | null>(null);
  const [creationType, setCreationType] = useState<"upload" | "structured">("upload");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    chkId: string;
    description: string;
  }>({
    open: false,
    chkId: "",
    description: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const chks = await qualityService.listChecklists(false);
      const pers = await personnelService.list();
      const st = await configService.list("quality.document-status");
      const oe = await configService.list("quality.equipment-oem");
      const mod = await configService.list("quality.modality");
      const md = await configService.list("quality.equipment-model");

      setChecklists(chks);
      setPersonnel(pers);
      setStatuses(st);
      setOems(oe);
      setModalities(mod);
      setModels(md);
    } catch (err) {
      console.error("Error loading checklists", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUploadClick = () => {
    setEditingChecklist(null);
    setCreationType("upload");
    setIsFormOpen(true);
  };

  const handleCreateStructuredClick = () => {
    setEditingChecklist(null);
    setCreationType("structured");
    setIsFormOpen(true);
  };

  const handleEditClick = (row: EquipmentChecklist) => {
    setEditingChecklist(row);
    setCreationType(row.type);
    setIsFormOpen(true);
  };

  const handleMockView = (row: EquipmentChecklist) => {
    setViewingChecklist(row);
  };

  const handleMockDownload = (row: EquipmentChecklist) => {
    alert(`Downloading "${row.fileName || `${row.formNumber}.pdf`}"...`);
  };

  const handleArchiveClick = (row: EquipmentChecklist) => {
    setConfirmState({
      open: true,
      chkId: row.id,
      description: row.description,
    });
  };

  const handleConfirmArchive = async () => {
    try {
      await qualityService.archiveChecklist(confirmState.chkId);
      loadData();
    } catch (err) {
      console.error("Error archiving checklist", err);
    }
  };

  const handleFormSubmit = async (input: EquipmentChecklistInput) => {
    try {
      if (editingChecklist) {
        await qualityService.updateChecklist(editingChecklist.id, input);
      } else {
        await qualityService.createChecklist(input);
      }
      loadData();
    } catch (err) {
      console.error("Error saving checklist", err);
    }
  };

  const columns: DataTableColumn<EquipmentChecklist>[] = [
    {
      key: "description",
      header: "Checklist Description",
      value: (row) => row.description,
      cell: (row) => (
        <div className="flex items-start gap-2.5 max-w-sm">
          <ClipboardCheck className="size-4.5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-foreground leading-snug">{row.description}</p>
            <span className="text-[10px] text-muted-foreground font-mono">
              {row.formNumber} ({row.type === "structured" ? "Custom Protocol" : "Uploaded File"})
            </span>
          </div>
        </div>
      ),
      filterable: false,
    },
    {
      key: "version",
      header: "Version",
      value: (row) => row.version,
      cell: (row) => (
        <span className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-foreground border border-border">
          {row.version}
        </span>
      ),
      filterable: false,
    },
    {
      key: "equipmentOem",
      header: "OEM",
      value: (row) => row.equipmentOem,
      filterable: true,
      className: "text-xs font-medium text-foreground",
    },
    {
      key: "modality",
      header: "Modality",
      value: (row) => row.modality,
      filterable: true,
      className: "text-xs text-muted-foreground font-medium",
    },
    {
      key: "equipmentModel",
      header: "Equipment Model Scope",
      value: (row) => row.equipmentModel,
      filterable: true,
      className: "text-xs text-muted-foreground font-mono",
    },
    {
      key: "assignedToName",
      header: "Assigned To",
      value: (row) => row.assignedToName || "Unassigned",
      cell: (row) => (
        <span
          className={cn(
            "text-xs font-medium",
            row.assignedToName ? "text-foreground" : "text-muted-foreground italic",
          )}
        >
          {row.assignedToName || "Unassigned"}
        </span>
      ),
      filterable: true,
    },
    {
      key: "status",
      header: "Status",
      value: (row) => row.status,
      cell: (row) => (
        <StatusBadge
          status={row.status === "Approved" ? "active" : row.status === "Draft" ? "inactive" : "pending"}
          label={row.status}
        />
      ),
      filterable: true,
    },
    {
      key: "lastModified",
      header: "Last Modified",
      value: (row) => row.lastModified,
      filterable: false,
      className: "font-mono text-[11px] text-muted-foreground",
    },
  ];

  const currentFullName = user ? `${user.firstName} ${user.lastName}` : "";

  const renderRowActions = (row: EquipmentChecklist) => {
    const isAuthor = row.preparedByName === currentFullName;

    return (
      <RowActionsMenu
        actions={[
          {
            label: "View Checklist",
            icon: Eye,
            onClick: () => handleMockView(row),
          },
          {
            label: "Download",
            icon: Download,
            onClick: () => handleMockDownload(row),
          },
          isAdmin || isAuthor
            ? {
                label: "Edit Checklist",
                icon: Edit2,
                onClick: () => handleEditClick(row),
              }
            : null,
          isAdmin
            ? {
                label: "Archive",
                icon: Archive,
                variant: "destructive",
                onClick: () => handleArchiveClick(row),
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
          <ClipboardCheck className="size-6 text-primary" />
          Equipment Checklists
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure, view, and assign diagnostic structured check protocols or file-based lists to medical device profiles.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={checklists}
        loading={loading}
        searchPlaceholder="Search checklist description or OEM/model scope..."
        emptyTitle="No equipment checklists found"
        emptyDescription="System equipment checklist registry is currently empty."
        toolbarActions={
          user ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-9 text-xs font-semibold" onClick={handleCreateUploadClick}>
                <Upload className="size-3.5 mr-1" />
                Upload Checklist
              </Button>
              <Button size="sm" className="h-9 text-xs font-semibold" onClick={handleCreateStructuredClick}>
                <Plus className="size-3.5 mr-1" />
                + Add Checklist
              </Button>
            </div>
          ) : undefined
        }
        rowActions={renderRowActions}
      />

      <ChecklistFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        checklist={editingChecklist}
        creationType={creationType}
        isAdmin={isAdmin}
        currentUserName={user ? `${user.firstName} ${user.lastName}` : undefined}
        personnelList={personnel}
        statuses={statuses}
        oems={oems}
        modalities={modalities}
        models={models}
        onSubmit={handleFormSubmit}
      />

      <ChecklistDetailModal
        open={!!viewingChecklist}
        onOpenChange={(open) => !open && setViewingChecklist(null)}
        data={viewingChecklist}
      />

      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((p) => ({ ...p, open }))}
        title="Archive Equipment Checklist"
        description={`Are you sure you want to archive "${confirmState.description}"? It will no longer show in active workspaces but remains historically available.`}
        confirmLabel="Archive"
        variant="destructive"
        onConfirm={handleConfirmArchive}
      />
    </div>
  );
}
