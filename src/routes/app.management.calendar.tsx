import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { debriefService } from "@/modules/debrief/services/debrief-service";
import { scheduleService } from "@/modules/debrief/services/schedule-service";
import type { DebriefJob } from "@/modules/debrief/types";
import type { Personnel } from "@/modules/settings/types";
import type { EngineerAvailability } from "@/modules/debrief/mocks/workforce-availability";
import { ScheduleTimelineView } from "@/modules/debrief/components/schedule/schedule-timeline-view";
import { ScheduleDetailDrawer } from "@/modules/debrief/components/schedule/schedule-detail-drawer";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Activity,
  Layers,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/management/calendar")({
  head: () => ({
    meta: [
      { title: "Service Calendar — Management | HEMP" },
      {
        name: "description",
        content:
          "Executive weekly service and dispatch calendar: biomedical engineer schedules, hospital field assignments, and workforce utilization (Read Only).",
      },
    ],
  }),
  component: ManagementCalendarPage,
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

const RECURRING_JOB_TEMPLATES = [
  {
    dayOffset: 0,
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
    dayOffset: 2,
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
    dayOffset: 1,
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
    dayOffset: 3,
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
    dayOffset: 3,
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
    dayOffset: 0,
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
    dayOffset: 2,
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
    dayOffset: 2,
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
    dayOffset: 4,
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
    dayOffset: 3,
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
    dayOffset: 1,
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

const RECURRING_WORKFORCE_TEMPLATES = [
  {
    dayOffset: 1,
    personnelId: "per_001",
    personnelName: "John Doe",
    status: "training" as const,
    title: "Radiation Safety & CT Compliance Training",
    notes: "Mandatory QA certification seminar",
  },
  {
    dayOffset: 4,
    personnelId: "per_002",
    personnelName: "Amara Okoye",
    status: "training" as const,
    title: "Ultrasound Transducer Calibration Workshop",
    notes: "OEM training session at GE Medical Campus",
  },
  {
    dayOffset: 1,
    personnelId: "per_005",
    personnelName: "Marcus Vance",
    status: "training" as const,
    title: "High-Voltage Generator Safety",
    notes: "Siemens & Philips diagnostic workshop",
  },
  {
    dayOffset: 4,
    personnelId: "per_013",
    personnelName: "Zainab Sani",
    status: "training" as const,
    title: "MRI Cryogen Handling Safety",
    notes: "Advanced superconducting magnet seminar",
  },
  {
    dayOffset: 4,
    personnelId: "per_001",
    personnelName: "John Doe",
    status: "leave" as const,
    title: "Approved Annual Leave",
    notes: "Family leave",
  },
  {
    dayOffset: 0,
    personnelId: "per_006",
    personnelName: "Emeka Nwosu",
    status: "training" as const,
    title: "ISO 15189 Quality Management",
    notes: "Clinical lab quality seminar",
  },
];

function ManagementCalendarPage() {
  const [engineers, setEngineers] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 21));
  const [selectedJob, setSelectedJob] = useState<DebriefJob | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [engList] = await Promise.all([
        scheduleService.getBiomedicalEngineers(),
        debriefService.list(),
      ]);
      setEngineers(engList);
    } catch (err) {
      console.error("Failed to load management calendar data", err);
      toast.error("Failed to load service calendar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Week calculation
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const weekNumber = useMemo(() => getWeekNumber(currentDate), [currentDate]);

  // Generate dynamic scheduled jobs for the current week
  const displayJobs = useMemo(() => {
    const monday = weekDates[0];
    return RECURRING_JOB_TEMPLATES.map((tmpl, idx) => {
      const targetDay = new Date(monday);
      targetDay.setDate(monday.getDate() + tmpl.dayOffset);
      const dateStr = formatDateKey(targetDay);

      return {
        id: `m-sched-job-${idx}-${dateStr}`,
        jobNumber: tmpl.jobNumber,
        assignedToId: tmpl.engineerId,
        assignedToName: tmpl.engineerName,
        jobStartDate: dateStr,
        startDate: dateStr,
        jobStatus: "Assigned" as const,
        jobPriority: tmpl.priority,
        jobType: tmpl.jobType,
        equipmentModel: tmpl.model,
        modality: tmpl.modality,
        location: tmpl.location,
        assetNumber: tmpl.assetNumber,
        oem: tmpl.oem,
        scheduledStartTime: "09:00",
        scheduledEndTime: "14:00",
        reportedIssue: "Scheduled preventive maintenance & performance certification.",
        createdAt: "2026-09-01",
        updatedAt: "2026-09-01",
      } as DebriefJob;
    });
  }, [weekDates]);

  // Generate dynamic availability for current week
  const displayAvailabilities = useMemo(() => {
    const monday = weekDates[0];
    return RECURRING_WORKFORCE_TEMPLATES.map((tmpl, idx) => {
      const targetDay = new Date(monday);
      targetDay.setDate(monday.getDate() + tmpl.dayOffset);
      const dateStr = formatDateKey(targetDay);

      return {
        id: `m-avail-${idx}-${dateStr}`,
        personnelId: tmpl.personnelId,
        personnelName: tmpl.personnelName,
        date: dateStr,
        status: tmpl.status,
        title: tmpl.title,
        notes: tmpl.notes,
      } as EngineerAvailability;
    });
  }, [weekDates]);

  // Week navigation
  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 8, 21));
  };

  const handleSelectJob = (job: DebriefJob) => {
    setSelectedJob(job);
    setDrawerOpen(true);
  };

  const startFormatted = formatMonthDay(weekDates[0]);
  const endFormatted = formatMonthDay(weekDates[6]);
  const yearString = weekDates[0].getFullYear();

  return (
    <div className="w-full space-y-5 pb-12">
      <PageHeader
        title="Service Calendar"
        subtitle="Weekly biomedical engineer dispatch calendar, hospital service assignments, workforce availability, and capacity utilization (Read Only)."
        icon={CalendarRange}
      />

      {/* Week Navigator & Metrics Bar */}
      <div className="rounded-xl border border-border bg-card p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevWeek}
            className="h-8 w-8 p-0 cursor-pointer"
            title="Previous Week"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-8 px-2.5 text-xs font-semibold cursor-pointer"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextWeek}
            className="h-8 w-8 p-0 cursor-pointer"
            title="Next Week"
          >
            <ChevronRight className="size-4" />
          </Button>

          <div className="flex items-center gap-2 ml-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary font-bold text-xs">
              <Calendar className="size-3.5" />
              Week {weekNumber}
            </span>
            <span className="font-bold text-sm text-foreground">
              {startFormatted} – {endFormatted}, {yearString}
            </span>
          </div>
        </div>

        {/* Executive summary pill indicators */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 border border-border/80">
            <Users className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Engineers:</span>
            <strong className="text-foreground font-mono">{engineers.length}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 border border-border/80">
            <Layers className="size-3.5 text-primary" />
            <span className="text-muted-foreground">Jobs This Week:</span>
            <strong className="text-foreground font-mono">{displayJobs.length}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 border border-border/80">
            <GraduationCap className="size-3.5 text-amber-500" />
            <span className="text-muted-foreground">Training/Leave:</span>
            <strong className="text-foreground font-mono">{displayAvailabilities.length}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
            <Activity className="size-3.5" />
            <span>Read-Only View</span>
          </div>
        </div>
      </div>

      {/* Main Schedule Timeline Table */}
      {loading ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-xs text-muted-foreground">
          <Calendar className="size-6 text-primary mx-auto mb-2 animate-pulse" />
          Loading service calendar...
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
          <ScheduleTimelineView
            currentDate={currentDate}
            weekNumber={weekNumber}
            engineers={engineers}
            jobs={displayJobs}
            availabilities={displayAvailabilities}
            isAdmin={false}
            onSelectJob={handleSelectJob}
            onDropJob={() => {}}
          />
        </div>
      )}

      {/* Read-Only Schedule Detail Drawer */}
      <ScheduleDetailDrawer
        job={selectedJob}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        isAdmin={false}
        readOnly={true}
        onJobUpdated={() => {}}
      />
    </div>
  );
}
