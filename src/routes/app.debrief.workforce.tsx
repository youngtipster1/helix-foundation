import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { isModuleAdmin } from "@/features/auth/permissions";
import { scheduleService } from "@/modules/debrief/services/schedule-service";
import { workforceService } from "@/modules/debrief/services/workforce-service";
import type { Personnel } from "@/modules/settings/types";
import { WorkforceRosterTable } from "@/modules/debrief/components/workforce/workforce-roster-table";
import { ManageAvailabilityModal } from "@/modules/debrief/components/workforce/manage-availability-modal";
import { CalendarLegendCard } from "@/modules/debrief/components/workforce/calendar-legend-card";
import {
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  CalendarOff,
  ClipboardList,
  CalendarRange,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/debrief/workforce")({
  head: () => ({
    meta: [
      { title: "Workforce Management — Debrief | HEMP" },
      {
        name: "description",
        content:
          "Admin workforce availability and capacity management: working schedules, training, leave periods, and calendar legend definitions.",
      },
    ],
  }),
  component: DebriefWorkforcePage,
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

function formatMonthDay(d: Date): string {
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  return `${month} ${day}`;
}

function DebriefWorkforcePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [engineers, setEngineers] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected week
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 21));

  // Selected engineer for schedule management modal
  const [selectedEngineer, setSelectedEngineer] = useState<Personnel | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Reload trigger
  const [refreshKey, setRefreshKey] = useState(0);

  const isAdmin =
    Boolean(user?.isSuperAdmin) ||
    user?.role === "Super Admin" ||
    isModuleAdmin(user, "debrief") ||
    (user?.role || "").toLowerCase().includes("admin");

  const loadEngineers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await scheduleService.getBiomedicalEngineers();
      setEngineers(data);
    } catch (err) {
      console.error("Failed to load workforce roster", err);
      toast.error("Failed to load workforce roster");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEngineers();
  }, [loadEngineers, refreshKey]);

  const weekDays = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const weekNumber = useMemo(() => getWeekNumber(currentDate), [currentDate]);

  const startDateLabel = formatMonthDay(weekDays[0]);
  const endDateLabel = formatMonthDay(weekDays[6]);
  const yearLabel = weekDays[0].getFullYear();

  // Summary Telemetry Calculations for the viewed week
  const weekMetrics = useMemo(() => {
    let totalStandardHours = 0;
    let totalAvailableHours = 0;
    let trainingCount = 0;
    let leaveCount = 0;

    const weekDateKeys = new Set(weekDays.slice(0, 5).map((d) => d.toISOString().split("T")[0]));

    engineers.forEach((eng) => {
      const calc = workforceService.calculateWeeklyAvailableTime(
        eng.id,
        `${eng.firstName} ${eng.lastName}`,
        weekDays
      );
      totalStandardHours += calc.standardWeeklyHours;
      totalAvailableHours += calc.availableWorkingHours;

      const periods = workforceService.getAvailabilityForEngineer(eng.id);
      periods.forEach((p) => {
        if (weekDateKeys.has(p.date)) {
          if (p.status === "training") trainingCount++;
          if (p.status === "leave" || p.status === "off") leaveCount++;
        }
      });
    });

    return {
      totalStandardHours,
      totalAvailableHours,
      trainingCount,
      leaveCount,
    };
  }, [engineers, weekDays, refreshKey]);

  // Navigation handlers
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

  const handleManageEngineer = (eng: Personnel) => {
    setSelectedEngineer(eng);
    setModalOpen(true);
  };

  const handleScheduleUpdated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <PageHeader
        eyebrow="Debrief Module"
        title="Workforce Management"
        subtitle={
          isAdmin
            ? "Manage engineer working schedules, record training and leave periods, inspect capacity, and define calendar legend rules."
            : "Workforce directory and weekly working capacity schedule."
        }
        icon={Users}
      />

      {/* Top Module Subnavigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/app/debrief" })}
          className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer border flex items-center gap-2 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
        >
          <ClipboardList className="size-3.5" />
          <span>Jobs</span>
        </button>

        <button
          type="button"
          onClick={() => navigate({ to: "/app/debrief/schedule" })}
          className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer border flex items-center gap-2 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
        >
          <CalendarRange className="size-3.5" />
          <span>Schedule Calendar</span>
        </button>

        <button
          type="button"
          className="px-4 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer border flex items-center gap-2 bg-primary text-primary-foreground border-primary shadow-xs"
        >
          <Users className="size-3.5" />
          <span>Workforce</span>
          <span className="px-1.5 py-0.5 rounded-full text-xs font-bold leading-none bg-primary-foreground/20 text-primary-foreground">
            {engineers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate({ to: "/app/debrief/my-work" })}
          className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer border flex items-center gap-2 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
        >
          <Wrench className="size-3.5" />
          <span>My Work</span>
        </button>
      </div>

      {/* Centered Date Navigator Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3.5 rounded-2xl border border-border bg-card shadow-2xs">
        {/* Left Side: Week Context Label */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-muted/40 text-xs font-semibold text-foreground">
            <span>Workforce Capacity Engine</span>
          </div>
        </div>

        {/* Center: Centered Week Picker */}
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

        {/* Right Side: Total Available Hours Badge */}
        <div className="flex items-center justify-end gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold">
            <span>{weekMetrics.totalAvailableHours.toFixed(0)}h Total Available this Week</span>
          </div>
        </div>
      </div>

      {/* Telemetry KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-semibold">Active Roster</span>
            <Users className="size-4 text-primary" />
          </div>
          <div className="font-mono font-bold text-xl text-foreground">
            {engineers.length} Engineers
          </div>
          <p className="text-[11px] text-muted-foreground">Clinical &amp; workshop specialists</p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-semibold">Calculated Available Time</span>
            <Clock className="size-4 text-emerald-500" />
          </div>
          <div className="font-mono font-bold text-xl text-foreground">
            {weekMetrics.totalAvailableHours.toFixed(0)} Hours
          </div>
          <p className="text-[11px] text-muted-foreground">
            of {weekMetrics.totalStandardHours.toFixed(0)}h standard potential
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-semibold">In Training (This Week)</span>
            <GraduationCap className="size-4 text-amber-500" />
          </div>
          <div className="font-mono font-bold text-xl text-foreground">
            {weekMetrics.trainingCount} Scheduled
          </div>
          <p className="text-[11px] text-muted-foreground">QA &amp; OEM certification seminars</p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-semibold">Leave &amp; Off Periods</span>
            <CalendarOff className="size-4 text-rose-500" />
          </div>
          <div className="font-mono font-bold text-xl text-foreground">
            {weekMetrics.leaveCount} Periods
          </div>
          <p className="text-[11px] text-muted-foreground">Annual leave &amp; roster rest days</p>
        </div>
      </div>

      {/* Main Workforce Roster Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span>Engineer Working Schedules &amp; Weekly Capacity</span>
          </h3>
          <span className="text-[11px] text-muted-foreground font-mono hidden sm:inline-block">
            Calculated for Week {weekNumber} ({startDateLabel} – {endDateLabel})
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-muted-foreground font-semibold">
            Loading workforce roster and availability schedules...
          </div>
        ) : (
          <WorkforceRosterTable
            engineers={engineers}
            weekDates={weekDays}
            onManageEngineer={handleManageEngineer}
          />
        )}
      </div>

      {/* Calendar Legend Configuration Section (Owned by Workforce) */}
      <CalendarLegendCard onLegendUpdated={handleScheduleUpdated} />

      {/* Manage Availability & Working Schedule Modal */}
      <ManageAvailabilityModal
        engineer={selectedEngineer}
        weekDates={weekDays}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onScheduleUpdated={handleScheduleUpdated}
      />
    </div>
  );
}
