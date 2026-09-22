import type { DebriefJob } from "../../types";
import type { EngineerAvailability } from "../../mocks/workforce-availability";

export type ScheduleViewMode = "timeline" | "month" | "week";

export interface JobTypeStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
  badgeClass: string;
  dotColor: string;
}

/**
 * Job Type colour-coding strictly adhering to the PDF specification.
 */
export const JOB_TYPE_COLORS: Record<string, JobTypeStyle> = {
  "Corrective Maintenance": {
    label: "Corrective Maintenance",
    bg: "bg-rose-500/10 dark:bg-rose-500/20",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/30 dark:border-rose-500/40",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    dotColor: "bg-rose-500",
  },
  "Preventive Maintenance": {
    label: "Preventive Maintenance",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-500/30 dark:border-blue-500/40",
    badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    dotColor: "bg-blue-500",
  },
  Installation: {
    label: "Installation",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/30 dark:border-emerald-500/40",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    dotColor: "bg-emerald-500",
  },
  Calibration: {
    label: "Calibration",
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/30 dark:border-amber-500/40",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    dotColor: "bg-amber-500",
  },
  Inspection: {
    label: "Inspection",
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-500/30 dark:border-purple-500/40",
    badgeClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
    dotColor: "bg-purple-500",
  },
  "Emergency Breakdown": {
    label: "Emergency Breakdown",
    bg: "bg-red-500/15 dark:bg-red-500/25",
    text: "text-red-700 dark:text-red-300 font-bold",
    border: "border-red-500/50",
    badgeClass: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/50",
    dotColor: "bg-red-600",
  },
  Decommissioning: {
    label: "Decommissioning",
    bg: "bg-slate-500/10 dark:bg-slate-500/20",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-500/30 dark:border-slate-500/40",
    badgeClass: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
    dotColor: "bg-slate-500",
  },
};

export function getJobTypeStyle(jobType: string): JobTypeStyle {
  return (
    JOB_TYPE_COLORS[jobType] || {
      label: jobType || "Standard Job",
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/20",
      badgeClass: "bg-primary/10 text-primary border-primary/20",
      dotColor: "bg-primary",
    }
  );
}

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
