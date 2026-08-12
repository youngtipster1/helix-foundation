import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { History, ShieldAlert, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { auditService } from "@/modules/settings/services/audit-service";
import type { AuditEvent } from "@/modules/settings/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/settings/audit-log")({
  head: () => ({
    meta: [
      { title: "Audit Log — HEMP" },
      { name: "description", content: "View administrative system activity and configuration audit logs." },
    ],
  }),
  component: AuditLogPage,
});

function AuditStatusBadge({ status }: { status: AuditEvent["status"] }) {
  const isSuccess = status === "success";
  const isWarning = status === "warning";
  const isFailed = status === "failed";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border uppercase tracking-wider",
        isSuccess && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/5",
        isWarning && "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/5",
        isFailed && "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400 dark:bg-rose-500/5"
      )}
    >
      {isSuccess && <CheckCircle2 className="size-3" />}
      {isWarning && <AlertTriangle className="size-3" />}
      {isFailed && <XCircle className="size-3" />}
      {status}
    </span>
  );
}

function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const data = await auditService.list();
        setLogs(data);
      } catch (err) {
        console.error("Error fetching audit logs", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const columns: DataTableColumn<AuditEvent>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      value: (row) => row.timestamp,
      filterable: false,
      className: "font-mono text-xs text-muted-foreground whitespace-nowrap",
    },
    {
      key: "user",
      header: "User / Operator",
      value: (row) => row.user,
      filterable: true,
      className: "font-medium text-foreground",
    },
    {
      key: "action",
      header: "Action / Event",
      value: (row) => row.action,
      filterable: false,
      className: "text-foreground font-medium",
    },
    {
      key: "module",
      header: "Module Context",
      value: (row) => row.module,
      filterable: true,
      className: "font-mono text-xs text-muted-foreground",
    },
    {
      key: "context",
      header: "Event Details / Changes",
      value: (row) => row.context,
      filterable: false,
      className: "text-muted-foreground",
    },
    {
      key: "status",
      header: "Result",
      value: (row) => row.status,
      cell: (row) => <AuditStatusBadge status={row.status} />,
      filterable: true,
      className: "whitespace-nowrap",
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        rows={logs}
        loading={loading}
        searchPlaceholder="Search audit events..."
        emptyTitle="No audit logs found"
        emptyDescription="System audit log history is currently empty."
      />
    </div>
  );
}
