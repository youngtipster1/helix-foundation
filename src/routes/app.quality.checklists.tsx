import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { Edit2, Eye, Download, Archive, Plus, ClipboardCheck, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table/data-table";
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
  personnelList,
  statuses,
  oems,
  modalities,
  models,
  onSubmit,
}: ChecklistFormModalProps) {
  const [creationMethod, setCreationMethod] = useState<"upload" | "structured">("upload");

  const [description, setDescription] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [version, setVersion] = useState("");
  const [preparedById, setPreparedById] = useState("");
  const [reviewedById, setReviewedById] = useState("");
  const [approvedById, setApprovedById] = useState("");
  const [status, setStatus] = useState("");
  const [equipmentOem, setEquipmentOem] = useState("");
  const [modality, setModality] = useState("");
  const [equipmentModel, setEquipmentModel] = useState("");
  const [fileName, setFileName] = useState("");

  // Option B: Structured Items Builder
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    if (checklist) {
      setCreationMethod(checklist.type);
      setDescription(checklist.description);
      setFormNumber(checklist.formNumber);
      setVersion(checklist.version);
      setPreparedById(checklist.preparedById);
      setReviewedById(checklist.reviewedById);
      setApprovedById(checklist.approvedById);
      setStatus(checklist.status);
      setEquipmentOem(checklist.equipmentOem);
      setModality(checklist.modality);
      setEquipmentModel(checklist.equipmentModel);
      setFileName(checklist.fileName || "");
      setItems(checklist.items || []);
    } else {
      setCreationMethod("upload");
      setDescription("");
      setFormNumber("");
      setVersion("v1.0");
      setPreparedById("");
      setReviewedById("");
      setApprovedById("");
      setStatus(statuses[0]?.label || "Draft");
      setEquipmentOem(oems[0]?.label || "");
      setModality(modalities[0]?.label || "");
      setEquipmentModel(models[0]?.label || "");
      setFileName("");
      setItems([]);
      setFileInputKey((k) => k + 1);
    }
  }, [checklist, open, statuses, oems, modalities, models]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        description: "",
        requirement: "",
        status: null,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: "description" | "requirement", value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const prep = personnelList.find((p) => p.id === preparedById);
    const rev = personnelList.find((p) => p.id === reviewedById);
    const app = personnelList.find((p) => p.id === approvedById);

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
      status,
      equipmentOem,
      modality,
      equipmentModel,
      type: creationMethod,
      fileName: creationMethod === "upload" ? fileName || "uploaded_checklist.pdf" : undefined,
      items: creationMethod === "structured" ? items : undefined,
    });
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{checklist ? "Edit Equipment Checklist" : "Add Equipment Checklist"}</DialogTitle>
        </DialogHeader>

        {/* Option Method Toggle (Only on creation) */}
        {!checklist && (
          <div className="flex justify-center border-b border-border pb-3">
            <div className="flex rounded-md border border-border p-1 bg-muted/40">
              <button
                type="button"
                className={cn(
                  "px-4 py-1 text-xs font-semibold rounded cursor-pointer",
                  creationMethod === "upload" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
                )}
                onClick={() => setCreationMethod("upload")}
              >
                Option A: Upload File
              </button>
              <button
                type="button"
                className={cn(
                  "px-4 py-1 text-xs font-semibold rounded cursor-pointer",
                  creationMethod === "structured" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
                )}
                onClick={() => setCreationMethod("structured")}
              >
                Option B: Create Form
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="chkDesc">Checklist Description</Label>
            <Textarea
              id="chkDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Standard preventative maintenance procedure for annual validation"
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="formNumber">Form Number</Label>
              <Input
                id="formNumber"
                value={formNumber}
                onChange={(e) => setFormNumber(e.target.value)}
                placeholder="FORM-PM-CT001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="chkVersion">Version</Label>
              <Input
                id="chkVersion"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1.0"
                required
              />
            </div>
          </div>

          {/* Scope Assignment settings */}
          <div className="border border-border/80 bg-accent/15 p-3 rounded-lg space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Equipment Scope Assignment
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="oemSelect" className="text-[10px]">OEM</Label>
                <select
                  id="oemSelect"
                  value={equipmentOem}
                  onChange={(e) => setEquipmentOem(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs cursor-pointer focus-visible:outline-none"
                  required
                >
                  <option value="">-- Select --</option>
                  {oems.map((o) => (
                    <option key={o.id} value={s => s.label}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="modSelect" className="text-[10px]">Modality</Label>
                <select
                  id="modSelect"
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs cursor-pointer focus-visible:outline-none"
                  required
                >
                  <option value="">-- Select --</option>
                  {modalities.map((m) => (
                    <option key={m.id} value={s => s.label}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="modelSelect" className="text-[10px]">Model Scope</Label>
                <select
                  id="modelSelect"
                  value={equipmentModel}
                  onChange={(e) => setEquipmentModel(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs cursor-pointer focus-visible:outline-none"
                  required
                >
                  <option value="">-- Select --</option>
                  {models.map((m) => (
                    <option key={m.id} value={s => s.label}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Personnel relationships */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="preparedBySelect" className="text-[11px]">Prepared By</Label>
              <select
                id="preparedBySelect"
                value={preparedById}
                onChange={(e) => setPreparedById(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs cursor-pointer focus-visible:outline-none"
                required
              >
                <option value="">-- Choose --</option>
                {personnelList.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="reviewedBySelect" className="text-[11px]">Reviewed By</Label>
              <select
                id="reviewedBySelect"
                value={reviewedById}
                onChange={(e) => setReviewedById(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs cursor-pointer focus-visible:outline-none"
                required
              >
                <option value="">-- Choose --</option>
                {personnelList.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="approvedBySelect" className="text-[11px]">Approved By</Label>
              <select
                id="approvedBySelect"
                value={approvedById}
                onChange={(e) => setApprovedById(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs cursor-pointer focus-visible:outline-none"
                required
              >
                <option value="">-- Choose --</option>
                {personnelList.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="chkStatus">Status</Label>
              <select
                id="chkStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm cursor-pointer focus-visible:outline-none"
                required
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.label}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Option A file upload UI */}
            {creationMethod === "upload" && (
              <div className="space-y-1.5">
                <Label htmlFor="chkFile">{checklist ? "Update File" : "Upload File"}</Label>
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
                    size="sm"
                    className="w-full text-xs font-semibold cursor-pointer truncate"
                    onClick={() => document.getElementById("chkFile")?.click()}
                  >
                    {fileName ? fileName : "Choose Document"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Option B structured items list builder UI */}
          {creationMethod === "structured" && (
            <div className="space-y-3.5 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                  Structured Checklist Items
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] uppercase font-bold cursor-pointer"
                  onClick={handleAddItem}
                >
                  <Plus className="size-3 mr-1" />
                  Add Checklist Item
                </Button>
              </div>

              {items.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-2 italic border border-dashed rounded">
                  No items added yet. Click button above to build.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={item.id} className="flex gap-2 items-start bg-muted/40 p-2.5 rounded-lg border border-border">
                      <div className="flex-1 space-y-2">
                        <div>
                          <Label className="text-[9px] uppercase font-semibold text-muted-foreground">Item {idx + 1} Description</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                            placeholder="Visual checks, functional tests, calibration value, etc."
                            className="h-8 text-xs bg-background"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-[9px] uppercase font-semibold text-muted-foreground">Requirement / Passing Criteria</Label>
                          <Input
                            value={item.requirement}
                            onChange={(e) => handleItemChange(item.id, "requirement", e.target.value)}
                            placeholder="Must be clean, reading within 2% margin, self test pass, etc."
                            className="h-8 text-xs bg-background"
                            required
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive self-center cursor-pointer shrink-0"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
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
      setPersonnel(pers.filter((p) => p.status === "active"));
      setStatuses(st);
      setOems(oe);
      setModalities(mod);
      setModels(md);
    } catch (err) {
      console.error("Error loading checklist configurations data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClick = () => {
    setEditingChecklist(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (chk: EquipmentChecklist) => {
    setEditingChecklist(chk);
    setIsFormOpen(true);
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

  const handleArchiveClick = (chk: EquipmentChecklist) => {
    setConfirmState({
      open: true,
      chkId: chk.id,
      description: chk.description,
    });
  };

  const handleConfirmArchive = async () => {
    if (!confirmState.chkId || !user) return;
    try {
      const userName = `${user.firstName} ${user.lastName}`;
      await qualityService.setChecklistArchived(confirmState.chkId, true, userName);
      loadData();
    } catch (err) {
      console.error("Error archiving checklist", err);
    } finally {
      setConfirmState({ open: false, chkId: "", description: "" });
    }
  };

  const handleMockView = (chk: EquipmentChecklist) => {
    if (chk.type === "structured") {
      let checklistItemsStr = chk.items?.map((item, idx) => `${idx + 1}. ${item.description}\n   Requirement: ${item.requirement}`).join("\n\n") || "No items configured.";
      alert(`Mock View (Structured Checklist):\n\n${chk.description} [${chk.formNumber} ${chk.version}]\n\nScope: ${chk.equipmentOem} ${chk.equipmentModel} (${chk.modality})\n\nItems:\n${checklistItemsStr}`);
    } else {
      alert(`Mock View: Opening file-based checklist ${chk.description} (${chk.fileName}) in a new browser tab.`);
    }
  };

  const handleMockDownload = (chk: EquipmentChecklist) => {
    alert(`Mock Download: Triggering checklist file-download download for ${chk.fileName || "form_checklist.pdf"}`);
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
              {row.type === "structured" ? "Structured checklist form" : row.fileName}
            </span>
          </div>
        </div>
      ),
      filterable: false,
    },
    {
      key: "formNumber",
      header: "Form Number",
      value: (row) => row.formNumber,
      cell: (row) => <span className="font-mono text-xs uppercase tracking-wide">{row.formNumber}</span>,
      filterable: true,
    },
    {
      key: "equipmentOem",
      header: "OEM",
      value: (row) => row.equipmentOem,
      filterable: true,
      className: "text-xs text-foreground font-semibold",
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
      key: "status",
      header: "Status",
      value: (row) => row.status,
      cell: (row) => {
        let theme: "active" | "inactive" | "pending" = "pending";
        if (row.status === "Approved" || row.status === "Published") theme = "active";
        if (row.status === "Draft") theme = "inactive";
        return (
          <StatusBadge
            status={row.status === "Approved" ? "active" : row.status === "Draft" ? "inactive" : "pending"}
            label={row.status}
          />
        );
      },
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

  const renderRowActions = (row: EquipmentChecklist) => {
    return (
      <div className="flex justify-end gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleMockView(row)}
              aria-label={`View checklist ${row.description}`}
            >
              <Eye className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>View Checklist</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleMockDownload(row)}
              aria-label={`Download checklist ${row.description}`}
            >
              <Download className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download Checklist</TooltipContent>
        </Tooltip>

        {isAdmin && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => handleEditClick(row)}
                  aria-label={`Edit checklist ${row.description}`}
                >
                  <Edit2 className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Checklist</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive"
                  onClick={() => handleArchiveClick(row)}
                  aria-label={`Archive checklist ${row.description}`}
                >
                  <Archive className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Archive Checklist</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
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
          isAdmin ? (
            <Button size="sm" className="h-9 text-xs" onClick={handleCreateClick}>
              <Plus className="size-3.5 mr-1" />
              Add Checklist
            </Button>
          ) : undefined
        }
        rowActions={renderRowActions}
      />

      <ChecklistFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        checklist={editingChecklist}
        personnelList={personnel}
        statuses={statuses}
        oems={oems}
        modalities={modalities}
        models={models}
        onSubmit={handleFormSubmit}
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
