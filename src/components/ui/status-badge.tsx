import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "active" | "archived" | "pending" | "inactive" | string;
  label?: string;
}

export function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const displayLabel = label || status;
  const normalized = (label || status).toLowerCase();

  const isApproved = normalized === "approved" || normalized === "active" || normalized === "published";
  const isUnderReview = normalized === "under review" || normalized === "in review";
  const isPending = normalized === "pending" || normalized === "pending approval";
  const isRevision = normalized === "needs revision" || normalized === "rejected";
  const isDraftOrArchived = normalized === "draft" || normalized === "archived" || normalized === "inactive";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 font-semibold uppercase tracking-wider text-[11px] md:text-xs border-0",
        isApproved && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/20",
        isUnderReview && "bg-sky-500/15 text-sky-700 dark:text-sky-400 dark:bg-sky-500/20",
        isPending && "bg-amber-500/15 text-amber-700 dark:text-amber-400 dark:bg-amber-500/20",
        isRevision && "bg-rose-500/15 text-rose-700 dark:text-rose-400 dark:bg-rose-500/20",
        isDraftOrArchived && "bg-muted text-muted-foreground",
        className
      )}
      {...props}
    >
      {displayLabel}
    </span>
  );
}
