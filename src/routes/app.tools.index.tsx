import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Archive,
  Wrench,
  Eye,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RowActionsMenu } from "@/components/data-table/row-actions-menu";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import { toolsService } from "@/modules/tools/services/tools-service";
import type { Tool, ToolInput } from "@/modules/tools/types";
import { CalibrationStatusBadge } from "@/modules/tools/components/calibration-status-badge";
import { ToolFormModal } from "@/modules/tools/components/tool-form-modal";
import { toast } from "sonner";

export const Route = createFileRoute("/app/tools/")({
  head: () => ({
    meta: [
      { title: "Tools Registry — HEMP" },
      { name: "description", content: "Master equipment register, metrological calibration compliance, and device specifications." },
    ],
  }),
  component: ToolsListPage,
});

function getDaysRemaining(dueDate?: string): { text: string; days: number } {
  if (!dueDate) return { text: "No Date", days: 0 };
  const diffTime = new Date(dueDate).getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, days: diffDays };
  if (diffDays === 0) return { text: "Due today", days: 0 };
  return { text: `${diffDays}d remaining`, days: diffDays };
}

function ToolsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [toolsList, setToolsList] = useState<Tool[]>([]);
  const [openJobMap, setOpenJobMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "attention" | "valid" | "due_soon" | "expired">("all");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  // Archive confirm dialog state
  const [archiveDialog, setArchiveDialog] = useState<{
    open: boolean;
    toolId: string;
    toolName: string;
  }>({
    open: false,
    toolId: "",
    toolName: "",
  });

  const isToolsAdmin = isModuleAdmin(user, "tools");

  const fetchTools = async () => {
    setLoading(true);
    try {
      const data = await toolsService.list();
      setToolsList(data);

      // Check open jobs for all tools
      const jobStatusEntries = await Promise.all(
        data.map(async (t) => {
          const hasOpen = await toolsService.hasOpenJobs(t.id);
          return [t.id, hasOpen] as [string, boolean];
        }),
      );
      setOpenJobMap(Object.fromEntries(jobStatusEntries));
    } catch (err) {
      console.error("Error fetching tools list", err);
      toast.error("Failed to load tools registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const validCount = toolsList.filter((t) => t.calibrationStatus === "valid").length;
  const dueSoonCount = toolsList.filter((t) => t.calibrationStatus === "due_soon").length;
  const expiredCount = toolsList.filter((t) => t.calibrationStatus === "expired").length;
  const attentionCount = dueSoonCount + expiredCount;

  const filteredTools = toolsList.filter((tool) => {
    if (activeFilter === "attention") return tool.calibrationStatus === "due_soon" || tool.calibrationStatus === "expired";
    if (activeFilter === "valid") return tool.calibrationStatus === "valid";
    if (activeFilter === "due_soon") return tool.calibrationStatus === "due_soon";
    if (activeFilter === "expired") return tool.calibrationStatus === "expired";
    return true;
  });

  const handleAddClick = () => {
    setEditingTool(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (tool: Tool) => {
    setEditingTool(tool);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (input: ToolInput) => {
    try {
      if (editingTool) {
        await toolsService.update(editingTool.id, input);
        toast.success(`Tool ${editingTool.id} updated successfully.`);
      } else {
        const created = await toolsService.create(input);
        toast.success(`Tool ${created.id} registered successfully.`);
      }
      fetchTools();
    } catch (err) {
      console.error("Error saving tool", err);
      toast.error("Failed to save tool record.");
    }
  };

  const handleArchiveConfirm = async () => {
    const { toolId } = archiveDialog;
    if (!toolId) return;

    try {
      const result = await toolsService.archive(toolId, `${user?.firstName} ${user?.lastName}`);
      if (result.success) {
        toast.success(`Tool ${toolId} archived successfully.`);
        fetchTools();
      } else {
        toast.error(result.message || "Unable to archive this tool.");
      }
    } catch (err) {
      console.error("Error archiving tool", err);
      toast.error("An error occurred while archiving the tool.");
    } finally {
      setArchiveDialog({ open: false, toolId: "", toolName: "" });
    }
  };

  const columns: DataTableColumn<Tool>[] = [
    {
      key: "id",
      header: "Tools ID",
      value: (row) => row.id,
      cell: (row) => (
        <button
          onClick={() => navigate({ to: "/app/tools/$toolId", params: { toolId: row.id } })}
          className="font-mono font-bold text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{row.id}</span>
        </button>
      ),
      className: "font-mono font-semibold",
      filterable: true,
    },
    {
      key: "category",
      header: "Category",
      value: (row) => row.category,
      filterable: true,
      className: "text-foreground font-medium",
    },
    {
      key: "oem",
      header: "OEM",
      value: (row) => row.oem,
      filterable: true,
      className: "text-muted-foreground",
    },
    {
      key: "model",
      header: "Model",
      value: (row) => row.model,
      filterable: true,
      className: "text-foreground font-medium",
    },
    {
      key: "serialNumber",
      header: "Serial Number",
      value: (row) => row.serialNumber,
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.serialNumber}
        </span>
      ),
      filterable: true,
    },
    {
      key: "calibrationStatus",
      header: "Calibration Status",
      value: (row) => row.calibrationStatus,
      cell: (row) => <CalibrationStatusBadge status={row.calibrationStatus} />,
      filterable: true,
    },
    {
      key: "lastCalibrationDate",
      header: "Last Calibration",
      value: (row) => row.lastCalibrationDate || "—",
      filterable: false,
      className: "text-muted-foreground font-mono text-xs",
    },
    {
      key: "nextCalibrationDate",
      header: "Calibration Due Date",
      value: (row) => row.nextCalibrationDate || "—",
      cell: (row) => {
        if (!row.nextCalibrationDate) return <span className="text-muted-foreground font-mono text-xs">—</span>;
        const remaining = getDaysRemaining(row.nextCalibrationDate);
        return (
          <div>
            <span className="font-mono text-xs font-semibold text-foreground block">
              {row.nextCalibrationDate}
            </span>
            <span
              className={`text-[10px] font-mono ${
                remaining.days < 0
                  ? "text-rose-600 dark:text-rose-400 font-bold"
                  : remaining.days <= 30
                  ? "text-amber-600 dark:text-amber-400 font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {remaining.text}
            </span>
          </div>
        );
      },
      filterable: false,
    },
    {
      key: "warrantyStatus",
      header: "Warranty Status",
      value: (row) => row.warrantyStatus,
      cell: (row) => <StatusBadge status={row.warrantyStatus} />,
      filterable: true,
    },
    {
      key: "vendor",
      header: "Vendor",
      value: (row) => row.vendor || "—",
      filterable: true,
      className: "text-muted-foreground",
    },
    {
      key: "yearOfManufacture",
      header: "Year of MFR",
      value: (row) => row.yearOfManufacture?.toString() || "—",
      filterable: true,
      className: "text-muted-foreground font-mono",
    },
  ];

  const renderRowActions = (row: Tool) => {
    const hasOpenJob = openJobMap[row.id] ?? false;

    return (
      <div className="flex justify-end">
        <RowActionsMenu
          label="Actions"
          align="end"
          actions={[
            {
              label: "View Details",
              icon: Eye,
              onClick: () => navigate({ to: "/app/tools/$toolId", params: { toolId: row.id } }),
            },
            {
              label: "Edit Tool",
              icon: Edit2,
              hidden: !isToolsAdmin,
              onClick: () => handleEditClick(row),
            },
            {
              label: "Schedule Calibration Job",
              icon: Calendar,
              hidden: !isToolsAdmin,
              onClick: () => navigate({ to: "/app/tools/jobs/create" }),
            },
            {
              label: hasOpenJob ? "Archive (Has Open Job)" : "Archive Tool",
              icon: Archive,
              variant: "destructive",
              hidden: !isToolsAdmin,
              disabled: hasOpenJob,
              onClick: () =>
                setArchiveDialog({
                  open: true,
                  toolId: row.id,
                  toolName: `${row.model} (${row.id})`,
                }),
            },
          ]}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tools Registry"
        description="Master equipment register, metrological calibration compliance, and device specifications"
        icon={Wrench}
      />

      {/* Summary KPI Cards (Unified Design System) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Equipment"
          value={toolsList.length}
          description="Registered biomedical diagnostic tools"
          icon={Wrench}
          active={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
        />
        <StatCard
          title="Calibrated & Valid"
          value={validCount}
          description="Valid calibration certificates active"
          icon={CheckCircle2}
          active={activeFilter === "valid"}
          onClick={() => setActiveFilter("valid")}
        />
        <StatCard
          title="Due Within 30 Days"
          value={dueSoonCount}
          description="Calibration slots scheduled with vendors"
          icon={AlertTriangle}
          active={activeFilter === "due_soon"}
          onClick={() => setActiveFilter("due_soon")}
        />
        <StatCard
          title="Out of Calibration"
          value={expiredCount}
          description="Quarantined & blocked from operational use"
          icon={ShieldAlert}
          active={activeFilter === "expired"}
          onClick={() => setActiveFilter("expired")}
        />
      </div>

      {/* Filter Tabs & Add Tool Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full sm:w-auto h-9 p-1 bg-muted/50 border border-border">
            <TabsTrigger value="all" className="text-xs">
              All ({toolsList.length})
            </TabsTrigger>
            <TabsTrigger value="attention" className="text-xs">
              Needs Attention ({attentionCount})
            </TabsTrigger>
            <TabsTrigger value="valid" className="text-xs">
              Valid ({validCount})
            </TabsTrigger>
            <TabsTrigger value="due_soon" className="text-xs">
              Due Soon ({dueSoonCount})
            </TabsTrigger>
            <TabsTrigger value="expired" className="text-xs">
              Expired ({expiredCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isToolsAdmin && (
          <Button size="sm" className="h-9 text-xs" onClick={handleAddClick}>
            <Plus className="size-3.5 mr-1" />
            Add New Tool
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={filteredTools}
        loading={loading}
        searchPlaceholder="Search tools by ID, serial number, model, OEM, category, vendor..."
        emptyTitle="No tools found."
        emptyDescription="No diagnostic tools match the selected filter."
        rowActions={renderRowActions}
      />

      {/* Tool Create / Edit Modal */}
      <ToolFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        tool={editingTool}
        onSubmit={handleFormSubmit}
      />

      {/* Archive Confirm Dialog */}
      <ConfirmDialog
        open={archiveDialog.open}
        onOpenChange={(open) => setArchiveDialog((p) => ({ ...p, open }))}
        title="Archive Tool Record"
        description={`Are you sure you want to archive ${archiveDialog.toolName}? The tool will be moved to the Archived Tools registry and can be restored at any time.`}
        confirmLabel="Archive Tool"
        variant="destructive"
        onConfirm={handleArchiveConfirm}
      />
    </div>
  );
}
