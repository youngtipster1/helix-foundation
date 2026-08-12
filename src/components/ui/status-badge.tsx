import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "active" | "archived" | string;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const isActive = status === "active";
  const isArchived = status === "archived";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border uppercase tracking-wider text-[10px]",
        isActive && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/5",
        isArchived && "bg-muted text-muted-foreground border-border",
        !isActive && !isArchived && "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/5",
        className
      )}
      {...props}
    >
      {isActive ? "Active" : isArchived ? "Archived" : status}
    </span>
  );
}
