import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppTabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: LucideIcon;
  badgeClassName?: string;
  disabled?: boolean;
}

export interface AppTabsProps<T extends string = string> {
  tabs: AppTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  tabClassName?: string;
  size?: "sm" | "md";
}

export function AppTabs<T extends string = string>({
  tabs,
  value,
  onChange,
  className,
  tabClassName,
  size = "md",
}: AppTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex flex-wrap items-center gap-1.5 sm:gap-2",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === value;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg font-semibold transition-all cursor-pointer border select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              size === "sm"
                ? "px-3 py-1.5 text-xs"
                : "px-3.5 sm:px-4 py-2 text-[13px]",
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent border-transparent",
              tabClassName
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  size === "sm" ? "size-3.5" : "size-3.5 sm:size-4",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
            )}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs font-bold leading-none transition-colors",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                  tab.badgeClassName
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
