import { MOCK_PERSONNEL } from "@/modules/settings/mocks/personnel";
import {
  MOCK_ENGINEER_AVAILABILITY,
  type EngineerAvailability,
  type AvailabilityStatus,
} from "../mocks/workforce-availability";
import type { Personnel } from "@/modules/settings/types";

export interface WorkingScheduleConfig {
  personnelId: string;
  startTime: string; // e.g. "08:00"
  endTime: string; // e.g. "17:00"
  breakDurationHours: number; // e.g. 1.0
  workingDays: number[]; // [1, 2, 3, 4, 5] (Monday=1 ... Friday=5). Saturday (6) and Sunday (0) are locked.
}

export interface AvailabilityTypeDefinition {
  code: AvailabilityStatus | "working";
  label: string;
  description: string;
  dotColor: string;
  badgeClass: string;
  allowsJobScheduling: boolean;
}

export const DEFAULT_AVAILABILITY_DEFINITIONS: AvailabilityTypeDefinition[] = [
  {
    code: "working",
    label: "Working",
    description: "Standard active duty shift available for normal service job dispatch",
    dotColor: "bg-emerald-500",
    badgeClass: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-200",
    allowsJobScheduling: true,
  },
  {
    code: "training",
    label: "Training",
    description: "Attending OEM equipment or QA safety training seminar (unavailable for jobs)",
    dotColor: "bg-amber-500",
    badgeClass: "bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200",
    allowsJobScheduling: false,
  },
  {
    code: "leave",
    label: "Leave",
    description: "HR approved annual, compassionate, or medical sick leave (unavailable for jobs)",
    dotColor: "bg-sky-500",
    badgeClass: "bg-sky-100 dark:bg-sky-950/70 text-sky-950 dark:text-sky-200",
    allowsJobScheduling: false,
  },
  {
    code: "off",
    label: "Off-Day",
    description: "Roster rest day or compensatory day off (unavailable for jobs)",
    dotColor: "bg-slate-500",
    badgeClass: "bg-slate-100 dark:bg-slate-900/80 text-slate-950 dark:text-slate-200",
    allowsJobScheduling: false,
  },
  {
    code: "busy",
    label: "Other Unavailable",
    description: "Special internal admin duties or emergency facility assignment",
    dotColor: "bg-purple-500",
    badgeClass: "bg-purple-100 dark:bg-purple-950/70 text-purple-950 dark:text-purple-200",
    allowsJobScheduling: false,
  },
];

const SCHEDULE_STORAGE_KEY = "hemp.workforce.schedules";
const AVAILABILITY_STORAGE_KEY = "hemp.workforce.availability";
const LEGEND_STORAGE_KEY = "hemp.workforce.legend";

class WorkforceService {
  private schedules: Record<string, WorkingScheduleConfig> = {};
  private availability: EngineerAvailability[] = [...MOCK_ENGINEER_AVAILABILITY];
  private legendDefinitions: AvailabilityTypeDefinition[] = [...DEFAULT_AVAILABILITY_DEFINITIONS];
  private initialized = false;

  private init() {
    if (this.initialized) return;
    if (typeof window !== "undefined") {
      try {
        const storedSched = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        if (storedSched) this.schedules = JSON.parse(storedSched);

        const storedAvail = localStorage.getItem(AVAILABILITY_STORAGE_KEY);
        if (storedAvail) this.availability = JSON.parse(storedAvail);

        const storedLegend = localStorage.getItem(LEGEND_STORAGE_KEY);
        if (storedLegend) this.legendDefinitions = JSON.parse(storedLegend);
      } catch (e) {
        console.error("Failed to load workforce storage", e);
      }
    }
    this.initialized = true;
  }

