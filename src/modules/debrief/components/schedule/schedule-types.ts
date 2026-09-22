import type { DebriefJob } from "../../types";
import type { EngineerAvailability } from "../../mocks/workforce-availability";

export interface JobTypeStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
  accentBar: string;
  badgeClass: string;
  dotColor: string;
}

/**
 * Modern borderless Job Type styling matching the Debrief specification.
 */
export const JOB_TYPE_COLORS: Record<string, JobTypeStyle> = {
  "Planned Preventive Maintenance": {
    label: "Planned PPM",
    bg: "bg-amber-100/90 dark:bg-amber-950/60 hover:bg-amber-200/90 dark:hover:bg-amber-900/70",
    text: "text-amber-950 dark:text-amber-100",
    border: "border-0 shadow-2xs",
    accentBar: "bg-amber-500",
    badgeClass: "bg-amber-200/80 text-amber-950 dark:bg-amber-900/60 dark:text-amber-200 border-0",
    dotColor: "bg-amber-500",
  },
  "Preventive Maintenance": {
    label: "Planned PPM",
    bg: "bg-amber-100/90 dark:bg-amber-950/60 hover:bg-amber-200/90 dark:hover:bg-amber-900/70",
    text: "text-amber-950 dark:text-amber-100",
    border: "border-0 shadow-2xs",
    accentBar: "bg-amber-500",
    badgeClass: "bg-amber-200/80 text-amber-950 dark:bg-amber-900/60 dark:text-amber-200 border-0",
    dotColor: "bg-amber-500",
  },
  Corrective: {
    label: "Corrective",
    bg: "bg-rose-100/90 dark:bg-rose-950/60 hover:bg-rose-200/90 dark:hover:bg-rose-900/70",
    text: "text-rose-950 dark:text-rose-100",
    border: "border-0 shadow-2xs",
    accentBar: "bg-rose-500",
    badgeClass: "bg-rose-200/80 text-rose-950 dark:bg-rose-900/60 dark:text-rose-200 border-0",
    dotColor: "bg-rose-500",
  },
  "Corrective Maintenance": {
    label: "Corrective",
    bg: "bg-rose-100/90 dark:bg-rose-950/60 hover:bg-rose-200/90 dark:hover:bg-rose-900/70",
    text: "text-rose-950 dark:text-rose-100",
    border: "border-0 shadow-2xs",
    accentBar: "bg-rose-500",
    badgeClass: "bg-rose-200/80 text-rose-950 dark:bg-rose-900/60 dark:text-rose-200 border-0",
    dotColor: "bg-rose-500",
  },
  "Emergency Breakdown": {
    label: "Emergency Breakdown",
    bg: "bg-red-100 dark:bg-red-950/70 hover:bg-red-200 dark:hover:bg-red-900/80",
    text: "text-red-950 dark:text-red-100 font-bold",
    border: "border-0 shadow-2xs",
    accentBar: "bg-red-600",
    badgeClass: "bg-red-200 text-red-950 dark:bg-red-900/70 dark:text-red-200 border-0",
    dotColor: "bg-red-600",
  },
  Project: {
    label: "Project",
    bg: "bg-sky-100/90 dark:bg-sky-950/60 hover:bg-sky-200/90 dark:hover:bg-sky-900/70",
    text: "text-sky-950 dark:text-sky-100",
    border: "border-0 shadow-2xs",
    accentBar: "bg-sky-500",
    badgeClass: "bg-sky-200/80 text-sky-950 dark:bg-sky-900/60 dark:text-sky-200 border-0",
    dotColor: "bg-sky-500",
  },
  Installation: {
    label: "Installation",
    bg: "bg-emerald-100/90 dark:bg-emerald-950/60 hover:bg-emerald-200/90 dark:hover:bg-emerald-900/70",
    text: "text-emerald-950 dark:text-emerald-100",
    border: "border-0 shadow-2xs",
    accentBar: "bg-emerald-500",
    badgeClass: "bg-emerald-200/80 text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-200 border-0",
    dotColor: "bg-emerald-500",
  },
  Audit: {
    label: "Audit",
    bg: "bg-slate-100/90 dark:bg-slate-900/80 hover:bg-slate-200/90 dark:hover:bg-slate-800/80",
    text: "text-slate-950 dark:text-slate-100",
    border: "border-0 shadow-2xs",
    accentBar: "bg-slate-500",
    badgeClass: "bg-slate-200/80 text-slate-950 dark:bg-slate-800 dark:text-slate-200 border-0",
    dotColor: "bg-slate-500",
  },
  Upgrade: {
    label: "Upgrade",
    bg: "bg-indigo-100/90 dark:bg-indigo-950/60 hover:bg-indigo-200/90 dark:hover:bg-indigo-900/70",
    text: "text-indigo-950 dark:text-indigo-100",
    border: "border-0 shadow-2xs",
    accentBar: "bg-indigo-500",
    badgeClass: "bg-indigo-200/80 text-indigo-950 dark:bg-indigo-900/60 dark:text-indigo-200 border-0",
    dotColor: "bg-indigo-500",
  },
  Calibration: {
    label: "Calibration",
    bg: "bg-orange-100/90 dark:bg-orange-950/60 hover:bg-orange-200/90 dark:hover:bg-orange-900/70",
    text: "text-orange-950 dark:text-orange-100",
    border: "border-0 shadow-2xs",
    accentBar: "bg-orange-500",
    badgeClass: "bg-orange-200/80 text-orange-950 dark:bg-orange-900/60 dark:text-orange-200 border-0",
    dotColor: "bg-orange-500",
  },
  Inspection: {
    label: "Inspection",
    bg: "bg-purple-100/90 dark:bg-purple-950/60 hover:bg-purple-200/90 dark:hover:bg-purple-900/70",
    text: "text-purple-950 dark:text-purple-100",
    border: "border-0 shadow-2xs",
    accentBar: "bg-purple-500",
    badgeClass: "bg-purple-200/80 text-purple-950 dark:bg-purple-900/60 dark:text-purple-200 border-0",
    dotColor: "bg-purple-500",
  },
  Decommissioning: {
    label: "Decommissioning",
    bg: "bg-slate-100/90 dark:bg-slate-900/80 hover:bg-slate-200/90 dark:hover:bg-slate-800/80",
    text: "text-slate-950 dark:text-slate-100",
    border: "border-0 shadow-2xs",
    accentBar: "bg-slate-500",
    badgeClass: "bg-slate-200/80 text-slate-950 dark:bg-slate-800 dark:text-slate-200 border-0",
    dotColor: "bg-slate-500",
  },
};

export function getJobTypeStyle(jobType: string): JobTypeStyle {
  return (
    JOB_TYPE_COLORS[jobType] || {
      label: jobType || "Service Job",
      bg: "bg-primary/10 hover:bg-primary/15",
      text: "text-primary font-bold",
      border: "border-0 shadow-2xs",
      accentBar: "bg-primary",
      badgeClass: "bg-primary/15 text-primary border-0",
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
