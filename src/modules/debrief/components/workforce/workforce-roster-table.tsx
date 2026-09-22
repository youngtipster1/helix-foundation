import type { Personnel } from "@/modules/settings/types";
import { workforceService } from "../../services/workforce-service";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Calendar,
  SlidersHorizontal,
  GraduationCap,
  CalendarOff,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkforceRosterTableProps {
  engineers: Personnel[];
  weekDates: Date[];
  onManageEngineer: (engineer: Personnel) => void;
}

export function WorkforceRosterTable({
  engineers,
  weekDates,
  onManageEngineer,
}: WorkforceRosterTableProps) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs min-w-[950px]">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-[11px] font-bold text-muted-foreground">
              <th className="py-3 px-4 text-left w-60 border-r border-border/50">
                Biomedical Engineer
              </th>
              <th className="py-3 px-3 text-left w-44 border-r border-border/50">
                Standard Shift
              </th>
              <th className="py-3 px-3 text-center border-r border-border/50">
                Weekly Availability Breakdown (Mon – Sun)
              </th>
              <th className="py-3 px-3 text-center w-36 border-r border-border/50">
                Calculated Available Time
              </th>
              <th className="py-3 px-4 text-right w-32">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/50">
            {engineers.map((engineer) => {
              const config = workforceService.getScheduleConfig(engineer.id);
              const dailyHours = workforceService.calculateDailyShiftHours(config);

              const weeklyCalc = workforceService.calculateWeeklyAvailableTime(
                engineer.id,
                `${engineer.firstName} ${engineer.lastName}`,
                weekDates
              );

              const capacityPercent =
                weeklyCalc.standardWeeklyHours > 0
                  ? Math.round(
                      (weeklyCalc.availableWorkingHours / weeklyCalc.standardWeeklyHours) *
                        100
                    )
                  : 0;

              return (
                <tr key={engineer.id} className="hover:bg-muted/10 transition-colors">
                  {/* Engineer Profile */}
                  <td className="py-3 px-4 border-r border-border/50 bg-muted/5 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {engineer.firstName[0]}
                        {engineer.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-foreground text-xs leading-tight truncate">
                          {engineer.firstName} {engineer.lastName}
                        </h4>
                        <span className="text-[11px] text-muted-foreground truncate block">
                          {engineer.jobTitle}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70 truncate block">
                          {engineer.department}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Standard Shift Hours */}
                  <td className="py-3 px-3 border-r border-border/50 align-middle">
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-xs text-foreground">
                        {config.startTime} – {config.endTime}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {dailyHours.toFixed(1)}h / day · Mon–Fri
                      </div>
                      <div className="text-[10px] text-muted-foreground/80 font-mono">
                        Weekends: Restricted Off
                      </div>
                    </div>
                  </td>

                  {/* Daily Availability Chips */}
                  <td className="py-3 px-3 border-r border-border/50 align-middle">
                    <div className="grid grid-cols-7 gap-1 max-w-md mx-auto">
                      {weeklyCalc.daysBreakdown.map((item) => (
                        <div
                          key={item.date}
                          title={`${item.dayName}: ${item.title}`}
                          className={cn(
                            "p-1.5 rounded-lg text-center border-0 space-y-0.5 shadow-2xs",
                            item.isWeekend
                              ? "bg-muted/30 text-muted-foreground/50"
                              : item.status === "working"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200"
                              : item.status === "training"
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 font-bold"
                              : "bg-rose-100 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 font-bold"
                          )}
                        >
                          <div className="text-[9px] font-bold uppercase">{item.dayName}</div>
                          <div className="font-mono text-[10px]">
                            {item.isWeekend ? "Off" : `${item.availableHours.toFixed(0)}h`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* System-Calculated Working Time */}
                  <td className="py-3 px-3 border-r border-border/50 text-center align-middle">
                    <div className="space-y-1">
                      <span className="font-mono font-bold text-sm text-foreground">
                        {weeklyCalc.availableWorkingHours.toFixed(1)}h
                      </span>
                      <span className="text-[11px] text-muted-foreground block font-mono">
                        of {weeklyCalc.standardWeeklyHours.toFixed(1)}h standard
                      </span>
                      <div className="w-20 mx-auto h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${capacityPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {capacityPercent}% Capacity
                      </span>
                    </div>
                  </td>

                  {/* Manage Schedule Button */}
                  <td className="py-3 px-4 text-right align-middle">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManageEngineer(engineer)}
                      className="h-8 px-2.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs hover:bg-muted"
                    >
                      <SlidersHorizontal className="size-3 text-primary" />
                      <span>Manage</span>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
