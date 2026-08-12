import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { Edit2, Eye, Download, Archive, Plus, FileText, CheckCircle2 } from "lucide-react";
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
import { qualityService, type PolicyDocumentInput } from "@/modules/quality/services/quality-service";
import type { Personnel, ConfigRecord } from "@/modules/settings/types";
import type { PolicyDocument } from "@/modules/quality/types";

export const Route = createFileRoute("/app/quality/policy-documents")({
  head: () => ({
    meta: [
      { title: "Policy Documents — HEMP" },
      { name: "description", content: "View, download and manage operational policy documents." },
    ],
  }),
  component: PolicyDocumentsPage,
});

interface DocumentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentItem: PolicyDocument | null; // null if creating
  personnelList: Personnel[];
  statuses: ConfigRecord[];
  onSubmit: (input: PolicyDocumentInput) => void;
}

function DocumentFormModal({ open, onOpenChange, documentItem, personnelList, statuses, onSubmit }: DocumentFormModalProps) {
  const [description, setDescription] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [version, setVersion] = useState("");
  const [preparedById, setPreparedById] = useState("");
  const [reviewedById, setReviewedById] = useState("");
  const [approvedById, setApprovedById] = useState("");
  const [status, setStatus] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0); // to reset file input

  useEffect(() => {
    if (documentItem) {
      setDescription(documentItem.description);
      setPolicyNumber(documentItem.policyNumber);
      setVersion(documentItem.version);
      setPreparedById(documentItem.preparedById);
      setReviewedById(documentItem.reviewedById);
      setApprovedById(documentItem.approvedById);
      setStatus(documentItem.status);
      setFileName(documentItem.fileName || "");
    } else {
      setDescription("");
      setPolicyNumber("");
      setVersion("v1.0");
      setPreparedById("");
      setReviewedById("");
      setApprovedById("");
      setStatus(statuses[0]?.label || "Draft");
      setFileName("");
      setFileInputKey((k) => k + 1);
    }
  }, [documentItem, open, statuses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const prep = personnelList.find((p) => p.id === preparedById);
    const rev = personnelList.find((p) => p.id === reviewedById);
    const app = personnelList.find((p) => p.id === approvedById);

    if (!prep || !rev || !app) return;

    onSubmit({
      description,
      policyNumber,
      version,
      preparedById,
      preparedByName: `${prep.firstName} ${prep.lastName}`,
      reviewedById,
      reviewedByName: `${rev.firstName} ${rev.lastName}`,
      approvedById,
      approvedByName: `${app.firstName} ${app.lastName}`,
      status,
      fileName: fileName || "uploaded_document.pdf",
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{documentItem ? "Edit Policy Document" : "Add Policy Document"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          
          <div className="space-y-1.5">
            <Label htmlFor="docDesc">Document Description</Label>
            <Textarea
              id="docDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Standard Operating Procedure for MRI Safety and Operations"
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="docNumber">Policy Number</Label>
              <Input
                id="docNumber"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="POL-MRI-001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="docVersion">Version</Label>
              <Input
                id="docVersion"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1.0"
                required
              />
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
              <Label htmlFor="docStatus">Status</Label>
              <select
                id="docStatus"
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

            {/* Mock File Upload */}
            <div className="space-y-1.5">
              <Label htmlFor="docFile">{documentItem ? "Update File" : "Upload File"}</Label>
              <div className="flex gap-2">
                <input
                  key={fileInputKey}
                  id="docFile"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  required={!documentItem}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold cursor-pointer truncate"
                  onClick={() => document.getElementById("docFile")?.click()}
                >
                  {fileName ? fileName : "Choose Document"}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{documentItem ? "Save Changes" : "Upload SOP"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PolicyDocumentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Quality Admin";

  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [statuses, setStatuses] = useState<ConfigRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editingDoc, setEditingDoc] = useState<PolicyDocument | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    docId: string;
    description: string;
  }>({
    open: false,
    docId: "",
    description: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const docs = await qualityService.listDocuments(false);
      const pers = await personnelService.list();
      const st = await configService.list("quality.document-status");
      
      setDocuments(docs);
      // Filter out archived personnel
      setPersonnel(pers.filter((p) => p.status === "active"));
      setStatuses(st);
    } catch (err) {
      console.error("Error loading policy documents registries", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClick = () => {
    setEditingDoc(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (doc: PolicyDocument) => {
    setEditingDoc(doc);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (input: PolicyDocumentInput) => {
    try {
      if (editingDoc) {
        await qualityService.updateDocument(editingDoc.id, input);
      } else {
        await qualityService.createDocument(input);
      }
      loadData();
    } catch (err) {
      console.error("Error saving policy document", err);
    }
  };

  const handleArchiveClick = (doc: PolicyDocument) => {
    setConfirmState({
      open: true,
      docId: doc.id,
      description: doc.description,
    });
  };

  const handleConfirmArchive = async () => {
    if (!confirmState.docId || !user) return;
    try {
      const userName = `${user.firstName} ${user.lastName}`;
      await qualityService.setDocumentArchived(confirmState.docId, true, userName);
      loadData();
    } catch (err) {
      console.error("Error archiving document", err);
    } finally {
      setConfirmState({ open: false, docId: "", description: "" });
    }
  };

  const handleMockView = (doc: PolicyDocument) => {
    // Open in a new tab as requested
    alert(`Mock View: Opening ${doc.description} (${doc.fileName}) in a new browser tab.`);
  };

  const handleMockDownload = (doc: PolicyDocument) => {
    // Mock download trigger
    alert(`Mock Download: Downloading ${doc.fileName} to your local device.`);
  };

  const columns: DataTableColumn<PolicyDocument>[] = [
    {
      key: "description",
      header: "Document Description",
      value: (row) => row.description,
      cell: (row) => (
        <div className="flex items-start gap-2.5 max-w-sm">
          <FileText className="size-4.5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-foreground leading-snug">{row.description}</p>
            <span className="text-[10px] text-muted-foreground font-mono">{row.fileName}</span>
          </div>
        </div>
      ),
      filterable: false,
    },
    {
      key: "policyNumber",
      header: "Policy Number",
      value: (row) => row.policyNumber,
      cell: (row) => <span className="font-mono text-xs uppercase tracking-wide">{row.policyNumber}</span>,
      filterable: true,
    },
    {
      key: "version",
      header: "Version",
      value: (row) => row.version,
      filterable: true,
      className: "font-mono text-xs text-muted-foreground",
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
      key: "preparedByName",
      header: "Prepared By",
      value: (row) => row.preparedByName,
      filterable: true,
      className: "text-xs text-foreground font-medium",
    },
    {
      key: "reviewedByName",
      header: "Reviewed By",
      value: (row) => row.reviewedByName,
      filterable: true,
      className: "text-xs text-muted-foreground",
    },
    {
      key: "approvedByName",
      header: "Approved By",
      value: (row) => row.approvedByName,
      filterable: true,
      className: "text-xs text-muted-foreground font-medium",
    },
    {
      key: "lastModified",
      header: "Last Modified",
      value: (row) => row.lastModified,
      filterable: false,
      className: "font-mono text-[11px] text-muted-foreground",
    },
  ];

  const renderRowActions = (row: PolicyDocument) => {
    return (
      <div className="flex justify-end gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleMockView(row)}
              aria-label={`View ${row.description}`}
            >
              <Eye className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>View Document</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleMockDownload(row)}
              aria-label={`Download ${row.description}`}
            >
              <Download className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download Document</TooltipContent>
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
                  aria-label={`Edit ${row.description}`}
                >
                  <Edit2 className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Document</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive"
                  onClick={() => handleArchiveClick(row)}
                  aria-label={`Archive ${row.description}`}
                >
                  <Archive className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Archive Document</TooltipContent>
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
          <FileText className="size-6 text-primary" />
          Policy Documents
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review, distribute, and manage quality guidelines and standard operating procedures.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={documents}
        loading={loading}
        searchPlaceholder="Search document description or number..."
        emptyTitle="No policy documents found"
        emptyDescription="Quality policy registry is currently empty."
        toolbarActions={
          isAdmin ? (
            <Button size="sm" className="h-9 text-xs" onClick={handleCreateClick}>
              <Plus className="size-3.5 mr-1" />
              Add Policy Document
            </Button>
          ) : undefined
        }
        rowActions={renderRowActions}
      />

      <DocumentFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        documentItem={editingDoc}
        personnelList={personnel}
        statuses={statuses}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((p) => ({ ...p, open }))}
        title="Archive Policy Document"
        description={`Are you sure you want to archive "${confirmState.description}"? It will no longer show in active workspaces but remains historically available.`}
        confirmLabel="Archive"
        variant="destructive"
        onConfirm={handleConfirmArchive}
      />
    </div>
  );
}
