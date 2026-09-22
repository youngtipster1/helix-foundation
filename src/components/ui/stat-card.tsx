import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number | React.ReactNode;
  subtext?: string | React.ReactNode;
  description?: string | React.ReactNode;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  active?: boolean;
  unit?: string;
  onClick?: () => void;
  className?: string;
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      title,
      value,
      subtext,
      description,
      icon: Icon,
      active = false,
      unit,
      onClick,
      className,
      ...props
    },
    ref
  ) => {
    const isInteractive = Boolean(onClick);

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "surface-panel p-5 flex flex-col justify-between transition-all text-left",
          isInteractive && "cursor-pointer hover:border-border/80 hover:bg-muted/10",
          active && "border-primary ring-2 ring-primary/30 shadow-xs bg-primary/5",
          className
        )}
        {...props}
      >
        {/* Top Row: Title & Cyan-Blue Icon Container */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            {title}
          </span>
          {Icon && (
            <div
              className={cn(
                "size-8 rounded-lg grid place-items-center shrink-0 transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-primary"
              )}
            >
              <Icon className="size-4" />
            </div>
          )}
        </div>

        {/* Middle Row: Primary Value & Subtext/Pill */}
        <div className="mt-4 flex items-baseline justify-between gap-2">
          <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
            {value}
            {unit && (
              <span className="ml-1 text-xs font-sans font-medium text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
          {subtext && (
            <span className="text-xs text-muted-foreground font-mono shrink-0">
              {subtext}
            </span>
          )}
        </div>

        {/* Bottom Row: Context Description */}
        {description && (
          <p className="text-xs text-muted-foreground mt-1 leading-normal">
            {description}
          </p>
        )}
      </div>
    );
  }
);

StatCard.displayName = "StatCard";
