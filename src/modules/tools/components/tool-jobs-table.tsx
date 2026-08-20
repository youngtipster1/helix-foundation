import { Link } from "@tanstack/react-router";
import type { ToolJob } from "../types";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowUpRight, ClipboardList } from "lucide-react";

interface ToolJobsTableProps {
  jobs: ToolJob[];
}

function calculateJobAge(openDate: string, closeDate?: string): string {
  const start = new Date(openDate).getTime();
  const end = closeDate ? new Date(closeDate).getTime() : new Date().getTime();
  const diffDays = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
  return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
}

export function ToolJobsTable({ jobs }: ToolJobsTableProps) {
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
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
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
            <th className="px-4 py-3 text-right">Action</th>
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
                  <Link
                    to="/app/tools/jobs/$jobId"
                    params={{ jobId: job.jobNumber }}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <span>{job.jobNumber}</span>
                  </Link>
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
                <td className="px-4 py-3 text-right">
                  <Link
                    to="/app/tools/jobs/$jobId"
                    params={{ jobId: job.jobNumber }}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    <span>View</span>
                    <ArrowUpRight className="size-3" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
