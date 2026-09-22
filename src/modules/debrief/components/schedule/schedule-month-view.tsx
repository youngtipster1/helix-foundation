import { useState, useMemo } from "react";
import type { DebriefJob } from "../../types";
import type { EngineerAvailability } from "../../mocks/workforce-availability";
import { getJobTypeStyle, type DragJobPayload } from "./schedule-types";
import { cn } from "@/lib/utils";
import { GripVertical, AlertTriangle, GraduationCap, CalendarOff } from "lucide-react";

interface ScheduleMonthViewProps {
  currentDate: Date;
  jobs: DebriefJob[];
  availabilities: EngineerAvailability[];
  isAdmin: boolean;
  onSelectJob: (job: DebriefJob) => void;
  onDropJobOnDate: (payload: DragJobPayload, targetDate: string) => void;
}

interface CalendarDay {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

function getMonthCalendarDays(centerDate: Date): CalendarDay[] {
  const year = centerDate.getFullYear();
  const month = centerDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Determine starting weekday (Monday = 1, Sunday = 0 -> adjust to Monday start)
  const startDayOfWeek = firstDayOfMonth.getDay();
  const leadingDaysCount = (startDayOfWeek + 6) % 7;

  const todayStr = new Date().toISOString().split("T")[0];
  const days: CalendarDay[] = [];

  // Previous month filler days
  for (let i = leadingDaysCount; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    const dateKey = d.toISOString().split("T")[0];
    days.push({
      date: d,
      dateKey,
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      isToday: dateKey === todayStr,
    });
  }

  // Current month days
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const d = new Date(year, month, i);
    const dateKey = d.toISOString().split("T")[0];
    days.push({
      date: d,
      dateKey,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: dateKey === todayStr,
    });
  }

  // Trailing next month filler days to complete grid of 35 or 42
  const totalSlots = days.length <= 35 ? 35 : 42;
  const trailingDaysCount = totalSlots - days.length;
  for (let i = 1; i <= trailingDaysCount; i++) {
    const d = new Date(year, month + 1, i);
    const dateKey = d.toISOString().split("T")[0];
    days.push({
      date: d,
      dateKey,
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      isToday: dateKey === todayStr,
    });
  }

  return days;
}

export function ScheduleMonthView({
  currentDate,
  jobs,
  availabilities,
  isAdmin,
  onSelectJob,
  onDropJobOnDate,
}: ScheduleMonthViewProps) {
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const calendarDays = useMemo(
    () => getMonthCalendarDays(currentDate),
    [currentDate]
  );

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverDate !== dateKey) {
      setDragOverDate(dateKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, dateKey: string) => {
    if (!isAdmin) return;
    e.preventDefault();
    setDragOverDate(null);
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const payload: DragJobPayload = JSON.parse(dataStr);
      onDropJobOnDate(payload, dateKey);
    } catch (err) {
      console.error("Month drop parse error", err);
    }
  };

  const handleDragStart = (e: React.DragEvent, job: DebriefJob) => {
    if (!isAdmin) return;
    const payload: DragJobPayload = {
      jobId: job.id,
      sourceEngineerId: job.assignedToId,
      sourceDate: job.jobStartDate || job.startDate,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  };

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
      {/* Day of Week Header */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-center text-xs font-bold text-muted-foreground">
        {dayNames.map((name) => (
          <div key={name} className="py-2.5 px-1 uppercase tracking-wider text-[11px]">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar Month Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-border/60">
        {calendarDays.map((day) => {
          const isOver = dragOverDate === day.dateKey;

          // Jobs scheduled on this day
          const dayJobs = jobs.filter((j) => {
            if (j.jobStatus === "Completed") return false;
            const jDate = j.jobStartDate || j.startDate || "";
            return jDate === day.dateKey;
          });

          // Availability records for this day
          const dayAvailabilities = availabilities.filter(
            (a) => a.date === day.dateKey && a.status !== "available"
          );

          return (
            <div
              key={day.dateKey}
              onDragOver={(e) => handleDragOver(e, day.dateKey)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day.dateKey)}
              className={cn(
                "min-h-[120px] p-2 flex flex-col justify-between transition-colors",
                !day.isCurrentMonth && "bg-muted/15 opacity-60",
                day.isToday && "bg-primary/5",
                isOver && "bg-primary/15 ring-2 ring-inset ring-primary"
              )}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between pb-1">
                <span
                  className={cn(
                    "text-xs font-mono font-bold size-6 rounded-full flex items-center justify-center",
                    day.isToday
                      ? "bg-primary text-primary-foreground font-bold"
                      : day.isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {day.dayNumber}
                </span>

                {dayJobs.length > 0 && (
                  <span className="text-[10px] font-bold text-muted-foreground font-mono">
                    {dayJobs.length} job{dayJobs.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              {/* Day Items: Availability notices & Job Cards */}
              <div className="space-y-1 flex-1 overflow-y-auto max-h-[140px] pr-0.5">
                {/* Workforce unavailability badge */}
                {dayAvailabilities.map((av) => (
                  <div
                    key={av.id}
                    className={cn(
                      "p-1 rounded text-[10px] font-semibold border flex items-center gap-1 truncate",
                      av.status === "training"
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200"
                        : "bg-rose-500/15 border-rose-500/40 text-rose-900 dark:text-rose-200"
                    )}
                  >
                    {av.status === "training" ? (
                      <GraduationCap className="size-2.5 shrink-0" />
                    ) : (
                      <CalendarOff className="size-2.5 shrink-0" />
                    )}
                    <span className="truncate">{av.personnelName} ({av.status})</span>
                  </div>
                ))}

                {/* Job Cards */}
                {dayJobs.map((job) => {
                  const style = getJobTypeStyle(job.jobType);

                  return (
                    <div
                      key={job.id}
                      draggable={isAdmin}
                      onDragStart={(e) => handleDragStart(e, job)}
                      onClick={() => onSelectJob(job)}
                      className={cn(
                        "p-1.5 rounded-md border text-[11px] space-y-0.5 shadow-2xs transition-all select-none group",
                        style.bg,
                        style.border,
                        isAdmin
                          ? "cursor-grab active:cursor-grabbing hover:border-primary/60 hover:shadow-xs"
                          : "cursor-pointer hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 truncate">
                          {isAdmin && (
                            <GripVertical className="size-2.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                          )}
                          <span className="font-mono font-bold text-[10px] text-primary truncate">
                            {job.jobNumber}
                          </span>
                        </div>
                        <span className={cn("size-2 rounded-full shrink-0", style.dotColor)} />
                      </div>

                      <div className="font-semibold text-foreground text-[10px] truncate leading-tight">
                        {job.model}
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-0.5">
                        <span className="truncate max-w-[70px]">
                          {job.assignedToName?.split(" ")[0] || "Unassigned"}
                        </span>
                        <span className="font-mono font-bold">
                          {job.jobPriority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Drag over target indicator */}
              {isOver && (
                <div className="text-[10px] font-bold text-primary text-center py-1 bg-primary/10 rounded mt-1">
                  Drop to Reschedule
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
