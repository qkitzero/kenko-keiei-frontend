import Link from "next/link";

export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "start" | "end";
  className?: string;
};

type DataTableProps<T> = {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  empty?: React.ReactNode;
};

const ALIGN = {
  start: "text-left",
  end: "text-right",
} as const;

export default function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  rowHref,
  empty,
}: DataTableProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="border-border bg-surface overflow-x-auto rounded-lg border">
      <table className="w-full min-w-max text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-border bg-surface-muted border-b">
            {columns.map((column) => (
              <th
                key={column.header}
                scope="col"
                className={`text-subtle px-4 py-2 text-xs font-medium ${
                  ALIGN[column.align ?? "start"]
                } ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
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
