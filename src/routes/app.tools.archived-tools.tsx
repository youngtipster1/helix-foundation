import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Archive, RotateCcw, ShieldAlert, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { PageHeader } from "@/components/layout/page-header";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RowActionsMenu } from "@/components/data-table/row-actions-menu";
import { useAuth } from "@/features/auth/auth-context";
import { toolsService } from "@/modules/tools/services/tools-service";
import type { Tool } from "@/modules/tools/types";
import { CalibrationStatusBadge } from "@/modules/tools/components/calibration-status-badge";
import { toast } from "sonner";

export const Route = createFileRoute("/app/tools/archived-tools")({
  head: () => ({
    meta: [
      { title: "Archived Tools — HEMP" },
      { name: "description", content: "Archived equipment registry and restoration management." },
    ],
  }),
  component: ArchivedToolsPage,
});

function ArchivedToolsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [archivedTools, setArchivedTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  // Restore confirm dialog state
  const [restoreDialog, setRestoreDialog] = useState<{
    open: boolean;
    toolId: string;
    toolName: string;
  }>({
    open: false,
    toolId: "",
    toolName: "",
  });

  const isToolsAdmin = Boolean(
    user?.isSuperAdmin ||
      user?.permissions?.tools === "admin" ||
      user?.role === "Tools Admin" ||
      user?.role === "Super Admin",
  );

  const fetchArchivedTools = async () => {
    setLoading(true);
    try {
      const data = await toolsService.listArchived();
      setArchivedTools(data);
    } catch (err) {
      console.error("Error loading archived tools", err);
      toast.error("Failed to load archived tools.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedTools();
  }, []);

  if (!isToolsAdmin) {
    return (
      <div className="surface-panel p-8 text-center space-y-4 max-w-md mx-auto my-12">
        <ShieldAlert className="size-10 text-destructive mx-auto" />
        <h2 className="text-base font-bold text-foreground">Access Restricted</h2>
        <p className="text-xs text-muted-foreground">
          Only Administrators have permission to view and restore archived equipment records.
        </p>
        <Button size="sm" variant="outline" onClick={() => navigate({ to: "/app/tools" })} className="text-xs">
          Return to Active Tools
        </Button>
      </div>
    );
  }

  const handleRestoreConfirm = async () => {
    const { toolId } = restoreDialog;
    if (!toolId) return;

    try {
      await toolsService.restore(toolId);
      toast.success(`Tool ${toolId} restored to active registry.`);
      fetchArchivedTools();
    } catch (err) {
      console.error("Error restoring tool", err);
      toast.error("Failed to restore tool.");
    } finally {
      setRestoreDialog({ open: false, toolId: "", toolName: "" });
    }
  };

  const columns: DataTableColumn<Tool>[] = [
    {
      key: "id",
      header: "Tools ID",
      value: (row) => row.id,
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-foreground">
          {row.id}
        </span>
      ),
      className: "font-mono font-semibold",
      filterable: true,
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
      key: "calibrationStatus",
      header: "Calibration Status",
      value: (row) => row.calibrationStatus,
      cell: (row) => <CalibrationStatusBadge status={row.calibrationStatus} />,
      filterable: true,
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

  const renderRowActions = (row: Tool) => (
    <div className="flex justify-end">
      <RowActionsMenu
        label="Actions"
        align="end"
        actions={[
          {
            label: "Restore Tool",
            icon: RotateCcw,
            variant: "success",
            onClick: () =>
              setRestoreDialog({
                open: true,
                toolId: row.id,
                toolName: `${row.model} (${row.id})`,
              }),
          },
        ]}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Archived Tools"
        description="View and restore soft-deleted equipment profiles and historical records"
        icon={Archive}
      />

      <DataTable
        columns={columns}
        rows={archivedTools}
        loading={loading}
        searchPlaceholder="Search archived tools by ID, serial number, model, OEM..."
        emptyTitle="No archived tools."
        emptyDescription="There are currently no archived equipment records."
        rowActions={renderRowActions}
      />

      {/* Restore Confirm Dialog */}
      <ConfirmDialog
        open={restoreDialog.open}
        onOpenChange={(open) => setRestoreDialog((p) => ({ ...p, open }))}
        title="Restore Equipment Record"
        description={`Are you sure you want to restore ${restoreDialog.toolName}? The tool will be moved back to the active tools registry with its complete historical job logs preserved.`}
        confirmLabel="Restore Tool"
        variant="default"
        onConfirm={handleRestoreConfirm}
      />
    </div>
  );
}
