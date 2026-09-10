import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, ClipboardCheck, Eye, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { RowActionsMenu } from "@/components/data-table/row-actions-menu";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import { toolsJobService } from "@/modules/tools/services/tools-job-service";
import type { ToolJob } from "@/modules/tools/types";
import { CalibrationStatusBadge } from "@/modules/tools/components/calibration-status-badge";
import { JobDetailModal } from "@/modules/tools/components/job-detail-modal";
import { CreateJobModal } from "@/modules/tools/components/create-job-modal";
import { toast } from "sonner";

export const Route = createFileRoute("/app/tools/jobs/")({
  head: () => ({
    meta: [
      { title: "Tools Jobs — HEMP" },
      { name: "description", content: "Track and manage tool repair, warranty and calibration jobs." },
    ],
  }),
  component: ToolsJobsPage,
});

function calculateJobAge(openDate: string, closeDate?: string): string {
  const start = new Date(openDate).getTime();
  const end = closeDate ? new Date(closeDate).getTime() : new Date().getTime();
  const diffDays = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
  return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
}

function ToolsJobsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobsList, setJobsList] = useState<ToolJob[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "closed">("all");
  const [loading, setLoading] = useState(true);
  const [selectedJobNumber, setSelectedJobNumber] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isToolsAdmin = isModuleAdmin(user, "tools");

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await toolsJobService.list("all");
      setJobsList(data);
    } catch (err) {
      console.error("Error loading jobs", err);
      toast.error("Failed to load jobs list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const closedCount = jobsList.filter((j) => j.jobStatus === "Completed").length;
  const displayedJobs = activeFilter === "closed"
    ? jobsList.filter((j) => j.jobStatus === "Completed")
    : jobsList;

  const columns: DataTableColumn<ToolJob>[] = [
    {
      key: "jobNumber",
      header: "Job Number",
      value: (row) => row.jobNumber,
      cell: (row) => (
        <button
          type="button"
          onClick={() => setSelectedJobNumber(row.jobNumber)}
          className="font-mono font-bold text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{row.jobNumber}</span>
        </button>
      ),
      filterable: true,
      className: "font-mono",
    },
    {
      key: "jobType",
      header: "Job Type",
      value: (row) => row.jobType,
      filterable: true,
      className: "font-medium text-foreground",
    },
    {
      key: "jobStatus",
      header: "Job Status",
      value: (row) => row.jobStatus,
      cell: (row) => <StatusBadge status={row.jobStatus} />,
      filterable: true,
    },
    {
      key: "jobAge",
      header: "Job Age",
      value: (row) => calculateJobAge(row.openDate, row.closeDate),
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {calculateJobAge(row.openDate, row.closeDate)}
        </span>
      ),
      filterable: false,
    },
    {
      key: "toolId",
      header: "Tool ID",
      value: (row) => row.toolId,
      cell: (row) => (
        <button
          onClick={() => navigate({ to: "/app/tools/$toolId", params: { toolId: row.toolId } })}
          className="font-mono text-xs text-muted-foreground hover:text-primary underline cursor-pointer"
        >
          {row.toolId}
        </button>
      ),
      filterable: true,
    },
    {
      key: "category",
      header: "Category",
      value: (row) => row.toolSnapshot.category,
      filterable: true,
      className: "text-muted-foreground text-xs",
    },
    {
      key: "oem",
      header: "OEM",
      value: (row) => row.toolSnapshot.oem,
      filterable: true,
      className: "text-muted-foreground text-xs",
    },
    {
      key: "model",
      header: "Model",
      value: (row) => row.toolSnapshot.model,
      filterable: true,
      className: "font-medium text-foreground text-xs",
    },
    {
      key: "serialNumber",
      header: "Serial Number",
      value: (row) => row.toolSnapshot.serialNumber,
      filterable: true,
      className: "font-mono text-muted-foreground text-xs",
    },
    {
      key: "toolStatus",
      header: "Tool Status",
      value: (row) => row.toolStatus,
      filterable: true,
      className: "text-xs font-medium",
    },
    {
      key: "calibrationStatus",
      header: "Cal Status",
      value: (row) => row.toolSnapshot.calibrationStatus,
      cell: (row) => <CalibrationStatusBadge status={row.toolSnapshot.calibrationStatus} />,
      filterable: true,
    },
    {
      key: "calibrationDueDate",
      header: "Cal Due Date",
      value: (row) => row.toolSnapshot.calibrationDueDate,
      filterable: false,
      className: "font-mono text-muted-foreground text-xs",
    },
    {
      key: "warrantyStatus",
      header: "Warranty",
      value: (row) => row.toolSnapshot.warrantyStatus,
      cell: (row) => <StatusBadge status={row.toolSnapshot.warrantyStatus} />,
      filterable: true,
    },
    {
      key: "contactName",
      header: "Contact Name",
      value: (row) => row.contactName,
      filterable: true,
      className: "text-muted-foreground text-xs",
    },
    {
      key: "contactEmail",
      header: "Contact Email",
      value: (row) => row.contactEmail,
      filterable: true,
      className: "font-mono text-muted-foreground text-xs",
    },
    {
      key: "assignedToName",
      header: "Assigned To",
      value: (row) => row.assignedToName,
      filterable: true,
      className: "font-medium text-foreground text-xs",
    },
    {
      key: "issue",
      header: "Issue / Scope",
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
            label: "View Job Details",
            icon: Eye,
            onClick: () => setSelectedJobNumber(row.jobNumber),
          },
          {
            label: "Archive Job",
            icon: Archive,
            variant: "destructive",
            hidden: !isToolsAdmin,
            onClick: async () => {
              try {
                await toolsJobService.archive(row.id, `${user?.firstName} ${user?.lastName}`);
                toast.success(`Job ${row.jobNumber} archived.`);
                fetchJobs();
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
        title="All Jobs"
        description="Comprehensive master register of all maintenance, repair, warranty, and calibration jobs"
        icon={ClipboardCheck}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)} className="w-full sm:w-auto">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="all" className="text-xs px-4">
              All Jobs ({jobsList.length})
            </TabsTrigger>
            <TabsTrigger value="closed" className="text-xs px-4">
              Closed Jobs ({closedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isToolsAdmin && (
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 text-xs gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Create Tools Job</span>
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={displayedJobs}
        loading={loading}
        searchPlaceholder="Search jobs by number, tool, serial number, OEM, model, engineer, contact..."
        emptyTitle="No tool jobs found."
        emptyDescription="No equipment jobs match your selected filter."
        rowActions={renderRowActions}
      />

      <JobDetailModal
        open={Boolean(selectedJobNumber)}
        onOpenChange={(open) => !open && setSelectedJobNumber(null)}
        jobNumber={selectedJobNumber}
        onJobUpdated={fetchJobs}
        onJobArchived={fetchJobs}
      />

      <CreateJobModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onJobCreated={fetchJobs}
      />
    </div>
  );
}
