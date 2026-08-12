import { Check, Filter } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function ColumnFilter({
  label,
  values,
  selected,
  onChange,
}: {
  label: string;
  values: string[];
  /** undefined = unfiltered (all values included) */
  selected: string[] | undefined;
  onChange: (next: string[] | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const active = selected !== undefined;
  const effective = useMemo(() => new Set(selected ?? values), [selected, values]);
  const visible = useMemo(
    () => values.filter((value) => value.toLowerCase().includes(query.trim().toLowerCase())),
    [values, query],
  );
  const allSelected = values.every((value) => effective.has(value));

  function toggle(value: string) {
    const next = new Set(effective);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    if (next.size === values.length) onChange(undefined);
    else onChange([...next]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Filter by ${label}`}
          className={cn(
            "-mx-1.5 inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            active && "text-primary",
          )}
        >
          <span>{label}</span>
          <Filter className={cn("size-3", active ? "text-primary" : "text-muted-foreground/70")} />
          {active && <span className="size-1.5 rounded-full bg-primary" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-0">
        <div className="border-b border-border p-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search values"
            className="h-8 text-sm"
            aria-label={`Search ${label} values`}
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm font-medium hover:bg-accent/60">
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => onChange(allSelected ? [] : undefined)}
            />
            Select all
          </label>
          {visible.map((value) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent/60"
            >
              <Checkbox checked={effective.has(value)} onCheckedChange={() => toggle(value)} />
              <span className="truncate">{value}</span>
            </label>
          ))}
          {visible.length === 0 && (
            <p className="px-2 py-3 text-sm text-muted-foreground">No matching values.</p>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onChange(undefined)}
            disabled={!active}
          >
            Clear filter
          </Button>
          <Button size="sm" className="h-7 px-2 text-xs" onClick={() => setOpen(false)}>
            <Check className="size-3" />
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
