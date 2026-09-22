import { useState, useMemo } from "react";
import type { DebriefJob } from "../../types";
import type { Personnel } from "@/modules/settings/types";
import type { EngineerAvailability } from "../../mocks/workforce-availability";
import {
  getJobTypeStyle,
  type DragJobPayload,
} from "./schedule-types";
import { cn } from "@/lib/utils";
import {
  Wrench,
  GraduationCap,
  CalendarOff,
  AlertTriangle,
  GripVertical,
  Plus,
  User,
  ShieldAlert,
} from "lucide-react";

interface ScheduleTimelineViewProps {
  currentDate: Date;
  engineers: Personnel[];
  jobs: DebriefJob[];
  availabilities: EngineerAvailability[];
  isAdmin: boolean;
  onSelectJob: (job: DebriefJob) => void;
  onDropJob: (
    payload: DragJobPayload,
    targetEngineerId: string,
    targetEngineerName: string,
    targetDate: string
  ) => void;
}

function getWeekDates(centerDate: Date): Date[] {
  const current = new Date(centerDate);
  const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday...
  // Align to Monday
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

export function ScheduleTimelineView({
  currentDate,
  engineers,
  jobs,
  availabilities,
  isAdmin,
  onSelectJob,
  onDropJob,
}: ScheduleTimelineViewProps) {
  const weekDays = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const todayKey = formatDateKey(new Date());

  const handleDragOver = (e: React.DragEvent, key: string) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverKey !== key) {
      setDragOverKey(key);
    }
  };

  const handleDragLeave = () => {
    setDragOverKey(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    engineer: Personnel,
    dateStr: string
  ) => {
    if (!isAdmin) return;
    e.preventDefault();
    setDragOverKey(null);
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const payload: DragJobPayload = JSON.parse(dataStr);
      const engineerName = `${engineer.firstName} ${engineer.lastName}`.trim();
      onDropJob(payload, engineer.id, engineerName, dateStr);
    } catch (err) {
      console.error("Drop parsing error", err);
    }
  };

  const handleDragStart = (
    e: React.DragEvent,
    job: DebriefJob,
    engineerId: string
  ) => {
    if (!isAdmin) return;
    const payload: DragJobPayload = {
      jobId: job.id,
      sourceEngineerId: engineerId,
      sourceDate: job.jobStartDate || job.startDate,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs min-w-[900px]">
          {/* Header Row: Days of the Week */}
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="py-3 px-4 text-left font-bold text-muted-foreground w-64 border-r border-border/60">
                Biomedical Engineer
              </th>
              {weekDays.map((day) => {
                const dateKey = formatDateKey(day);
                const isToday = dateKey === todayKey;
                return (
                  <th
                    key={dateKey}
                    className={cn(
                      "py-3 px-3 text-center border-r border-border/40 last:border-r-0 min-w-[125px]",
                      isToday && "bg-primary/5"
                    )}
                  >
                    <div className="text-[11px] font-medium text-muted-foreground uppercase">
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div
                      className={cn(
                        "font-mono font-bold text-sm inline-block px-2 py-0.5 rounded-full mt-0.5",
                        isToday
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-foreground"
                      )}
                    >
                      {day.getDate()}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body Rows: One Row Per Engineer */}
          <tbody className="divide-y divide-border/60">
            {engineers.map((engineer) => {
              const engFullName = `${engineer.firstName} ${engineer.lastName}`.trim().toLowerCase();
              const engFirstName = engineer.firstName.toLowerCase();

              // Get all jobs for this engineer
              const engineerJobs = jobs.filter((j) => {
                if (j.jobStatus === "Completed") return false;
                const matchId = j.assignedToId === engineer.id;
                const matchName =
                  j.assignedToName &&
                  (j.assignedToName.toLowerCase().includes(engFullName) ||
                    j.assignedToName.toLowerCase().includes(engFirstName));
                return matchId || matchName;
              });

              return (
                <tr key={engineer.id} className="hover:bg-muted/10 transition-colors">
                  {/* Engineer Info Column */}
                  <td className="py-3 px-4 border-r border-border/60 bg-muted/15 align-top">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                        {engineer.firstName[0]}
                        {engineer.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-foreground text-xs leading-tight truncate">
                          {engineer.firstName} {engineer.lastName}
                        </h4>
                        <span className="text-[11px] text-muted-foreground truncate block">
                          {engineer.jobTitle}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground font-medium">
                          <span className="px-1.5 py-0.2 rounded bg-muted border border-border/60">
                            {engineerJobs.length} active job{engineerJobs.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Day Slots */}
                  {weekDays.map((day) => {
                    const dateKey = formatDateKey(day);
                    const cellKey = `${engineer.id}_${dateKey}`;
                    const isOver = dragOverKey === cellKey;
                    const isToday = dateKey === todayKey;

                    // 1. Check if engineer has workforce availability record
                    const avail = availabilities.find(
                      (a) =>
                        (a.personnelId === engineer.id ||
                          a.personnelName.toLowerCase() === engFullName) &&
                        a.date === dateKey
                    );

                    // 2. Check jobs scheduled on this date
                    const dayJobs = engineerJobs.filter((j) => {
                      const jDate = j.jobStartDate || j.startDate || "";
                      return jDate === dateKey;
                    });

                    return (
                      <td
                        key={dateKey}
                        onDragOver={(e) => handleDragOver(e, cellKey)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, engineer, dateKey)}
                        className={cn(
                          "py-2 px-2 border-r border-border/40 last:border-r-0 align-top transition-colors min-h-[90px] h-[100px]",
                          isToday && "bg-primary/2",
                          isOver && "bg-primary/15 ring-2 ring-inset ring-primary"
                        )}
                      >
                        <div className="space-y-1.5 min-h-full">
                          {/* Workforce Availability Badge (Training / Leave / Off) */}
                          {avail && avail.status !== "available" && (
                            <div
                              className={cn(
                                "p-1.5 rounded-lg border text-[11px] space-y-0.5 shadow-2xs",
                                avail.status === "training"
                                  ? "bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200"
                                  : avail.status === "leave"
                                  ? "bg-rose-500/15 border-rose-500/40 text-rose-900 dark:text-rose-200"
                                  : "bg-slate-500/15 border-slate-500/40 text-slate-800 dark:text-slate-200"
                              )}
                            >
                              <div className="flex items-center gap-1 font-bold">
                                {avail.status === "training" ? (
                                  <GraduationCap className="size-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                ) : (
                                  <CalendarOff className="size-3 text-rose-600 dark:text-rose-400 shrink-0" />
                                )}
                                <span className="uppercase text-[10px] tracking-wider">
                                  {avail.status}
                                </span>
                              </div>
                              <p className="text-[10px] leading-tight line-clamp-2 opacity-90">
                                {avail.title}
                              </p>
                            </div>
                          )}

                          {/* Scheduled Job Cards */}
                          {dayJobs.map((job) => {
                            const style = getJobTypeStyle(job.jobType);

                            return (
                              <div
                                key={job.id}
                                draggable={isAdmin}
                                onDragStart={(e) => handleDragStart(e, job, engineer.id)}
                                onClick={() => onSelectJob(job)}
                                className={cn(
                                  "p-2 rounded-lg border shadow-2xs transition-all space-y-1 group select-none",
                                  style.bg,
                                  style.border,
                                  isAdmin
                                    ? "cursor-grab active:cursor-grabbing hover:shadow-xs hover:border-primary/60"
                                    : "cursor-pointer hover:border-primary/50"
                                )}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <div className="flex items-center gap-1">
                                    {isAdmin && (
                                      <GripVertical className="size-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                    )}
                                    <span className="font-mono font-bold text-[11px] text-primary">
                                      {job.jobNumber}
                                    </span>
                                  </div>
                                  <span
                                    className={cn(
                                      "size-2 rounded-full shrink-0",
                                      style.dotColor
                                    )}
                                  />
                                </div>

                                <div className="text-foreground font-semibold text-[11px] leading-tight line-clamp-1">
                                  {job.model}
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                                  <span className="truncate max-w-[80px]">
                                    {job.modality}
                                  </span>
                                  <span
                                    className={cn(
                                      "font-bold",
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

                          {/* Empty Slot Placeholder */}
                          {!avail && dayJobs.length === 0 && (
                            <div
                              className={cn(
                                "h-14 rounded-lg border border-dashed border-transparent flex items-center justify-center transition-all",
                                isOver
                                  ? "border-primary bg-primary/10 text-primary font-bold text-[11px]"
                                  : "hover:border-border/60 hover:bg-muted/20"
                              )}
                            >
                              {isOver && <span>Drop to Schedule</span>}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
