import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Zap, Plus, Eye, Archive, UserCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { RowActionsMenu } from "@/components/data-table/row-actions-menu";
import { toolsJobService } from "@/modules/tools/services/tools-job-service";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import type { ToolJob } from "@/modules/tools/types";
import { JobDetailModal } from "@/modules/tools/components/job-detail-modal";
import { CreateJobModal } from "@/modules/tools/components/create-job-modal";
import { toast } from "sonner";

export const Route = createFileRoute("/app/tools/jobs/open")({
  head: () => ({
    meta: [
      { title: "Open Jobs — HEMP" },
      { name: "description", content: "Active and in-progress biomedical maintenance, warranty, and calibration jobs." },
    ],
  }),
  component: OpenJobsPage,
});

function calculateJobAge(openDate: string): string {
  const start = new Date(openDate).getTime();
  const end = new Date().getTime();
  const diffDays = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
  return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
}

function OpenJobsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = isModuleAdmin(user, "tools");

  const [openJobs, setOpenJobs] = useState<ToolJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobNumber, setSelectedJobNumber] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchOpenJobs = async () => {
    setLoading(true);
    try {
      const data = await toolsJobService.list("open");
      setOpenJobs(data);
    } catch (err) {
      console.error("Error loading open jobs", err);
      toast.error("Failed to load open jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenJobs();
  }, []);

  const columns: DataTableColumn<ToolJob>[] = [
    {
      key: "jobNumber",
      header: "Job Number",
      value: (row) => row.jobNumber,
      cell: (row) => (
        <button
          type="button"
          onClick={() => setSelectedJobNumber(row.jobNumber)}
          className="font-mono font-bold text-xs text-primary hover:underline cursor-pointer"
        >
          {row.jobNumber}
        </button>
      ),
      className: "font-mono font-semibold",
      filterable: true,
    },
    {
      key: "jobType",
      header: "Job Type",
      value: (row) => row.jobType,
      filterable: true,
      className: "font-medium text-foreground text-xs",
    },
    {
      key: "jobStatus",
      header: "Current Status",
      value: (row) => row.jobStatus,
      cell: (row) => <StatusBadge status={row.jobStatus} />,
      filterable: true,
    },
    {
      key: "jobAge",
      header: "Age",
      value: (row) => calculateJobAge(row.openDate),
      cell: (row) => (
        <span className="font-mono text-xs text-amber-600 dark:text-amber-400 font-medium">
          {calculateJobAge(row.openDate)}
        </span>
      ),
      filterable: false,
    },
    {
      key: "toolId",
      header: "Tool ID / Model",
      value: (row) => `${row.toolId} - ${row.toolSnapshot.model}`,
      cell: (row) => (
        <div>
          <Link
            to="/app/tools/$toolId"
            params={{ toolId: row.toolId }}
            className="font-mono text-xs font-semibold text-primary hover:underline block"
          >
            {row.toolId}
          </Link>
          <span className="text-[11px] text-muted-foreground">
            {row.toolSnapshot.model} ({row.toolSnapshot.oem})
          </span>
        </div>
      ),
      filterable: true,
    },
    {
      key: "toolStatus",
      header: "Tool Physical Status",
      value: (row) => row.toolStatus,
      filterable: true,
      className: "text-xs font-medium",
    },
    {
      key: "assignedToName",
      header: "Assigned Engineer",
      value: (row) => row.assignedToName,
      cell: (row) => (
        <div className="flex items-center gap-1 text-xs font-medium text-foreground">
          <UserCheck className="size-3 text-muted-foreground" />
          <span>{row.assignedToName}</span>
        </div>
      ),
      filterable: true,
    },
    {
      key: "issue",
      header: "Issue / Work Scope",
      value: (row) => row.issue,
      cell: (row) => (
        <span className="text-xs text-muted-foreground line-clamp-1 max-w-xs" title={row.issue}>
          {row.issue}
        </span>
      ),
      filterable: false,
    },
  ];

  const renderRowActions = (row: ToolJob) => (
    <div className="flex justify-end">
      <RowActionsMenu
        label="Actions"
        align="end"
        actions={[
          {
            label: "Open Job Workspace",
            icon: Eye,
            onClick: () => setSelectedJobNumber(row.jobNumber),
          },
          {
            label: "Close Job (Complete)",
            icon: CheckCircle2,
            variant: "success",
            onClick: async () => {
              try {
                await toolsJobService.closeJob(row.id);
                toast.success(`Job ${row.jobNumber} marked as Completed.`);
                fetchOpenJobs();
              } catch (err) {
                toast.error("Failed to close job.");
              }
            },
          },
          {
            label: "Archive Job",
            icon: Archive,
            variant: "destructive",
            hidden: !isAdmin,
            onClick: async () => {
              try {
                await toolsJobService.archive(row.id, `${user?.firstName} ${user?.lastName}`);
                toast.success(`Job ${row.jobNumber} archived.`);
                fetchOpenJobs();
              } catch (err) {
                toast.error("Failed to archive job.");
              }
            },
          },
        ]}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Open Jobs"
        description="Active maintenance, repair, and calibration work orders requiring completion"
        icon={Zap}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Active Workload: <strong className="text-foreground font-mono">{openJobs.length} jobs</strong>
          </span>
        </div>

        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs gap-1.5 h-9 cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Create Tools Job</span>
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={openJobs}
        loading={loading}
        searchPlaceholder="Search open jobs by number, tool, engineer, or issue..."
        emptyTitle="No open jobs."
        emptyDescription="All maintenance and calibration jobs are currently completed."
        rowActions={renderRowActions}
      />

      <JobDetailModal
        open={Boolean(selectedJobNumber)}
        onOpenChange={(open) => !open && setSelectedJobNumber(null)}
        jobNumber={selectedJobNumber}
        onJobUpdated={fetchOpenJobs}
        onJobArchived={fetchOpenJobs}
      />

      <CreateJobModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onJobCreated={fetchOpenJobs}
      />
    </div>
  );
}
