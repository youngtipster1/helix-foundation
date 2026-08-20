import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { History, RotateCcw, ShieldAlert, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RowActionsMenu } from "@/components/data-table/row-actions-menu";
import { useAuth } from "@/features/auth/auth-context";
import { toolsJobService } from "@/modules/tools/services/tools-job-service";
import type { ToolJob } from "@/modules/tools/types";
import { toast } from "sonner";

export const Route = createFileRoute("/app/tools/archived-jobs")({
  head: () => ({
    meta: [
      { title: "Archived Jobs — HEMP" },
      { name: "description", content: "Archived maintenance and calibration jobs registry." },
    ],
  }),
  component: ArchivedJobsPage,
});

function ArchivedJobsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [archivedJobs, setArchivedJobs] = useState<ToolJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Restore confirm dialog state
  const [restoreDialog, setRestoreDialog] = useState<{
    open: boolean;
    jobId: string;
    jobName: string;
  }>({
    open: false,
    jobId: "",
    jobName: "",
  });

  const isToolsAdmin = Boolean(
    user?.isSuperAdmin ||
      user?.permissions?.tools === "admin" ||
      user?.role === "Tools Admin" ||
      user?.role === "Super Admin",
  );

  const fetchArchivedJobs = async () => {
    setLoading(true);
    try {
      const data = await toolsJobService.listArchived();
      setArchivedJobs(data);
    } catch (err) {
      console.error("Error loading archived jobs", err);
      toast.error("Failed to load archived jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedJobs();
  }, []);

  if (!isToolsAdmin) {
    return (
      <div className="surface-panel p-8 text-center space-y-4 max-w-md mx-auto my-12">
        <ShieldAlert className="size-10 text-destructive mx-auto" />
        <h2 className="text-base font-bold text-foreground">Access Restricted</h2>
        <p className="text-xs text-muted-foreground">
          Only Administrators have permission to view and restore archived job records.
        </p>
        <Button size="sm" variant="outline" onClick={() => navigate({ to: "/app/tools/jobs" })} className="text-xs">
          Return to Active Jobs
        </Button>
      </div>
    );
  }

  const handleRestoreConfirm = async () => {
    const { jobId } = restoreDialog;
    if (!jobId) return;

    try {
      await toolsJobService.restore(jobId);
      toast.success(`Job ${jobId} restored to active registry.`);
      fetchArchivedJobs();
    } catch (err) {
      console.error("Error restoring job", err);
      toast.error("Failed to restore job.");
    } finally {
      setRestoreDialog({ open: false, jobId: "", jobName: "" });
    }
  };

  const columns: DataTableColumn<ToolJob>[] = [
    {
      key: "jobNumber",
      header: "Job Number",
      value: (row) => row.jobNumber,
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-foreground">
          {row.jobNumber}
        </span>
      ),
      className: "font-mono font-semibold",
      filterable: true,
    },
    {
      key: "jobType",
      header: "Job Type",
      value: (row) => row.jobType,
      filterable: true,
      className: "font-medium text-foreground",
    },
    {
      key: "tool",
      header: "Tool / Model",
      value: (row) => `${row.toolId} - ${row.toolSnapshot.model}`,
      cell: (row) => (
        <div>
          <span className="font-mono text-xs font-semibold text-foreground block">
            {row.toolId}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {row.toolSnapshot.model} ({row.toolSnapshot.oem})
          </span>
        </div>
      ),
      filterable: true,
    },
    {
      key: "jobStatus",
      header: "Job Status",
      value: (row) => row.jobStatus,
      cell: (row) => <StatusBadge status={row.jobStatus} />,
      filterable: true,
    },
    {
      key: "assignedToName",
      header: "Assigned To",
      value: (row) => row.assignedToName,
      filterable: true,
      className: "text-foreground font-medium text-xs",
    },
    {
      key: "archivedDate",
      header: "Archived Date",
      value: (row) => row.archivedDate || "—",
      filterable: false,
      className: "font-mono text-xs text-muted-foreground",
    },
    {
      key: "archivedBy",
      header: "Archived By",
      value: (row) => row.archivedBy || "System Admin",
      filterable: true,
      className: "text-xs font-medium text-foreground",
    },
  ];

  const renderRowActions = (row: ToolJob) => (
    <div className="flex justify-end">
      <RowActionsMenu
        label="Actions"
        align="end"
        actions={[
          {
            label: "Restore Job",
            icon: RotateCcw,
            variant: "success",
            onClick: () =>
              setRestoreDialog({
                open: true,
                jobId: row.id,
                jobName: `Job ${row.jobNumber} (${row.jobType})`,
              }),
          },
        ]}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Archived Jobs"
        description="View and restore soft-deleted equipment maintenance, repair and calibration jobs"
        icon={History}
      />

      <DataTable
        columns={columns}
        rows={archivedJobs}
        loading={loading}
        searchPlaceholder="Search archived jobs by number, tool, engineer, type..."
        emptyTitle="No archived jobs."
        emptyDescription="There are currently no archived equipment jobs."
        rowActions={renderRowActions}
      />

      {/* Restore Confirm Dialog */}
      <ConfirmDialog
        open={restoreDialog.open}
        onOpenChange={(open) => setRestoreDialog((p) => ({ ...p, open }))}
        title="Restore Job Record"
        description={`Are you sure you want to restore ${restoreDialog.jobName}? The job will be returned to the active jobs collection with all associated expenses and documents intact.`}
        confirmLabel="Restore Job"
        variant="default"
        onConfirm={handleRestoreConfirm}
      />
    </div>
  );
}
