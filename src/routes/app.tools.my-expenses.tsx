import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Receipt, Plus, FileText, Eye, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RowActionsMenu } from "@/components/data-table/row-actions-menu";
import { ExpenseFormModal } from "@/modules/tools/components/expense-form-modal";
import { DocumentViewerModal } from "@/modules/tools/components/document-viewer-modal";
import { JobDetailModal } from "@/modules/tools/components/job-detail-modal";
import { toolsExpenseService } from "@/modules/tools/services/tools-expense-service";
import { useAuth } from "@/features/auth/auth-context";
import type { ToolExpense, CreateExpenseInput } from "@/modules/tools/types";
import { toast } from "sonner";

export const Route = createFileRoute("/app/tools/my-expenses")({
  head: () => ({
    meta: [
      { title: "My Expense Claims — HEMP" },
      { name: "description", content: "Personal maintenance and calibration reimbursement claims and approval status." },
    ],
  }),
  component: MyExpensesPage,
});

function MyExpensesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allMyExpenses, setAllMyExpenses] = useState<ToolExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedJobNumber, setSelectedJobNumber] = useState<string | null>(null);

  const [viewingDoc, setViewingDoc] = useState<{
    title: string;
    fileName: string;
    fileSize?: string;
    documentType?: string;
    uploadedBy?: string;
    dateUploaded?: string;
    comment?: string;
  } | null>(null);

  const fetchMyExpenses = async () => {
    setLoading(true);
    try {
      const allExpenses = await toolsExpenseService.list();
      const userName = user ? `${user.firstName} ${user.lastName}`.toLowerCase() : "";
      const userId = user?.id || "";

      // Filter expenses submitted by this user or fallback to demo technician claims
      const userClaims = allExpenses.filter(
        (e) =>
          e.submittedById === userId ||
          (userName && e.submittedByName.toLowerCase().includes(userName)) ||
          // Demo fallback
          (user?.role?.includes("User") && (e.submittedByName.includes("Marcus") || e.submittedByName.includes("Amara"))),
      );

      setAllMyExpenses(userClaims.length > 0 ? userClaims : allExpenses.slice(0, 4));
    } catch (err) {
      console.error("Error loading my expenses", err);
      toast.error("Failed to load claims.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyExpenses();
  }, [user]);

  const pendingList = allMyExpenses.filter((e) => e.approvalStatus === "Pending Approval");
  const approvedList = allMyExpenses.filter((e) => e.approvalStatus === "Approved");
  const rejectedList = allMyExpenses.filter((e) => e.approvalStatus === "Rejected");

  const displayedExpenses = allMyExpenses.filter((e) => {
    if (activeFilter === "pending") return e.approvalStatus === "Pending Approval";
    if (activeFilter === "approved") return e.approvalStatus === "Approved";
    if (activeFilter === "rejected") return e.approvalStatus === "Rejected";
    return true;
  });

  const approvedTotal = approvedList.reduce((sum, e) => sum + e.amount, 0);
  const pendingTotal = pendingList.reduce((sum, e) => sum + e.amount, 0);

  const handleCreateExpense = async (input: CreateExpenseInput) => {
    if (!user) return;
    try {
      const created = await toolsExpenseService.create(input, {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        isAdmin: false,
      });
      setAllMyExpenses((prev) => [created, ...prev]);
      toast.success("Expense claim submitted for administrative approval.");
      fetchMyExpenses();
    } catch (err) {
      toast.error("Failed to submit claim.");
    }
  };

  const columns: DataTableColumn<ToolExpense>[] = [
    {
      key: "date",
      header: "Date",
      value: (row) => row.date,
      filterable: false,
      className: "font-mono text-xs text-muted-foreground",
    },
    {
      key: "jobId",
      header: "Job Number",
      value: (row) => row.jobId,
      cell: (row) => (
        <button
          type="button"
          onClick={() => setSelectedJobNumber(row.jobId)}
          className="font-mono font-bold text-xs text-primary hover:underline cursor-pointer"
        >
          {row.jobId}
        </button>
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
      key: "receipt",
      header: "Receipt",
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
      header: "Approval Status",
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
            label: "Open Job Workspace",
            icon: Eye,
            onClick: () => setSelectedJobNumber(row.jobId),
          },
        ]}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Expense Claims"
        description="Track your tool maintenance expenses, procurement claims, and supervisor approvals"
        icon={Receipt}
      />

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Claims"
          value={pendingList.length}
          description={`Totaling ${new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(pendingTotal)}`}
          icon={Clock}
          active={activeFilter === "pending"}
          onClick={() => setActiveFilter("pending")}
        />
        <StatCard
          title="Approved Claims"
          value={approvedList.length}
          description={`Totaling ${new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(approvedTotal)}`}
          icon={CheckCircle2}
          active={activeFilter === "approved"}
          onClick={() => setActiveFilter("approved")}
        />
        <StatCard
          title="Rejected Claims"
          value={rejectedList.length}
          description="Check job workspace for rejection notes"
          icon={XCircle}
          active={activeFilter === "rejected"}
          onClick={() => setActiveFilter("rejected")}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 w-full sm:w-auto h-9 p-1 bg-muted/50 border border-border">
            <TabsTrigger value="all" className="text-xs">
              All ({allMyExpenses.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs text-amber-600 dark:text-amber-400">
              Pending ({pendingList.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs">
              Approved ({approvedList.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs text-rose-600 dark:text-rose-400">
              Rejected ({rejectedList.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          size="sm"
          onClick={() => setIsSubmitModalOpen(true)}
          className="text-xs gap-1.5 h-9"
        >
          <Plus className="size-3.5" />
          <span>Submit Expense Claim</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={displayedExpenses}
        loading={loading}
        searchPlaceholder="Search my claims by job, type, comment..."
        emptyTitle="No expense claims found."
        emptyDescription="You have not submitted any expense claims in this view."
        rowActions={renderRowActions}
      />

      {/* Submit Expense Claim Modal */}
      <ExpenseFormModal
        open={isSubmitModalOpen}
        onOpenChange={setIsSubmitModalOpen}
        jobId="T00001"
        onSubmit={handleCreateExpense}
      />

      {/* Document / Receipt Viewer Modal */}
      <DocumentViewerModal
        open={Boolean(viewingDoc)}
        onOpenChange={(open) => !open && setViewingDoc(null)}
        document={viewingDoc}
      />

      {/* Job Detail Modal */}
      <JobDetailModal
        open={Boolean(selectedJobNumber)}
        onOpenChange={(open) => !open && setSelectedJobNumber(null)}
        jobNumber={selectedJobNumber}
        onJobUpdated={fetchMyExpenses}
      />
    </div>
  );
}
