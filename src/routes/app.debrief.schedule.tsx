import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import { debriefService } from "@/modules/debrief/services/debrief-service";
import { scheduleService } from "@/modules/debrief/services/schedule-service";
import type { DebriefJob } from "@/modules/debrief/types";
import type { Personnel } from "@/modules/settings/types";
import type { EngineerAvailability } from "@/modules/debrief/mocks/workforce-availability";
import {
  ScheduleCalendarHeader,
} from "@/modules/debrief/components/schedule/schedule-calendar-header";
import {
  ScheduleTimelineView,
} from "@/modules/debrief/components/schedule/schedule-timeline-view";
import {
  ScheduleMonthView,
} from "@/modules/debrief/components/schedule/schedule-month-view";
import {
  ScheduleWeekView,
} from "@/modules/debrief/components/schedule/schedule-week-view";
import {
  UnscheduledJobsTray,
} from "@/modules/debrief/components/schedule/unscheduled-jobs-tray";
import {
  ScheduleConflictModal,
} from "@/modules/debrief/components/schedule/schedule-conflict-modal";
import {
  ScheduleDetailDrawer,
} from "@/modules/debrief/components/schedule/schedule-detail-drawer";
import type {
  ScheduleViewMode,
  SchedulingConflict,
  DragJobPayload,
} from "@/modules/debrief/components/schedule/schedule-types";
import { CalendarRange } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/debrief/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule Management — Debrief | HEMP" },
      {
        name: "description",
        content:
          "Admin service calendar planning, engineer dispatch scheduling, drag-and-drop rescheduling, and conflict resolution.",
      },
    ],
  }),
  component: DebriefSchedulePage,
});

