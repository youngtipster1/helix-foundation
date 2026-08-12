import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { ShieldCheck, Eye, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { qualityService } from "@/modules/quality/services/quality-service";
import { Loading } from "@/components/ui/loading";

export const Route = createFileRoute("/app/quality/approvals")({
  head: () => ({
    meta: [
      { title: "Quality Approvals — HEMP" },
      { name: "description", content: "Authorize and approve verified quality templates and operational guidelines." },
    ],
  }),
  component: QualityApprovalsPage,
});

function QualityApprovalsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== "Quality Admin") {
      navigate({ to: "/app/quality/policy-documents", replace: true });
    }
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await qualityService.getAttentionRequired();
      // Only show items with status "Pending Approval"
      setItems(data.filter((item) => item.status === "Pending Approval"));
    } catch (err) {
      console.error("Error loading approvals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMockView = (item: any) => {
    alert(`Mock View: Opening ${item.description} (${item.identifier}) to perform approval audit.`);
  };

  const handleSignOffApproval = async (item: any) => {
    try {
      if (item.type === "document") {
        const docs = await qualityService.listDocuments(true);
        const doc = docs.find((d) => d.id === item.id);
        if (doc) {
          await qualityService.updateDocument(doc.id, {
            ...doc,
            status: "Approved",
          });
        }
      } else {
        const chks = await qualityService.listChecklists(true);
        const chk = chks.find((c) => c.id === item.id);
        if (chk) {
          await qualityService.updateChecklist(chk.id, {
            ...chk,
            status: "Approved",
          });
        }
      }
      alert(`Approval complete! "${item.description}" has been officially signed off and is now active.`);
      loadData();
    } catch (err) {
      console.error("Error signing off approval", err);
    }
  };

  const columns: DataTableColumn<any>[] = [
    {
      key: "description",
      header: "Document / Checklist",
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
      key: "preparedBy",
      header: "Reviewed By",
      value: (row) => row.preparedBy, // In getAttentionRequired, preparedBy is mapped
      filterable: true,
      className: "text-xs font-semibold text-foreground",
    },
    {
      key: "status",
      header: "Approval Status",
      value: (row) => row.status,
      cell: (row) => <StatusBadge status="pending" label={row.status} />,
      filterable: true,
    },
    {
      key: "lastUpdated",
      header: "Last Updated",
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
          <TooltipContent>View</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-emerald-600 dark:text-emerald-400"
              onClick={() => handleSignOffApproval(row)}
              aria-label={`Sign off approval for ${row.description}`}
            >
              <CheckCircle2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Sign Off & Approve</TooltipContent>
        </Tooltip>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="size-6 text-primary" />
          Pending Approvals
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Perform administrative sign-off to authorize guidelines and publish active checklist forms.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        searchPlaceholder="Search items awaiting approval..."
        emptyTitle="No approvals pending"
        emptyDescription="All peer-reviewed quality templates have been signed off."
        rowActions={renderRowActions}
      />
    </div>
  );
}
