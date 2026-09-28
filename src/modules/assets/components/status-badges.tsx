import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EquipmentStatus, ContractStatus, WarrantyStatus } from "../types";

interface EquipmentStatusBadgeProps {
  status: EquipmentStatus | string;
  className?: string;
}

export const EquipmentStatusBadge: React.FC<EquipmentStatusBadgeProps> = ({ status, className }) => {
  switch (status) {
    case "Up":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-0",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Up
        </span>
      );
    case "Partially Up":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-0",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          Partially Up
        </span>
      );
    case "Down":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-0",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Down
        </span>
      );
    case "Unknown":
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-0",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          {status || "Unknown"}
        </span>
      );
  }
};

interface ContractStatusBadgeProps {
  status: ContractStatus | string;
  className?: string;
}

export const ContractStatusBadge: React.FC<ContractStatusBadgeProps> = ({ status, className }) => {
  const isInContract = status === "In Contract";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border-0",
        isInContract
          ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
          : "bg-rose-500/15 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isInContract ? "bg-emerald-500" : "bg-rose-500"
        )}
      />
      {status || "Out of Contract"}
    </span>
  );
};

interface WarrantyStatusBadgeProps {
  status: WarrantyStatus | string;
  className?: string;
}

export const WarrantyStatusBadge: React.FC<WarrantyStatusBadgeProps> = ({ status, className }) => {
  const isWarranty = status === "Warranty";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border-0",
        isWarranty
          ? "bg-blue-500/15 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
          : "bg-slate-500/15 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isWarranty ? "bg-blue-500" : "bg-slate-400"
        )}
      />
      {status || "Out of Warranty"}
    </span>
  );
};
