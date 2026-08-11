import { Activity } from "lucide-react";

import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground",
        className,
      )}
      aria-hidden="true"
    >
      <Activity className="size-4" strokeWidth={2.4} />
    </span>
  );
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <BrandMark />
      {!compact && (
        <span className="min-w-0">
          <span className="block text-sm font-semibold tracking-[0.14em] text-foreground">
            HEMP
          </span>
          <span className="block truncate text-[11px] leading-tight text-muted-foreground">
            Healthcare Engineering
          </span>
        </span>
      )}
    </div>
  );
}