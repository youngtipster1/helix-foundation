import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Columns3,
  CalendarDays,
  CalendarRange,
  Inbox,
  Filter,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  JOB_TYPE_COLORS,
  type ScheduleViewMode,
} from "./schedule-types";

interface ScheduleCalendarHeaderProps {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  viewMode: ScheduleViewMode;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  unscheduledCount: number;
  unscheduledOpen: boolean;
  onToggleUnscheduled: () => void;
  isAdmin: boolean;
}

export function ScheduleCalendarHeader({
  currentDate,
  onPrev,
  onNext,
  onToday,
  viewMode,
  onViewModeChange,
  unscheduledCount,
  unscheduledOpen,
  onToggleUnscheduled,
  isAdmin,
}: ScheduleCalendarHeaderProps) {
  const monthYearLabel = currentDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Top Controls Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border pb-4">
        {/* Date Navigation */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5 shadow-2xs">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrev}
              aria-label="Previous timeframe"
              className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToday}
              className="h-8 px-3 text-xs font-bold cursor-pointer hover:bg-muted"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              aria-label="Next timeframe"
              className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="size-4 text-primary shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {monthYearLabel}
            </h2>
          </div>
        </div>

        {/* View Switcher & Unscheduled Backlog Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted/40 p-1 rounded-lg border border-border/60">
            <button
              type="button"
              onClick={() => onViewModeChange("timeline")}
              className={cn(
                "px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === "timeline"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Columns3 className="size-3.5" />
              <span>Engineer Timeline</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange("week")}
              className={cn(
                "px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === "week"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarRange className="size-3.5" />
              <span>Week</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange("month")}
              className={cn(
                "px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === "month"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays className="size-3.5" />
              <span>Month</span>
            </button>
          </div>

          {/* Admin Backlog Tray Toggle */}
          {isAdmin && (
            <Button
              variant={unscheduledOpen ? "default" : "outline"}
              size="sm"
              onClick={onToggleUnscheduled}
              className={cn(
                "h-8.5 text-xs font-bold gap-1.5 cursor-pointer shadow-2xs",
                unscheduledOpen
                  ? "bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:bg-muted"
              )}
            >
              <Inbox className="size-3.5" />
              <span>Unscheduled Queue</span>
              {unscheduledCount > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none",
                    unscheduledOpen
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {unscheduledCount}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* PDF Colour Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border shadow-2xs text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-bold text-muted-foreground flex items-center gap-1">
            <Layers className="size-3.5 text-primary" />
            Job Type Colors:
          </span>
          {Object.entries(JOB_TYPE_COLORS).map(([key, style]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-full shrink-0", style.dotColor)} />
              <span className="text-foreground font-medium text-[11px] sm:text-xs">
                {style.label}
              </span>
            </div>
          ))}
        </div>

        {/* Workforce State Indicators */}
        <div className="flex flex-wrap items-center gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/50">
          <span className="text-muted-foreground text-[11px] font-medium">Workforce:</span>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground text-[11px]">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground text-[11px]">Training</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-rose-500" />
            <span className="text-muted-foreground text-[11px]">Leave / Off</span>
          </div>
        </div>
      </div>
    </div>
  );
}
