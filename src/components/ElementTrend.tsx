import Card from "@/components/Card";
import ElementRadar, {
  type RadarAxis,
  type RadarSeries,
} from "@/components/ElementRadar";
import RankLegend from "@/components/RankLegend";
import StateCard from "@/components/StateCard";
import TrendTable from "@/components/TrendTable";
import { dateLabel } from "@/lib/date";
import { ELEMENTS, MIN_RADAR_ELEMENTS, elementLabel } from "@/lib/judgment";
import type { Measurement } from "@/lib/measurement";
import {
  elementRows,
  hasAnyValue,
  type Judgments,
  type TrendRow,
} from "@/lib/trend";

const AXES: RadarAxis[] = ELEMENTS.map((element) => ({
  key: element,
  label: elementLabel(element),
}));

function valuesAt(rows: TrendRow[], index: number): (number | null)[] {
  return rows.map((row) => row.points[index]?.value ?? null);
}

function radarIndexes(rows: TrendRow[], count: number): number[] {
  const usable: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const measured = rows.filter(
      (row) => row.points[index]?.value !== null,
    ).length;
    if (measured >= MIN_RADAR_ELEMENTS) usable.push(index);
  }
  return usable;
}

function LegendItem({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={`inline-block h-0.5 w-4 rounded ${tone}`} />
      {label}
    </span>
  );
}

export default function ElementTrend({
  measurements,
  judgments,
}: {
  measurements: Measurement[];
  judgments: Judgments;
}) {
  const rows = elementRows(measurements, judgments);

  if (!hasAnyValue(rows)) {
    return (
      <Card title="6要素の変化">
        <StateCard message="要素別の評価が出た測定がありません。判定の対象は20〜79歳・男女の運動機能の項目です。" />
      </Card>
    );
  }

  const usable = radarIndexes(rows, measurements.length);

  const firstIndex = usable[0];
  const lastIndex = usable.at(-1);
  const overlaid = usable.length >= 2;

  const series: RadarSeries[] = [];
  if (overlaid && firstIndex !== undefined) {
    series.push({
      key: "first",
      stroke: "stroke-trend-old",
      fill: "fill-trend-old",
      values: valuesAt(rows, firstIndex),
    });
  }
  if (lastIndex !== undefined) {
    series.push({
      key: "last",
      stroke: "stroke-trend-new",
      fill: "fill-trend-new",
      values: valuesAt(rows, lastIndex),
    });
  }

  const dateAt = (index: number | undefined) =>
    index === undefined
      ? ""
      : dateLabel(measurements[index]?.measuredOn) || "測定日未登録";

  return (
    <Card title="6要素の変化" splittable>
      <div className="flex flex-col gap-6">
        {series.length > 0 && (
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8 print:break-inside-avoid">
            <ElementRadar axes={AXES} series={series} />
            <div className="text-muted flex flex-col gap-1.5 text-xs">
              {overlaid && (
                <LegendItem tone="bg-trend-old" label={dateAt(firstIndex)} />
              )}
              <LegendItem tone="bg-trend-new" label={dateAt(lastIndex)} />
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="bg-surface-muted border-border inline-block h-3 w-4 rounded-sm border"
                />
                年代相応（C）の範囲
              </span>
              <p className="text-subtle mt-1 max-w-64">
                外側ほど良い評価です。
                {overlaid
                  ? "図は評価が出た測定のうち、最も古いものと最新のものを重ねています。"
                  : "評価が出た測定が1件のため、1つだけ描いています。"}
                他の測定は下の表で読めます。
              </p>
            </div>
          </div>
        )}

        <TrendTable
          caption="要素別評価の推移"
          itemHeader="要素"
          measurements={measurements}
          rows={rows}
          empty="表示できる要素別評価がありません。"
        />

        <RankLegend note="数値は z スコアで、高いほど同年代の平均より良い評価です。" />
      </div>
    </Card>
  );
}
