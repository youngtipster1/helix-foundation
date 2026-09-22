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
  Inbox,
  Calendar,
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

function formatMonthDay(d: Date): string {
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  return `${month} ${day}`;
}

function DebriefSchedulePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<DebriefJob[]>([]);
  const [engineers, setEngineers] = useState<Personnel[]>([]);
  const [availabilities, setAvailabilities] = useState<EngineerAvailability[]>([]);
  const [loading, setLoading] = useState(true);

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

  const startDateLabel = formatMonthDay(weekDays[0]);
  const endDateLabel = formatMonthDay(weekDays[6]);
  const yearLabel = weekDays[0].getFullYear();

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

  const utilizationRate = totalWorkdays > 0 ? ((totalDaysWorked / totalWorkdays) * 100).toFixed(0) : "0";

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
            ? "Weekly biomedical engineer dispatch calendar, hospital service assignments, workforce availability, and capacity utilization."
            : "Weekly service calendar: view your scheduled hospital visits and equipment debriefs."
        }
        icon={CalendarRange}
      />

      {/* Top Header Controls with Centered Date Picker */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3.5 rounded-2xl border border-border bg-card shadow-2xs">
        {/* Left Side: Summary Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 text-xs font-semibold text-foreground">
            <span>{engineers.length} Engineers</span>
            <span className="text-muted-foreground">·</span>
            <span>{jobs.length} Active Jobs</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold">
            <span>{utilizationRate}% Utilization</span>
          </div>
        </div>

        {/* Center: Date Picker & Week Stepper */}
        <div className="flex items-center justify-center gap-2 self-center">
          <div className="flex items-center rounded-xl bg-muted/40 p-1 border border-border/50 shadow-2xs">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevWeek}
              aria-label="Previous week"
              className="h-8 w-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hover:bg-background"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCurrentWeek}
              className="h-8 px-3 rounded-lg text-xs font-bold cursor-pointer hover:bg-background flex items-center gap-1.5"
            >
              <Calendar className="size-3.5 text-primary" />
              <span>Week {weekNumber}</span>
              <span className="text-muted-foreground font-normal">
                ({startDateLabel} – {endDateLabel}, {yearLabel})
              </span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextWeek}
              aria-label="Next week"
              className="h-8 w-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hover:bg-background"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Right Side: Unscheduled Queue Toggle for Admin */}
        <div className="flex items-center justify-end gap-2">
          {isAdmin && (
            <Button
              variant={unscheduledOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setUnscheduledOpen((prev) => !prev)}
              className={cn(
                "h-9 text-xs font-bold gap-1.5 cursor-pointer shadow-2xs rounded-xl",
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
      </div>

      {/* Main Board & Optional Unscheduled Queue Tray */}
      <div className="flex flex-col xl:flex-row items-start gap-5">
        <div className="flex-1 w-full overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-xs text-muted-foreground font-semibold">
              Loading service calendar...
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
