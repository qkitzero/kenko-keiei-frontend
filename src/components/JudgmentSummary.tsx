import Card from "@/components/Card";
import {
  ageRangeLabel,
  evaluatedAgeRanges,
  motorAgeDifference,
  motorAgeDifferenceLabel,
  usesFallbackStandards,
  type Judgment,
} from "@/lib/judgment";
import type { Measurement } from "@/lib/measurement";

function fallbackNote(judgment: Judgment, age: number): string {
  const ranges = evaluatedAgeRanges(judgment.itemEvaluations ?? []);
  const nearest =
    ranges.length === 1 ? `${ageRangeLabel(ranges[0])}の` : "年代の";
  return `測定時の年齢（${age}歳）に対応する年代の基準値が無いため、項目は最も近い${nearest}基準値で評価しています。運動器年齢は、基準値を年代の外へ延長して推定した値です。`;
}

export default function JudgmentSummary({
  judgment,
  measurement,
}: {
  judgment: Judgment;
  measurement: Measurement;
}) {
  const motorAge = judgment.motorAge;
  const age = measurement.ageAtMeasurement;
  const difference = motorAgeDifference(judgment, measurement);

  return (
    <Card title="運動器年齢">
      {typeof motorAge === "number" ? (
        <>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-foreground text-2xl font-semibold tabular-nums">
              {motorAge}
              <span className="text-subtle ml-1 text-sm font-normal">歳</span>
            </p>
            {difference !== null && (
              <p className="text-muted text-sm">
                {motorAgeDifferenceLabel(difference)}（測定時 {age}歳）
              </p>
            )}
          </div>
          {typeof age === "number" && usesFallbackStandards(judgment, age) && (
            <p className="text-subtle mt-2 text-xs">
              {fallbackNote(judgment, age)}
            </p>
          )}
        </>
      ) : (
        <p className="text-subtle text-sm">
          この測定では運動器年齢を算出できませんでした。基準値で判定できた項目が1つ以上必要です。
        </p>
      )}
    </Card>
  );
}
