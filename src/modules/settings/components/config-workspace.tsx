import { useEffect, useState } from "react";
import { Plus, Edit2, Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { configService } from "../services/config-service";
import type { ConfigRecord } from "../types";
import { ConfigFormModal } from "./config-form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ConfigCategory {
  key: string;
  label: string;
  singular: string;
}

interface ConfigWorkspaceProps {
  title: string;
  categories: ConfigCategory[];
}

export function ConfigWorkspace({ title, categories }: ConfigWorkspaceProps) {
  const [activeTab, setActiveTab] = useState(categories[0]?.key || "");
  const [records, setRecords] = useState<ConfigRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ConfigRecord | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    recordId: string;
    action: "archive" | "restore";
  }>({
    open: false,
    recordId: "",
    action: "archive",
  });

  const activeCategory = categories.find((c) => c.key === activeTab) || categories[0];

  const fetchRecords = async () => {
    if (!activeTab) return;
    setLoading(true);
    try {
      const data = await configService.list(activeTab);
      // Sort: active first, then by updatedAt desc
      const sorted = [...data].sort((a, b) => {
        if (a.status === b.status) {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        return a.status === "active" ? -1 : 1;
      });
      setRecords(sorted);
    } catch (err) {
      console.error("Error fetching config records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeTab]);

  const handleAddClick = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (record: ConfigRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (label: string, status: "active" | "archived", description: string) => {
    try {
      if (editingRecord) {
        await configService.update(editingRecord.id, { label, status, description });
      } else {
        await configService.create(activeTab, { label, status, description });
      }
      fetchRecords();
    } catch (err) {
      console.error("Error saving record", err);
    }
  };

  const handleActionConfirm = async () => {
    const { recordId, action } = confirmState;
    if (!recordId) return;

    try {
      await configService.setStatus(recordId, action === "archive" ? "archived" : "active");
      fetchRecords();
    } catch (err) {
      console.error(`Error ${action}ing record`, err);
    } finally {
      setConfirmState({ open: false, recordId: "", action: "archive" });
    }
  };

  const columns: DataTableColumn<ConfigRecord>[] = [
    {
      key: "label",
      header: "Name / Value",
      value: (row) => row.label,
      filterable: false,
      className: "font-medium text-foreground",
    },
    {
      key: "status",
      header: "Status",
      value: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} />,
      filterable: true,
    },
    {
      key: "description",
      header: "Description",
      value: (row) => row.description || "—",
      filterable: false,
      className: "text-muted-foreground",
    },
    {
      key: "updatedAt",
      header: "Updated",
      value: (row) => row.updatedAt,
      filterable: false,
      className: "font-mono text-xs text-muted-foreground",
    },
  ];

  const renderRowActions = (row: ConfigRecord) => {
    const isArchived = row.status === "archived";
    return (
      <div className="flex justify-end gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleEditClick(row)}
              aria-label={`Edit ${row.label}`}
            >
              <Edit2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit Record</TooltipContent>
        </Tooltip>

        {isArchived ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-emerald-600 dark:text-emerald-400"
                onClick={() =>
                  setConfirmState({
                    open: true,
                    recordId: row.id,
                    action: "restore",
                  })
                }
                aria-label={`Restore ${row.label}`}
              >
                <RotateCcw className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Restore Record</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive"
                onClick={() =>
                  setConfirmState({
                    open: true,
                    recordId: row.id,
                    action: "archive",
                  })
                }
                aria-label={`Archive ${row.label}`}
              >
                <Archive className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive Record</TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Category selector / Tabs */}
      <div className="border-b border-border">
        <div className="flex flex-wrap -mb-px gap-2">
          {categories.map((cat) => {
            const isActive = cat.key === activeTab;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`py-2.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Table */}
      <DataTable
        columns={columns}
        rows={records}
        loading={loading}
        searchPlaceholder={`Search ${activeCategory?.label.toLowerCase()}...`}
        emptyTitle={`No ${activeCategory?.label.toLowerCase()} found`}
        emptyDescription={`Add a new ${activeCategory?.singular.toLowerCase()} to get started.`}
        toolbarActions={
          <Button size="sm" className="h-9 text-xs" onClick={handleAddClick}>
            <Plus className="size-3.5 mr-1" />
            Add {activeCategory?.singular}
          </Button>
        }
        rowActions={renderRowActions}
      />

      {/* Form Modal */}
      <ConfigFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingRecord ? `Edit ${activeCategory?.singular}` : `Add New ${activeCategory?.singular}`}
        record={editingRecord}
        onSubmit={handleFormSubmit}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((p) => ({ ...p, open }))}
        title={confirmState.action === "archive" ? `Archive ${activeCategory?.singular}` : `Restore ${activeCategory?.singular}`}
        description={
          confirmState.action === "archive"
            ? `Are you sure you want to archive this ${activeCategory?.singular.toLowerCase()}? It will be hidden from default selections.`
            : `Are you sure you want to restore this ${activeCategory?.singular.toLowerCase()}?`
        }
        confirmLabel={confirmState.action === "archive" ? "Archive" : "Restore"}
        variant={confirmState.action === "archive" ? "destructive" : "default"}
        onConfirm={handleActionConfirm}
      />
    </div>
  );
}
