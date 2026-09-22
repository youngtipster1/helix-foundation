import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import { debriefService } from "@/modules/debrief/services/debrief-service";
import { JobsTable } from "@/modules/debrief/components/jobs-table";
import { CreateJobModal } from "@/modules/debrief/components/create-job-modal";
import { JobDetailsModal } from "@/modules/debrief/components/job-details-modal";
import { ClipboardList, Plus } from "lucide-react";

export const Route = createFileRoute("/app/debrief/")({
  head: () => ({
    meta: [
      { title: "Jobs Register — Debrief | HEMP" },
      {
        name: "description",
        content: "Central job register and service tracking table.",
      },
    ],
  }),
  component: DebriefJobsPage,
});

function DebriefJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<DebriefJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<DebriefJob | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const isAdmin =
    Boolean(user?.isSuperAdmin) ||
    user?.role === "Super Admin" ||
    isModuleAdmin(user, "debrief") ||
    (user?.role || "").toLowerCase().includes("admin");

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await debriefService.list(user);
      setJobs(data);
    } catch (err) {
      console.error("Failed to load jobs", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleOpenJob = (job: DebriefJob) => {
    setSelectedJob(job);
    setDetailsModalOpen(true);
  };

  const handleJobCreated = (newJob: DebriefJob) => {
    setJobs((prev) => [newJob, ...prev]);
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader
        eyebrow="Debrief Module"
        title="Jobs Register"
        subtitle={
          isAdmin
            ? "Central organization job management table, biomedical equipment assignments, and post-service records."
            : "Your assigned biomedical service jobs and active task assignments."
        }
        icon={ClipboardList}
      >
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="h-9 px-3.5 text-xs font-bold gap-1.5 shadow-sm cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" />
            <span>Create Job</span>
          </Button>
        )}
      </PageHeader>

      <JobsTable
        jobs={jobs}
        loading={loading}
        isAdmin={isAdmin}
        onOpenJob={handleOpenJob}
      />

      {/* Admin 3-Step Create Job Modal */}
      {isAdmin && (
        <CreateJobModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onJobCreated={handleJobCreated}
        />
      )}

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        isAdmin={isAdmin}
      />
    </div>
  );
}