  private save() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(this.schedules));
        localStorage.setItem(AVAILABILITY_STORAGE_KEY, JSON.stringify(this.availability));
        localStorage.setItem(LEGEND_STORAGE_KEY, JSON.stringify(this.legendDefinitions));
      } catch (e) {
        console.error("Failed to save workforce storage", e);
      }
    }
  }

  getLegendDefinitions(): AvailabilityTypeDefinition[] {
    this.init();
    return [...this.legendDefinitions];
  }

  updateLegendDefinition(code: string, updates: Partial<AvailabilityTypeDefinition>) {
    this.init();
    this.legendDefinitions = this.legendDefinitions.map((item) =>
      item.code === code ? { ...item, ...updates } : item
    );
    this.save();
    return [...this.legendDefinitions];
  }

  /**
   * Retrieves or initializes default schedule config for an engineer (Mon-Fri, 08:00 - 17:00, 1h break = 8h net).
   * Weekend work is permanently locked/excluded.
   */
  getScheduleConfig(personnelId: string): WorkingScheduleConfig {
    this.init();
    if (this.schedules[personnelId]) {
      return { ...this.schedules[personnelId] };
    }
    const def: WorkingScheduleConfig = {
      personnelId,
      startTime: "08:00",
      endTime: "17:00",
      breakDurationHours: 1.0,
      workingDays: [1, 2, 3, 4, 5], // Mon to Fri
    };
    this.schedules[personnelId] = def;
    return { ...def };
  }

  saveScheduleConfig(config: WorkingScheduleConfig) {
    this.init();
    // Enforce weekend restriction rule: Saturday (6) and Sunday (0) can never be active working days
    config.workingDays = config.workingDays.filter((d) => d >= 1 && d <= 5);
    this.schedules[config.personnelId] = { ...config };
    this.save();
  }

  getAllAvailabilities(): EngineerAvailability[] {
    this.init();
    return [...this.availability];
  }

  getAvailabilityForEngineer(personnelId: string): EngineerAvailability[] {
    this.init();
    return this.availability.filter(
      (a) => a.personnelId === personnelId || a.personnelName.toLowerCase() === personnelId.toLowerCase()
    );
  }

  addAvailabilityPeriod(entry: Omit<EngineerAvailability, "id">): EngineerAvailability {
    this.init();
    const newEntry: EngineerAvailability = {
      id: `avail_cust_${Date.now()}`,
      ...entry,
    };
    this.availability.unshift(newEntry);
    this.save();
    return newEntry;
  }

  removeAvailabilityPeriod(id: string): boolean {
    this.init();
    const lenBefore = this.availability.length;
    this.availability = this.availability.filter((a) => a.id !== id);
    if (this.availability.length !== lenBefore) {
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Calculates net daily shift duration in hours.
   */
  calculateDailyShiftHours(config: WorkingScheduleConfig): number {
    const [startH, startM] = config.startTime.split(":").map(Number);
    const [endH, endM] = config.endTime.split(":").map(Number);

    const startTotal = startH + (startM || 0) / 60;
    const endTotal = endH + (endM || 0) / 60;
    const gross = Math.max(0, endTotal - startTotal);
    return Math.max(0, gross - (config.breakDurationHours || 0));
  }

  /**
   * System-calculates the engineer's available working hours for a given week.
   * Admin does NOT manually enter a weekly total.
   */
  calculateWeeklyAvailableTime(
    personnelId: string,
    personnelName: string,
    weekDates: Date[]
  ): {
    standardWeeklyHours: number;
    availableWorkingHours: number;
    unavailableHours: number;
    daysBreakdown: Array<{
      date: string;
      dayOfWeek: number;
      dayName: string;
      isWeekend: boolean;
      status: AvailabilityStatus | "working";
      title: string;
      shiftHours: number;
      availableHours: number;
    }>;
  } {
    this.init();
    const config = this.getScheduleConfig(personnelId);
    const dailyHours = this.calculateDailyShiftHours(config);

    const engAvailabilities = this.getAvailabilityForEngineer(personnelId);
    const engFullName = personnelName.toLowerCase();

    let standardWeeklyHours = 0;
    let availableWorkingHours = 0;
    let unavailableHours = 0;

    const daysBreakdown = weekDates.map((dateObj) => {
      const dayOfWeek = dateObj.getDay(); // 0 is Sun, 1 is Mon...
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dateKey = dateObj.toISOString().split("T")[0];
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });

      const isWorkingDay = !isWeekend && config.workingDays.includes(dayOfWeek);
      const shiftHours = isWorkingDay ? dailyHours : 0;

      if (isWorkingDay) {
        standardWeeklyHours += shiftHours;
      }

      // Check if engineer has recorded unavailable period (Training, Leave, Off, etc.)
      const period = engAvailabilities.find(
        (a) =>
          (a.personnelId === personnelId || a.personnelName.toLowerCase() === engFullName) &&
          a.date === dateKey
      );

      if (isWeekend) {
        return {
          date: dateKey,
          dayOfWeek,
          dayName,
          isWeekend: true,
          status: "off" as const,
          title: "Weekend Off (System Rest)",
          shiftHours: 0,
          availableHours: 0,
        };
      }

      if (period && period.status !== "available") {
        unavailableHours += shiftHours;
        return {
          date: dateKey,
          dayOfWeek,
          dayName,
          isWeekend: false,
          status: period.status,
          title: period.title,
          shiftHours,
          availableHours: 0,
        };
      }

      if (isWorkingDay) {
        availableWorkingHours += shiftHours;
        return {
          date: dateKey,
          dayOfWeek,
          dayName,
          isWeekend: false,
          status: "working" as const,
          title: `Active Shift (${config.startTime} - ${config.endTime})`,
          shiftHours,
          availableHours: shiftHours,
        };
      }

      return {
        date: dateKey,
        dayOfWeek,
        dayName,
        isWeekend: false,
        status: "off" as const,
        title: "Roster Day Off",
        shiftHours: 0,
        availableHours: 0,
      };
    });

    return {
      standardWeeklyHours,
      availableWorkingHours,
      unavailableHours,
      daysBreakdown,
    };
  }
}

export const workforceService = new WorkforceService();
