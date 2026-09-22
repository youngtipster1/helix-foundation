import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { Edit2, Eye, Download, Archive, Plus, FileText, CheckCircle2 } from "lucide-react";
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
import { qualityService, type PolicyDocumentInput } from "@/modules/quality/services/quality-service";
import type { Personnel, ConfigRecord } from "@/modules/settings/types";
import type { PolicyDocument } from "@/modules/quality/types";
import { ChecklistDetailModal } from "@/components/quality/checklist-detail-modal";
import { PageHeader } from "@/components/layout/page-header";

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold">{documentItem ? "Edit Policy Document" : "Add Policy Document"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          
          <div className="space-y-1.5 md:col-span-2">
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

          {/* Personnel relationships */}
          <div className="space-y-1.5 md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="preparedBySelect" className="text-sm font-medium">Prepared By</Label>
                <select
                  id="preparedBySelect"
                  value={preparedById}
                  onChange={(e) => setPreparedById(e.target.value)}
                  className="flex h-11 md:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm cursor-pointer focus-visible:outline-none"
                  required
                >
                  <option value="">-- Choose --</option>
                  {personnelList.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reviewedBySelect" className="text-sm font-medium">Reviewed By</Label>
                <select
                  id="reviewedBySelect"
                  value={reviewedById}
                  onChange={(e) => setReviewedById(e.target.value)}
                  className="flex h-11 md:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm cursor-pointer focus-visible:outline-none"
                  required
                >
                  <option value="">-- Choose --</option>
                  {personnelList.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="approvedBySelect" className="text-sm font-medium">Approved By</Label>
                <select
                  id="approvedBySelect"
                  value={approvedById}
                  onChange={(e) => setApprovedById(e.target.value)}
                  className="flex h-11 md:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm cursor-pointer focus-visible:outline-none"
                  required
                >
                  <option value="">-- Choose --</option>
                  {personnelList.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="docStatus">Status</Label>
            <select
              id="docStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-11 md:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm cursor-pointer focus-visible:outline-none"
              required
            >
              {statuses.map((s) => (
                <option key={s.id} value={s.label}>{s.label}</option>
              ))}
            </select>
          </div>

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
                className="w-full justify-start font-normal truncate"
                onClick={() => document.getElementById("docFile")?.click()}
              >
                {fileName ? fileName : "Choose Document"}
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3 border-t border-border md:col-span-2 mt-2">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">{documentItem ? "Save Changes" : "Upload SOP"}</Button>
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
  const [viewingDoc, setViewingDoc] = useState<PolicyDocument | null>(null);
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
    setViewingDoc(doc);
  };

  const handleMockDownload = (doc: PolicyDocument) => {
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
      cell: (row) => <StatusBadge status={row.status} label={row.status} />,
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
      <RowActionsMenu
        actions={[
          {
            label: "View Document",
            icon: Eye,
            onClick: () => handleMockView(row),
          },
          {
            label: "Download",
            icon: Download,
            onClick: () => handleMockDownload(row),
          },
          isAdmin
            ? {
                label: "Edit",
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
      <PageHeader
        eyebrow="Quality Standards"
        title="Policy Documents"
        subtitle="Review, distribute, and manage quality guidelines and standard operating procedures."
        icon={FileText}
      />

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

      <ChecklistDetailModal
        open={!!viewingDoc}
        onOpenChange={(open) => !open && setViewingDoc(null)}
        data={viewingDoc}
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
