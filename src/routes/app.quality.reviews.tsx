import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { CheckSquare, Eye, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import type { DataTableColumn } from "@/components/data-table/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { qualityService } from "@/modules/quality/services/quality-service";
import { Loading } from "@/components/ui/loading";

export const Route = createFileRoute("/app/quality/reviews")({
  head: () => ({
    meta: [
      { title: "Quality Reviews — HEMP" },
      { name: "description", content: "Review pending quality standards and equipment procedures." },
    ],
  }),
  component: QualityReviewsPage,
});

function QualityReviewsPage() {
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
      // Only show items with status "Under Review"
      setItems(data.filter((item) => item.status === "Under Review"));
    } catch (err) {
      console.error("Error loading reviews", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMockView = (item: any) => {
    alert(`Mock View: Opening ${item.description} (${item.identifier}) to perform review checklist.`);
  };

  const handleCompleteReview = async (item: any) => {
    try {
      if (item.type === "document") {
        const docs = await qualityService.listDocuments(true);
        const doc = docs.find((d) => d.id === item.id);
        if (doc) {
          await qualityService.updateDocument(doc.id, {
            ...doc,
            status: "Pending Approval",
          });
        }
      } else {
        const chks = await qualityService.listChecklists(true);
        const chk = chks.find((c) => c.id === item.id);
        if (chk) {
          await qualityService.updateChecklist(chk.id, {
            ...chk,
            status: "Pending Approval",
          });
        }
      }
      alert(`Review complete! "${item.description}" has been escalated to "Pending Approval".`);
      loadData();
    } catch (err) {
      console.error("Error completing review", err);
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
      header: "Prepared By",
      value: (row) => row.preparedBy,
      filterable: true,
      className: "text-xs font-semibold text-foreground",
    },
    {
      key: "status",
      header: "Review Status",
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
              onClick={() => handleCompleteReview(row)}
              aria-label={`Approve review for ${row.description}`}
            >
              <CheckCircle2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Approve Review</TooltipContent>
        </Tooltip>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CheckSquare className="size-6 text-primary" />
          Pending Reviews
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Perform quality assurance validation on newly prepared guidelines and equipment checklist versions.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        searchPlaceholder="Search items awaiting review..."
        emptyTitle="No reviews pending"
        emptyDescription="All submitted materials have been peer-reviewed."
        rowActions={renderRowActions}
      />
    </div>
  );
}
