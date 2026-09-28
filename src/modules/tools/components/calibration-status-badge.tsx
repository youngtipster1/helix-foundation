import { cn } from "@/lib/utils";
import type { CalibrationStatus } from "../types";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface CalibrationStatusBadgeProps {
  status: CalibrationStatus;
  className?: string;
  showIcon?: boolean;
}

export function CalibrationStatusBadge({
  status,
  className,
  showIcon = true,
}: CalibrationStatusBadgeProps) {
  let label = "Valid";
  let variantClasses = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  let Icon = CheckCircle2;

  if (status === "due_soon") {
    label = "Due Soon";
    variantClasses = "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    Icon = AlertTriangle;
  } else if (status === "expired") {
    label = "Overdue";
    variantClasses = "bg-rose-500/15 text-rose-700 dark:text-rose-400";
    Icon = XCircle;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold border-0 tracking-wide select-none",
        variantClasses,
        className,
      )}
    >
      {showIcon && <Icon className="size-3 shrink-0" />}
      <span>{label}</span>
    </span>
  );
}
