import { useNavigate } from "@tanstack/react-router";
import type { DebriefJob } from "../../types";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  PauseCircle,
  CalendarRange,
  Users,
  ArrowRight,
  ShieldAlert,
  Clock,
} from "lucide-react";

interface OperationalAttentionCardProps {
  onHoldJobs: DebriefJob[];
  isAdmin: boolean;
}

export function OperationalAttentionCard({
  onHoldJobs,
  isAdmin,
}: OperationalAttentionCardProps) {
  const navigate = useNavigate();

  // Mock scheduling conflict & workforce blocker alerts from the system
  const schedulingConflicts = [
    {
      id: "conflict_01",
      engineerName: "John Doe",
      conflictType: "Scheduled During Training",
      date: "Sep 22, 2026",
      detail: "Radiation Safety & CT Compliance Seminar coincides with scheduled PM visit.",
      actionTo: "/app/debrief/schedule",
      actionLabel: "Resolve in Schedule",
    },
  ];

  const workforceBlockers = [
    {
      id: "blocker_01",
      engineerName: "Zainab Sani",
      blockerType: "Upcoming Multi-Day Leave",
      date: "Sep 25 – Sep 28, 2026",
      detail: "Approved Annual Leave roster restriction requires shifting pending ventilator jobs.",
      actionTo: "/app/debrief/workforce",
      actionLabel: "Inspect Workforce",
    },
  ];

  const totalAttentionCount =
    onHoldJobs.length + schedulingConflicts.length + workforceBlockers.length;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden space-y-4 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Operational Situations Requiring Attention
            </h3>
            <p className="text-xs text-muted-foreground">
              Direct escalation alerts across blocked jobs, calendar conflicts, and workforce capacity.
            </p>
          </div>
        </div>

        <div className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto">
          <ShieldAlert className="size-3.5" />
          <span>{totalAttentionCount} Active Operational Alerts</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Category 1: Jobs On Hold */}
        <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <PauseCircle className="size-4 text-amber-500" />
                Jobs On Hold ({onHoldJobs.length})
              </span>
              <span className="text-xs text-muted-foreground font-mono">Blocked Flow</span>
            </div>

            {onHoldJobs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                No active jobs currently on hold.
              </p>
            ) : (
              <div className="space-y-2">
                {onHoldJobs.slice(0, 2).map((job) => (
                  <div
                    key={job.id}
                    className="p-2.5 rounded-lg border border-border/50 bg-background text-xs space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-foreground">
                      <span>{job.jobNumber}</span>
                      <span className="text-amber-600 dark:text-amber-400 text-xs">
                        {job.jobPriority} Priority
                      </span>
                    </div>
                    <div className="text-foreground font-semibold truncate">
                      {job.model}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {job.reportedIssue}
                    </div>
                    <div className="text-xs text-muted-foreground/80 flex items-center gap-1 pt-0.5">
                      <Clock className="size-3" />
                      <span>Assigned: {job.assignedToName || "Unassigned"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/app/debrief" })}
            className="w-full h-8 text-xs font-semibold gap-1.5 cursor-pointer mt-2 hover:bg-muted"
          >
            <span>View All Jobs in Debrief</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {/* Category 2: Scheduling Conflicts */}
        <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <CalendarRange className="size-4 text-rose-500" />
                Scheduling Conflicts ({schedulingConflicts.length})
              </span>
              <span className="text-xs text-muted-foreground font-mono">Timeline Warning</span>
            </div>

            <div className="space-y-2">
              {schedulingConflicts.map((conf) => (
                <div
                  key={conf.id}
                  className="p-2.5 rounded-lg border border-rose-500/20 bg-background text-xs space-y-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span>{conf.engineerName}</span>
                    <span className="text-rose-600 dark:text-rose-400 text-xs font-mono">
                      {conf.date}
                    </span>
                  </div>
                  <div className="text-rose-600 dark:text-rose-400 font-semibold text-xs">
                    {conf.conflictType}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {conf.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/app/debrief/schedule" })}
            className="w-full h-8 text-xs font-semibold gap-1.5 cursor-pointer mt-2 hover:bg-muted"
          >
            <span>Open Schedule Calendar</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {/* Category 3: Workforce Capacity Blockers */}
        <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="size-4 text-primary" />
                Workforce Capacity ({workforceBlockers.length})
              </span>
              <span className="text-xs text-muted-foreground font-mono">Leave / Training</span>
            </div>

            <div className="space-y-2">
              {workforceBlockers.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-lg border border-border/50 bg-background text-xs space-y-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span>{b.engineerName}</span>
                    <span className="text-primary text-xs font-mono">{b.date}</span>
                  </div>
                  <div className="text-primary font-semibold text-xs">{b.blockerType}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {b.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/app/debrief/workforce" })}
            className="w-full h-8 text-xs font-semibold gap-1.5 cursor-pointer mt-2 hover:bg-muted"
          >
            <span>Manage Workforce Capacity</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
