import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DollarSign, CheckCircle2, XCircle, Clock, FileText, Eye, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RowActionsMenu } from "@/components/data-table/row-actions-menu";
import { ExpenseApprovalDialog } from "@/modules/tools/components/expense-approval-dialog";
import { DocumentViewerModal } from "@/modules/tools/components/document-viewer-modal";
import { toolsExpenseService } from "@/modules/tools/services/tools-expense-service";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import type { ToolExpense } from "@/modules/tools/types";
import { toast } from "sonner";

export const Route = createFileRoute("/app/tools/expense-approvals")({
  head: () => ({
    meta: [
      { title: "Expense Approvals — HEMP" },
      { name: "description", content: "Audit, verify, and approve technician tool maintenance and calibration expenses." },
    ],
  }),
  component: ExpenseApprovalsPage,
});

function ExpenseApprovalsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = isModuleAdmin(user, "tools");

  const [expenses, setExpenses] = useState<ToolExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const [reviewingExpense, setReviewingExpense] = useState<ToolExpense | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{
    title: string;
    fileName: string;
    fileSize?: string;
    documentType?: string;
    uploadedBy?: string;
    dateUploaded?: string;
    comment?: string;
  } | null>(null);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await toolsExpenseService.list();
      setExpenses(data);
    } catch (err) {
      console.error("Error loading expenses", err);
      toast.error("Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  if (!isAdmin) {
    return (
      <div className="surface-panel p-8 text-center space-y-4 max-w-md mx-auto my-12">
        <ShieldAlert className="size-10 text-destructive mx-auto" />
        <h2 className="text-base font-bold text-foreground">Access Restricted</h2>
        <p className="text-xs text-muted-foreground">
          Only Administrators have permission to audit and approve operational expenses.
        </p>
        <Button size="sm" variant="outline" onClick={() => navigate({ to: "/app/tools" })} className="text-xs">
          Return to Tools
        </Button>
      </div>
    );
  }

  const pendingList = expenses.filter((e) => e.approvalStatus === "Pending Approval");
  const approvedList = expenses.filter((e) => e.approvalStatus === "Approved");
  const rejectedList = expenses.filter((e) => e.approvalStatus === "Rejected");

  const displayedExpenses = expenses.filter((e) => {
    if (activeFilter === "pending") return e.approvalStatus === "Pending Approval";
    if (activeFilter === "approved") return e.approvalStatus === "Approved";
    if (activeFilter === "rejected") return e.approvalStatus === "Rejected";
    return true;
  });

  const pendingAmountTotal = pendingList.reduce((sum, e) => sum + e.amount, 0);

  const handleApprove = async (expenseId: string) => {
    if (!user) return;
    try {
      await toolsExpenseService.approve(expenseId, {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
      });
      toast.success(`Expense ${expenseId} approved.`);
      fetchExpenses();
    } catch (err) {
      toast.error("Failed to approve expense.");
    }
  };

  const handleReject = async (expenseId: string, reason: string) => {
    if (!user) return;
    try {
      await toolsExpenseService.reject(
        expenseId,
        { id: user.id, name: `${user.firstName} ${user.lastName}` },
        reason,
      );
      toast.error(`Expense ${expenseId} rejected.`);
      fetchExpenses();
    } catch (err) {
      toast.error("Failed to reject expense.");
    }
  };

  const columns: DataTableColumn<ToolExpense>[] = [
    {
      key: "date",
      header: "Claim Date",
      value: (row) => row.date,
      filterable: false,
      className: "font-mono text-xs text-muted-foreground",
    },
    {
      key: "jobId",
      header: "Job Number",
      value: (row) => row.jobId,
      cell: (row) => (
        <Link
          to="/app/tools/jobs/$jobId"
          params={{ jobId: row.jobId }}
          className="font-mono font-bold text-xs text-primary hover:underline"
        >
          {row.jobId}
        </Link>
      ),
      className: "font-mono font-semibold",
      filterable: true,
    },
    {
      key: "expenseType",
      header: "Expense Type",
      value: (row) => row.expenseType,
      cell: (row) => (
        <div>
          <span className="font-medium text-foreground text-xs block">{row.expenseType}</span>
          {row.comment && (
            <span className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">{row.comment}</span>
          )}
        </div>
      ),
      filterable: true,
    },
    {
      key: "amount",
      header: "Amount (₦)",
      value: (row) => row.amount.toString(),
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-foreground">
          {new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0,
          }).format(row.amount)}
        </span>
      ),
      filterable: false,
    },
    {
      key: "submittedByName",
      header: "Submitted By",
      value: (row) => row.submittedByName,
      filterable: true,
      className: "text-xs font-medium text-foreground",
    },
    {
      key: "receipt",
      header: "Receipt / Invoice",
      value: (row) => row.receiptFileName || "—",
      cell: (row) =>
        row.receiptFileName ? (
          <button
            onClick={() =>
              setViewingDoc({
                title: "Expense Receipt",
                fileName: row.receiptFileName || "Receipt.pdf",
                fileSize: row.receiptFileSize || "1.1 MB",
                documentType: row.expenseType,
                uploadedBy: row.submittedByName,
                dateUploaded: row.date,
                comment: row.comment,
              })
            }
            className="text-primary hover:underline inline-flex items-center gap-1 font-mono text-xs cursor-pointer"
          >
            <FileText className="size-3" />
            <span>{row.receiptFileName}</span>
          </button>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
      filterable: false,
    },
    {
      key: "approvalStatus",
      header: "Status",
      value: (row) => row.approvalStatus,
      cell: (row) => <StatusBadge status={row.approvalStatus} />,
      filterable: true,
    },
  ];

  const renderRowActions = (row: ToolExpense) => (
    <div className="flex justify-end">
      <RowActionsMenu
        label="Actions"
        align="end"
        actions={[
          {
            label: "Audit & Review Claim",
            icon: Eye,
            onClick: () => setReviewingExpense(row),
          },
          {
            label: "Approve Claim",
            icon: CheckCircle2,
            variant: "success",
            hidden: row.approvalStatus !== "Pending Approval",
            onClick: () => handleApprove(row.id),
          },
          {
            label: "Reject Claim",
            icon: XCircle,
            variant: "destructive",
            hidden: row.approvalStatus !== "Pending Approval",
            onClick: () => setReviewingExpense(row),
          },
        ]}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Approvals"
        description="Review and audit technician maintenance claims, replacement parts costs, and calibration fees"
        icon={DollarSign}
      />

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface-panel p-4">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Awaiting Approval
          </span>
          <span className="text-2xl font-bold font-mono text-foreground mt-1 block">
            {pendingList.length} claims
          </span>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Totaling {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(pendingAmountTotal)}
          </p>
        </div>

        <div className="surface-panel p-4">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Approved Claims
          </span>
          <span className="text-2xl font-bold font-mono text-foreground mt-1 block">
            {approvedList.length} claims
          </span>
          <p className="text-[10px] text-muted-foreground mt-0.5">Processed for reimbursement</p>
        </div>

        <div className="surface-panel p-4">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Rejected Claims
          </span>
          <span className="text-2xl font-bold font-mono text-foreground mt-1 block">
            {rejectedList.length} claims
          </span>
          <p className="text-[10px] text-muted-foreground mt-0.5">Returned with notes</p>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 w-full sm:w-auto h-9 p-1 bg-muted/50 border border-border">
            <TabsTrigger value="pending" className="text-xs text-amber-600 dark:text-amber-400">
              Pending ({pendingList.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs">
              Approved ({approvedList.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs text-rose-600 dark:text-rose-400">
              Rejected ({rejectedList.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All ({expenses.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Expenses Table */}
      <DataTable
        columns={columns}
        rows={displayedExpenses}
        loading={loading}
        searchPlaceholder="Search claims by job number, type, submitted technician..."
        emptyTitle="No expense claims found."
        emptyDescription="There are currently no expense claims in this queue."
        rowActions={renderRowActions}
      />

      {/* Approval / Rejection Modal */}
      <ExpenseApprovalDialog
        open={Boolean(reviewingExpense)}
        onOpenChange={(open) => !open && setReviewingExpense(null)}
        expense={reviewingExpense}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Document / Receipt Viewer Modal */}
      <DocumentViewerModal
        open={Boolean(viewingDoc)}
        onOpenChange={(open) => !open && setViewingDoc(null)}
        document={viewingDoc}
      />
    </div>
  );
}
