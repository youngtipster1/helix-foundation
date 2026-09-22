import { useState, useMemo } from "react";
import type { DebriefJob } from "../../types";
import type { EngineerAvailability } from "../../mocks/workforce-availability";
import { getJobTypeStyle, type DragJobPayload } from "./schedule-types";
import { cn } from "@/lib/utils";
import { GripVertical, AlertTriangle, GraduationCap, CalendarOff, User } from "lucide-react";

interface ScheduleWeekViewProps {
  currentDate: Date;
  jobs: DebriefJob[];
  availabilities: EngineerAvailability[];
  isAdmin: boolean;
  onSelectJob: (job: DebriefJob) => void;
  onDropJobOnDate: (payload: DragJobPayload, targetDate: string) => void;
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

function formatDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function ScheduleWeekView({
  currentDate,
  jobs,
  availabilities,
  isAdmin,
  onSelectJob,
  onDropJobOnDate,
}: ScheduleWeekViewProps) {
  const weekDays = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const todayKey = formatDateKey(new Date());

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
      console.error("Week drop parse error", err);
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

  return (
    <div className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-border/60">
        {weekDays.map((day) => {
          const dateKey = formatDateKey(day);
          const isToday = dateKey === todayKey;
          const isOver = dragOverDate === dateKey;

          const dayJobs = jobs.filter((j) => {
            if (j.jobStatus === "Completed") return false;
            const jDate = j.jobStartDate || j.startDate || "";
            return jDate === dateKey;
          });

          const dayAvailabilities = availabilities.filter(
            (a) => a.date === dateKey && a.status !== "available"
          );

          return (
            <div
              key={dateKey}
              onDragOver={(e) => handleDragOver(e, dateKey)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, dateKey)}
              className={cn(
                "p-3 flex flex-col justify-between min-h-[350px] transition-colors",
                isToday && "bg-primary/2",
                isOver && "bg-primary/15 ring-2 ring-inset ring-primary"
              )}
            >
              {/* Day Header */}
              <div className="pb-3 border-b border-border/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-muted-foreground uppercase">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div
                    className={cn(
                      "font-mono font-bold text-base inline-block",
                      isToday ? "text-primary" : "text-foreground"
                    )}
                  >
                    {day.getDate()}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      {day.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </div>
                </div>

                {isToday && (
                  <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px]">
                    Today
                  </span>
                )}
              </div>

              {/* Day Body Content */}
              <div className="space-y-2 py-3 flex-1 overflow-y-auto">
                {/* Workforce unavailability blocks */}
                {dayAvailabilities.map((av) => (
                  <div
                    key={av.id}
                    className={cn(
                      "p-2 rounded-lg border text-xs space-y-1 shadow-2xs",
                      av.status === "training"
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200"
                        : "bg-rose-500/15 border-rose-500/40 text-rose-900 dark:text-rose-200"
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      {av.status === "training" ? (
                        <GraduationCap className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      ) : (
                        <CalendarOff className="size-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                      )}
                      <span className="uppercase text-[10px] tracking-wider">
                        {av.status}
                      </span>
                    </div>
                    <div className="font-semibold text-xs leading-tight">
                      {av.personnelName}
                    </div>
                    <p className="text-[11px] leading-tight opacity-90">
                      {av.title}
                    </p>
                  </div>
                ))}

                {/* Scheduled Jobs */}
                {dayJobs.map((job) => {
                  const style = getJobTypeStyle(job.jobType);

                  return (
                    <div
                      key={job.id}
                      draggable={isAdmin}
                      onDragStart={(e) => handleDragStart(e, job)}
                      onClick={() => onSelectJob(job)}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs space-y-1.5 shadow-2xs transition-all select-none group",
                        style.bg,
                        style.border,
                        isAdmin
                          ? "cursor-grab active:cursor-grabbing hover:border-primary/60 hover:shadow-xs"
                          : "cursor-pointer hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1">
                          {isAdmin && (
                            <GripVertical className="size-3 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                          )}
                          <span className="font-mono font-bold text-xs text-primary">
                            {job.jobNumber}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded text-[10px] font-semibold border",
                            style.badgeClass
                          )}
                        >
                          {job.jobType}
                        </span>
                      </div>

                      <div className="font-bold text-foreground text-xs leading-tight line-clamp-1">
                        {job.model}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                        <span className="flex items-center gap-1 truncate max-w-[90px]">
                          <User className="size-3 text-muted-foreground shrink-0" />
                          {job.assignedToName?.split(" ")[0] || "Unassigned"}
                        </span>
                        <span
                          className={cn(
                            "font-bold text-[10px]",
                            job.jobPriority === "High"
                              ? "text-rose-600"
                              : job.jobPriority === "Mid"
                              ? "text-amber-600"
                              : "text-blue-600"
                          )}
                        >
                          {job.jobPriority}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {dayJobs.length === 0 && dayAvailabilities.length === 0 && (
                  <div className="h-24 rounded-lg border border-dashed border-border/50 flex items-center justify-center text-muted-foreground text-[11px]">
                    No jobs scheduled
                  </div>
                )}
              </div>

              {/* Slot footer count */}
              <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                <span>Total Jobs:</span>
                <span className="font-mono font-bold text-foreground">
                  {dayJobs.length}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