function DebriefSchedulePage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<DebriefJob[]>([]);
  const [engineers, setEngineers] = useState<Personnel[]>([]);
  const [availabilities, setAvailabilities] = useState<EngineerAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar State
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 14)); // Set to mid-September 2026 for demo consistency
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("timeline");
  const [unscheduledOpen, setUnscheduledOpen] = useState(true);

  // Modals & Drawers
  const [selectedJob, setSelectedJob] = useState<DebriefJob | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeConflict, setActiveConflict] = useState<SchedulingConflict | null>(null);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);

  const isAdmin =
    Boolean(user?.isSuperAdmin) ||
    user?.role === "Super Admin" ||
    isModuleAdmin(user, "debrief") ||
    (user?.role || "").toLowerCase().includes("admin");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [jobsData, engineersData] = await Promise.all([
        debriefService.list(user),
        scheduleService.getBiomedicalEngineers(),
      ]);
      setJobs(jobsData);
      setEngineers(engineersData);
      setAvailabilities(scheduleService.getAvailability());
    } catch (err) {
      console.error("Failed to load schedule data", err);
      toast.error("Failed to load scheduling calendar");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Date Navigation Handlers
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === "month") {
        next.setMonth(next.getMonth() - 1);
      } else {
        next.setDate(next.getDate() - 7);
      }
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === "month") {
        next.setMonth(next.getMonth() + 1);
      } else {
        next.setDate(next.getDate() + 7);
      }
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Backlog / Unscheduled Jobs: jobs with open/unassigned state or missing date
  const unscheduledJobs = useMemo(() => {
    return jobs.filter(
      (j) =>
        j.jobStatus !== "Completed" &&
        (!j.jobStartDate || j.jobStartDate === "—" || j.jobStatus === "Open" || !j.assignedToId)
    );
  }, [jobs]);

  // Click on job -> open Detail Drawer
  const handleSelectJob = (job: DebriefJob) => {
    setSelectedJob(job);
    setDrawerOpen(true);
  };

  // Job update handler
  const handleJobUpdated = (updated: DebriefJob) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  };

  // Execute Drag & Drop on Engineer Timeline
  const handleDropOnTimeline = async (
    payload: DragJobPayload,
    targetEngineerId: string,
    targetEngineerName: string,
    targetDate: string
  ) => {
    if (!isAdmin) return;
    const job = jobs.find((j) => j.id === payload.jobId);
    if (!job) return;

    // Check conflict
    const conflict = await scheduleService.checkConflict(
      job,
      targetEngineerId,
      targetEngineerName,
      targetDate
    );

    if (conflict.hasConflict) {
      setActiveConflict(conflict);
      setConflictModalOpen(true);
      return;
    }

    // Direct Apply
    try {
      const updated = await scheduleService.reassignJob(
        job.id,
        targetEngineerId,
        targetEngineerName,
        targetDate
      );
      if (updated) {
        toast.success(
          `Scheduled ${job.jobNumber} for ${targetEngineerName} on ${targetDate}`
        );
        handleJobUpdated(updated);
      }
    } catch {
      toast.error("Failed to update schedule");
    }
  };

  // Execute Drag & Drop on Month or Week View
  const handleDropOnDate = async (payload: DragJobPayload, targetDate: string) => {
    if (!isAdmin) return;
    const job = jobs.find((j) => j.id === payload.jobId);
    if (!job) return;

    const engineerId = job.assignedToId || engineers[0]?.id || "per_001";
    const engineerName =
      job.assignedToName ||
      `${engineers[0]?.firstName || "John"} ${engineers[0]?.lastName || "Doe"}`;

    const conflict = await scheduleService.checkConflict(
      job,
      engineerId,
      engineerName,
      targetDate
    );

    if (conflict.hasConflict) {
      setActiveConflict(conflict);
      setConflictModalOpen(true);
      return;
    }

    try {
      const updated = await scheduleService.rescheduleJob(job.id, targetDate);
      if (updated) {
        toast.success(`Rescheduled ${job.jobNumber} to ${targetDate}`);
        handleJobUpdated(updated);
      }
    } catch {
      toast.error("Failed to reschedule job");
    }
  };

  // Conflict Resolution Confirmations
  const handleConfirmOverride = async (conflict: SchedulingConflict) => {
    try {
      const updated = await scheduleService.reassignJob(
        conflict.job.id,
        conflict.engineerId,
        conflict.engineerName,
        conflict.targetDate
      );
      if (updated) {
        toast.warning(
          `Override applied: ${conflict.job.jobNumber} scheduled for ${conflict.engineerName} on ${conflict.targetDate}`
        );
        handleJobUpdated(updated);
      }
    } catch {
      toast.error("Failed to apply override");
    }
  };

  const handleReassignConflict = async (
    conflict: SchedulingConflict,
    newEngineerId: string,
    newEngineerName: string
  ) => {
    try {
      const updated = await scheduleService.reassignJob(
        conflict.job.id,
        newEngineerId,
        newEngineerName,
        conflict.targetDate
      );
      if (updated) {
        toast.success(
          `Reassigned ${conflict.job.jobNumber} to ${newEngineerName} on ${conflict.targetDate}`
        );
        handleJobUpdated(updated);
      }
    } catch {
      toast.error("Failed to reassign engineer");
    }
  };

  const handleRescheduleDateConflict = async (
    conflict: SchedulingConflict,
    newDate: string
  ) => {
    try {
      const updated = await scheduleService.reassignJob(
        conflict.job.id,
        conflict.engineerId,
        conflict.engineerName,
        newDate
      );
      if (updated) {
        toast.success(
          `Rescheduled ${conflict.job.jobNumber} to ${newDate} for ${conflict.engineerName}`
        );
        handleJobUpdated(updated);
      }
    } catch {
      toast.error("Failed to reschedule job date");
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <PageHeader
        eyebrow="Debrief Module"
        title="Schedule Management"
        subtitle={
          isAdmin
            ? "Admin service calendar planning: assign biomedical engineers, drag-and-drop reschedule future jobs, inspect workforce availability, and resolve conflicts."
            : "Service calendar schedule: view your upcoming assigned service jobs and team dispatch commitments."
        }
        icon={CalendarRange}
      />

      {/* Calendar Controls & Color Legend */}
      <ScheduleCalendarHeader
        currentDate={currentDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        unscheduledCount={unscheduledJobs.length}
        unscheduledOpen={unscheduledOpen}
        onToggleUnscheduled={() => setUnscheduledOpen((prev) => !prev)}
        isAdmin={isAdmin}
      />

      {/* Main Interactive Canvas & Optional Unscheduled Queue Tray */}
      <div className="flex flex-col xl:flex-row items-start gap-5">
        {/* Calendar Grid Container */}
        <div className="flex-1 w-full overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-xs text-muted-foreground font-semibold">
              Loading service calendar and workforce schedules...
            </div>
          ) : viewMode === "timeline" ? (
            <ScheduleTimelineView
              currentDate={currentDate}
              engineers={engineers}
              jobs={jobs}
              availabilities={availabilities}
              isAdmin={isAdmin}
              onSelectJob={handleSelectJob}
              onDropJob={handleDropOnTimeline}
            />
          ) : viewMode === "week" ? (
            <ScheduleWeekView
              currentDate={currentDate}
              jobs={jobs}
              availabilities={availabilities}
              isAdmin={isAdmin}
              onSelectJob={handleSelectJob}
              onDropJobOnDate={handleDropOnDate}
            />
          ) : (
            <ScheduleMonthView
              currentDate={currentDate}
              jobs={jobs}
              availabilities={availabilities}
              isAdmin={isAdmin}
              onSelectJob={handleSelectJob}
              onDropJobOnDate={handleDropOnDate}
            />
          )}
        </div>

        {/* Unscheduled Backlog Sidebar (Admin only) */}
        {isAdmin && unscheduledOpen && (
          <UnscheduledJobsTray
            jobs={unscheduledJobs}
            open={unscheduledOpen}
            onClose={() => setUnscheduledOpen(false)}
            onSelectJob={handleSelectJob}
          />
        )}
      </div>

      {/* Conflict Resolution Modal */}
      <ScheduleConflictModal
        conflict={activeConflict}
        open={conflictModalOpen}
        onOpenChange={setConflictModalOpen}
        onConfirmOverride={handleConfirmOverride}
        onReassign={handleReassignConflict}
        onRescheduleDate={handleRescheduleDateConflict}
      />

      {/* Job Schedule Detail & Quick Adjust Drawer */}
      <ScheduleDetailDrawer
        job={selectedJob}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        isAdmin={isAdmin}
        onJobUpdated={handleJobUpdated}
        onRequestScheduleMove={(job, engId, engName, date) => {
          handleDropOnTimeline({ jobId: job.id }, engId, engName, date);
        }}
      />
    </div>
  );
}
