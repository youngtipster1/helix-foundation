import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import { debriefService } from "@/modules/debrief/services/debrief-service";
import type { DebriefJob } from "@/modules/debrief/types";
import { JobsTable } from "@/modules/debrief/components/jobs-table";
import { CreateJobModal } from "@/modules/debrief/components/create-job-modal";
import { JobDetailsModal } from "@/modules/debrief/components/job-details-modal";
import { ClipboardList, Plus, Play, Calendar, CheckCircle2, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [activeTab, setActiveTab] = useState<"all" | "active" | "scheduled" | "completed">("all");
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

  const activeCount = useMemo(() => {
    return jobs.filter((j) => j.jobStatus === "In Progress" || j.jobStatus === "On Hold" || j.stage === "traveling" || j.stage === "working").length;
  }, [jobs]);

  const scheduledCount = useMemo(() => {
    return jobs.filter((j) => (j.jobStatus === "Open" || j.stage === "assigned") && !j.labour?.travelStartTime && j.jobStatus !== "In Progress" && j.jobStatus !== "On Hold").length;
  }, [jobs]);

  const completedCount = useMemo(() => {
    return jobs.filter((j) => j.jobStatus === "Completed" || j.stage === "completed").length;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (activeTab === "active") {
      return jobs.filter((j) => j.jobStatus === "In Progress" || j.jobStatus === "On Hold" || j.stage === "traveling" || j.stage === "working");
    }
    if (activeTab === "scheduled") {
      return jobs.filter((j) => (j.jobStatus === "Open" || j.stage === "assigned") && !j.labour?.travelStartTime && j.jobStatus !== "In Progress" && j.jobStatus !== "On Hold");
    }
    if (activeTab === "completed") {
      return jobs.filter((j) => j.jobStatus === "Completed" || j.stage === "completed");
    }
    return jobs;
  }, [jobs, activeTab]);

  const handleOpenJob = (job: DebriefJob) => {
    setSelectedJob(job);
    setDetailsModalOpen(true);
  };

  const handleJobCreated = (newJob: DebriefJob) => {
    setJobs((prev) => [newJob, ...prev]);
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <PageHeader
        title="Jobs Register"
        subtitle={
          isAdmin
            ? "Central organization job management table, biomedical equipment assignments, live cost rollups, and post-service records."
            : "Your assigned biomedical service jobs and active task assignments."
        }
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

      {/* 4 Quick Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer border flex items-center gap-2",
            activeTab === "all"
              ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
              : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
          )}
        >
          <ListFilter className="size-3.5" />
          <span>All Jobs</span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-full text-xs font-bold leading-none",
              activeTab === "all" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {jobs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={cn(
            "px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer border flex items-center gap-2",
            activeTab === "active"
              ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
              : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
          )}
        >
          <Play className="size-3.5" />
          <span>Active &amp; In Progress</span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-full text-xs font-bold leading-none",
              activeTab === "active" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("scheduled")}
          className={cn(
            "px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer border flex items-center gap-2",
            activeTab === "scheduled"
              ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
              : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
          )}
        >
          <Calendar className="size-3.5" />
          <span>Scheduled</span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-full text-xs font-bold leading-none",
              activeTab === "scheduled" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {scheduledCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          className={cn(
            "px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer border flex items-center gap-2",
            activeTab === "completed"
              ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
              : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
          )}
        >
          <CheckCircle2 className="size-3.5" />
          <span>Completed</span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-full text-xs font-bold leading-none",
              activeTab === "completed" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {completedCount}
          </span>
        </button>
      </div>

      <JobsTable
        jobs={filteredJobs}
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
