import { useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { Button } from "@/components/ui/button";
import type { DebriefJob } from "../types";
import { Eye, Plus, Wrench, ShieldAlert } from "lucide-react";

interface JobsTableProps {
  jobs: DebriefJob[];
  loading?: boolean;
  isAdmin?: boolean;
  onCreateJob?: () => void;
  onOpenJob?: (job: DebriefJob) => void;
}

export function JobsTable({
  jobs,
  loading = false,
  isAdmin = false,
  onCreateJob,
  onOpenJob,
}: JobsTableProps) {
  const columns: DataTableColumn<DebriefJob>[] = useMemo(
    () => [
      {
        key: "sn",
        header: "SN",
        accessor: (_row, idx) => String(idx + 1),
        align: "center",
        render: (_value, _row, idx) => (
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            {idx + 1}
          </span>
        ),
      },
      {
        key: "jobNumber",
        header: "JOB NUMBER",
        accessor: (row) => row.jobNumber,
        sortable: true,
        filterable: true,
        filterType: "text",
        render: (value, row) => (
          <button
            type="button"
            onClick={() => onOpenJob?.(row)}
            className="font-mono text-xs font-bold text-primary hover:underline hover:text-primary/80 transition-colors text-left cursor-pointer"
          >
            {value}
          </button>
        ),
      },
      {
        key: "assetNumber",
        header: "ASSET NUMBER",
        accessor: (row) => row.assetNumber,
        sortable: true,
        filterable: true,
        filterType: "text",
        render: (value) => (
          <span className="font-mono text-xs font-bold text-foreground">
            {value}
          </span>
        ),
      },
      {
        key: "modality",
        header: "MODALITY",
        accessor: (row) => row.modality,
        sortable: true,
        filterable: true,
        filterType: "select",
        render: (value) => <span className="text-xs text-foreground">{value}</span>,
      },
      {
        key: "oem",
        header: "OEM",
        accessor: (row) => row.oem,
        sortable: true,
        filterable: true,
        filterType: "select",
        render: (value) => <span className="text-xs font-medium text-foreground">{value}</span>,
      },
      {
        key: "model",
        header: "MODEL",
        accessor: (row) => row.model,
        sortable: true,
        filterable: true,
        filterType: "text",
        render: (value) => <span className="text-xs font-semibold text-foreground">{value}</span>,
      },
      {
        key: "serialNumber",
        header: "SERIAL NUMBER",
        accessor: (row) => row.serialNumber,
        sortable: true,
        filterable: true,
        filterType: "text",
        render: (value) => (
          <span className="font-mono text-xs text-muted-foreground">{value}</span>
        ),
      },
      {
        key: "warrantyEndDate",
        header: "WARRANTY END DATE",
        accessor: (row) => row.warrantyEndDate || "—",
        sortable: true,
        filterable: true,
        filterType: "text",
        render: (value) => <span className="text-xs font-mono text-muted-foreground">{value}</span>,
      },
      {
        key: "warrantyStartDate",
        header: "WARRANTY START DATE",
        accessor: (row) => row.warrantyStartDate || "—",
        sortable: true,
        filterable: true,
        filterType: "text",
        render: (value) => <span className="text-xs font-mono text-muted-foreground">{value}</span>,
      },
      {
        key: "contractStartDate",
        header: "CONTRACT START DATE",
        accessor: (row) => row.contractStartDate || "—",
        sortable: true,
        filterable: true,
        filterType: "text",
        render: (value) => <span className="text-xs font-mono text-muted-foreground">{value}</span>,
      },
      {
        key: "contractEndDate",
        header: "CONTRACT END DATE",
        accessor: (row) => row.contractEndDate || "—",
        sortable: true,
        filterable: true,
        filterType: "text",
        render: (value) => <span className="text-xs font-mono text-muted-foreground">{value}</span>,
      },
      {
        key: "yearOfManufacture",
        header: "YEAR OF MANUFACTURE",
        accessor: (row) => row.yearOfManufacture,
        sortable: true,
        filterable: true,
        filterType: "select",
        render: (value) => <span className="text-xs text-center block text-foreground">{value}</span>,
      },
      {
        key: "jobType",
        header: "JOB TYPE",
        accessor: (row) => row.jobType,
        sortable: true,
        filterable: true,
        filterType: "select",
        render: (value) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground border border-border/60">
            {value}
          </span>
        ),
      },
      {
        key: "jobOpenDate",
        header: "JOB OPEN DATE",
        accessor: (row) => row.jobOpenDate,
        sortable: true,
        filterable: true,
        filterType: "text",
        render: (value) => <span className="text-xs font-mono text-foreground">{value}</span>,
      },
      {
        key: "jobStartDate",
        header: "JOB START DATE",
        accessor: (row) => row.jobStartDate,
        sortable: true,
        filterable: true,
        filterType: "text",
        render: (value) => <span className="text-xs font-mono text-foreground">{value}</span>,
      },
      {
        key: "equipmentStatus",
        header: "EQUIPMENT STATUS",
        accessor: (row) => row.equipmentStatus,
        sortable: true,
        filterable: true,
        filterType: "select",
        render: (value) => {
          if (value === "UP") {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                UP
              </span>
            );
          }
          if (value === "Partially UP") {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Partially UP
              </span>
            );
          }
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              Down
            </span>
          );
        },
      },
      {
        key: "jobPriority",
        header: "JOB PRIORITY",
        accessor: (row) => row.jobPriority,
        sortable: true,
        filterable: true,
        filterType: "select",
        render: (value) => {
          if (value === "High") {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                High
              </span>
            );
          }
          if (value === "Mid") {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Mid
              </span>
            );
          }
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Low
            </span>
          );
        },
      },
      {
        key: "assignTo",
        header: "ASSIGN TO",
        accessor: (row) => row.assignedToName,
        sortable: true,
        filterable: true,
        filterType: "select",
        render: (value) => <span className="text-xs font-bold text-foreground">{value}</span>,
      },
      {
        key: "assistedBy",
        header: "ASSISTED BY",
        accessor: (row) => row.assistedBy || "—",
        sortable: true,
        filterable: true,
        filterType: "text",
        render: (value) => <span className="text-xs text-muted-foreground">{value}</span>,
      },
      {
        key: "startDate",
        header: "START DATE",
        accessor: (row) => row.startDate || "—",
        sortable: true,
        filterable: true,
        filterType: "text",
        render: (value) => <span className="text-xs font-mono text-muted-foreground">{value}</span>,
      },
      {
        key: "endDate",
        header: "END DATE",
        accessor: (row) => row.endDate || "—",
        sortable: true,
        filterable: true,
        filterType: "text",
        render: (value) => <span className="text-xs font-mono text-muted-foreground">{value}</span>,
      },
      {
        key: "rootCause",
        header: "ROOT CAUSE",
        accessor: (row) => row.rootCause || "—",
        sortable: true,
        filterable: true,
        filterType: "select",
        render: (value) => <span className="text-xs text-foreground font-medium">{value}</span>,
      },
      {
        key: "resolution",
        header: "RESOLUTION",
        accessor: (row) => row.resolution || "—",
        sortable: true,
        filterable: true,
        filterType: "select",
        render: (value) => <span className="text-xs text-foreground font-medium">{value}</span>,
      },
    ],
    [onOpenJob]
  );

  return (
    <div className="space-y-4">
      <DataTable<DebriefJob>
        columns={columns}
        rows={jobs}
        loading={loading}
        searchPlaceholder="Search jobs by number, asset, OEM, model, engineer..."
        pageSize={10}
        emptyTitle="No jobs found"
        emptyDescription={
          isAdmin
            ? "No service jobs have been recorded yet. Click '+ Create Job' to dispatch a new job."
            : "You have no service jobs assigned to you at this time."
        }
        mobileStrategy="card"
        enableColumnReordering={true}
        toolbarActions={
          isAdmin && onCreateJob ? (
            <Button
              onClick={onCreateJob}
              size="sm"
              className="h-9 px-3 text-xs font-bold gap-1.5 shadow-xs cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-3.5" />
              <span>Create Job</span>
            </Button>
          ) : undefined
        }
        rowActions={(job) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenJob?.(job)}
            className="h-8 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1.5 cursor-pointer font-semibold"
          >
            <Eye className="size-3.5" />
            <span>Open</span>
          </Button>
        )}
      />
    </div>
  );
}
