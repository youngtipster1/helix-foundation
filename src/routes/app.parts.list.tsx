import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Boxes } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Loading } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import { partsService } from "@/modules/parts/services/parts-service";
import { PartsTable } from "@/modules/parts/components/parts-table";
import { PartFormModal } from "@/modules/parts/components/part-form-modal";
import { PartDetailModal } from "@/modules/parts/components/part-detail-modal";
import { Part } from "@/modules/parts/types";
import { toast } from "sonner";

export const Route = createFileRoute("/app/parts/list")({
  head: () => ({
    meta: [
      { title: "Parts Inventory Registry — HEMP" },
      {
        name: "description",
        content: "Master spare parts catalog, stock levels, lead times, and physical bin coordinates.",
      },
    ],
  }),
  component: PartsListPage,
});

function PartsListPage() {
  const { user } = useAuth();
  const isAdmin = isModuleAdmin(user, "parts");

  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [viewingPart, setViewingPart] = useState<Part | null>(null);

  // Archive confirmation
  const [archiveDialog, setArchiveDialog] = useState<{
    open: boolean;
    part: Part | null;
  }>({
    open: false,
    part: null,
  });

  const loadParts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await partsService.list();
      setParts(data);
    } catch (err) {
      console.error("Failed to load parts", err);
      toast.error("Failed to load parts inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParts();
  }, [loadParts]);

  const handleAddPart = () => {
    setEditingPart(null);
    setIsFormOpen(true);
  };

  const handleEditPart = (part: Part) => {
    setEditingPart(part);
    setIsFormOpen(true);
  };

  const handleViewPart = (part: Part) => {
    setViewingPart(part);
  };

  const handleArchiveClick = (part: Part) => {
    setArchiveDialog({
      open: true,
      part,
    });
  };

  const handleArchiveConfirm = async () => {
    if (!archiveDialog.part) return;
    try {
      const currentUserName = user ? `${user.firstName} ${user.lastName}` : "System Admin";
      await partsService.archive(archiveDialog.part.id, currentUserName);
      toast.success(`Part ${archiveDialog.part.partNumber} archived successfully.`);
      loadParts();
    } catch (err) {
      console.error("Error archiving part", err);
      toast.error("Failed to archive part.");
    } finally {
      setArchiveDialog({ open: false, part: null });
    }
  };

  const handlePartSaved = () => {
    loadParts();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parts Inventory Registry"
        subtitle="Master replacement catalog, depot allocations, vendor SLA pricing, and real-time inventory counts"
        icon={Boxes}
      />

      {loading ? (
        <div className="flex min-h-[350px] items-center justify-center">
          <Loading />
        </div>
      ) : (
        <PartsTable
          parts={parts}
          isAdmin={isAdmin}
          onAddPart={handleAddPart}
          onEditPart={handleEditPart}
          onArchivePart={handleArchiveClick}
          onViewPart={handleViewPart}
          onRefresh={loadParts}
        />
      )}

      {/* 3-Step Add / Edit Stepper Modal */}
      <PartFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        partToEdit={editingPart}
        onSaved={handlePartSaved}
      />

      {/* Detailed Part Inspector Modal */}
      <PartDetailModal
        part={viewingPart}
        open={Boolean(viewingPart)}
        onOpenChange={(open) => !open && setViewingPart(null)}
        isAdmin={isAdmin}
        onEdit={(part) => {
          setViewingPart(null);
          handleEditPart(part);
        }}
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        open={archiveDialog.open}
        onOpenChange={(open) => setArchiveDialog((p) => ({ ...p, open }))}
        title="Archive Spare Part"
        description={`Are you sure you want to archive part "${archiveDialog.part?.partNumber}" (${archiveDialog.part?.model})? This item will be removed from active inventory but its historical audit trails and maintenance links will be preserved.`}
        confirmLabel="Archive Part"
        variant="destructive"
        onConfirm={handleArchiveConfirm}
      />
    </div>
  );
}
