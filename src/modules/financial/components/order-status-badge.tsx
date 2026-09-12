import React from "react";
import { Badge } from "@/components/ui/badge";
import { OrderStatus, PurchaseOrderStatus } from "../types";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: OrderStatus | PurchaseOrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge
          variant="outline"
          className={cn("bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 font-medium text-xs", className)}
        >
          Draft
        </Badge>
      );
    case "SUBMITTED":
      return (
        <Badge
          variant="outline"
          className={cn("bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 font-medium text-xs", className)}
        >
          Submitted (Under Review)
        </Badge>
      );
    case "SENT_BACK":
      return (
        <Badge
          variant="outline"
          className={cn("bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800 font-medium text-xs", className)}
        >
          Sent Back for Revision
        </Badge>
      );
    case "APPROVED":
    case "REQUISITIONED":
      return (
        <Badge
          variant="outline"
          className={cn("bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-800 font-medium text-xs", className)}
        >
          Approved (Requisitioned)
        </Badge>
      );
    case "FINAL_APPROVED":
      return (
        <Badge
          variant="outline"
          className={cn("bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 font-medium text-xs", className)}
        >
          Final Approved
        </Badge>
      );
    case "PO_CREATED":
    case "ISSUED":
      return (
        <Badge
          variant="outline"
          className={cn("bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800 font-medium text-xs", className)}
        >
          PO Issued
        </Badge>
      );
    case "PARTIALLY_FULFILLED":
      return (
        <Badge
          variant="outline"
          className={cn("bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800 font-medium text-xs", className)}
        >
          Partially Fulfilled
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge
          variant="outline"
          className={cn("bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 font-medium text-xs", className)}
        >
          Completed
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className={cn("bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700 font-medium text-xs", className)}
        >
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={cn("text-xs", className)}>
          {status}
        </Badge>
      );
  }
}
