import { useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { Button } from "@/components/ui/button";
import type { DebriefJob } from "../types";
import { Eye } from "lucide-react";

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
        value: (row) => {
          const idx = jobs.findIndex((j) => j.id === row.id);
          return idx !== -1 ? String(idx + 1) : "—";
        },
        cell: (row) => {
          const idx = jobs.findIndex((j) => j.id === row.id);
          return (
            <span className="font-mono text-xs font-semibold text-muted-foreground">
              {idx !== -1 ? idx + 1 : "—"}
            </span>
          );
        },
        className: "w-14 min-w-[56px] text-center",
        headerClassName: "w-14 min-w-[56px] text-center",
        filterable: false,
        reorderable: true,
      },
      {
        key: "jobNumber",
        header: "JOB NUMBER",
        value: (row) => row.jobNumber,
        cell: (row) => (
          <button
            type="button"
            onClick={() => onOpenJob?.(row)}
            className="font-mono text-xs font-bold text-primary hover:underline hover:text-primary/80 transition-colors text-left cursor-pointer"
          >
            {row.jobNumber}
          </button>
        ),
        className: "min-w-[140px]",
        headerClassName: "min-w-[140px]",
        filterable: true,
        priority: true,
      },
      {
        key: "assetNumber",
        header: "ASSET NUMBER",
        value: (row) => row.assetNumber,
        cell: (row) => (
          <span className="font-mono text-xs font-bold text-foreground">
            {row.assetNumber}
          </span>
        ),
        className: "min-w-[140px]",
        headerClassName: "min-w-[140px]",
        filterable: true,
        priority: true,
      },
      {
        key: "modality",
        header: "MODALITY",
        value: (row) => row.modality,
        cell: (row) => <span className="text-xs text-foreground font-medium">{row.modality}</span>,
        className: "min-w-[130px]",
        headerClassName: "min-w-[130px]",
        filterable: true,
      },
      {
        key: "oem",
        header: "OEM",
        value: (row) => row.oem,
        cell: (row) => <span className="text-xs font-medium text-foreground">{row.oem}</span>,
        className: "min-w-[140px]",
        headerClassName: "min-w-[140px]",
        filterable: true,
      },
      {
        key: "model",
        header: "MODEL",
        value: (row) => row.model,
        cell: (row) => <span className="text-xs font-semibold text-foreground">{row.model}</span>,
        className: "min-w-[160px]",
        headerClassName: "min-w-[160px]",
        filterable: true,
      },
      {
        key: "serialNumber",
        header: "SERIAL NUMBER",
        value: (row) => row.serialNumber,
        cell: (row) => (
          <span className="font-mono text-xs text-muted-foreground">{row.serialNumber}</span>
        ),
        className: "min-w-[140px]",
        headerClassName: "min-w-[140px]",
        filterable: true,
      },
      {
        key: "warrantyEndDate",
        header: "WARRANTY END DATE",
        value: (row) => row.warrantyEndDate || "—",
        cell: (row) => (
          <span className="text-xs font-mono text-muted-foreground">
            {row.warrantyEndDate || "—"}
          </span>
        ),
        className: "min-w-[150px]",
        headerClassName: "min-w-[150px]",
        filterable: true,
      },
      {
        key: "warrantyStartDate",
        header: "WARRANTY START DATE",
        value: (row) => row.warrantyStartDate || "—",
        cell: (row) => (
          <span className="text-xs font-mono text-muted-foreground">
            {row.warrantyStartDate || "—"}
          </span>
        ),
        className: "min-w-[150px]",
        headerClassName: "min-w-[150px]",
        filterable: true,
      },
      {
        key: "contractStartDate",
        header: "CONTRACT START DATE",
        value: (row) => row.contractStartDate || "—",
        cell: (row) => (
          <span className="text-xs font-mono text-muted-foreground">
            {row.contractStartDate || "—"}
          </span>
        ),
        className: "min-w-[160px]",
        headerClassName: "min-w-[160px]",
        filterable: true,
      },
      {
        key: "contractEndDate",
        header: "CONTRACT END DATE",
        value: (row) => row.contractEndDate || "—",
        cell: (row) => (
          <span className="text-xs font-mono text-muted-foreground">
            {row.contractEndDate || "—"}
          </span>
        ),
        className: "min-w-[150px]",
        headerClassName: "min-w-[150px]",
        filterable: true,
      },
      {
        key: "yearOfManufacture",
        header: "YEAR OF MANUFACTURE",
        value: (row) => row.yearOfManufacture,
        cell: (row) => (
          <span className="text-xs font-mono text-muted-foreground">
            {row.yearOfManufacture}
          </span>
        ),
        className: "min-w-[160px]",
        headerClassName: "min-w-[160px]",
        filterable: true,
      },
      {
        key: "jobType",
        header: "JOB TYPE",
        value: (row) => row.jobType,
        cell: (row) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground border border-border/60">
            {row.jobType}
          </span>
        ),
        className: "min-w-[160px]",
        headerClassName: "min-w-[160px]",
        filterable: true,
        priority: true,
      },
      {
        key: "jobOpenDate",
        header: "JOB OPEN DATE",
        value: (row) => row.jobOpenDate,
        cell: (row) => (
          <span className="text-xs font-mono text-foreground">{row.jobOpenDate}</span>
        ),
        className: "min-w-[140px]",
        headerClassName: "min-w-[140px]",
        filterable: true,
      },
      {
        key: "jobStartDate",
        header: "JOB START DATE",
        value: (row) => row.jobStartDate,
        cell: (row) => (
          <span className="text-xs font-mono text-foreground">{row.jobStartDate}</span>
        ),
        className: "min-w-[140px]",
        headerClassName: "min-w-[140px]",
        filterable: true,
      },
      {
        key: "equipmentStatus",
        header: "EQUIPMENT STATUS",
        value: (row) => row.equipmentStatus,
        cell: (row) => {
          const val = row.equipmentStatus;
          if (val === "UP") {
            return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                UP
              </span>
            );
          }
          if (val === "Partially UP") {
            return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Partially UP
              </span>
            );
          }
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              Down
            </span>
          );
        },
        className: "min-w-[150px]",
        headerClassName: "min-w-[150px]",
        filterable: true,
        priority: true,
      },
      {
        key: "jobPriority",
        header: "JOB PRIORITY",
        value: (row) => row.jobPriority,
        cell: (row) => {
          const val = row.jobPriority;
          if (val === "High") {
            return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                High
              </span>
            );
          }
          if (val === "Mid") {
            return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Mid
              </span>
            );
          }
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Low
            </span>
          );
        },
        className: "min-w-[130px]",
        headerClassName: "min-w-[130px]",
        filterable: true,
        priority: true,
      },
      {
        key: "assignTo",
        header: "ASSIGN TO",
        value: (row) => row.assignedToName,
        cell: (row) => (
          <span className="text-xs font-bold text-foreground">{row.assignedToName}</span>
        ),
        className: "min-w-[150px]",
        headerClassName: "min-w-[150px]",
        filterable: true,
      },
      {
        key: "assistedBy",
        header: "ASSISTED BY",
        value: (row) => row.assistedBy || "—",
        cell: (row) => (
          <span className="text-xs text-muted-foreground">{row.assistedBy || "—"}</span>
        ),
        className: "min-w-[150px]",
        headerClassName: "min-w-[150px]",
        filterable: true,
      },
      {
        key: "location",
        header: "LOCATION",
        value: (row) => row.location,
        cell: (row) => (
          <span className="text-xs text-foreground truncate">{row.location}</span>
        ),
        className: "min-w-[150px]",
        headerClassName: "min-w-[150px]",
        filterable: true,
      },
      {
        key: "endDate",
        header: "END DATE",
        value: (row) => row.endDate || "—",
        cell: (row) => (
          <span className="text-xs font-mono text-muted-foreground">
            {row.endDate || "—"}
          </span>
        ),
        className: "min-w-[130px]",
        headerClassName: "min-w-[130px]",
        filterable: true,
      },
      {
        key: "rootCause",
        header: "ROOT CAUSE",
        value: (row) => row.rootCause || "—",
        cell: (row) => (
          <span className="text-xs text-foreground font-medium">{row.rootCause || "—"}</span>
        ),
        className: "min-w-[150px]",
        headerClassName: "min-w-[150px]",
        filterable: true,
      },
      {
        key: "resolution",
        header: "RESOLUTION",
        value: (row) => row.resolution || "—",
        cell: (row) => (
          <span className="text-xs text-foreground font-medium">{row.resolution || "—"}</span>
        ),
        className: "min-w-[150px]",
        headerClassName: "min-w-[150px]",
        filterable: true,
      },
    ],
    [jobs, onOpenJob]
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
        mobileStrategy="scroll"
        enableColumnReordering={true}
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
