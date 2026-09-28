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
          className={cn("bg-slate-500/15 text-slate-700 dark:text-slate-300 font-medium text-xs border-0", className)}
        >
          Draft
        </Badge>
      );
    case "SUBMITTED":
      return (
        <Badge
          variant="outline"
          className={cn("bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium text-xs border-0", className)}
        >
          Submitted (Under Review)
        </Badge>
      );
    case "SENT_BACK":
      return (
        <Badge
          variant="outline"
          className={cn("bg-rose-500/15 text-rose-700 dark:text-rose-400 font-medium text-xs border-0", className)}
        >
          Sent Back for Revision
        </Badge>
      );
    case "APPROVED":
    case "REQUISITIONED":
      return (
        <Badge
          variant="outline"
          className={cn("bg-sky-500/15 text-sky-700 dark:text-sky-400 font-medium text-xs border-0", className)}
        >
          Approved (Requisitioned)
        </Badge>
      );
    case "FINAL_APPROVED":
      return (
        <Badge
          variant="outline"
          className={cn("bg-blue-500/15 text-blue-700 dark:text-blue-400 font-medium text-xs border-0", className)}
        >
          Final Approved
        </Badge>
      );
    case "PO_CREATED":
    case "ISSUED":
      return (
        <Badge
          variant="outline"
          className={cn("bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 font-medium text-xs border-0", className)}
        >
          PO Issued
        </Badge>
      );
    case "PARTIALLY_FULFILLED":
      return (
        <Badge
          variant="outline"
          className={cn("bg-purple-500/15 text-purple-700 dark:text-purple-400 font-medium text-xs border-0", className)}
        >
          Partially Fulfilled
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge
          variant="outline"
          className={cn("bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-medium text-xs border-0", className)}
        >
          Completed
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className={cn("bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 font-medium text-xs border-0", className)}
        >
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={cn("text-xs border-0", className)}>
          {status}
        </Badge>
      );
  }
}
