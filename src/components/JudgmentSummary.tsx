import Card from "@/components/Card";
import {
  motorAgeDifference,
  motorAgeDifferenceLabel,
  type Judgment,
} from "@/lib/judgment";
import type { Measurement } from "@/lib/measurement";

export default function JudgmentSummary({
  judgment,
  measurement,
}: {
  judgment: Judgment;
  measurement: Measurement;
}) {
  const motorAge = judgment.motorAge;
  const difference = motorAgeDifference(judgment, measurement);

  return (
    <Card title="運動器年齢">
      {typeof motorAge === "number" ? (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-foreground text-2xl font-semibold tabular-nums">
            {motorAge}
            <span className="text-subtle ml-1 text-sm font-normal">歳</span>
          </p>
          {difference !== null && (
            <p className="text-muted text-sm">
              {motorAgeDifferenceLabel(difference)}（測定時{" "}
              {measurement.ageAtMeasurement}歳）
            </p>
          )}
        </div>
      ) : (
        <p className="text-subtle text-sm">
          この測定では運動器年齢を算出できませんでした。すべての年代の基準値がそろっている項目が必要です。
        </p>
      )}
    </Card>
  );
}
