import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import { debriefService } from "@/modules/debrief/services/debrief-service";
import { scheduleService } from "@/modules/debrief/services/schedule-service";
import type { DebriefJob } from "@/modules/debrief/types";
import type { Personnel } from "@/modules/settings/types";
import type { EngineerAvailability } from "@/modules/debrief/mocks/workforce-availability";
import {
  ScheduleTimelineView,
} from "@/modules/debrief/components/schedule/schedule-timeline-view";
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
  SchedulingConflict,
  DragJobPayload,
} from "@/modules/debrief/components/schedule/schedule-types";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Wrench,
  Inbox,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/debrief/schedule")({
  head: () => ({
    meta: [
      { title: "Service Calendar — Debrief | HEMP" },
      {
        name: "description",
        content:
          "Admin service calendar planning, engineer dispatch scheduling, drag-and-drop rescheduling, and workload utilization.",
      },
    ],
  }),
  component: DebriefSchedulePage,
});

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekDates(centerDate: Date): Date[] {
  const current = new Date(centerDate);
  const dayOfWeek = current.getDay();
  const diff = current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    days.push(nextDay);
  }
  return days;
}

function formatDisplayDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function DebriefSchedulePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<DebriefJob[]>([]);
  const [engineers, setEngineers] = useState<Personnel[]>([]);
  const [availabilities, setAvailabilities] = useState<EngineerAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  // Set default calendar to mid-February 2026 (matching Slide 18: Week 7, 16/02/2026) or September 2026
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 14));
  const [unscheduledOpen, setUnscheduledOpen] = useState(false);

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
      toast.error("Failed to load service calendar");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Week Dates and Metrics
  const weekDays = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const weekNumber = useMemo(() => getWeekNumber(currentDate), [currentDate]);

  const startDateLabel = formatDisplayDate(weekDays[0]);
  const endDateLabel = formatDisplayDate(weekDays[6]);

  const totalWorkdays = engineers.length * 5;

  const totalDaysWorked = useMemo(() => {
    const weekDateKeys = new Set(weekDays.slice(0, 5).map((d) => d.toISOString().split("T")[0]));
    let count = 0;
    engineers.forEach((eng) => {
      const engFullName = `${eng.firstName} ${eng.lastName}`.trim().toLowerCase();
      const engFirstName = eng.firstName.toLowerCase();

      const workedDays = new Set<string>();
      jobs.forEach((j) => {
        if (j.jobStatus === "Completed") return;
        const jDate = j.jobStartDate || j.startDate || "";
        if (!weekDateKeys.has(jDate)) return;

        const matchId = j.assignedToId === eng.id;
        const matchName =
          j.assignedToName &&
          (j.assignedToName.toLowerCase().includes(engFullName) ||
            j.assignedToName.toLowerCase().includes(engFirstName));

        if (matchId || matchName) {
          workedDays.add(jDate);
        }
      });
      count += workedDays.size;
    });
    return count;
  }, [engineers, jobs, weekDays]);

  const utilizationRate = totalWorkdays > 0 ? ((totalDaysWorked / totalWorkdays) * 100).toFixed(1) : "0.0";

  // Navigation Handlers
  const handlePrevWeek = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleCurrentWeek = () => {
    setCurrentDate(new Date(2026, 8, 14));
  };

  // Backlog / Unscheduled Jobs
  const unscheduledJobs = useMemo(() => {
    return jobs.filter(
      (j) =>
        j.jobStatus !== "Completed" &&
        (!j.jobStartDate || j.jobStartDate === "—" || j.jobStatus === "Open" || !j.assignedToId)
    );
  }, [jobs]);

  const handleSelectJob = (job: DebriefJob) => {
    setSelectedJob(job);
    setDrawerOpen(true);
  };

  const handleJobUpdated = (updated: DebriefJob) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  };

  // Drag & Drop Handler
  const handleDropOnTimeline = async (
    payload: DragJobPayload,
    targetEngineerId: string,
    targetEngineerName: string,
    targetDate: string
  ) => {
    if (!isAdmin) return;
    const job = jobs.find((j) => j.id === payload.jobId);
    if (!job) return;

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

    try {
      const updated = await scheduleService.reassignJob(
        job.id,
        targetEngineerId,
        targetEngineerName,
        targetDate
      );
      if (updated) {
        toast.success(
          `Assigned ${job.jobNumber} to ${targetEngineerName} on ${targetDate}`
        );
        handleJobUpdated(updated);
      }
    } catch {
      toast.error("Failed to update schedule");
    }
  };

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
        title="Service Calendar"
        subtitle={
          isAdmin
            ? "Admin service planning calendar: assign biomedical engineers, schedule week dispatches, inspect workforce availability, and manage workload utilization."
            : "Service calendar: view your upcoming weekly assigned service dispatches."
        }
        icon={CalendarRange}
      />

      {/* Module Navigation Tabs — Designed identical to My Work screen */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: Job List */}
          <button
            type="button"
            onClick={() => navigate({ to: "/app/debrief" })}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer border flex items-center gap-2 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
          >
            <ClipboardList className="size-3.5" />
            <span>Job List</span>
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold leading-none bg-muted text-muted-foreground">
              {jobs.length}
            </span>
          </button>

          {/* Tab 2: Service Calendar (Active) */}
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer border flex items-center gap-2 bg-primary text-primary-foreground border-primary shadow-xs"
          >
            <CalendarRange className="size-3.5" />
            <span>Service Calendar</span>
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold leading-none bg-primary-foreground/20 text-primary-foreground">
              Week {weekNumber}
            </span>
          </button>

          {/* Tab 3: My Work */}
          <button
            type="button"
            onClick={() => navigate({ to: "/app/debrief/my-work" })}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer border flex items-center gap-2 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
          >
            <Wrench className="size-3.5" />
            <span>My Work</span>
          </button>
        </div>

        {/* Right side: Unscheduled Queue Toggle for Admin */}
        {isAdmin && (
          <Button
            variant={unscheduledOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setUnscheduledOpen((prev) => !prev)}
            className={cn(
              "h-9 text-xs font-bold gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto",
              unscheduledOpen
                ? "bg-primary text-primary-foreground"
                : "border-border text-foreground hover:bg-muted"
            )}
          >
            <Inbox className="size-3.5" />
            <span>Unscheduled Queue</span>
            {unscheduledJobs.length > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none",
                  unscheduledOpen
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {unscheduledJobs.length}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Week Timeline Navigation & Workload Metrics Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-2xs">
        {/* Week Stepper */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevWeek}
              aria-label="Previous week"
              className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCurrentWeek}
              className="h-8 px-3 text-xs font-bold cursor-pointer hover:bg-muted"
            >
              Current Week
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextWeek}
              aria-label="Next week"
              className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div>
            <h3 className="font-mono font-bold text-sm sm:text-base text-foreground">
              WEEK {weekNumber} · {startDateLabel} – {endDateLabel}
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Biomedical Engineering Service Timeline
            </span>
          </div>
        </div>

        {/* Utilization & Workdays Stats (Slide 18) */}
        <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-muted/40 border border-border/60">
            <span className="text-muted-foreground text-[11px] block">Total Workdays:</span>
            <span className="font-mono font-bold text-foreground text-sm">
              {totalWorkdays}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-muted/40 border border-border/60">
            <span className="text-muted-foreground text-[11px] block">Days Worked:</span>
            <span className="font-mono font-bold text-primary text-sm">
              {totalDaysWorked}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <span className="text-[11px] block font-semibold">Utilization Rate:</span>
            <span className="font-mono font-black text-sm">
              {utilizationRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Week Timeline Grid */}
      <div className="flex flex-col xl:flex-row items-start gap-5">
        <div className="flex-1 w-full overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-xs text-muted-foreground font-semibold">
              Loading service calendar and engineer schedules...
            </div>
          ) : (
            <ScheduleTimelineView
              currentDate={currentDate}
              weekNumber={weekNumber}
              engineers={engineers}
              jobs={jobs}
              availabilities={availabilities}
              isAdmin={isAdmin}
              onSelectJob={handleSelectJob}
              onDropJob={handleDropOnTimeline}
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
