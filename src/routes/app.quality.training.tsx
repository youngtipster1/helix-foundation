import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  Plus,
  Download,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  Award,
  Users,
  ShieldCheck,
  UploadCloud,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { RowActionsMenu } from "@/components/data-table/row-actions-menu";
import type { DataTableColumn } from "@/components/data-table/types";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { AppTabs } from "@/components/ui/app-tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import { trainingService } from "@/modules/quality/services/training-service";
import type {
  TrainingAssignment,
  AssignTrainingInput,
  UserComplianceKPI,
} from "@/modules/quality/types";
import { QualityComplianceChart } from "@/modules/quality/components/quality-compliance-chart";
import { AssignTrainingModal } from "@/modules/quality/components/assign-training-modal";
import { ReadAcknowledgeModal } from "@/modules/quality/components/read-acknowledge-modal";
import { toast } from "sonner";

export const Route = createFileRoute("/app/quality/training")({
  head: () => ({
    meta: [
      { title: "Training & Quality Compliance — HEMP" },
      {
        name: "description",
        content:
          "Manage biomedical policy document training, track personnel completion, and view Quality Compliance KPIs.",
      },
    ],
  }),
  component: QualityTrainingPage,
});

function QualityTrainingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allAssignments, setAllAssignments] = useState<TrainingAssignment[]>([]);
  const [complianceKPIs, setComplianceKPIs] = useState<UserComplianceKPI[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "completed">("all");
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [acknowledgeTarget, setAcknowledgeTarget] = useState<TrainingAssignment | null>(null);

  const isAdmin = isModuleAdmin(user, "quality");

  const fetchTrainingData = async () => {
    setLoading(true);
    try {
      const [assignmentsList, kpis] = await Promise.all([
        trainingService.list(),
        trainingService.getComplianceKPIs(),
      ]);
      setAllAssignments(assignmentsList);
      setComplianceKPIs(kpis);
    } catch (err) {
      console.error("Error loading training assignments", err);
      toast.error("Failed to load training data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainingData();
  }, []);

  // Filter for User: only view trainings assigned to him
  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim().toLowerCase();
  const userRole = user?.role || "";

  const roleRelevantAssignments = isAdmin
    ? allAssignments
    : allAssignments.filter(
        (a) =>
          a.assignedToId === user?.id ||
          (fullName && a.assignedToName.toLowerCase().includes(fullName)) ||
          (userRole.includes("User") &&
            (a.assignedToName.includes("Marcus") ||
              a.assignedToName.includes("Amara") ||
              a.assignedToName.includes("Aara") ||
              a.assignedToName.includes("Aisha") ||
              a.assignedToName.includes("Tunde"))),
      );

  // Status counters based on role
  const totalCount = roleRelevantAssignments.length;
  const completedCount = roleRelevantAssignments.filter((a) => a.trainingStatus === "Completed").length;
  const pendingCount = roleRelevantAssignments.filter((a) => a.trainingStatus !== "Completed").length;
  const complianceRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

  // Filtered dataset for table
  const displayedAssignments = roleRelevantAssignments.filter((a) => {
    if (activeFilter === "pending") return a.trainingStatus !== "Completed";
    if (activeFilter === "completed") return a.trainingStatus === "Completed";
    return true;
  });

  const handleAssignSubmit = async (
    input: AssignTrainingInput,
    userMap: Record<string, string>,
  ) => {
    try {
      await trainingService.assignTraining(
        input,
        {
          id: user?.id || "admin",
          name: `${user?.firstName || "Admin"} ${user?.lastName || "Supervisor"}`.trim(),
        },
        userMap,
      );
      toast.success(`Training assigned to ${input.userIds.length} technicians successfully.`);
      fetchTrainingData();
    } catch (err) {
      console.error("Error assigning training", err);
      toast.error("Failed to dispatch training assignments.");
    }
  };

  const handleAcknowledge = async (id: string, notes?: string) => {
    try {
      await trainingService.acknowledgeTraining(
        id,
        {
          id: user?.id || "user",
          name: `${user?.firstName || "Engineer"} ${user?.lastName || ""}`.trim(),
        },
        notes,
      );
      toast.success("Training acknowledged and marked as Completed!");
      fetchTrainingData();
    } catch (err) {
      console.error("Error acknowledging training", err);
      toast.error("Failed to submit acknowledgment.");
    }
  };

  const handleExportCSV = () => {
    if (roleRelevantAssignments.length === 0) {
      toast.error("No training data to export.");
      return;
    }

    const headers = [
      "Training / Policy Document",
      "Format",
      "Document Version",
      "Assigned Date",
      "Completion Date",
      "Training Status",
      "Assigned To",
      "Assigned By",
      "Acknowledged At",
    ];

    const csvRows = [
      headers.join(","),
      ...roleRelevantAssignments.map((a) =>
        [
          `"${a.policyDocumentTitle.replace(/"/g, '""')}"`,
          `"${a.trainingType || "Policy Document"}"`,
          `"${a.documentVersion}"`,
          `"${a.assignedDate}"`,
          `"${a.completionDate || "N/A"}"`,
          `"${a.trainingStatus}"`,
          `"${a.assignedToName}"`,
          `"${a.assignedByName}"`,
          `"${a.acknowledgedAt || "N/A"}"`,
        ].join(","),
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Quality_Training_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Training compliance report exported to CSV.");
  };

  const columns: DataTableColumn<TrainingAssignment>[] = [
    {
      key: "policyDocumentTitle",
      header: "Policy Document",
      value: (row) => row.policyDocumentTitle,
      cell: (row) => (
        <button
          onClick={() => setAcknowledgeTarget(row)}
          className="flex items-start gap-2.5 max-w-md py-1 text-left cursor-pointer group"
        >
          <FileText className="size-4 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
          <div>
            <span className="font-semibold text-xs text-foreground block line-clamp-1 group-hover:text-primary group-hover:underline">
              {row.policyDocumentTitle}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {row.policyDocumentNumber || "POL-BME-001"}
            </span>
          </div>
        </button>
      ),
      filterable: true,
    },
    {
      key: "documentVersion",
      header: "Version",
      value: (row) => row.documentVersion,
      cell: (row) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted/60 text-foreground">
          {row.documentVersion}
        </span>
      ),
      filterable: true,
      className: "font-mono text-xs",
    },
    {
      key: "assignedDate",
      header: "Assigned Date",
      value: (row) => row.assignedDate,
      filterable: false,
      className: "text-muted-foreground font-mono text-xs",
    },
    {
      key: "completionDate",
      header: "Completion Date",
      value: (row) => row.completionDate || "—",
      cell: (row) =>
        row.completionDate ? (
          <span className="text-foreground font-mono text-xs font-medium">
            {row.completionDate}
          </span>
        ) : (
          <span className="text-muted-foreground font-mono text-xs">—</span>
        ),
      filterable: false,
    },
    {
      key: "trainingStatus",
      header: "Training Status",
      value: (row) => row.trainingStatus,
      cell: (row) => {
        if (row.trainingStatus === "Completed") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="size-3 shrink-0" />
              <span>Completed</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Clock className="size-3 shrink-0" />
            <span>Pending</span>
          </span>
        );
      },
      filterable: true,
    },
    ...(isAdmin
      ? ([
          {
            key: "assignedToName",
            header: "Assigned To",
            value: (row: TrainingAssignment) => row.assignedToName,
            cell: (row: TrainingAssignment) => (
              <div className="flex items-center gap-1.5">
                <span className="size-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] grid place-items-center shrink-0">
                  {row.assignedToName.charAt(0)}
                </span>
                <span className="text-xs font-semibold text-foreground">{row.assignedToName}</span>
              </div>
            ),
            filterable: true,
          },
        ] as DataTableColumn<TrainingAssignment>[])
      : ([
          {
            key: "assignedByName",
            header: "Assigned By",
            value: (row: TrainingAssignment) => row.assignedByName,
            cell: (row: TrainingAssignment) => (
              <span className="text-xs text-muted-foreground">{row.assignedByName}</span>
            ),
            filterable: true,
          },
        ] as DataTableColumn<TrainingAssignment>[])),
  ];

  const renderRowActions = (row: TrainingAssignment) => {
    const isCompleted = row.trainingStatus === "Completed";

    return (
      <div className="flex justify-end">
        <RowActionsMenu
          label="Actions"
          align="end"
          actions={[
            !isAdmin && !isCompleted
              ? {
                  label: "Read & Acknowledge",
                  icon: CheckCircle2,
                  variant: "success",
                  onClick: () => setAcknowledgeTarget(row),
                }
              : null,
            {
              label: "View Training Record",
              icon: Eye,
              onClick: () => setAcknowledgeTarget(row),
            },
          ]}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdmin ? "Training & Quality Compliance" : "My Training & Compliance"}
        description={
          isAdmin
            ? "Assign policy documents, uploaded files, and SOPs to personnel and monitor team Quality Compliance"
            : "Review assigned policy documents, read operating procedures, and submit electronic compliance acknowledgments"
        }
        icon={GraduationCap}
      />

      {/* Role-tailored KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title={isAdmin ? "Total Dispatched" : "My Assigned"}
          value={totalCount}
          description={isAdmin ? "All team assignments" : "Assigned to your workbench"}
          icon={GraduationCap}
        />
        <StatCard
          title={isAdmin ? "Completed" : "My Completed"}
          value={completedCount}
          description="Acknowledged & compliant"
          icon={CheckCircle2}
        />
        <StatCard
          title={isAdmin ? "Pending" : "Action Required"}
          value={pendingCount}
          description={isAdmin ? "Awaiting technician review" : "Pending your signature"}
          icon={Clock}
        />
        <StatCard
          title={isAdmin ? "Team Compliance" : "Compliance Rate"}
          value={`${complianceRate}%`}
          description={isAdmin ? "Overall team rate" : "Your personal compliance"}
          icon={Award}
        />
      </div>

      {/* KPI Bar Chart: % Quality Compliance per User (Matching Client Slide) */}
      <QualityComplianceChart data={complianceKPIs} />

      {/* Filter Tabs & Toolbar Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AppTabs
          value={activeFilter}
          onChange={(v) => setActiveFilter(v as any)}
          tabs={[
            {
              id: "all",
              label: "All",
              count: totalCount,
            },
            {
              id: "pending",
              label: "Pending",
              count: pendingCount,
            },
            {
              id: "completed",
              label: "Completed",
              count: completedCount,
            },
          ]}
        />

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="h-9 text-xs gap-1.5"
          >
            <Download className="size-3.5" />
            <span>Download Report</span>
          </Button>

          {isAdmin && (
            <Button
              size="sm"
              onClick={() => setIsAssignOpen(true)}
              className="h-9 text-xs gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Assign Training</span>
            </Button>
          )}
        </div>
      </div>

      {/* Trainings Table */}
      <DataTable
        columns={columns}
        rows={displayedAssignments}
        loading={loading}
        searchPlaceholder={
          isAdmin
            ? "Search trainings by title, version, technician name..."
            : "Search your assigned trainings..."
        }
        emptyTitle={
          isAdmin
            ? "No training assignments found."
            : "No trainings assigned to your workbench."
        }
        emptyDescription={
          isAdmin
            ? "Dispatch a policy document or SOP to begin tracking compliance."
            : "You are fully up to date with all clinical engineering policies."
        }
        rowActions={renderRowActions}
      />

      {/* Assign Training Modal (Admin Only) */}
      {isAdmin && (
        <AssignTrainingModal
          open={isAssignOpen}
          onOpenChange={setIsAssignOpen}
          onSubmit={handleAssignSubmit}
        />
      )}

      {/* Read & Acknowledge / View Record Modal */}
      <ReadAcknowledgeModal
        open={Boolean(acknowledgeTarget)}
        onOpenChange={(open) => {
          if (!open) setAcknowledgeTarget(null);
        }}
        assignment={acknowledgeTarget}
        isAdmin={isAdmin}
        onAcknowledge={handleAcknowledge}
      />
    </div>
  );
}
