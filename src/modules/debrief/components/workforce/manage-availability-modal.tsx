import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Personnel } from "@/modules/settings/types";
import {
  workforceService,
  type WorkingScheduleConfig,
} from "../../services/workforce-service";
import type { AvailabilityStatus } from "../../mocks/workforce-availability";
import {
  Clock,
  Calendar,
  Lock,
  GraduationCap,
  CalendarOff,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ManageAvailabilityModalProps {
  engineer: Personnel | null;
  weekDates: Date[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduleUpdated: () => void;
}

const DAYS_OF_WEEK = [
  { dayNumber: 1, name: "Monday" },
  { dayNumber: 2, name: "Tuesday" },
  { dayNumber: 3, name: "Wednesday" },
  { dayNumber: 4, name: "Thursday" },
  { dayNumber: 5, name: "Friday" },
  { dayNumber: 6, name: "Saturday", locked: true },
  { dayNumber: 0, name: "Sunday", locked: true },
];

export function ManageAvailabilityModal({
  engineer,
  weekDates,
  open,
  onOpenChange,
  onScheduleUpdated,
}: ManageAvailabilityModalProps) {
  const [scheduleConfig, setScheduleConfig] = useState<WorkingScheduleConfig>({
    personnelId: "",
    startTime: "08:00",
    endTime: "17:00",
    breakDurationHours: 1.0,
    workingDays: [1, 2, 3, 4, 5],
  });

  // Unavailable period creation form state
  const [newType, setNewType] = useState<AvailabilityStatus>("training");
  const [newDate, setNewDate] = useState<string>("");
  const [newTitle, setNewTitle] = useState<string>("");
  const [newNotes, setNewNotes] = useState<string>("");

  useEffect(() => {
    if (engineer && open) {
      const config = workforceService.getScheduleConfig(engineer.id);
      setScheduleConfig(config);
      setNewDate(weekDates[0]?.toISOString().split("T")[0] || "");
      setNewTitle("");
      setNewNotes("");
    }
  }, [engineer, open, weekDates]);

  if (!engineer) return null;

  // Calculate daily shift hours
  const dailyShiftHours = workforceService.calculateDailyShiftHours(scheduleConfig);

  // Calculate weekly working time breakdown for the selected week
  const weeklyCalc = workforceService.calculateWeeklyAvailableTime(
    engineer.id,
    `${engineer.firstName} ${engineer.lastName}`,
    weekDates
  );

  const existingPeriods = workforceService.getAvailabilityForEngineer(engineer.id);

  const handleToggleDay = (dayNumber: number) => {
    // Weekend restriction rule: Saturday (6) and Sunday (0) are permanently locked
    if (dayNumber === 0 || dayNumber === 6) return;

    setScheduleConfig((prev) => {
      const exists = prev.workingDays.includes(dayNumber);
      const updated = exists
        ? prev.workingDays.filter((d) => d !== dayNumber)
        : [...prev.workingDays, dayNumber];
      return { ...prev, workingDays: updated };
    });
  };

  const handleSaveWorkingSchedule = () => {
    workforceService.saveScheduleConfig(scheduleConfig);
    toast.success(`Working schedule saved for ${engineer.firstName} ${engineer.lastName}`);
    onScheduleUpdated();
  };

  const handleAddUnavailablePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTitle.trim()) {
      toast.error("Please provide both a date and a title/reason.");
      return;
    }

    workforceService.addAvailabilityPeriod({
      personnelId: engineer.id,
      personnelName: `${engineer.firstName} ${engineer.lastName}`,
      date: newDate,
      status: newType,
      title: newTitle.trim(),
      notes: newNotes.trim() || undefined,
    });

    toast.success(`Recorded ${newType} period for ${newDate}`);
    setNewTitle("");
    setNewNotes("");
    onScheduleUpdated();
  };

  const handleRemovePeriod = (id: string) => {
    workforceService.removeAvailabilityPeriod(id);
    toast.info("Unavailable period removed");
    onScheduleUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center gap-2 text-primary">
            <Briefcase className="size-5" />
            <DialogTitle className="text-base font-bold text-foreground">
              Manage Workforce Schedule &amp; Availability
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure working hours, system-calculated capacity, and unavailable periods for{" "}
            <span className="font-bold text-foreground">
              {engineer.firstName} {engineer.lastName}
            </span>{" "}
            ({engineer.jobTitle} · {engineer.department}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3 text-xs">
          {/* SECTION 1: Standard Working Hours & Working Days */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-3 shadow-2xs">
            <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" />
              1. Configurable Working Hours &amp; Active Shift Days
            </h4>

            {/* Shift times row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="shift-start" className="text-xs font-medium">
                  Shift Start Time
                </Label>
                <Input
                  id="shift-start"
                  type="time"
                  value={scheduleConfig.startTime}
                  onChange={(e) =>
                    setScheduleConfig((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                  className="h-8.5 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="shift-end" className="text-xs font-medium">
                  Shift End Time
                </Label>
                <Input
                  id="shift-end"
                  type="time"
                  value={scheduleConfig.endTime}
                  onChange={(e) =>
                    setScheduleConfig((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                  className="h-8.5 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="break-dur" className="text-xs font-medium">
                  Break Duration (Hours)
                </Label>
                <Input
                  id="break-dur"
                  type="number"
                  step="0.5"
                  min="0"
                  max="4"
                  value={scheduleConfig.breakDurationHours}
                  onChange={(e) =>
                    setScheduleConfig((prev) => ({
                      ...prev,
                      breakDurationHours: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-8.5 text-xs bg-background"
                />
              </div>
            </div>

            {/* Net daily shift calculation notice */}
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between font-mono text-[11px]">
              <span className="text-muted-foreground">Calculated Daily Net Working Time:</span>
              <span className="font-bold text-foreground text-xs">
                {dailyShiftHours.toFixed(1)} Hours / day
              </span>
            </div>

            {/* Working days checkboxes */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-medium text-foreground">
                Configured Working Days (Weekend Restricted by System Rule)
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK.map((d) => {
                  const isChecked = scheduleConfig.workingDays.includes(d.dayNumber);
                  const isLockedWeekend = d.locked;

                  return (
                    <button
                      key={d.dayNumber}
                      type="button"
                      disabled={isLockedWeekend}
                      onClick={() => handleToggleDay(d.dayNumber)}
                      className={cn(
                        "p-2 rounded-lg text-center text-xs font-semibold transition-all border",
                        isLockedWeekend
                          ? "bg-muted/40 text-muted-foreground/60 border-border/40 cursor-not-allowed"
                          : isChecked
                          ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs cursor-pointer"
                          : "bg-background text-muted-foreground border-border hover:bg-muted cursor-pointer"
                      )}
                    >
                      <div className="text-[11px] truncate">{d.name.slice(0, 3)}</div>
                      {isLockedWeekend ? (
                        <span className="text-[9px] font-mono flex items-center justify-center gap-0.5 mt-0.5 opacity-80">
                          <Lock className="size-2.5" /> Off
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono mt-0.5 block">
                          {isChecked ? `${dailyShiftHours}h` : "Off"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Lock className="size-3 text-muted-foreground shrink-0" />
                <span>System Rule Enforced: Users cannot be scheduled for weekend work (Sat &amp; Sun are locked).</span>
              </p>
            </div>

            <Button
              size="sm"
              onClick={handleSaveWorkingSchedule}
              className="h-8 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              Save Working Hours &amp; Days
            </Button>
          </div>

          {/* SECTION 2: System-Calculated Weekly Capacity */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                2. System-Calculated Weekly Working Capacity
              </h4>
              <span className="text-[11px] text-muted-foreground font-mono">
                Admin does not enter weekly totals manually
              </span>
            </div>

            {/* Daily Breakdown Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
              {weeklyCalc.daysBreakdown.map((item) => (
                <div
                  key={item.date}
                  className={cn(
                    "p-2 rounded-lg text-center space-y-1 border",
                    item.isWeekend
                      ? "bg-muted/30 border-border/40 text-muted-foreground/60"
                      : item.status === "working"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-950 dark:text-emerald-200"
                      : item.status === "training"
                      ? "bg-amber-500/15 border-amber-500/30 text-amber-950 dark:text-amber-200"
                      : "bg-rose-500/15 border-rose-500/30 text-rose-950 dark:text-rose-200"
                  )}
                >
                  <div className="text-[11px] font-bold uppercase">{item.dayName}</div>
                  <div className="text-[10px] font-mono opacity-80">{item.date.slice(5)}</div>
                  <div className="font-mono font-bold text-xs pt-0.5 border-t border-current/20">
                    {item.availableHours.toFixed(1)}h
                  </div>
                  <div className="text-[9px] truncate font-medium">{item.status}</div>
                </div>
              ))}
            </div>

            {/* Total System Calculation Summary */}
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold block">
                  Total Calculated Available Working Time this Week:
                </span>
                <span className="font-mono font-black text-sm">
                  {weeklyCalc.availableWorkingHours.toFixed(1)} Hours
                </span>
              </div>
              <div className="text-right text-[11px] font-mono">
                <span>Standard: {weeklyCalc.standardWeeklyHours.toFixed(1)}h</span>
                <span className="block text-muted-foreground">
                  Unavailable: {weeklyCalc.unavailableHours.toFixed(1)}h
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: Record Unavailable Periods */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-3 shadow-2xs">
            <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <CalendarOff className="size-3.5 text-primary" />
              3. Record Unavailable Periods (Training, Leave, Off-Days)
            </h4>

            {/* Add new unavailable period form */}
            <form onSubmit={handleAddUnavailablePeriod} className="space-y-3 p-3 rounded-lg bg-muted/20 border border-border/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="unavail-type" className="text-xs font-medium">
                    Availability State / Category
                  </Label>
                  <Select
                    value={newType}
                    onValueChange={(val) => setNewType(val as AvailabilityStatus)}
                  >
                    <SelectTrigger id="unavail-type" className="h-8.5 text-xs bg-background">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="training" className="text-xs">Training (Seminar / Workshop)</SelectItem>
                      <SelectItem value="leave" className="text-xs">Leave (Annual / Sick / Medical)</SelectItem>
                      <SelectItem value="off" className="text-xs">Off-Day (Roster Rest Day)</SelectItem>
                      <SelectItem value="busy" className="text-xs">Other Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="unavail-date" className="text-xs font-medium">
                    Target Date
                  </Label>
                  <Input
                    id="unavail-date"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="h-8.5 text-xs bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="unavail-title" className="text-xs font-medium">
                  Title / Reason / Certification Name
                </Label>
                <Input
                  id="unavail-title"
                  placeholder="e.g. Radiation Safety & CT Compliance Certification"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-8.5 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="unavail-notes" className="text-xs font-medium">
                  Additional Notes (Optional)
                </Label>
                <Input
                  id="unavail-notes"
                  placeholder="e.g. Mandatory OEM certification organized by GE Medical"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="h-8.5 text-xs bg-background"
                />
              </div>

              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs font-bold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Record Unavailable Period</span>
              </Button>
            </form>

            {/* List of currently recorded periods */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-bold text-foreground">
                Recorded Periods for {engineer.firstName} ({existingPeriods.length})
              </Label>

              {existingPeriods.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3 text-center bg-muted/10 rounded-lg">
                  No unavailable periods recorded. Engineer is fully available for normal shifts.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {existingPeriods.map((period) => (
                    <div
                      key={period.id}
                      className="p-2.5 rounded-lg bg-muted/20 border border-border/60 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-foreground">
                            {period.date}
                          </span>
                          <span
                            className={cn(
                              "px-1.5 py-0.2 rounded text-[10px] font-bold uppercase",
                              period.status === "training"
                                ? "bg-amber-500/20 text-amber-800 dark:text-amber-200"
                                : "bg-sky-500/20 text-sky-800 dark:text-sky-200"
                            )}
                          >
                            {period.status}
                          </span>
                        </div>
                        <p className="text-xs text-foreground font-medium truncate">
                          {period.title}
                        </p>
                        {period.notes && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {period.notes}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePeriod(period.id)}
                        className="size-7 text-rose-600 hover:bg-rose-500/10 cursor-pointer shrink-0"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold cursor-pointer"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
