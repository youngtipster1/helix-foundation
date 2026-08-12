import { Search, SlidersHorizontal, TableProperties } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

import { ColumnFilter } from "./column-filter";
import { TablePagination } from "./table-pagination";
import type { ColumnFilterState, DataTableColumn } from "./types";

/**
 * Reusable table with search, Excel-style column filters and pagination.
 *
 * Filtering runs against the rows it is given, so a future Laravel-backed
 * implementation can pass server-filtered rows plus `onFiltersChange` without
 * changing the table UI.
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
  onFiltersChange,
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
  onFiltersChange?: (filters: ColumnFilterState, search: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ColumnFilterState>({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    onFiltersChange?.(filters, search);
  }, [filters, search, onFiltersChange]);

  const uniqueValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const column of columns) {
      if (!column.filterable) continue;
      map[column.key] = [...new Set(rows.map((row) => column.value(row)))].sort((a, b) =>
        a.localeCompare(b),
      );
    }
    return map;
  }, [columns, rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      for (const column of columns) {
        const selected = filters[column.key];
        if (selected && !selected.includes(column.value(row))) return false;
      }
      if (!term) return true;
      return columns.some((column) => column.value(row).toLowerCase().includes(term));
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
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "px-4 py-2.5 text-left text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase",
                      column.headerClassName,
                    )}
                  >
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
                  </th>
                ))}
                {rowActions && (
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-right text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/70 transition-colors last:border-0 hover:bg-accent/40"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("px-4 py-3 align-middle text-foreground", column.className)}
                    >
                      {column.cell ? column.cell(row) : column.value(row)}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">{rowActions(row)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
