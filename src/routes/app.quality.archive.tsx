import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { Archive, Eye, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { qualityService } from "@/modules/quality/services/quality-service";
import { Loading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/quality/archive")({
  head: () => ({
    meta: [
      { title: "Quality Archive — HEMP" },
      { name: "description", content: "Review and restore archived quality policies and equipment checklist templates." },
    ],
  }),
  component: QualityArchivePage,
});

function QualityArchivePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Quality Admin";

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const docs = await qualityService.listDocuments(true);
      const chks = await qualityService.listChecklists(true);

      const archivedDocs = docs
        .filter((d) => d.isArchived)
        .map((d) => ({
          id: d.id,
          type: "Document",
          description: d.description,
          identifier: d.policyNumber,
          version: d.version,
          status: d.status,
          scope: "General Guidelines",
          lastModified: d.lastModified,
          fileName: d.fileName,
        }));

      const archivedChks = chks
        .filter((c) => c.isArchived)
        .map((c) => ({
          id: c.id,
          type: "Checklist",
          description: c.description,
          identifier: c.formNumber,
          version: c.version,
          status: c.status,
          scope: `${c.equipmentOem} ${c.equipmentModel}`,
          lastModified: c.lastModified,
          fileName: c.fileName || "structured_form",
        }));

      setItems([...archivedDocs, ...archivedChks]);
    } catch (err) {
      console.error("Error loading archived items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMockView = (row: any) => {
    alert(`Mock View: Opening archived ${row.type} "${row.description}" in read-only audit window.`);
  };

  const handleMockDownload = (row: any) => {
    alert(`Mock Download: Triggering archive file-download download for ${row.fileName}`);
  };

  const handleRestore = async (row: any) => {
    if (!user) return;
    try {
      const userName = `${user.firstName} ${user.lastName}`;
      if (row.type === "Document") {
        await qualityService.setDocumentArchived(row.id, false, userName);
      } else {
        await qualityService.setChecklistArchived(row.id, false, userName);
      }
      alert(`Restored! "${row.description}" has been returned to the active list workspace.`);
      loadData();
    } catch (err) {
      console.error("Error restoring item", err);
    }
  };

  const columns: DataTableColumn<any>[] = [
    {
      key: "description",
      header: "Archived Item",
      value: (row) => row.description,
      cell: (row) => (
        <div>
          <p className="font-semibold text-foreground leading-snug">{row.description}</p>
          <span className="text-[10px] text-muted-foreground font-mono">
            {row.identifier} &bull; {row.fileName}
          </span>
        </div>
      ),
      filterable: false,
    },
    {
      key: "type",
      header: "Item Type",
      value: (row) => row.type,
      cell: (row) => (
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border",
            row.type === "Document"
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
          )}
        >
          {row.type}
        </span>
      ),
      filterable: true,
    },
    {
      key: "scope",
      header: "Applicable Scope",
      value: (row) => row.scope,
      filterable: true,
      className: "text-xs text-muted-foreground font-medium",
    },
    {
      key: "version",
      header: "Version",
      value: (row) => row.version,
      filterable: true,
      className: "font-mono text-xs text-muted-foreground",
    },
    {
      key: "status",
      header: "Archived Status",
      value: (row) => row.status,
      cell: (row) => <StatusBadge status="inactive" label={row.status} />,
      filterable: true,
    },
    {
      key: "lastModified",
      header: "Last Modified",
      value: (row) => row.lastModified,
      filterable: false,
      className: "font-mono text-[11px] text-muted-foreground",
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
          <TooltipContent>View</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleMockDownload(row)}
              aria-label={`Download ${row.description}`}
            >
              <Download className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download</TooltipContent>
        </Tooltip>

        {isAdmin && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-emerald-600 dark:text-emerald-400"
                onClick={() => handleRestore(row)}
                aria-label={`Restore ${row.description}`}
              >
                <RefreshCw className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Restore Item</TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Archive className="size-6 text-primary" />
          Quality Archive
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Historical repository of archived policies and retired equipment checklists.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        searchPlaceholder="Search archived items by name or policy number..."
        emptyTitle="Archive is empty"
        emptyDescription="No retired or archived items found in history."
        rowActions={renderRowActions}
      />
    </div>
  );
}
