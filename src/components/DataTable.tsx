import Link from "next/link";

export type SortOrder = "asc" | "desc";

export type SortState = { key: string; order: SortOrder };

export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "start" | "end";
  className?: string;
  sortKey?: string;
};

type DataTableProps<T> = {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  empty?: React.ReactNode;
  sort?: SortState;
  onSort?: (key: string) => void;
};

const ALIGN = {
  start: "text-left",
  end: "text-right",
} as const;

const ARIA_SORT = {
  asc: "ascending",
  desc: "descending",
} as const;

const SORT_INDICATOR = {
  asc: "↑",
  desc: "↓",
} as const;

const HEADER_CELL = "text-subtle text-xs font-medium";

const HEADER_PADDING = "px-4 py-2";

const SORT_JUSTIFY = {
  start: "justify-start",
  end: "justify-end",
} as const;

const SORT_BUTTON =
  "focus-visible:outline-primary hover:text-foreground flex w-full cursor-pointer items-center gap-1 transition-colors focus-visible:-outline-offset-2 focus-visible:outline-2";

export default function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  rowHref,
  empty,
  sort,
  onSort,
}: DataTableProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="border-border bg-surface overflow-x-auto rounded-lg border">
      <table className="w-full min-w-max text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-border bg-surface-muted border-b">
            {columns.map((column) => {
              const sortKey = column.sortKey;
              const sortable = Boolean(sortKey && onSort);
              const order =
                sortKey && sort && sort.key === sortKey
                  ? sort.order
                  : undefined;
              const align = column.align ?? "start";
              return (
                <th
                  key={column.header}
                  scope="col"
                  aria-sort={
                    sortable ? (order ? ARIA_SORT[order] : "none") : undefined
                  }
                  className={`${HEADER_CELL} ${sortable ? "" : HEADER_PADDING} ${
                    ALIGN[align]
                  } ${column.className ?? ""}`}
                >
                  {sortKey && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(sortKey)}
                      className={`${SORT_BUTTON} ${HEADER_PADDING} ${
                        SORT_JUSTIFY[align]
                      } ${order ? "text-foreground" : ""}`}
                    >
                      {column.header}
                      <span aria-hidden className={order ? "" : "opacity-40"}>
                        {order ? SORT_INDICATOR[order] : "↕"}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {rows.map((row) => {
            const href = rowHref?.(row);
            return (
              <tr
                key={rowKey(row)}
                className={
                  href ? "hover:bg-hover relative transition-colors" : undefined
                }
              >
                {columns.map((column, index) => {
                  const content = column.cell(row);
                  const Cell = index === 0 ? "th" : "td";
                  return (
                    <Cell
                      key={column.header}
                      scope={index === 0 ? "row" : undefined}
                      className={`text-foreground px-4 py-2.5 font-normal ${
                        ALIGN[column.align ?? "start"]
                      } ${column.className ?? ""}`}
                    >
                      {index === 0 && href ? (
                        <Link
                          href={href}
                          className="focus-visible:outline-primary rounded-sm font-medium outline-offset-2 after:absolute after:inset-0 focus-visible:outline-2"
                        >
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </Cell>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
