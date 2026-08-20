import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileCheck, Plus, FileText, Eye, Trash2, Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RowActionsMenu } from "@/components/data-table/row-actions-menu";
import { DocumentUploadModal } from "@/modules/tools/components/document-upload-modal";
import { DocumentViewerModal } from "@/modules/tools/components/document-viewer-modal";
import { toolsDocumentService } from "@/modules/tools/services/tools-document-service";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import type { ToolDocument, UploadDocumentInput } from "@/modules/tools/types";
import { toast } from "sonner";

export const Route = createFileRoute("/app/tools/documents")({
  head: () => ({
    meta: [
      { title: "Compliance Documents Vault — HEMP" },
      { name: "description", content: "Central repository of calibration certificates, decommissioning forms, and service reports." },
    ],
  }),
  component: DocumentsVaultPage,
});

function DocumentsVaultPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = isModuleAdmin(user, "tools");

  const [documents, setDocuments] = useState<ToolDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [viewingDoc, setViewingDoc] = useState<{
    title: string;
    fileName: string;
    fileSize?: string;
    documentType?: string;
    uploadedBy?: string;
    dateUploaded?: string;
    comment?: string;
  } | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await toolsDocumentService.list();
      setDocuments(data);
    } catch (err) {
      console.error("Error loading documents", err);
      toast.error("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (input: UploadDocumentInput) => {
    if (!user) return;
    try {
      await toolsDocumentService.upload(input, {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
      });
      toast.success("Document uploaded successfully.");
      fetchDocuments();
    } catch (err) {
      toast.error("Failed to upload document.");
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await toolsDocumentService.delete(docId);
      toast.success("Document deleted.");
      fetchDocuments();
    } catch (err) {
      toast.error("Failed to delete document.");
    }
  };

  const displayedDocs = documents.filter((doc) => {
    if (activeFilter === "all") return true;
    return doc.documentType.toLowerCase().includes(activeFilter.toLowerCase());
  });

  const columns: DataTableColumn<ToolDocument>[] = [
    {
      key: "fileName",
      header: "Document File",
      value: (row) => row.fileName,
      cell: (row) => (
        <button
          onClick={() =>
            setViewingDoc({
              title: row.documentType,
              fileName: row.fileName,
              fileSize: row.fileSize,
              documentType: row.documentType,
              uploadedBy: row.uploadedByName,
              dateUploaded: row.dateUploaded,
              comment: row.comment,
            })
          }
          className="text-primary hover:underline font-semibold flex items-center gap-1.5 text-xs text-left cursor-pointer"
        >
          <FileText className="size-3.5 text-primary shrink-0" />
          <span className="truncate max-w-xs">{row.fileName}</span>
        </button>
      ),
      filterable: true,
    },
    {
      key: "documentType",
      header: "Type",
      value: (row) => row.documentType,
      cell: (row) => (
        <span className="text-xs font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border">
          {row.documentType}
        </span>
      ),
      filterable: true,
    },
    {
      key: "toolId",
      header: "Tool ID",
      value: (row) => row.toolId,
      cell: (row) => (
        <Link
          to="/app/tools/$toolId"
          params={{ toolId: row.toolId }}
          className="font-mono text-xs text-primary hover:underline"
        >
          {row.toolId}
        </Link>
      ),
      className: "font-mono",
      filterable: true,
    },
    {
      key: "jobId",
      header: "Associated Job",
      value: (row) => row.jobId || "—",
      cell: (row) =>
        row.jobId ? (
          <Link
            to="/app/tools/jobs/$jobId"
            params={{ jobId: row.jobId }}
            className="font-mono text-xs text-primary hover:underline"
          >
            {row.jobId}
          </Link>
        ) : (
          <span className="text-muted-foreground text-xs font-mono">—</span>
        ),
      filterable: true,
    },
    {
      key: "fileSize",
      header: "Size",
      value: (row) => row.fileSize,
      filterable: false,
      className: "font-mono text-xs text-muted-foreground",
    },
    {
      key: "uploadedByName",
      header: "Uploaded By",
      value: (row) => row.uploadedByName,
      filterable: true,
      className: "text-xs font-medium text-foreground",
    },
    {
      key: "dateUploaded",
      header: "Upload Date",
      value: (row) => row.dateUploaded,
      filterable: false,
      className: "font-mono text-xs text-muted-foreground",
    },
  ];

  const renderRowActions = (row: ToolDocument) => (
    <div className="flex justify-end">
      <RowActionsMenu
        label="Actions"
        align="end"
        actions={[
          {
            label: "Preview & Download",
            icon: Eye,
            onClick: () =>
              setViewingDoc({
                title: row.documentType,
                fileName: row.fileName,
                fileSize: row.fileSize,
                documentType: row.documentType,
                uploadedBy: row.uploadedByName,
                dateUploaded: row.dateUploaded,
                comment: row.comment,
              }),
          },
          {
            label: "Delete Document",
            icon: Trash2,
            variant: "destructive",
            hidden: !isAdmin,
            onClick: () => handleDelete(row.id),
          },
        ]}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance & Certification Vault"
        description="Centralized repository of ISO calibration certificates, decommissioning forms, and vendor warranties"
        icon={FileCheck}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto h-9 p-1 bg-muted/50 border border-border">
            <TabsTrigger value="all" className="text-xs">
              All ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="calibration" className="text-xs">
              Calibration Certificates
            </TabsTrigger>
            <TabsTrigger value="decommission" className="text-xs">
              Decommissioning
            </TabsTrigger>
            <TabsTrigger value="report" className="text-xs">
              Service Reports
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          size="sm"
          onClick={() => setIsUploadOpen(true)}
          className="text-xs gap-1.5 h-9"
        >
          <Plus className="size-3.5" />
          <span>Upload Document</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={displayedDocs}
        loading={loading}
        searchPlaceholder="Search documents by file name, tool ID, job number, or uploader..."
        emptyTitle="No documents found."
        emptyDescription="There are currently no uploaded compliance documents matching your filter."
        rowActions={renderRowActions}
      />

      {/* Upload Document Modal */}
      <DocumentUploadModal
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        toolId="TL-00001"
        onSubmit={handleUpload}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        open={Boolean(viewingDoc)}
        onOpenChange={(open) => !open && setViewingDoc(null)}
        document={viewingDoc}
      />
    </div>
  );
}
