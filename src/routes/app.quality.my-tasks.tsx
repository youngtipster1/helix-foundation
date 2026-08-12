import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { ClipboardCheck, Eye, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { qualityService } from "@/modules/quality/services/quality-service";
import { Loading } from "@/components/ui/loading";

export const Route = createFileRoute("/app/quality/my-tasks")({
  head: () => ({
    meta: [
      { title: "My Tasks — HEMP" },
      { name: "description", content: "View and execute quality reviews and approvals assigned to you." },
    ],
  }),
  component: MyTasksPage,
});

function MyTasksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== "Quality User") {
      navigate({ to: "/app/quality/policy-documents", replace: true });
    }
  }, [user, navigate]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const fullName = `${user.firstName} ${user.lastName}`;
      const data = await qualityService.getMyTasks(fullName);
      setTasks(data);
    } catch (err) {
      console.error("Error loading tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleMockView = (row: any) => {
    alert(`Mock View: Opening ${row.description} (${row.identifier}) to perform peer review or approval.`);
  };

  const handleResolveTask = async (row: any) => {
    try {
      if (row.role === "Reviewer") {
        if (row.type === "document") {
          const docs = await qualityService.listDocuments(true);
          const doc = docs.find((d) => d.id === row.id);
          if (doc) await qualityService.updateDocument(doc.id, { ...doc, status: "Pending Approval" });
        } else {
          const chks = await qualityService.listChecklists(true);
          const chk = chks.find((c) => c.id === row.id);
          if (chk) await qualityService.updateChecklist(chk.id, { ...chk, status: "Pending Approval" });
        }
        alert(`Review submitted! "${row.description}" has been escalated to "Pending Approval".`);
      } else {
        // Approver
        if (row.type === "document") {
          const docs = await qualityService.listDocuments(true);
          const doc = docs.find((d) => d.id === row.id);
          if (doc) await qualityService.updateDocument(doc.id, { ...doc, status: "Approved" });
        } else {
          const chks = await qualityService.listChecklists(true);
          const chk = chks.find((c) => c.id === row.id);
          if (chk) await qualityService.updateChecklist(chk.id, { ...chk, status: "Approved" });
        }
        alert(`Approval signed off! "${row.description}" is now active and approved.`);
      }
      loadData();
    } catch (err) {
      console.error("Error resolving task", err);
    }
  };

  const columns: DataTableColumn<any>[] = [
    {
      key: "description",
      header: "Task Subject / Item",
      value: (row) => row.description,
      cell: (row) => (
        <div>
          <p className="font-semibold text-foreground leading-snug">{row.description}</p>
          <span className="text-[10px] text-muted-foreground font-mono">{row.identifier} ({row.type})</span>
        </div>
      ),
      filterable: false,
    },
    {
      key: "role",
      header: "Your Assignment",
      value: (row) => row.role,
      cell: (row) => (
        <span className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-foreground border border-border">
          {row.role}
        </span>
      ),
      filterable: true,
    },
    {
      key: "actionRequired",
      header: "Action Required",
      value: (row) => row.actionRequired,
      filterable: true,
      className: "text-xs font-medium text-foreground",
    },
    {
      key: "status",
      header: "Current State",
      value: (row) => row.status,
      cell: (row) => <StatusBadge status="pending" label={row.status} />,
      filterable: true,
    },
    {
      key: "lastUpdated",
      header: "Assigned Timestamp",
      value: (row) => row.lastUpdated,
      filterable: false,
      className: "font-mono text-xs text-muted-foreground",
    },
  ];

  const renderRowActions = (row: any) => {
    return (
      <div className="flex justify-end gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleMockView(row)}
              aria-label={`View ${row.description}`}
            >
              <Eye className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>View Details</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-emerald-600 dark:text-emerald-400"
              onClick={() => handleResolveTask(row)}
              aria-label={`Resolve task for ${row.description}`}
            >
              <CheckCircle2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Submit {row.role === "Reviewer" ? "Review" : "Approval"}</TooltipContent>
        </Tooltip>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="size-6 text-primary animate-pulse" />
          My Tasks
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Perform reviews or approvals on quality protocols assigned to your personnel profile.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={tasks}
        loading={loading}
        searchPlaceholder="Search assigned tasks..."
        emptyTitle="No tasks pending"
        emptyDescription="Great job! Your quality validation queue is completely empty."
        rowActions={renderRowActions}
      />
    </div>
  );
}
