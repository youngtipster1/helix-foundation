import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { AppTabs, type AppTabItem } from "@/components/ui/app-tabs";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import { debriefService } from "@/modules/debrief/services/debrief-service";
import type { DebriefJob } from "@/modules/debrief/types";
import { JobsTable } from "@/modules/debrief/components/jobs-table";
import { CreateJobModal } from "@/modules/debrief/components/create-job-modal";
import { JobDetailsModal } from "@/modules/debrief/components/job-details-modal";
import { RescheduleJobModal } from "@/modules/debrief/components/reschedule-job-modal";
import { ReassignJobModal } from "@/modules/debrief/components/reassign-job-modal";
import { Plus, Play, Calendar, CheckCircle2, ListFilter } from "lucide-react";

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

type TabFilter = "all" | "active" | "scheduled" | "completed";

function DebriefJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<DebriefJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<DebriefJob | null>(null);
  const [jobToReschedule, setJobToReschedule] = useState<DebriefJob | null>(null);
  const [jobToReassign, setJobToReassign] = useState<DebriefJob | null>(null);
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

  const tabs: AppTabItem<TabFilter>[] = useMemo(
    () => [
      { id: "all", label: "All Jobs", count: jobs.length, icon: ListFilter },
      { id: "active", label: "Active & In Progress", count: activeCount, icon: Play },
      { id: "scheduled", label: "Scheduled", count: scheduledCount, icon: Calendar },
      { id: "completed", label: "Completed", count: completedCount, icon: CheckCircle2 },
    ],
    [jobs.length, activeCount, scheduledCount, completedCount]
  );

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

  const handleCreateNewJob = () => {
    setJobToEdit(null);
    setCreateModalOpen(true);
  };

  const handleEditJob = (job: DebriefJob) => {
    setJobToEdit(job);
    setCreateModalOpen(true);
  };

  const handleRescheduleJob = (job: DebriefJob) => {
    setJobToReschedule(job);
  };

  const handleReassignJob = (job: DebriefJob) => {
    setJobToReassign(job);
  };

  const handleJobCreated = (newJob: DebriefJob) => {
    setJobs((prev) => [newJob, ...prev]);
  };

  const handleJobUpdated = (updatedJob: DebriefJob) => {
    setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
    if (selectedJob?.id === updatedJob.id) {
      setSelectedJob(updatedJob);
    }
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
            onClick={handleCreateNewJob}
            className="h-9 px-3.5 text-xs font-bold gap-1.5 shadow-sm cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" />
            <span>Create Job</span>
          </Button>
        )}
      </PageHeader>

      {/* 4 Quick Filter Tabs */}
      <div className="border-b border-border pb-3">
        <AppTabs<TabFilter>
          tabs={tabs}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <JobsTable
        jobs={filteredJobs}
        loading={loading}
        isAdmin={isAdmin}
        onOpenJob={handleOpenJob}
        onEditJob={handleEditJob}
        onRescheduleJob={handleRescheduleJob}
        onReassignJob={handleReassignJob}
      />

      {/* Create / Edit Job Modal */}
      {isAdmin && (
        <CreateJobModal
          open={createModalOpen}
          onOpenChange={(isOpen) => {
            setCreateModalOpen(isOpen);
            if (!isOpen) setJobToEdit(null);
          }}
          jobToEdit={jobToEdit}
          onJobCreated={handleJobCreated}
          onJobUpdated={handleJobUpdated}
        />
      )}

      {/* Reschedule Job Modal */}
      {isAdmin && (
        <RescheduleJobModal
          job={jobToReschedule}
          open={Boolean(jobToReschedule)}
          onOpenChange={(isOpen) => {
            if (!isOpen) setJobToReschedule(null);
          }}
          onJobUpdated={handleJobUpdated}
        />
      )}

      {/* Reassign Job Modal */}
      {isAdmin && (
        <ReassignJobModal
          job={jobToReassign}
          open={Boolean(jobToReassign)}
          onOpenChange={(isOpen) => {
            if (!isOpen) setJobToReassign(null);
          }}
          onJobUpdated={handleJobUpdated}
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
