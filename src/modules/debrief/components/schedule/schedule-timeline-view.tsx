import { useState, useMemo } from "react";
import type { DebriefJob } from "../../types";
import type { Personnel } from "@/modules/settings/types";
import type { EngineerAvailability } from "../../mocks/workforce-availability";
import {
  getJobTypeStyle,
  JOB_TYPE_COLORS,
  WORKFORCE_LEGEND_ITEMS,
  type DragJobPayload,
} from "./schedule-types";
import { cn } from "@/lib/utils";
import {
  GripVertical,
  GraduationCap,
  CalendarOff,
  Info,
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
  const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday...
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
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function ScheduleTimelineView({
  currentDate,
  weekNumber,
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

  // Calculate total workdays (5 workdays Mon-Fri per engineer) & days worked across all engineers
  const totalWorkdays = engineers.length * 5;
  
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

  const totalDaysWorked = Object.values(engineerWorkedDaysMap).reduce((a, b) => a + b, 0);

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
    <div className="flex flex-col xl:flex-row items-start gap-5 w-full">
      {/* Main Slide 18 Table Section */}
      <div className="flex-1 w-full space-y-2.5 overflow-hidden">
        {/* Yellow Format Header Banner (Slide 18) */}
        <div className="bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-950 dark:text-amber-200 px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded text-[11px] font-black uppercase">
              FORMAT
            </span>
            <span>Hospital Name, Equipment Type, Job number</span>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            Slide 18 Schedule Spec
          </span>
        </div>

        {/* The Grid Table */}
        <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs min-w-[1050px]">
              {/* Top Week Header Row */}
              <thead>
                <tr className="bg-slate-900 text-slate-100 dark:bg-slate-950 text-[11px] font-bold">
                  <th className="py-2.5 px-3 text-left w-48 border-r border-slate-700 uppercase tracking-wider">
                    ENGINEER
                  </th>
                  <th
                    colSpan={7}
                    className="py-2 px-3 text-center border-r border-slate-700 uppercase tracking-widest text-xs font-mono text-amber-400"
                  >
                    WEEK {weekNumber}
                  </th>
                  <th className="py-2 px-2 text-center w-24 border-r border-slate-700 bg-rose-950/80 text-rose-300 font-mono text-xs">
                    {totalWorkdays}
                  </th>
                  <th className="py-2 px-2 text-center w-24 bg-rose-950/80 text-rose-300 font-mono text-xs">
                    {totalDaysWorked}
                  </th>
                </tr>

                {/* Sub-header: Weekday Names & Date Values */}
                <tr className="border-b border-border bg-muted/40 text-[11px] font-bold text-muted-foreground">
                  <th className="py-2.5 px-3 text-left border-r border-border/60">
                    Staff Name
                  </th>
                  {weekDays.map((day, idx) => {
                    const isWeekend = idx >= 5;
                    const dateKey = formatDateKey(day);
                    const isToday = dateKey === todayKey;

                    return (
                      <th
                        key={dateKey}
                        className={cn(
                          "py-2 px-2 text-center border-r border-border/40 min-w-[110px]",
                          isWeekend && "bg-muted/70 text-muted-foreground",
                          isToday && "bg-primary/10 text-primary font-bold"
                        )}
                      >
                        <div className="uppercase text-[10px] tracking-wider">
                          {day.toLocaleDateString("en-US", { weekday: "long" })}
                        </div>
                        <div className="font-mono text-[11px] text-foreground font-semibold mt-0.5">
                          {formatDisplayDate(day)}
                        </div>
                      </th>
                    );
                  })}
                  <th className="py-2 px-2 text-center border-r border-border/60 text-[10px] leading-tight text-foreground bg-muted/20">
                    Number of<br />workdays
                  </th>
                  <th className="py-2 px-2 text-center text-[10px] leading-tight text-foreground bg-muted/20">
                    Number of<br />days worked
                  </th>
                </tr>
              </thead>

              {/* Body: One Row Per Engineer (ENGR A, ENGR B, etc.) */}
              <tbody className="divide-y divide-border/60">
                {engineers.map((engineer, idx) => {
                  const engCode = `ENGR ${String.fromCharCode(65 + idx)}`;
                  const engFullName = `${engineer.firstName} ${engineer.lastName}`.trim().toLowerCase();
                  const engFirstName = engineer.firstName.toLowerCase();

                  // Filter jobs assigned to this engineer
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

                  return (
                    <tr key={engineer.id} className="hover:bg-muted/10 transition-colors">
                      {/* Engineer Label Column (ENGR A - John Doe) */}
                      <td className="py-2.5 px-3 border-r border-border/60 bg-muted/15 align-top">
                        <div className="font-mono font-bold text-xs text-foreground">
                          {engCode}
                        </div>
                        <div className="text-[11px] font-semibold text-muted-foreground truncate max-w-[170px]">
                          {engineer.firstName} {engineer.lastName}
                        </div>
                        <div className="text-[10px] text-muted-foreground/80 truncate">
                          {engineer.jobTitle}
                        </div>
                      </td>

                      {/* 7 Day Slots */}
                      {weekDays.map((day, dIdx) => {
                        const isWeekend = dIdx >= 5;
                        const dateKey = formatDateKey(day);
                        const cellKey = `${engineer.id}_${dateKey}`;
                        const isOver = dragOverKey === cellKey;
                        const isToday = dateKey === todayKey;

                        // Check workforce availability record
                        const avail = availabilities.find(
                          (a) =>
                            (a.personnelId === engineer.id ||
                              a.personnelName.toLowerCase() === engFullName) &&
                            a.date === dateKey
                        );

                        // Check jobs scheduled for this engineer on this date
                        const dayJobs = engineerJobs.filter((j) => {
                          const jDate = j.jobStartDate || j.startDate || "";
                          return jDate === dateKey;
                        });

                        // Weekend Column Styling (Slide 18)
                        if (isWeekend) {
                          return (
                            <td
                              key={dateKey}
                              className="py-2 px-2 border-r border-border/40 bg-muted/40 text-center align-middle text-[11px] font-mono font-bold text-muted-foreground/70 select-none"
                            >
                              WEEKEND
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
                              "py-1.5 px-1.5 border-r border-border/40 align-top transition-colors min-h-[75px] h-[85px] max-w-[140px]",
                              isToday && "bg-primary/2",
                              isOver && "bg-primary/20 ring-2 ring-inset ring-primary"
                            )}
                          >
                            <div className="space-y-1 min-h-full">
                              {/* Workforce availability chip (e.g. TRAINING, AL, SICK) */}
                              {avail && avail.status !== "available" && (
                                <div
                                  className={cn(
                                    "p-1.5 rounded text-[10px] font-bold border space-y-0.5",
                                    avail.status === "training"
                                      ? "bg-amber-400 text-amber-950 border-amber-500"
                                      : avail.status === "leave"
                                      ? "bg-sky-400 text-sky-950 border-sky-500"
                                      : "bg-rose-400 text-rose-950 border-rose-500"
                                  )}
                                >
                                  <div className="flex items-center gap-1 uppercase tracking-wider text-[9px] font-black">
                                    {avail.status === "training" ? (
                                      <GraduationCap className="size-3 shrink-0" />
                                    ) : (
                                      <CalendarOff className="size-3 shrink-0" />
                                    )}
                                    <span>{avail.status === "training" ? "TRAINING" : "AL"}</span>
                                  </div>
                                  <p className="text-[10px] leading-tight line-clamp-1">
                                    {avail.title}
                                  </p>
                                </div>
                              )}

                              {/* Scheduled Job Card in Slide 18 format:
                                  "Hospital Name, Equipment Type, Job number" */}
                              {dayJobs.map((job) => {
                                const style = getJobTypeStyle(job.jobType);

                                return (
                                  <div
                                    key={job.id}
                                    draggable={isAdmin}
                                    onDragStart={(e) => handleDragStart(e, job, engineer.id)}
                                    onClick={() => onSelectJob(job)}
                                    className={cn(
                                      "p-2 rounded border shadow-2xs transition-all space-y-0.5 group select-none text-[11px]",
                                      style.bg,
                                      style.border,
                                      style.text,
                                      isAdmin
                                        ? "cursor-grab active:cursor-grabbing hover:shadow-xs hover:border-foreground/40"
                                        : "cursor-pointer hover:border-foreground/30"
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-1 pb-0.5 border-b border-current/20">
                                      <div className="flex items-center gap-1 truncate font-mono text-[10px]">
                                        {isAdmin && (
                                          <GripVertical className="size-2.5 opacity-60 group-hover:opacity-100 shrink-0" />
                                        )}
                                        <span className="truncate">{job.jobNumber}</span>
                                      </div>
                                      <span className={cn("size-2 rounded-full shrink-0", style.dotColor)} />
                                    </div>

                                    {/* Line 1: Hospital Name / Location */}
                                    <div className="font-bold text-[11px] leading-snug line-clamp-1">
                                      {job.location || "Medicare Hospital Lagos"}
                                    </div>

                                    {/* Line 2: Equipment Type */}
                                    <div className="text-[10px] opacity-90 truncate">
                                      {job.model || job.modality || "X-ray"}
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Empty slot placeholder */}
                              {!avail && dayJobs.length === 0 && (
                                <div
                                  className={cn(
                                    "h-12 rounded border border-dashed border-transparent flex items-center justify-center transition-all",
                                    isOver
                                      ? "border-primary bg-primary/10 text-primary font-bold text-[10px]"
                                      : "hover:border-border/60 hover:bg-muted/20"
                                  )}
                                >
                                  {isOver && <span>Drop to Assign</span>}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Number of workdays Column (5 Mon-Fri) */}
                      <td className="py-2.5 px-2 text-center border-r border-border/60 font-mono font-bold text-xs text-foreground bg-muted/10 align-middle">
                        5
                      </td>

                      {/* Number of days worked Column */}
                      <td
                        className={cn(
                          "py-2.5 px-2 text-center font-mono font-bold text-xs align-middle bg-muted/10",
                          daysWorked > 0 ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {daysWorked > 0 ? daysWorked : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Exact Slide 18 Legend Table on Right */}
      <div className="w-full xl:w-72 shrink-0 rounded-xl border border-border bg-card p-4 shadow-2xs space-y-4">
        <div className="border-b border-border pb-2.5">
          <h4 className="font-mono font-black text-xs uppercase tracking-wider text-foreground">
            LEGEND (Slide 18)
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Color coding &amp; workforce codes
          </p>
        </div>

        {/* Job Type Color Codes */}
        <div className="space-y-1.5 text-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase">
            Job Types
          </span>

          <div className="space-y-1">
            <div className="flex items-center gap-2 p-1.5 rounded border border-amber-400/50 bg-amber-400/20">
              <span className="size-3.5 rounded bg-yellow-400 border border-yellow-500 shrink-0" />
              <span className="text-foreground font-semibold text-[11px]">
                Planned Preventive Maintenance
              </span>
            </div>

            <div className="flex items-center gap-2 p-1.5 rounded border border-rose-500/50 bg-rose-500/20">
              <span className="size-3.5 rounded bg-red-600 border border-red-700 shrink-0" />
              <span className="text-foreground font-semibold text-[11px]">
                Corrective
              </span>
            </div>

            <div className="flex items-center gap-2 p-1.5 rounded border border-cyan-500/50 bg-cyan-500/20">
              <span className="size-3.5 rounded bg-cyan-500 border border-cyan-600 shrink-0" />
              <span className="text-foreground font-semibold text-[11px]">
                Project
              </span>
            </div>

            <div className="flex items-center gap-2 p-1.5 rounded border border-emerald-500/50 bg-emerald-500/20">
              <span className="size-3.5 rounded bg-emerald-500 border border-emerald-600 shrink-0" />
              <span className="text-foreground font-semibold text-[11px]">
                Installation
              </span>
            </div>

            <div className="flex items-center gap-2 p-1.5 rounded border border-slate-500/40 bg-slate-500/15">
              <span className="size-3.5 rounded bg-slate-500 border border-slate-600 shrink-0" />
              <span className="text-foreground font-semibold text-[11px]">
                Audit
              </span>
            </div>

            <div className="flex items-center gap-2 p-1.5 rounded border border-indigo-500/40 bg-indigo-500/20">
              <span className="size-3.5 rounded bg-indigo-500 border border-indigo-600 shrink-0" />
              <span className="text-foreground font-semibold text-[11px]">
                Upgrade
              </span>
            </div>
          </div>
        </div>

        {/* Workforce Availability Codes */}
        <div className="space-y-1.5 text-xs pt-2 border-t border-border">
          <span className="text-[11px] font-bold text-muted-foreground uppercase">
            Workforce Status
          </span>

          <div className="space-y-1 font-mono text-[11px]">
            {WORKFORCE_LEGEND_ITEMS.map((item) => (
              <div
                key={item.code}
                className="flex items-center justify-between p-1.5 rounded bg-muted/40 border border-border/60"
              >
                <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", item.color)}>
                  {item.code}
                </span>
                <span className="text-foreground font-medium text-[11px]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
