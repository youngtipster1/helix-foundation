import { useState } from "react";
import type { ToolJob } from "../types";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowUpRight, ClipboardList } from "lucide-react";
import { JobDetailModal } from "./job-detail-modal";
import { Button } from "@/components/ui/button";

interface ToolJobsTableProps {
  jobs: ToolJob[];
  onJobUpdated?: () => void;
}

function calculateJobAge(openDate: string, closeDate?: string): string {
  const start = new Date(openDate).getTime();
  const end = closeDate ? new Date(closeDate).getTime() : new Date().getTime();
  const diffDays = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
  return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
}

export function ToolJobsTable({ jobs, onJobUpdated }: ToolJobsTableProps) {
  const [selectedJobNumber, setSelectedJobNumber] = useState<string | null>(null);

  if (!jobs || jobs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center bg-muted/10 space-y-2">
        <ClipboardList className="size-8 text-muted-foreground mx-auto" />
        <h4 className="text-xs font-semibold text-foreground">No Jobs Recorded</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          No repair, warranty, or calibration jobs have been created for this equipment yet.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Vertical Card View (md:hidden) */}
      <div className="space-y-3 md:hidden">
        {jobs.map((job) => {
          const age = calculateJobAge(job.openDate, job.closeDate);

          return (
            <div
              key={job.id}
              className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs space-y-3 transition-colors hover:border-primary/40"
            >
              {/* Card Header: Job Number + Action Button */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase block">
                    Job Number
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedJobNumber(job.jobNumber)}
                    className="mt-0.5 text-sm font-mono font-bold text-primary hover:underline cursor-pointer block"
                  >
                    {job.jobNumber}
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedJobNumber(job.jobNumber)}
                  className="h-8 gap-1 px-2.5 text-xs text-primary font-medium cursor-pointer"
                >
                  <span>View</span>
                  <ArrowUpRight className="size-3" />
                </Button>
              </div>

              {/* Card Body: Fields in 2-column grid */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-2.5 border-t border-border/60 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    Type
                  </span>
                  <span className="text-xs font-medium text-foreground">{job.jobType}</span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    Job Status
                  </span>
                  <div>
                    <StatusBadge status={job.jobStatus} />
                  </div>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    Assigned To
                  </span>
                  <span className="text-xs font-medium text-foreground">{job.assignedToName}</span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    Tool Status
                  </span>
                  <span className="text-xs font-medium text-foreground">{job.toolStatus}</span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    Open Date
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">{job.openDate}</span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    Age
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">{age}</span>
                </div>

                {job.closeDate && (
                  <div className="flex flex-col gap-0.5 col-span-2">
                    <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                      Close Date
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">{job.closeDate}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (hidden md:block) */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Job Number</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Job Status</th>
              <th className="px-4 py-3">Open Date</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Tool Status</th>
              <th className="px-4 py-3">Close Date</th>
              <th className="px-4 py-3 text-right sticky right-0 bg-muted/95 backdrop-blur-xs shadow-xs z-10">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.map((job) => {
              const age = calculateJobAge(job.openDate, job.closeDate);
              return (
                <tr
                  key={job.id}
                  className="hover:bg-accent/40 transition-colors group"
                >
                  <td className="px-4 py-3 font-mono font-bold text-foreground">
                    <button
                      type="button"
                      onClick={() => setSelectedJobNumber(job.jobNumber)}
                      className="text-primary hover:underline flex items-center gap-1 cursor-pointer font-mono font-bold"
                    >
                      <span>{job.jobNumber}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {job.jobType}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.jobStatus} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {job.openDate}
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {age}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {job.assignedToName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {job.toolStatus}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {job.closeDate || "—"}
                  </td>
                  <td
                    className="px-4 py-3 text-right whitespace-nowrap sticky right-0 bg-card/95 backdrop-blur-xs shadow-xs z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedJobNumber(job.jobNumber)}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium cursor-pointer"
                    >
                      <span>View</span>
                      <ArrowUpRight className="size-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <JobDetailModal
        open={Boolean(selectedJobNumber)}
        onOpenChange={(open) => !open && setSelectedJobNumber(null)}
        jobNumber={selectedJobNumber}
        onJobUpdated={onJobUpdated}
      />
    </>
  );
}
