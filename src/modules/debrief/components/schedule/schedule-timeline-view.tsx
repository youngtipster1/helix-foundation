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
  GripVertical,
  GraduationCap,
  CalendarOff,
} from "lucide-react";

interface ScheduleTimelineViewProps {
  currentDate: Date;
  weekNumber: number;
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

function formatDisplayDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
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

  const engineerWorkedDaysMap = useMemo(() => {
    const map: Record<string, number> = {};
    const weekDateKeys = new Set(weekDays.slice(0, 5).map(formatDateKey));

    engineers.forEach((eng) => {
      const engFullName = `${eng.firstName} ${eng.lastName}`.trim().toLowerCase();
      const engFirstName = eng.firstName.toLowerCase();

      const workedDaysSet = new Set<string>();
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
          workedDaysSet.add(jDate);
        }
      });
      map[eng.id] = workedDaysSet.size;
    });
    return map;
  }, [engineers, jobs, weekDays]);

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
    <div className="w-full rounded-2xl border border-border bg-card shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs min-w-[1000px]">
          {/* Header: Days of the week & Capacity */}
          <thead>
            <tr className="border-b border-border bg-muted/30 text-[11px] font-bold text-muted-foreground">
              <th className="py-3 px-4 text-left w-56 border-r border-border/50">
                Biomedical Engineer
              </th>
              {weekDays.map((day, idx) => {
                const isWeekend = idx >= 5;
                const dateKey = formatDateKey(day);
                const isToday = dateKey === todayKey;

                return (
                  <th
                    key={dateKey}
                    className={cn(
                      "py-2.5 px-2 text-center border-r border-border/40 min-w-[115px]",
                      isWeekend && "bg-muted/40 text-muted-foreground",
                      isToday && "bg-primary/5 text-primary"
                    )}
                  >
                    <div className="uppercase text-[10px] tracking-wider font-bold">
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div
                      className={cn(
                        "font-mono text-xs mt-0.5 inline-block px-1.5 py-0.2 rounded-full",
                        isToday
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-foreground font-semibold"
                      )}
                    >
                      {formatDisplayDate(day)}
                    </div>
                  </th>
                );
              })}
              <th className="py-3 px-3 text-center text-[10px] leading-tight text-foreground bg-muted/15 w-24">
                Workload<br />(5 Days)
              </th>
            </tr>
          </thead>

          {/* Body: One Row Per Engineer */}
          <tbody className="divide-y divide-border/50">
            {engineers.map((engineer) => {
              const engFullName = `${engineer.firstName} ${engineer.lastName}`.trim().toLowerCase();
              const engFirstName = engineer.firstName.toLowerCase();

              const engineerJobs = jobs.filter((j) => {
                if (j.jobStatus === "Completed") return false;
                const matchId = j.assignedToId === engineer.id;
                const matchName =
                  j.assignedToName &&
                  (j.assignedToName.toLowerCase().includes(engFullName) ||
                    j.assignedToName.toLowerCase().includes(engFirstName));
                return matchId || matchName;
              });

              const daysWorked = engineerWorkedDaysMap[engineer.id] || 0;
              const workloadPercent = Math.min(100, Math.round((daysWorked / 5) * 100));

              return (
                <tr key={engineer.id} className="hover:bg-muted/10 transition-colors">
                  {/* Engineer Profile Column */}
                  <td className="py-3 px-4 border-r border-border/50 bg-muted/10 align-top">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
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
                        <span className="text-[10px] text-muted-foreground/70 truncate block">
                          {engineer.department}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 7 Days Slots */}
                  {weekDays.map((day, dIdx) => {
                    const isWeekend = dIdx >= 5;
                    const dateKey = formatDateKey(day);
                    const cellKey = `${engineer.id}_${dateKey}`;
                    const isOver = dragOverKey === cellKey;
                    const isToday = dateKey === todayKey;

                    const avail = availabilities.find(
                      (a) =>
                        (a.personnelId === engineer.id ||
                          a.personnelName.toLowerCase() === engFullName) &&
                        a.date === dateKey
                    );

                    const dayJobs = engineerJobs.filter((j) => {
                      const jDate = j.jobStartDate || j.startDate || "";
                      return jDate === dateKey;
                    });

                    // Weekend column
                    if (isWeekend) {
                      return (
                        <td
                          key={dateKey}
                          className="py-2 px-2 border-r border-border/40 bg-muted/20 text-center align-middle text-[11px] font-mono font-medium text-muted-foreground/50 select-none"
                        >
                          Weekend
                        </td>
                      );
                    }

                    return (
                      <td
                        key={dateKey}
                        onDragOver={(e) => handleDragOver(e, cellKey)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, engineer, dateKey)}
                        className={cn(
                          "py-1.5 px-1.5 border-r border-border/40 align-top transition-colors min-h-[85px] h-[95px] max-w-[145px]",
                          isToday && "bg-primary/2",
                          isOver && "bg-primary/15 ring-2 ring-inset ring-primary"
                        )}
                      >
                        <div className="space-y-1.5 min-h-full">
                          {/* Borderless Workforce Availability Block */}
                          {avail && avail.status !== "available" && (
                            <div
                              className={cn(
                                "p-2 rounded-lg text-[10px] font-bold space-y-0.5 shadow-2xs border-0",
                                avail.status === "training"
                                  ? "bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200"
                                  : avail.status === "leave"
                                  ? "bg-sky-100 dark:bg-sky-950/70 text-sky-950 dark:text-sky-200"
                                  : "bg-rose-100 dark:bg-rose-950/70 text-rose-950 dark:text-rose-200"
                              )}
                            >
                              <div className="flex items-center gap-1 uppercase tracking-wider text-[9px] font-black">
                                {avail.status === "training" ? (
                                  <GraduationCap className="size-3 shrink-0 text-amber-600 dark:text-amber-400" />
                                ) : (
                                  <CalendarOff className="size-3 shrink-0 text-rose-600 dark:text-rose-400" />
                                )}
                                <span>{avail.status === "training" ? "Training" : "Leave"}</span>
                              </div>
                              <p className="text-[10px] font-medium leading-tight line-clamp-2">
                                {avail.title}
                              </p>
                            </div>
                          )}

                          {/* Borderless Scheduled Job Card with prominent Left Color Bar */}
                          {dayJobs.map((job) => {
                            const style = getJobTypeStyle(job.jobType);

                            return (
                              <div
                                key={job.id}
                                draggable={isAdmin}
                                onDragStart={(e) => handleDragStart(e, job, engineer.id)}
                                onClick={() => onSelectJob(job)}
                                className={cn(
                                  "relative overflow-hidden p-2.5 rounded-xl transition-all space-y-1 group select-none text-[11px] border-0",
                                  style.bg,
                                  style.text,
                                  style.border,
                                  isAdmin
                                    ? "cursor-grab active:cursor-grabbing hover:shadow-xs"
                                    : "cursor-pointer"
                                )}
                              >
                                {/* Left Accent Color Strip */}
                                <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l", style.accentBar)} />

                                <div className="pl-1 space-y-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1 font-mono text-[10px] font-bold">
                                      {isAdmin && (
                                        <GripVertical className="size-2.5 opacity-50 group-hover:opacity-100 shrink-0" />
                                      )}
                                      <span>{job.jobNumber}</span>
                                    </div>
                                    <span className={cn("px-1.5 py-0.2 rounded text-[9px] font-bold", style.badgeClass)}>
                                      {style.label}
                                    </span>
                                  </div>

                                  {/* Facility / Hospital Name */}
                                  <div className="font-bold text-xs leading-snug line-clamp-1">
                                    {job.location || "Medicare Hospital Lagos"}
                                  </div>

                                  {/* Equipment Name & Modality */}
                                  <div className="text-[10px] opacity-80 truncate">
                                    {job.model} · {job.modality}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Empty slot placeholder */}
                          {!avail && dayJobs.length === 0 && (
                            <div
                              className={cn(
                                "h-12 rounded-lg border border-dashed border-transparent flex items-center justify-center transition-all",
                                isOver
                                  ? "border-primary bg-primary/10 text-primary font-bold text-[10px]"
                                  : "hover:border-border/60 hover:bg-muted/15"
                              )}
                            >
                              {isOver && <span>Drop to Assign</span>}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Workload / Utilization Column */}
                  <td className="py-3 px-3 text-center bg-muted/5 align-middle">
                    <div className="space-y-1">
                      <span
                        className={cn(
                          "font-mono font-bold text-xs",
                          daysWorked > 0 ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {daysWorked} / 5
                      </span>
                      <div className="w-16 mx-auto h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${workloadPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {workloadPercent}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
