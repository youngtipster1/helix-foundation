import { GripVertical, RotateCcw, Search, SlidersHorizontal, TableProperties } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DragEvent, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

import { ColumnFilter } from "./column-filter";
import { TablePagination } from "./table-pagination";
import type { ColumnFilterState, DataTableColumn } from "./types";

export const ACTIONS_COLUMN_KEY = "__actions__";

type RenderableColumn<T> =
  | { type: "data"; column: DataTableColumn<T>; key: string }
  | { type: "actions"; key: typeof ACTIONS_COLUMN_KEY };

/**
 * Reusable table with search, Excel-style column filters, draggable/reorderable columns,
 * pagination, and a native mobile vertical card layout with action buttons.
 */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading = false,
  searchPlaceholder = "Search...",
  toolbarActions,
  rowActions,
  pageSize = 8,
  emptyTitle = "No records yet",
  emptyDescription,
  mobileStrategy = "card",
  enableColumnReordering = true,
  onFiltersChange,
  onColumnOrderChange,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  toolbarActions?: ReactNode;
  rowActions?: (row: T) => ReactNode;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  mobileStrategy?: "card" | "scroll" | "priority";
  enableColumnReordering?: boolean;
  onFiltersChange?: (filters: ColumnFilterState, search: string) => void;
  onColumnOrderChange?: (newOrder: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ColumnFilterState>({});
  const [page, setPage] = useState(1);

  // Column reordering state - default positions Actions column at the far right
  const defaultKeys = useMemo(() => {
    const colKeys = columns.map((c) => c.key);
    if (rowActions) {
      return [...colKeys, ACTIONS_COLUMN_KEY];
    }
    return colKeys;
  }, [columns, rowActions]);

  const [columnOrder, setColumnOrder] = useState<string[]>(defaultKeys);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ key: string; position: "left" | "right" } | null>(null);

  // Keep columnOrder aligned if columns or rowActions prop changes
  useEffect(() => {
    setColumnOrder((prev) => {
      const allValidKeys = rowActions ? [...columns.map((c) => c.key), ACTIONS_COLUMN_KEY] : columns.map((c) => c.key);
      const existingInIncoming = prev.filter((k) => allValidKeys.includes(k));
      const addedKeys = allValidKeys.filter((k) => !prev.includes(k));
      const nextOrder = [...existingInIncoming, ...addedKeys];
      return nextOrder.length === allValidKeys.length ? nextOrder : defaultKeys;
    });
  }, [columns, rowActions, defaultKeys]);

  const isReordered = useMemo(() => {
    if (columnOrder.length !== defaultKeys.length) return false;
    return columnOrder.some((k, idx) => k !== defaultKeys[idx]);
  }, [columnOrder, defaultKeys]);

  const orderedRenderColumns = useMemo<RenderableColumn<T>[]>(() => {
    const colMap = new Map(columns.map((c) => [c.key, c]));
    const result: RenderableColumn<T>[] = [];

    for (const key of columnOrder) {
      if (key === ACTIONS_COLUMN_KEY && rowActions) {
        result.push({ type: "actions", key: ACTIONS_COLUMN_KEY });
      } else {
        const col = colMap.get(key);
        if (col) {
          result.push({ type: "data", column: col, key: col.key });
          colMap.delete(key);
        }
      }
    }

    // Append any leftover columns
    for (const col of colMap.values()) {
      result.push({ type: "data", column: col, key: col.key });
    }

    if (rowActions && !result.some((r) => r.type === "actions")) {
      result.push({ type: "actions", key: ACTIONS_COLUMN_KEY });
    }

    return result;
  }, [columns, columnOrder, rowActions]);

  useEffect(() => {
    onFiltersChange?.(filters, search);
  }, [filters, search, onFiltersChange]);

  const uniqueValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const column of columns) {
      if (!column.filterable) continue;
      map[column.key] = [
        ...new Set(rows.map((row) => String(column.value(row) ?? ""))),
      ].sort((a, b) => (a ?? "").localeCompare(b ?? ""));
    }
    return map;
  }, [columns, rows]);

  const filterableColumns = useMemo(() => columns.filter((c) => c.filterable), [columns]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      for (const column of columns) {
        const selected = filters[column.key];
        const val = String(column.value(row) ?? "");
        if (selected && !selected.includes(val)) return false;
      }
      if (!term) return true;
      return columns.some((column) => {
        const val = String(column.value(row) ?? "").toLowerCase();
        return val.includes(term);
      });
    });
  }, [rows, columns, filters, search]);

  const activeFilterCount = Object.keys(filters).length;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, filters]);

  // Drag and drop handlers
  const handleDragStart = (e: DragEvent<HTMLTableHeaderCellElement>, columnKey: string) => {
    if (!enableColumnReordering) return;
    setDraggedKey(columnKey);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", columnKey);
  };

  const handleDragOver = (e: DragEvent<HTMLTableHeaderCellElement>, targetKey: string) => {
    if (!enableColumnReordering || !draggedKey || draggedKey === targetKey) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const rect = e.currentTarget.getBoundingClientRect();
    const isRight = e.clientX > rect.left + rect.width / 2;
    setDropTarget({ key: targetKey, position: isRight ? "right" : "left" });
  };

  const handleDragLeave = (_e: DragEvent<HTMLTableHeaderCellElement>, targetKey: string) => {
    if (dropTarget?.key === targetKey) {
      setDropTarget(null);
    }
  };

  const handleDrop = (e: DragEvent<HTMLTableHeaderCellElement>, targetKey: string) => {
    if (!enableColumnReordering || !draggedKey || draggedKey === targetKey) {
      setDraggedKey(null);
      setDropTarget(null);
      return;
    }
    e.preventDefault();

    const position = dropTarget?.position ?? "left";
    const nextOrder = [...columnOrder];
    const sourceIdx = nextOrder.indexOf(draggedKey);
    if (sourceIdx !== -1) {
      nextOrder.splice(sourceIdx, 1);
    }
    const targetIdx = nextOrder.indexOf(targetKey);
    if (targetIdx !== -1) {
      const insertIdx = position === "right" ? targetIdx + 1 : targetIdx;
      nextOrder.splice(insertIdx, 0, draggedKey);
    }

    setColumnOrder(nextOrder);
    onColumnOrderChange?.(nextOrder);
    setDraggedKey(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedKey(null);
    setDropTarget(null);
  };

  const resetColumnOrder = () => {
    setColumnOrder(defaultKeys);
    onColumnOrderChange?.(defaultKeys);
  };

  return (
    <div className="surface-panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3 sm:p-4">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search table"
            className="h-9 pl-8"
          />
        </div>

        {/* Mobile Filters Dropdown */}
        {filterableColumns.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs md:hidden"
              >
                <SlidersHorizontal className="size-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-2 space-y-2">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-1">
                Filter by Column
              </DropdownMenuLabel>
              {filterableColumns.map((col) => (
                <div key={col.key} className="px-1 py-0.5">
                  <ColumnFilter
                    label={col.header}
                    values={uniqueValues[col.key] ?? []}
                    selected={filters[col.key]}
                    onChange={(next) =>
                      setFilters((prev) => {
                        const draft = { ...prev };
                        if (next === undefined) delete draft[col.key];
                        else draft[col.key] = next;
                        return draft;
                      })
                    }
                  />
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs"
            onClick={() => setFilters({})}
          >
            <SlidersHorizontal className="size-3.5" />
            Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
          </Button>
        )}
        {isReordered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-muted-foreground hover:text-foreground hidden sm:inline-flex"
            onClick={resetColumnOrder}
            title="Reset column order"
          >
            <RotateCcw className="size-3.5 mr-1" />
            Reset Columns
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">{toolbarActions}</div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-14">
          <Loading />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={TableProperties}
            title={rows.length === 0 ? emptyTitle : "No matching records"}
            {...(rows.length === 0
              ? emptyDescription
                ? { description: emptyDescription }
                : {}
              : { description: "Adjust your search or column filters." })}
            className="border-0 bg-transparent"
          />
        </div>
      ) : mobileStrategy === "scroll" ? (
        /* Legacy horizontal scroll container if explicitly requested */
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[36rem]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {orderedRenderColumns.map((item) => {
                  if (item.type === "actions") {
                    return (
                      <th
                        key={ACTIONS_COLUMN_KEY}
                        scope="col"
                        className="px-4 py-2.5 text-right text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase select-none whitespace-nowrap sticky right-0 bg-muted/95 backdrop-blur-xs shadow-xs z-10"
                      >
                        Actions
                      </th>
                    );
                  }
                  return (
                    <th
                      key={item.column.key}
                      scope="col"
                      className="px-4 py-2.5 text-left text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase select-none"
                    >
                      {item.column.header}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/70 transition-colors last:border-0 hover:bg-accent/40"
                >
                  {orderedRenderColumns.map((item) => {
                    if (item.type === "actions") {
                      return (
                        <td
                          key={ACTIONS_COLUMN_KEY}
                          className="px-4 py-3 text-right whitespace-nowrap sticky right-0 bg-card/95 backdrop-blur-xs shadow-xs z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end">
                            {rowActions?.(row)}
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td key={item.column.key} className="px-4 py-3 align-middle text-foreground">
                        {item.column.cell ? item.column.cell(row) : item.column.value(row)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {/* Mobile Vertical Card View (visible on <md screens) */}
          <div className="p-3 space-y-3 md:hidden bg-muted/5">
            {pageRows.map((row) => {
              const primaryCol = columns[0];
              const secondaryCols = columns.slice(1);

              return (
                <div
                  key={row.id}
                  className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs space-y-3 transition-colors hover:border-primary/40"
                >
                  {/* Card Header: Primary Column Value + Action Button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {primaryCol && (
                        <>
                          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase block">
                            {primaryCol.header}
                          </span>
                          <div className="mt-0.5 text-sm font-bold text-foreground">
                            {primaryCol.cell ? primaryCol.cell(row) : primaryCol.value(row)}
                          </div>
                        </>
                      )}
                    </div>

                    {rowActions && (
                      <div className="shrink-0 pt-0.5">
                        {rowActions(row)}
                      </div>
                    )}
                  </div>

                  {/* Card Body: All remaining fields in a 2-column or full-width grid */}
                  {secondaryCols.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-2.5 border-t border-border/60 text-xs">
                      {secondaryCols.map((col) => {
                        const rendered = col.cell ? col.cell(row) : col.value(row);
                        if (rendered === null || rendered === undefined || rendered === "") return null;

                        const valStr = String(col.value(row) ?? "");
                        const isWide =
                          valStr.length > 25 ||
                          col.header.toLowerCase().includes("description") ||
                          col.header.toLowerCase().includes("title") ||
                          col.header.toLowerCase().includes("notes") ||
                          col.header.toLowerCase().includes("summary") ||
                          col.header.toLowerCase().includes("activity") ||
                          col.header.toLowerCase().includes("reason");

                        return (
                          <div
                            key={col.key}
                            className={cn("flex flex-col gap-0.5", isWide && "col-span-2")}
                          >
                            <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                              {col.header}
                            </span>
                            <div className="text-xs font-medium text-foreground break-words">
                              {rendered}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (hidden on mobile, visible on md+ screens) */}
          <div className="hidden md:block w-full overflow-x-auto">
            <table className={cn("w-full border-collapse text-sm")}>
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {orderedRenderColumns.map((item) => {
                    if (item.type === "actions") {
                      const isBeingDragged = draggedKey === ACTIONS_COLUMN_KEY;
                      const isDropLeft = dropTarget?.key === ACTIONS_COLUMN_KEY && dropTarget.position === "left";
                      const isDropRight = dropTarget?.key === ACTIONS_COLUMN_KEY && dropTarget.position === "right";
                      const canReorder = enableColumnReordering;

                      return (
                        <th
                          key={ACTIONS_COLUMN_KEY}
                          scope="col"
                          draggable={canReorder}
                          onDragStart={(e) => handleDragStart(e, ACTIONS_COLUMN_KEY)}
                          onDragOver={(e) => handleDragOver(e, ACTIONS_COLUMN_KEY)}
                          onDragLeave={(e) => handleDragLeave(e, ACTIONS_COLUMN_KEY)}
                          onDrop={(e) => handleDrop(e, ACTIONS_COLUMN_KEY)}
                          onDragEnd={handleDragEnd}
                          title={canReorder ? "Drag Actions column to reorder" : undefined}
                          className={cn(
                            "group/th relative px-4 py-2.5 text-right text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase select-none whitespace-nowrap transition-colors sticky right-0 bg-muted/95 backdrop-blur-xs shadow-xs z-10",
                            canReorder && "cursor-grab active:cursor-grabbing",
                            isBeingDragged && "opacity-40 bg-accent/30",
                            isDropLeft && "border-l-2 border-primary bg-primary/5",
                            isDropRight && "border-r-2 border-primary bg-primary/5",
                          )}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {canReorder && (
                              <GripVertical className="size-3 text-muted-foreground/30 opacity-0 transition-opacity group-hover/th:opacity-100 shrink-0" />
                            )}
                            <span>Actions</span>
                          </div>
                        </th>
                      );
                    }

                    const { column } = item;
                    const isBeingDragged = draggedKey === column.key;
                    const isDropLeft = dropTarget?.key === column.key && dropTarget.position === "left";
                    const isDropRight = dropTarget?.key === column.key && dropTarget.position === "right";
                    const canReorder = enableColumnReordering && column.reorderable !== false;

                    return (
                      <th
                        key={column.key}
                        scope="col"
                        draggable={canReorder}
                        onDragStart={(e) => handleDragStart(e, column.key)}
                        onDragOver={(e) => handleDragOver(e, column.key)}
                        onDragLeave={(e) => handleDragLeave(e, column.key)}
                        onDrop={(e) => handleDrop(e, column.key)}
                        onDragEnd={handleDragEnd}
                        title={canReorder ? "Drag column header to reorder" : undefined}
                        className={cn(
                          "group/th relative px-4 py-2.5 text-left text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase select-none transition-colors",
                          canReorder && "cursor-grab active:cursor-grabbing",
                          isBeingDragged && "opacity-40 bg-accent/30",
                          isDropLeft && "border-l-2 border-primary bg-primary/5",
                          isDropRight && "border-r-2 border-primary bg-primary/5",
                          column.headerClassName,
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          {canReorder && (
                            <GripVertical className="size-3 text-muted-foreground/30 opacity-0 transition-opacity group-hover/th:opacity-100 shrink-0" />
                          )}
                          <div className="flex-1 truncate">
                            {column.filterable ? (
                              <ColumnFilter
                                label={column.header}
                                values={uniqueValues[column.key] ?? []}
                                selected={filters[column.key]}
                                onChange={(next) =>
                                  setFilters((prev) => {
                                    const draft = { ...prev };
                                    if (next === undefined) delete draft[column.key];
                                    else draft[column.key] = next;
                                    return draft;
                                  })
                                }
                              />
                            ) : (
                              column.header
                            )}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/70 transition-colors last:border-0 hover:bg-accent/40"
                  >
                    {orderedRenderColumns.map((item) => {
                      if (item.type === "actions") {
                        return (
                          <td
                            key={ACTIONS_COLUMN_KEY}
                            className="px-4 py-3 text-right whitespace-nowrap sticky right-0 bg-card/95 backdrop-blur-xs shadow-xs z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end">
                              {rowActions?.(row)}
                            </div>
                          </td>
                        );
                      }

                      const { column } = item;
                      return (
                        <td
                          key={column.key}
                          className={cn(
                            "px-4 py-3 align-middle text-foreground",
                            column.className,
                          )}
                        >
                          {column.cell ? column.cell(row) : column.value(row)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && filtered.length > pageSize && (
        <TablePagination
          page={currentPage}
          pageCount={pageCount}
          total={filtered.length}
          from={start + 1}
          to={Math.min(start + pageSize, filtered.length)}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
