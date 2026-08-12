import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  /** Unique key, also used as the filter identifier. */
  key: string;
  header: string;
  /** Plain-text value used for search, filtering and sorting. */
  value: (row: T) => string;
  /** Optional custom cell rendering. Falls back to `value`. */
  cell?: (row: T) => ReactNode;
  /** Enables Excel-style multi-select column filtering. */
  filterable?: boolean;
  className?: string;
  headerClassName?: string;
};

/** Filter state shape: column key -> selected values. Empty/absent = no filter. */
export type ColumnFilterState = Record<string, string[]>;
