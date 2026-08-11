import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function Loading({ label, className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      className={cn("flex items-center justify-center gap-2 py-10 text-muted-foreground", className)}
    >
      <Loader2 className="size-4 animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}