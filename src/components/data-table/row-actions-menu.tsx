import { ChevronDown } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type RowActionItem = {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive" | "success" | "warning";
  hidden?: boolean;
  separatorAfter?: boolean;
};

export interface RowActionsMenuProps {
  actions: (RowActionItem | null | false | undefined)[];
  label?: string;
  align?: "start" | "end" | "center";
  className?: string;
  trigger?: ReactNode;
}

/**
 * Standard single Actions menu for table rows.
 * Renders a clean `[ Actions ▾ ]` dropdown menu that contains role- and status-aware actions.
 */
export function RowActionsMenu({
  actions,
  label = "Actions",
  align = "end",
  className,
  trigger,
}: RowActionsMenuProps) {
  const visibleActions = actions.filter((action): action is RowActionItem => Boolean(action && !action.hidden));

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5 px-2.5 text-xs font-medium transition-colors hover:bg-accent/60",
              className,
            )}
            aria-label="Open row actions"
          >
            <span>{label}</span>
            <ChevronDown className="size-3.5 text-muted-foreground opacity-70" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44 p-1">
        {visibleActions.map((action, idx) => (
          <div key={`${action.label}-${idx}`}>
            <DropdownMenuItem
              disabled={action.disabled}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              className={cn(
                "cursor-pointer text-xs flex items-center gap-2 py-1.5",
                action.variant === "destructive" &&
                  "text-destructive focus:text-destructive focus:bg-destructive/10 dark:focus:bg-destructive/20",
                action.variant === "success" &&
                  "text-emerald-600 dark:text-emerald-400 focus:text-emerald-600 focus:bg-emerald-500/10",
                action.variant === "warning" &&
                  "text-amber-600 dark:text-amber-400 focus:text-amber-600 focus:bg-amber-500/10",
              )}
            >
              {action.icon && <action.icon className="size-3.5 shrink-0" />}
              <span>{action.label}</span>
            </DropdownMenuItem>
            {action.separatorAfter && idx < visibleActions.length - 1 && (
              <DropdownMenuSeparator className="my-1" />
            )}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
