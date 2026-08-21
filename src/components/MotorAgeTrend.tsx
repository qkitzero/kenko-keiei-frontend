import Card from "@/components/Card";
import DataTable, { type Column } from "@/components/DataTable";
import Missing from "@/components/Missing";
import StateCard from "@/components/StateCard";
import TrendLine from "@/components/TrendLine";
import { hasAdjacentPair } from "@/lib/chart";
import { dateLabel } from "@/lib/date";
import {
  STANDARD_MAX_AGE,
  STANDARD_MIN_AGE,
  signedAgeLabel,
  usesRoundedStandards,
} from "@/lib/judgment";
import type { Measurement } from "@/lib/measurement";
import { motorAgeTrend, type Judgments } from "@/lib/trend";

type AgeRow = {
  key: string;
  label: string;
  values: (number | null)[];
  signed: boolean;
};

function ageText(value: number | null, signed: boolean): string {
  if (value === null) return "";
  return signed ? signedAgeLabel(value) : `${value}歳`;
}

function ageColumns(measurements: Measurement[]): Column<AgeRow>[] {
  const columns: Column<AgeRow>[] = [
    { header: "", cell: (row) => row.label, className: "print:px-2" },
  ];

  measurements.forEach((measurement, index) => {
    columns.push({
      key: measurement.measurementId ?? `${index}`,
      header: dateLabel(measurement.measuredOn) || "測定日未登録",
      cell: (row) => {
        const text = ageText(row.values[index], row.signed);
        return text ? (
          <span className="tabular-nums">{text}</span>
        ) : (
          <Missing />
        );
      },
      align: "end",
      className: "print:px-2",
    });
  });

  return columns;
}

export default function MotorAgeTrend({
  measurements,
  judgments,
}: {
  measurements: Measurement[];
  judgments: Judgments;
}) {
  const trend = motorAgeTrend(measurements, judgments);

  if (trend.measuredCount === 0) {
    return (
      <Card title="運動器年齢">
        <StateCard message="運動器年齢を算出できた測定がありません。すべての年代の基準値がそろっている項目が必要です。" />
      </Card>
    );
  }

  const rows: AgeRow[] = [
    {
      key: "motor-age",
      label: "運動器年齢",
      values: trend.motorAges,
      signed: false,
    },
    { key: "age", label: "実年齢", values: trend.ages, signed: false },
    { key: "difference", label: "差", values: trend.differences, signed: true },
  ];

  const latest = trend.motorAges.filter((value) => value !== null).at(-1);
  const latestAge = trend.ages.filter((value) => value !== null).at(-1);
  const hasRoundedAge = trend.ages.some(
    (age, index) =>
      trend.motorAges[index] !== null && usesRoundedStandards(age),
  );

  return (
    <Card title="運動器年齢" splittable>
      <div className="flex flex-col gap-4">
        {hasAdjacentPair(trend.motorAges) && (
          <div className="flex flex-col gap-2 print:break-inside-avoid">
            <TrendLine
              values={trend.motorAges}
              context={trend.ages}
              labels={measurements.map(
                (measurement) => dateLabel(measurement.measuredOn) || "",
              )}
              valueLabel={latest === undefined ? "" : `${latest}歳`}
              contextLabel={latestAge === undefined ? "" : `${latestAge}歳`}
            />
            <div className="text-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="border-primary inline-block h-0 w-5 border-t-2"
                />
                運動器年齢（実線）
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="border-subtle inline-block h-0 w-5 border-t-2 border-dashed"
                />
                実年齢（破線）
              </span>
            </div>
          </div>
        )}

        <DataTable
          caption="運動器年齢の推移"
          columns={ageColumns(measurements)}
          rows={rows}
          rowKey={(row) => row.key}
        />

        <p className="text-subtle text-xs">
          運動器年齢は、すべての年代の基準値がそろっている項目から算出します。項目がそろわない測定では空欄になります。
          {hasRoundedAge &&
            `測定時の年齢に対応する基準値が無い測定は、最も近い年代（${STANDARD_MIN_AGE}〜${STANDARD_MAX_AGE}歳）の基準値で比べているため、差が大きく出ます。`}
        </p>
      </div>
    </Card>
  );
}
