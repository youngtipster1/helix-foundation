import { useState } from "react";
import {
  workforceService,
  type AvailabilityTypeDefinition,
} from "../../services/workforce-service";
import { cn } from "@/lib/utils";
import {
  Layers,
  GraduationCap,
  CalendarOff,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface CalendarLegendCardProps {
  onLegendUpdated?: () => void;
}

export function CalendarLegendCard({ onLegendUpdated }: CalendarLegendCardProps) {
  const [definitions, setDefinitions] = useState<AvailabilityTypeDefinition[]>(
    workforceService.getLegendDefinitions()
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Layers className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Calendar Legend &amp; Availability Definitions
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Workforce Management owns and configures availability state rules for the entire Debrief system.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline-block">
          {definitions.length} Standard States Defined
        </span>
      </div>

      {/* Grid of Availability State Definitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {definitions.map((def) => {
          return (
            <div
              key={def.code}
              className="p-3 rounded-xl bg-muted/20 border border-border/60 flex flex-col justify-between space-y-2 hover:border-border transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2.5 rounded-full shrink-0", def.dotColor)} />
                    <span className="font-bold text-xs text-foreground">
                      {def.label}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1",
                      def.allowsJobScheduling
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {def.allowsJobScheduling ? (
                      <>
                        <CheckCircle2 className="size-2.5" />
                        <span>Open for Jobs</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="size-2.5" />
                        <span>Jobs Blocked</span>
                      </>
                    )}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {def.description}
                </p>
              </div>

              <div className="pt-1 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                <span>Code: {def.code.toUpperCase()}</span>
                <span>Enforced by Schedule</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
        <span>💡 Schedule Calendar directly consumes these availability state definitions when detecting conflicts.</span>
      </div>
    </div>
  );
}
