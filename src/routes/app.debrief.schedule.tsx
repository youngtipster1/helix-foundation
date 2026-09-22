import { createFileRoute } from "@tanstack/react-router";
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
import {
  JOB_TYPE_COLORS,
  type SchedulingConflict,
  type DragJobPayload,
} from "@/modules/debrief/components/schedule/schedule-types";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Calendar,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/debrief/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule Calendar — Debrief | HEMP" },
      {
        name: "description",
        content:
          "Admin weekly schedule calendar: biomedical engineer dispatches, hospital service assignments, workforce availability, and workload utilization.",
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

function formatDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatMonthDay(d: Date): string {
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  return `${month} ${day}`;
}

// Template jobs mapped to day-of-week offsets (0 = Monday, 1 = Tuesday, 2 = Wednesday, 3 = Thursday, 4 = Friday)
const RECURRING_JOB_TEMPLATES = [
  {
    dayOffset: 0, // Monday
    engineerId: "per_001",
    engineerName: "John Doe",
    jobNumber: "JOB-2026-0001",
    model: "Optima CT660 128-Slice",
    modality: "Radiology",
    jobType: "Planned Preventive Maintenance",
    location: "Medicare Hospital, Lagos",
    priority: "High" as const,
    assetNumber: "EQ-RAD-001",
    oem: "GE Healthcare",
  },
  {
    dayOffset: 2, // Wednesday
    engineerId: "per_001",
    engineerName: "John Doe",
    jobNumber: "JOB-2026-0011",
    model: "Incisive CT 128",
    modality: "Radiology",
    jobType: "Project",
    location: "State Specialist Hospital, Asaba",
    priority: "High" as const,
    assetNumber: "EQ-RAD-009",
    oem: "Philips Healthcare",
  },
  {
    dayOffset: 1, // Tuesday
    engineerId: "per_002",
    engineerName: "Amara Okoye",
    jobNumber: "JOB-2026-0008",
    model: "Logiq V5 Ultrasound",
    modality: "Ultrasound",
    jobType: "Planned Preventive Maintenance",
    location: "FMC Abuja, Radiology Suite",
    priority: "Mid" as const,
    assetNumber: "EQ-US-003",
    oem: "GE Healthcare",
  },
  {
    dayOffset: 3, // Thursday
    engineerId: "per_002",
    engineerName: "Amara Okoye",
    jobNumber: "JOB-2026-0018",
    model: "Vivid E95 4D Cardiovascular",
    modality: "Ultrasound",
    jobType: "Preventive Maintenance",
    location: "Cardio Suite, FMC Abuja",
    priority: "Mid" as const,
    assetNumber: "EQ-US-009",
    oem: "GE Healthcare",
  },
  {
    dayOffset: 3, // Thursday
    engineerId: "per_005",
    engineerName: "Marcus Vance",
    jobNumber: "JOB-2026-0010",
    model: "BeneVision N17 Patient Monitor",
    modality: "Patient Monitoring",
    jobType: "Installation",
    location: "Cedarcrest Hospital, Abuja",
    priority: "Mid" as const,
    assetNumber: "EQ-MON-005",
    oem: "Mindray",
  },
  {
    dayOffset: 0, // Monday
    engineerId: "per_013",
    engineerName: "Zainab Sani",
    jobNumber: "JOB-2026-0009",
    model: "Evita Infinity V500 Ventilator",
    modality: "ICU / Anaesthesia",
    jobType: "Corrective Maintenance",
    location: "National Hospital, Trauma Ward",
    priority: "High" as const,
    assetNumber: "EQ-VENT-002",
    oem: "Dräger Medical",
  },
  {
    dayOffset: 2, // Wednesday
    engineerId: "per_013",
    engineerName: "Zainab Sani",
    jobNumber: "JOB-2026-0015",
    model: "HAMILTON-C6 Intensive Care",
    modality: "ICU / Anaesthesia",
    jobType: "Emergency Breakdown",
    location: "Main Hospital ICU, Kano",
    priority: "High" as const,
    assetNumber: "EQ-VENT-007",
    oem: "Hamilton Medical",
  },
  {
    dayOffset: 2, // Wednesday
    engineerId: "per_003",
    engineerName: "Liam Fischer",
    jobNumber: "JOB-2026-0014",
    model: "5008S CorDiax Hemodialysis",
    modality: "Renal / Dialysis",
    jobType: "Calibration",
    location: "Dialysis Centre, UTH Abuja",
    priority: "High" as const,
    assetNumber: "EQ-DIAL-001",
    oem: "Fresenius Medical Care",
  },
  {
    dayOffset: 4, // Friday
    engineerId: "per_004",
    engineerName: "Sara Haddad",
    jobNumber: "JOB-2026-0016",
    model: "GSS67H Steam Sterilizer Autoclave",
    modality: "CSSD / Sterilization",
    jobType: "Preventive Maintenance",
    location: "CSSD Department, UPTH",
    priority: "Low" as const,
    assetNumber: "EQ-STER-002",
    oem: "Getinge",
  },
  {
    dayOffset: 3, // Thursday
    engineerId: "per_012",
    engineerName: "Tariq Mansoor",
    jobNumber: "JOB-2026-0020",
    model: "Vantage Orian 1.5T MRI",
    modality: "Radiology",
    jobType: "Project",
    location: "Federal Medical Centre, Jabi",
    priority: "High" as const,
    assetNumber: "EQ-RAD-025",
    oem: "Canon Medical",
  },
  {
    dayOffset: 1, // Tuesday
    engineerId: "per_006",
    engineerName: "Emeka Nwosu",
    jobNumber: "JOB-2026-0019",
    model: "XN-1000 Automated Hematology",
    modality: "Laboratory",
    jobType: "Calibration",
    location: "Main Lab, Garki Hospital",
    priority: "Low" as const,
    assetNumber: "EQ-LAB-008",
    oem: "Sysmex",
  },
];

// Template workforce events mapped to day-of-week offsets
const RECURRING_WORKFORCE_TEMPLATES = [
  {
    dayOffset: 1, // Tuesday
    personnelId: "per_001",
    personnelName: "John Doe",
    status: "training" as const,
    title: "Radiation Safety & CT Compliance Training",
    notes: "Mandatory QA certification seminar",
  },
  {
    dayOffset: 4, // Friday
    personnelId: "per_002",
    personnelName: "Amara Okoye",
    status: "training" as const,
    title: "Ultrasound Transducer Calibration Workshop",
    notes: "OEM training session at GE Medical Campus",
  },
  {
    dayOffset: 1, // Tuesday
    personnelId: "per_005",
    personnelName: "Marcus Vance",
    status: "training" as const,
    title: "High-Voltage Generator Safety",
    notes: "Siemens & Philips diagnostic workshop",
  },
  {
    dayOffset: 4, // Friday
    personnelId: "per_013",
    personnelName: "Zainab Sani",
    status: "training" as const,
    title: "MRI Cryogen Handling Safety",
    notes: "Advanced superconducting magnet seminar",
  },
  {
    dayOffset: 4, // Friday
    personnelId: "per_001",
    personnelName: "John Doe",
    status: "leave" as const,
    title: "Approved Annual Leave",
    notes: "Family leave",
  },
  {
    dayOffset: 0, // Monday
    personnelId: "per_006",
    personnelName: "Emeka Nwosu",
    status: "training" as const,
    title: "ISO 15189 Quality Management",
    notes: "Clinical lab quality seminar",
  },
];

function DebriefSchedulePage() {
  const { user } = useAuth();
  const [engineers, setEngineers] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);

  // Default to current week or today
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 21));
  const [unscheduledOpen, setUnscheduledOpen] = useState(false);

  // Custom user rescheduled/reassigned jobs in this session
  const [customJobOverrides, setCustomJobOverrides] = useState<Record<string, Partial<DebriefJob>>>({});

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

  const loadEngineers = useCallback(async () => {
    setLoading(true);
    try {
      const engineersData = await scheduleService.getBiomedicalEngineers();
      setEngineers(engineersData);
    } catch (err) {
      console.error("Failed to load schedule data", err);
      toast.error("Failed to load schedule calendar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEngineers();
  }, [loadEngineers]);

  // Week Dates for the currently viewed week
  const weekDays = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const weekNumber = useMemo(() => getWeekNumber(currentDate), [currentDate]);

  const startDateLabel = formatMonthDay(weekDays[0]);
  const endDateLabel = formatMonthDay(weekDays[6]);
  const yearLabel = weekDays[0].getFullYear();

  // Generate dynamic jobs for the currently viewed week (so next 5 weeks or previous weeks are always populated!)
  const weekJobs = useMemo<DebriefJob[]>(() => {
    return RECURRING_JOB_TEMPLATES.map((tmpl, idx) => {
      const targetDate = formatDateKey(weekDays[tmpl.dayOffset]);
      const jobId = `deb_week_${weekNumber}_${idx + 1}`;

      const override = customJobOverrides[jobId];
      const assignedToId = override?.assignedToId || tmpl.engineerId;
      const assignedToName = override?.assignedToName || tmpl.engineerName;
      const jobStartDate = override?.jobStartDate || targetDate;

      return {
        id: jobId,
        jobNumber: tmpl.jobNumber,
        assetNumber: tmpl.assetNumber,
        modality: tmpl.modality,
        oem: tmpl.oem,
        model: tmpl.model,
        serialNumber: `SN-${tmpl.assetNumber}`,
        warrantyStartDate: "2024-01-01",
        warrantyEndDate: "2025-01-01",
        contractStartDate: "2026-01-01",
        contractEndDate: "2026-12-31",
        contractType: "COMPREHENSIVE",
        yearOfManufacture: "2023",
        jobType: tmpl.jobType,
        jobOpenDate: targetDate,
        jobStartDate,
        equipmentStatus: "UP",
        jobPriority: tmpl.priority,
        assignedToId,
        assignedToName,
        assistedBy: "—",
        location: tmpl.location,
        address: tmpl.location,
        reportedIssue: `Routine service protocol and diagnostic evaluation for ${tmpl.model}.`,
        startDate: jobStartDate,
        jobStatus: "Open",
        stage: "assigned",
        totalPartsCost: 0,
        totalExpensesCost: 0,
        totalJobCost: 0,
        partsUsed: [],
        expenses: [],
        toolsUsed: [],
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }, [weekDays, weekNumber, customJobOverrides]);

  // Generate dynamic workforce availability for the currently viewed week
  const weekAvailabilities = useMemo<EngineerAvailability[]>(() => {
    return RECURRING_WORKFORCE_TEMPLATES.map((tmpl, idx) => {
      const targetDate = formatDateKey(weekDays[tmpl.dayOffset]);
      return {
        id: `avail_week_${weekNumber}_${idx + 1}`,
        personnelId: tmpl.personnelId,
        personnelName: tmpl.personnelName,
        date: targetDate,
        status: tmpl.status,
        title: tmpl.title,
        notes: tmpl.notes,
      };
    });
  }, [weekDays, weekNumber]);

  // Total available workdays (Mon-Fri = 5 days per engineer)
  const totalWorkdays = engineers.length * 5;

  // Calculate days worked for the current week
  const totalDaysWorked = useMemo(() => {
    const weekDateKeys = new Set(weekDays.slice(0, 5).map(formatDateKey));
    let count = 0;
    engineers.forEach((eng) => {
      const engFullName = `${eng.firstName} ${eng.lastName}`.trim().toLowerCase();
      const engFirstName = eng.firstName.toLowerCase();

      const workedDays = new Set<string>();
      weekJobs.forEach((j) => {
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
  }, [engineers, weekJobs, weekDays]);

  const utilizationRate =
    totalWorkdays > 0 ? ((totalDaysWorked / totalWorkdays) * 100).toFixed(0) : "0";

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
    setCurrentDate(new Date(2026, 8, 21));
  };

  // Backlog / Unscheduled Jobs
  const unscheduledJobs = useMemo(() => {
    return [
      {
        id: "unsched_01",
        jobNumber: "JOB-2026-0021",
        assetNumber: "EQ-SURG-004",
        modality: "Surgical",
        oem: "Olympus",
        model: "VISERA ELITE II Video System",
        jobType: "Corrective Maintenance",
        location: "Maitama District Hospital, Abuja",
        jobPriority: "High" as const,
        equipmentStatus: "Down" as const,
        serialNumber: "SN-OLY-4401",
        warrantyStartDate: "2024-01-01",
        warrantyEndDate: "2025-01-01",
        contractStartDate: "2026-01-01",
        contractEndDate: "2026-12-31",
        yearOfManufacture: "2023",
        jobOpenDate: "2026-09-20",
        jobStartDate: "",
        assignedToId: "",
        assignedToName: "Unassigned",
        reportedIssue: "Xenon light source ignition error.",
        jobStatus: "Open" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "unsched_02",
        jobNumber: "JOB-2026-0022",
        assetNumber: "EQ-RAD-029",
        modality: "Radiology",
        oem: "Hologic",
        model: "Selenia Dimensions 3D Mammography",
        jobType: "Planned Preventive Maintenance",
        location: "Garki Hospital Women's Centre",
        jobPriority: "Mid" as const,
        equipmentStatus: "UP" as const,
        serialNumber: "SN-HOLO-9921",
        warrantyStartDate: "2024-01-01",
        warrantyEndDate: "2025-01-01",
        contractStartDate: "2026-01-01",
        contractEndDate: "2026-12-31",
        yearOfManufacture: "2024",
        jobOpenDate: "2026-09-21",
        jobStartDate: "",
        assignedToId: "",
        assignedToName: "Unassigned",
        reportedIssue: "Semi-annual detector flat field calibration.",
        jobStatus: "Open" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }, []);

  const handleSelectJob = (job: DebriefJob) => {
    setSelectedJob(job);
    setDrawerOpen(true);
  };

  const handleJobUpdated = (updated: DebriefJob) => {
    setCustomJobOverrides((prev) => ({
      ...prev,
      [updated.id]: {
        assignedToId: updated.assignedToId,
        assignedToName: updated.assignedToName,
        jobStartDate: updated.jobStartDate,
      },
    }));
  };

  // Drag & Drop Handler
  const handleDropOnTimeline = async (
    payload: DragJobPayload,
    targetEngineerId: string,
    targetEngineerName: string,
    targetDate: string
  ) => {
    if (!isAdmin) return;
    const job = weekJobs.find((j) => j.id === payload.jobId);
    if (!job) return;

    // Check conflict
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

    setCustomJobOverrides((prev) => ({
      ...prev,
      [job.id]: {
        assignedToId: targetEngineerId,
        assignedToName: targetEngineerName,
        jobStartDate: targetDate,
      },
    }));

    toast.success(`Assigned ${job.jobNumber} to ${targetEngineerName} on ${targetDate}`);
  };

  const handleConfirmOverride = async (conflict: SchedulingConflict) => {
    setCustomJobOverrides((prev) => ({
      ...prev,
      [conflict.job.id]: {
        assignedToId: conflict.engineerId,
        assignedToName: conflict.engineerName,
        jobStartDate: conflict.targetDate,
      },
    }));
    toast.warning(
      `Override applied: ${conflict.job.jobNumber} scheduled for ${conflict.engineerName} on ${conflict.targetDate}`
    );
  };

  const handleReassignConflict = async (
    conflict: SchedulingConflict,
    newEngineerId: string,
    newEngineerName: string
  ) => {
    setCustomJobOverrides((prev) => ({
      ...prev,
      [conflict.job.id]: {
        assignedToId: newEngineerId,
        assignedToName: newEngineerName,
        jobStartDate: conflict.targetDate,
      },
    }));
    toast.success(
      `Reassigned ${conflict.job.jobNumber} to ${newEngineerName} on ${conflict.targetDate}`
    );
  };

  const handleRescheduleDateConflict = async (
    conflict: SchedulingConflict,
    newDate: string
  ) => {
    setCustomJobOverrides((prev) => ({
      ...prev,
      [conflict.job.id]: {
        assignedToId: conflict.engineerId,
        assignedToName: conflict.engineerName,
        jobStartDate: newDate,
      },
    }));
    toast.success(
      `Rescheduled ${conflict.job.jobNumber} to ${newDate} for ${conflict.engineerName}`
    );
  };

  return (
    <div className="w-full space-y-5 pb-12">
      <PageHeader
        title="Schedule Calendar"
        subtitle={
          isAdmin
            ? "Weekly biomedical engineer dispatch calendar, hospital service assignments, workforce availability, and capacity utilization."
            : "Weekly schedule calendar: view your scheduled hospital visits and equipment debriefs."
        }
      />

      {/* Top Header Controls with Centered Date Picker */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3.5 rounded-2xl border border-border bg-card shadow-2xs">
        {/* Left Side: Telemetry Metrics Card (Dynamically updates with viewed week's stats) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 text-xs font-semibold text-foreground">
            <span>{engineers.length} Engineers</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-bold text-primary">{weekJobs.length} Scheduled Jobs</span>
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

      {/* Horizontal Bar Legend with Dots */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border shadow-2xs text-xs">
        {/* Job Types with colored dots */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-bold text-muted-foreground flex items-center gap-1 text-[11px] uppercase tracking-wider">
            <Layers className="size-3.5 text-primary" />
            Job Types:
          </span>
          {Object.entries(JOB_TYPE_COLORS).slice(0, 7).map(([key, style]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full shrink-0", style.dotColor)} />
              <span className="text-foreground font-medium text-[11px]">
                {key}
              </span>
            </div>
          ))}
        </div>

        {/* Workforce Status Dots */}
        <div className="flex flex-wrap items-center gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40">
          <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">Workforce:</span>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground text-[11px]">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground text-[11px]">Training</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-sky-500" />
            <span className="text-muted-foreground text-[11px]">Annual Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-rose-500" />
            <span className="text-muted-foreground text-[11px]">Sick Leave / Off</span>
          </div>
        </div>
      </div>

      {/* Main Full-Width Board & Optional Unscheduled Queue Tray */}
      <div className="flex flex-col xl:flex-row items-start gap-5 w-full">
        <div className="flex-1 w-full overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-xs text-muted-foreground font-semibold">
              Loading schedule calendar...
            </div>
          ) : (
            <ScheduleTimelineView
              currentDate={currentDate}
              weekNumber={weekNumber}
              engineers={engineers}
              jobs={weekJobs}
              availabilities={weekAvailabilities}
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
