import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import { partsService } from "@/modules/parts/services/parts-service";
import { PartsAuditTable } from "@/modules/parts/components/parts-audit-table";
import { AuditItem, AuditRun } from "@/modules/parts/types";
import { toast } from "sonner";

export const Route = createFileRoute("/app/parts/audit")({
  head: () => ({
    meta: [
      { title: "Parts Stock Audit — HEMP" },
      {
        name: "description",
        content: "Physical parts inventory stocktaking reconciliation matrix, shrinkage calculations, and audit logs.",
      },
    ],
  }),
  component: PartsAuditPage,
});

function PartsAuditPage() {
  const { user } = useAuth();
  const isAdmin = isModuleAdmin(user, "parts");

  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAuditSheet = useCallback(async () => {
    setLoading(true);
    try {
      const data = await partsService.getAuditSheet();
      setItems(data);
    } catch (err) {
      console.error("Failed to load audit sheet", err);
      toast.error("Failed to load physical audit matrix");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditSheet();
  }, [loadAuditSheet]);

  const handleAuditSaved = (run: AuditRun) => {
    toast.success(
      `Audit run completed. ${run.totalAudited} items verified with total shrinkage value of ₦${run.totalShrinkageValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`
    );
    loadAuditSheet();
  };

  const currentUserName = user ? `${user.firstName} ${user.lastName}` : "Clinical Engineering Lead";
  const currentUserId = user?.id ?? "usr_admin_1";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Physical Stocktaking Audit"
        subtitle="18-column physical verification matrix, discrepancy shrinkage computation, and automated inventory sync"
        icon={ClipboardCheck}
      />

      {loading ? (
        <div className="flex min-h-[350px] items-center justify-center">
          <Loading />
        </div>
      ) : (
        <PartsAuditTable
          initialItems={items}
          isAdmin={isAdmin}
          currentUserName={currentUserName}
          currentUserId={currentUserId}
          onAuditSaved={handleAuditSaved}
        />
      )}
    </div>
  );
}
