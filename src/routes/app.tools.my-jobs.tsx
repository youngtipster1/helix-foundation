import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardCheck, Eye } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RowActionsMenu } from "@/components/data-table/row-actions-menu";
import { toolsJobService } from "@/modules/tools/services/tools-job-service";
import { useAuth } from "@/features/auth/auth-context";
import type { ToolJob } from "@/modules/tools/types";
import { JobDetailModal } from "@/modules/tools/components/job-detail-modal";
import { toast } from "sonner";

export const Route = createFileRoute("/app/tools/my-jobs")({
  head: () => ({
    meta: [
      { title: "My Assigned Jobs — HEMP" },
      { name: "description", content: "Personal technician workbench for assigned maintenance and calibration orders." },
    ],
  }),
  component: MyJobsPage,
});

function calculateJobAge(openDate: string, closeDate?: string): string {
  const start = new Date(openDate).getTime();
  const end = closeDate ? new Date(closeDate).getTime() : new Date().getTime();
  const diffDays = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
  return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
}

function MyJobsPage() {
  const { user } = useAuth();

  const [allMyJobs, setAllMyJobs] = useState<ToolJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "open" | "completed">("open");
  const [selectedJobNumber, setSelectedJobNumber] = useState<string | null>(null);

  const fetchMyJobs = async () => {
    setLoading(true);
    try {
      const allJobs = await toolsJobService.list();
      const userName = user ? `${user.firstName} ${user.lastName}`.toLowerCase() : "";
      const userId = user?.id || "";

      // Filter jobs assigned to this technician or fallback to active demo technician jobs
      const userJobs = allJobs.filter(
        (job) =>
          job.assignedToId === userId ||
          (userName && job.assignedToName.toLowerCase().includes(userName)) ||
          // Demo fallback for technicians
          (user?.role?.includes("User") && (job.assignedToName.includes("Marcus") || job.assignedToName.includes("Amara"))),
      );

      setAllMyJobs(userJobs.length > 0 ? userJobs : allJobs.slice(0, 5));
    } catch (err) {
      console.error("Error loading my jobs", err);
      toast.error("Failed to load assigned jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, [user]);

  const openCount = allMyJobs.filter((j) => j.jobStatus !== "Completed").length;
  const completedCount = allMyJobs.filter((j) => j.jobStatus === "Completed").length;

  const displayedJobs = allMyJobs.filter((j) => {
    if (activeFilter === "open") return j.jobStatus !== "Completed";
    if (activeFilter === "completed") return j.jobStatus === "Completed";
    return true;
  });

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
      header: "Status",
      value: (row) => row.jobStatus,
      cell: (row) => <StatusBadge status={row.jobStatus} />,
      filterable: true,
    },
    {
      key: "jobAge",
      header: "Age",
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
      header: "Equipment / Model",
      value: (row) => `${row.toolId} - ${row.toolSnapshot.model}`,
      cell: (row) => (
        <div>
          <span className="font-mono text-xs font-semibold text-primary block">
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
      key: "toolStatus",
      header: "Tool Physical Status",
      value: (row) => row.toolStatus,
      filterable: true,
      className: "text-xs font-medium",
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
        ]}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Assigned Jobs"
        description="Your active maintenance, calibration, and repair work orders"
        icon={ClipboardCheck}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto h-9 p-1 bg-muted/50 border border-border">
            <TabsTrigger value="open" className="text-xs text-amber-600 dark:text-amber-400">
              Active / Open ({openCount})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              Completed ({completedCount})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All Assigned ({allMyJobs.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <DataTable
        columns={columns}
        rows={displayedJobs}
        loading={loading}
        searchPlaceholder="Search my work orders by number, equipment, model..."
        emptyTitle="No jobs assigned."
        emptyDescription="You currently have no maintenance or calibration jobs in this queue."
        rowActions={renderRowActions}
      />

      <JobDetailModal
        open={Boolean(selectedJobNumber)}
        onOpenChange={(open) => !open && setSelectedJobNumber(null)}
        jobNumber={selectedJobNumber}
        onJobUpdated={fetchMyJobs}
      />
    </div>
  );
}
