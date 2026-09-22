import type { DebriefJob } from "../../types";
import type { EngineerAvailability } from "../../mocks/workforce-availability";

export interface JobTypeStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
  badgeClass: string;
  dotColor: string;
  hex: string;
}

/**
 * Job Type colour-coding strictly adhering to client PowerPoint Slide 18:
 * - Planned Preventive Maintenance: Yellow (#eab308 / #facc15)
 * - Corrective: Red (#ef4444 / #dc2626)
 * - Project: Cyan/Blue (#06b6d4 / #0284c7)
 * - Installation: Green (#22c55e / #16a34a)
 * - Audit: Gray/Slate
 * - Upgrade: Purple/Indigo
 */
export const JOB_TYPE_COLORS: Record<string, JobTypeStyle> = {
  "Planned Preventive Maintenance": {
    label: "Planned Preventive Maintenance",
    bg: "bg-amber-400/20 dark:bg-amber-500/25",
    text: "text-amber-950 dark:text-amber-200 font-bold",
    border: "border-amber-500/50",
    badgeClass: "bg-amber-400/25 text-amber-900 dark:text-amber-200 border-amber-500/40",
    dotColor: "bg-yellow-400",
    hex: "#eab308",
  },
  "Preventive Maintenance": {
    label: "Planned Preventive Maintenance",
    bg: "bg-amber-400/20 dark:bg-amber-500/25",
    text: "text-amber-950 dark:text-amber-200 font-bold",
    border: "border-amber-500/50",
    badgeClass: "bg-amber-400/25 text-amber-900 dark:text-amber-200 border-amber-500/40",
    dotColor: "bg-yellow-400",
    hex: "#eab308",
  },
  Corrective: {
    label: "Corrective",
    bg: "bg-rose-500/20 dark:bg-rose-500/30",
    text: "text-rose-950 dark:text-rose-200 font-bold",
    border: "border-rose-500/60",
    badgeClass: "bg-rose-500/25 text-rose-900 dark:text-rose-200 border-rose-500/50",
    dotColor: "bg-rose-600",
    hex: "#ef4444",
  },
  "Corrective Maintenance": {
    label: "Corrective",
    bg: "bg-rose-500/20 dark:bg-rose-500/30",
    text: "text-rose-950 dark:text-rose-200 font-bold",
    border: "border-rose-500/60",
    badgeClass: "bg-rose-500/25 text-rose-900 dark:text-rose-200 border-rose-500/50",
    dotColor: "bg-rose-600",
    hex: "#ef4444",
  },
  "Emergency Breakdown": {
    label: "Corrective (Emergency)",
    bg: "bg-red-500/25 dark:bg-red-500/35",
    text: "text-red-950 dark:text-red-200 font-extrabold",
    border: "border-red-600/70",
    badgeClass: "bg-red-500/30 text-red-950 dark:text-red-200 border-red-600/60",
    dotColor: "bg-red-600",
    hex: "#dc2626",
  },
  Project: {
    label: "Project",
    bg: "bg-cyan-500/20 dark:bg-cyan-500/30",
    text: "text-cyan-950 dark:text-cyan-200 font-bold",
    border: "border-cyan-500/60",
    badgeClass: "bg-cyan-500/25 text-cyan-900 dark:text-cyan-200 border-cyan-500/50",
    dotColor: "bg-cyan-500",
    hex: "#06b6d4",
  },
  Installation: {
    label: "Installation",
    bg: "bg-emerald-500/20 dark:bg-emerald-500/30",
    text: "text-emerald-950 dark:text-emerald-200 font-bold",
    border: "border-emerald-500/60",
    badgeClass: "bg-emerald-500/25 text-emerald-900 dark:text-emerald-200 border-emerald-500/50",
    dotColor: "bg-emerald-500",
    hex: "#22c55e",
  },
  Audit: {
    label: "Audit",
    bg: "bg-slate-500/15 dark:bg-slate-500/25",
    text: "text-slate-900 dark:text-slate-200 font-bold",
    border: "border-slate-500/40",
    badgeClass: "bg-slate-500/20 text-slate-800 dark:text-slate-200 border-slate-500/40",
    dotColor: "bg-slate-500",
    hex: "#64748b",
  },
  Upgrade: {
    label: "Upgrade",
    bg: "bg-indigo-500/20 dark:bg-indigo-500/30",
    text: "text-indigo-950 dark:text-indigo-200 font-bold",
    border: "border-indigo-500/50",
    badgeClass: "bg-indigo-500/25 text-indigo-900 dark:text-indigo-200 border-indigo-500/40",
    dotColor: "bg-indigo-500",
    hex: "#6366f1",
  },
  Calibration: {
    label: "Calibration",
    bg: "bg-orange-500/20 dark:bg-orange-500/30",
    text: "text-orange-950 dark:text-orange-200 font-bold",
    border: "border-orange-500/50",
    badgeClass: "bg-orange-500/25 text-orange-900 dark:text-orange-200 border-orange-500/40",
    dotColor: "bg-orange-500",
    hex: "#f97316",
  },
  Inspection: {
    label: "Inspection",
    bg: "bg-purple-500/20 dark:bg-purple-500/30",
    text: "text-purple-950 dark:text-purple-200 font-bold",
    border: "border-purple-500/50",
    badgeClass: "bg-purple-500/25 text-purple-900 dark:text-purple-200 border-purple-500/40",
    dotColor: "bg-purple-500",
    hex: "#a855f7",
  },
  Decommissioning: {
    label: "Decommissioning",
    bg: "bg-slate-500/15 dark:bg-slate-500/25",
    text: "text-slate-900 dark:text-slate-200 font-bold",
    border: "border-slate-500/40",
    badgeClass: "bg-slate-500/20 text-slate-800 dark:text-slate-200 border-slate-500/40",
    dotColor: "bg-slate-500",
    hex: "#475569",
  },
};

export function getJobTypeStyle(jobType: string): JobTypeStyle {
  return (
    JOB_TYPE_COLORS[jobType] || {
      label: jobType || "Standard Job",
      bg: "bg-primary/15",
      text: "text-primary font-bold",
      border: "border-primary/40",
      badgeClass: "bg-primary/15 text-primary border-primary/30",
      dotColor: "bg-primary",
      hex: "#0ea5e9",
    }
  );
}

/**
 * Slide 18 Workforce Activity & Availability Legend items
 */
export const WORKFORCE_LEGEND_ITEMS = [
  { code: "TRAINING", label: "Training", color: "bg-amber-400 text-amber-950" },
  { code: "ADMIN", label: "Other Reasons", color: "bg-slate-300 text-slate-900" },
  { code: "AL", label: "Annual Leave", color: "bg-sky-400 text-sky-950" },
  { code: "SICK", label: "Sick Leave", color: "bg-rose-400 text-rose-950" },
  { code: "DAY OFF", label: "Day off for working on a weekend", color: "bg-emerald-300 text-emerald-950" },
  { code: "WEEKEND", label: "Weekend", color: "bg-muted text-muted-foreground" },
  { code: "HOLIDAY", label: "Public Holiday", color: "bg-purple-300 text-purple-950" },
];

export interface SchedulingConflict {
  hasConflict: boolean;
  type: "leave" | "training" | "off" | "double_booking" | "none";
  title: string;
  description: string;
  conflictingItem?: EngineerAvailability | DebriefJob;
  engineerId: string;
  engineerName: string;
  targetDate: string;
  job: DebriefJob;
}

export interface DragJobPayload {
  jobId: string;
  sourceEngineerId?: string;
  sourceDate?: string;
}
