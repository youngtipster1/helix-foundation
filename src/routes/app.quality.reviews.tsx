import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { CheckSquare, Eye, CheckCircle2, XCircle, Download, FileText, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable, RowActionsMenu } from "@/components/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { qualityService } from "@/modules/quality/services/quality-service";
import { isModuleAdmin } from "@/features/auth/permissions";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ChecklistDetailModal } from "@/components/quality/checklist-detail-modal";
import type { ChecklistItem } from "@/modules/quality/types";

export const Route = createFileRoute("/app/quality/reviews")({
  head: () => ({
    meta: [
      { title: "Quality Reviews — HEMP" },
      { name: "description", content: "Review pending quality standards and equipment procedures." },
    ],
  }),
  component: QualityReviewsPage,
});

function QualityReviewsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Detailed inspection modal state
  const [viewItem, setViewItem] = useState<any | null>(null);

  // Reject modal state
  const [rejectItem, setRejectItem] = useState<any | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [rejectionRecommendations, setRejectionRecommendations] = useState("");
  const [additionalItems, setAdditionalItems] = useState<ChecklistItem[]>([]);

  // Direct approve confirm
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
      // Show unapproved items awaiting review
      setItems(data.filter((item) => item.status === "Under Review"));
    } catch (err) {
      console.error("Error loading reviews", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmDirectApprove = async () => {
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
      console.error("Error approving review directly", err);
    }
  };

  const handleAddAdminItem = () => {
    setAdditionalItems((prev) => [
      ...prev,
      {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        description: "",
        requirement: "",
        status: null,
      },
    ]);
  };

  const handleRemoveAdminItem = (id: string) => {
    setAdditionalItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAdminItemChange = (id: string, field: "description" | "requirement", value: string) => {
    setAdditionalItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectItem || !user) return;
    const adminName = `${user.firstName} ${user.lastName}`;
    try {
      if (rejectItem.type === "checklist") {
        await qualityService.rejectChecklist(
          rejectItem.id,
          rejectionNotes,
          undefined,
          additionalItems.filter((it) => it.description.trim() !== ""),
          adminName
        );
      } else {
        const docs = await qualityService.listDocuments(true);
        const doc = docs.find((d) => d.id === rejectItem.id);
        if (doc) {
          await qualityService.updateDocument(doc.id, {
            ...doc,
            status: "Needs Revision",
          });
        }
      }
      setRejectItem(null);
      setRejectionNotes("");
      setAdditionalItems([]);
      loadData();
    } catch (err) {
      console.error("Error rejecting review", err);
    }
  };

  const handleDownloadFile = (item: any) => {
    alert(`Downloading file "${item.fileName || "checklist_document.pdf"}"...`);
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
      header: "Submitted By",
      value: (row) => row.preparedBy,
      filterable: true,
      className: "text-xs font-semibold text-foreground",
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
            label: "View Full Details",
            icon: Eye,
            onClick: () => setViewItem(row),
          },
          row.fileName
            ? {
                label: "Download File",
                icon: Download,
                onClick: () => handleDownloadFile(row),
              }
            : null,
          {
            label: "Approve",
            icon: CheckCircle2,
            variant: "success",
            onClick: () => setApproveItem(row),
          },
          {
            label: "Reject Checklist",
            icon: XCircle,
            variant: "destructive",
            onClick: () => {
              setRejectItem(row);
              setRejectionNotes("");
              setAdditionalItems([]);
            },
          },
        ]}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CheckSquare className="size-6 text-primary" />
          Pending Reviews
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Perform administrative quality review. Directly approve verified standards or reject with feedback notes for user revision.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        searchPlaceholder="Search items awaiting review..."
        emptyTitle="No reviews pending"
        emptyDescription="All submitted checklists and documents have been reviewed and approved."
        rowActions={renderRowActions}
      />

      {/* Comprehensive Checklist Inspection Modal */}
      <ChecklistDetailModal
        open={!!viewItem}
        onOpenChange={(open) => !open && setViewItem(null)}
        data={viewItem}
        approveLabel="Approve"
        onReject={() => {
          const target = viewItem;
          setViewItem(null);
          setRejectItem(target);
          setRejectionNotes("");
          setAdditionalItems([]);
        }}
        onDirectApprove={() => {
          const target = viewItem;
          setViewItem(null);
          setApproveItem(target);
        }}
      />

      {/* Reject Dialog with Feedback & Optional Additional Items */}
      <Dialog open={!!rejectItem} onOpenChange={(open) => !open && setRejectItem(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive text-base sm:text-lg">
              <AlertCircle className="size-5 shrink-0" />
              Reject Checklist & Request Revision
            </DialogTitle>
          </DialogHeader>

          {rejectItem && (
            <form onSubmit={handleConfirmReject} className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground">
                Provide feedback and revision instructions for <strong className="text-foreground">{rejectItem.description}</strong>. The submitter will receive this in their <em>My Tasks</em> workspace to revise and resubmit.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="rejNote" className="text-xs font-semibold">
                  Rejection Reason Note <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="rejNote"
                  required
                  rows={3}
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Explain why this checklist was rejected (e.g. Emergency stop switch fail requires grounding leakage test and secondary breaker check before authorization)..."
                />
              </div>

              {/* Admin Optional Checklist Additions */}
              <div className="space-y-3 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-foreground uppercase tracking-wide block">
                      Add Required / Recommended Checklist Items
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Specific items you want the user to incorporate into their checklist.
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold shrink-0"
                    onClick={handleAddAdminItem}
                  >
                    <Plus className="size-3.5 mr-1" />
                    Add Item
                  </Button>
                </div>

                {additionalItems.length > 0 && (
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {additionalItems.map((item, idx) => (
                      <div key={item.id} className="flex gap-2 items-start bg-muted/40 p-2.5 rounded-lg border border-border">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={item.description}
                            onChange={(e) => handleAdminItemChange(item.id, "description", e.target.value)}
                            placeholder={`Checkpoint ${idx + 1} description`}
                            className="bg-background h-8 text-xs"
                            required
                          />
                          <Input
                            value={item.requirement}
                            onChange={(e) => handleAdminItemChange(item.id, "requirement", e.target.value)}
                            placeholder="Passing requirement / acceptance criteria"
                            className="bg-background h-8 text-xs"
                            required
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleRemoveAdminItem(item.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setRejectItem(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" size="sm" className="w-full sm:w-auto">
                  Confirm Rejection & Send to User
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Direct Approve Confirm Dialog */}
      <ConfirmDialog
        open={!!approveItem}
        onOpenChange={(open) => !open && setApproveItem(null)}
        title="Approve Equipment Checklist"
        description={`Are you sure you want to approve "${approveItem?.description}"? Its status will immediately become "Approved" in the Equipment Checklists registry.`}
        confirmLabel="Approve"
        onConfirm={handleConfirmDirectApprove}
      />
    </div>
  );
}
