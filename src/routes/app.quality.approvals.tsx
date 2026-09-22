import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { ShieldCheck, Eye, CheckCircle2, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, RowActionsMenu } from "@/components/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { isModuleAdmin } from "@/features/auth/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ChecklistDetailModal } from "@/components/quality/checklist-detail-modal";

export const Route = createFileRoute("/app/quality/approvals")({
  head: () => ({
    meta: [
      { title: "Quality Approvals — HEMP" },
      { name: "description", content: "Authorize and approve verified quality templates and operational guidelines." },
    ],
  }),
  component: QualityApprovalsPage,
});

function QualityApprovalsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Detailed inspection modal state
  const [viewItem, setViewItem] = useState<any | null>(null);

  // Sign-off confirm state
  const [approveItem, setApproveItem] = useState<any | null>(null);

  useEffect(() => {
    if (user && !isModuleAdmin(user, "quality")) {
      navigate({ to: "/app/quality/training", replace: true });
    }
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await qualityService.getAttentionRequired();
      // Only show items with status "Pending Approval"
      setItems(data.filter((item) => item.status === "Pending Approval"));
    } catch (err) {
      console.error("Error loading approvals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSignOffApproval = async () => {
    if (!approveItem || !user) return;
    const adminName = `${user.firstName} ${user.lastName}`;
    try {
      if (approveItem.type === "checklist") {
        await qualityService.approveChecklistDirect(approveItem.id, adminName);
      } else {
        const docs = await qualityService.listDocuments(true);
        const doc = docs.find((d) => d.id === approveItem.id);
        if (doc) {
          await qualityService.updateDocument(doc.id, {
            ...doc,
            status: "Approved",
            approvedByName: adminName,
          });
        }
      }
      setApproveItem(null);
      loadData();
    } catch (err) {
      console.error("Error signing off approval", err);
    }
  };

  const columns: DataTableColumn<any>[] = [
    {
      key: "description",
      header: "Document / Checklist",
      value: (row) => row.description,
      cell: (row) => (
        <div className="flex items-start gap-2.5 max-w-sm">
          <FileText className="size-4.5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-foreground leading-snug">{row.description}</p>
            <span className="text-[10px] text-muted-foreground font-mono">
              {row.identifier} • {row.type === "checklist" ? (row.checklistType === "structured" ? "Custom Form" : "Upload File") : "Policy Document"}
            </span>
          </div>
        </div>
      ),
      filterable: false,
    },
    {
      key: "preparedBy",
      header: "Submitted / Prepared By",
      value: (row) => row.preparedBy,
      filterable: true,
      className: "text-xs font-semibold text-foreground",
    },
    {
      key: "status",
      header: "Approval Status",
      value: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} label={row.status} />,
      filterable: true,
    },
    {
      key: "lastUpdated",
      header: "Last Updated",
      value: (row) => row.lastUpdated,
      filterable: false,
      className: "font-mono text-xs text-muted-foreground",
    },
  ];

  const renderRowActions = (row: any) => {
    return (
      <RowActionsMenu
        actions={[
          {
            label: "View & Audit Details",
            icon: Eye,
            onClick: () => setViewItem(row),
          },
          row.fileName
            ? {
                label: "Download File",
                icon: Download,
                onClick: () => alert(`Downloading "${row.fileName}"...`),
              }
            : null,
          {
            label: "Sign Off & Approve",
            icon: CheckCircle2,
            variant: "success",
            onClick: () => setApproveItem(row),
          },
        ]}
      />
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quality Assurance"
        title="Pending Approvals"
        subtitle="Perform administrative sign-off to authorize guidelines and publish active checklist forms."
        icon={ShieldCheck}
      />

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        searchPlaceholder="Search items awaiting approval..."
        emptyTitle="No approvals pending"
        emptyDescription="All peer-reviewed quality templates have been signed off and approved."
        rowActions={renderRowActions}
      />

      {/* Comprehensive Checklist Inspection Modal */}
      <ChecklistDetailModal
        open={!!viewItem}
        onOpenChange={(open) => !open && setViewItem(null)}
        data={viewItem}
        approveLabel="Sign Off & Approve"
        onDirectApprove={() => {
          const target = viewItem;
          setViewItem(null);
          setApproveItem(target);
        }}
      />

      {/* Confirm Sign Off Dialog */}
      <ConfirmDialog
        open={!!approveItem}
        onOpenChange={(open) => !open && setApproveItem(null)}
        title="Sign Off & Approve Quality Standard"
        description={`Are you sure you want to officially approve and publish "${approveItem?.description}"? It will become active in the repository.`}
        confirmLabel="Sign Off & Approve"
        onConfirm={handleSignOffApproval}
      />
    </div>
  );
}
