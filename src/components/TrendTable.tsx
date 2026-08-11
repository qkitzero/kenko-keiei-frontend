import Badge from "@/components/Badge";
import DataTable, { type Column } from "@/components/DataTable";
import Missing from "@/components/Missing";
import Sparkline from "@/components/Sparkline";
import StateCard from "@/components/StateCard";
import { hasAdjacentPair } from "@/lib/chart";
import { dateLabel } from "@/lib/date";
import { rankLetter, rankTone } from "@/lib/judgment";
import type { Measurement } from "@/lib/measurement";
import { trendDelta, type TrendRow } from "@/lib/trend";

const RANK_SLOT = "inline-flex w-7 shrink-0 justify-start";

const TIGHT_CELL = "print:px-2";

function pointCell(row: TrendRow, index: number, showRank: boolean) {
  const point = row.points[index];
  if (!point || (!point.text && !point.rank)) return <Missing />;

  return (
    <span className="inline-flex items-center justify-end gap-1.5">
      <span className="tabular-nums">{point.text}</span>
      {showRank && (
        <span className={RANK_SLOT}>
          {point.rank && (
            <Badge size="sm" tone={rankTone(point.rank)}>
              {rankLetter(point.rank)}
            </Badge>
          )}
        </span>
      )}
    </span>
  );
}

function sparklineCell(row: TrendRow) {
  const values = row.points.map((point) => point.value);
  if (!hasAdjacentPair(values)) return <Missing />;

  return (
    <span className="inline-flex justify-end">
      <Sparkline values={values} minRange={row.minRange} />
    </span>
  );
}

function deltaCell(row: TrendRow) {
  const delta = trendDelta(row);

  if (delta.kind === "empty") return <Missing />;
  if (delta.kind === "unchanged") {
    return <span className="text-subtle">変わらず</span>;
  }
  if (delta.kind === "value") {
    return <span className="tabular-nums">{delta.text}</span>;
  }
  if (delta.kind === "text") {
    return (
      <span className="inline-flex flex-wrap items-center justify-end gap-1">
        <span>{delta.from}</span>
        <span aria-hidden className="text-subtle text-xs">
          →
        </span>
        <span>{delta.to}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Badge size="sm" tone={rankTone(delta.from)}>
        {rankLetter(delta.from)}
      </Badge>
      <span aria-hidden className="text-subtle text-xs">
        →
      </span>
      <Badge size="sm" tone={rankTone(delta.to)}>
        {rankLetter(delta.to)}
      </Badge>
    </span>
  );
}

function trendColumns(
  measurements: Measurement[],
  itemHeader: string,
  showRank: boolean,
): Column<TrendRow>[] {
  const columns: Column<TrendRow>[] = [
    {
      header: itemHeader,
      className: TIGHT_CELL,
      cell: (row) => (
        <span>
          {row.label}
          {row.unit && (
            <span className="text-subtle ml-1.5 text-xs">{row.unit}</span>
          )}
        </span>
      ),
    },
  ];

  measurements.forEach((measurement, index) => {
    columns.push({
      key: measurement.measurementId ?? `${index}`,
      header: dateLabel(measurement.measuredOn) || "測定日未登録",
      cell: (row) => pointCell(row, index, showRank),
      align: "end",
      className: TIGHT_CELL,
    });
  });

  columns.push({
    header: "推移",
    cell: sparklineCell,
    align: "end",
    className: "print:hidden",
  });

  columns.push({
    header: "変化",
    cell: deltaCell,
    align: "end",
    className: TIGHT_CELL,
  });

  return columns;
}

export default function TrendTable({
  caption,
  itemHeader,
  measurements,
  rows,
  empty,
}: {
  caption: string;
  itemHeader: string;
  measurements: Measurement[];
  rows: TrendRow[];
  empty: string;
}) {
  const showRank = rows.some((row) => row.hasRank);

  return (
    <DataTable
      caption={caption}
      columns={trendColumns(measurements, itemHeader, showRank)}
      rows={rows}
      rowKey={(row) => row.key}
      empty={<StateCard message={empty} />}
    />
  );
}
