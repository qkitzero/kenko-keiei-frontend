import Badge from "@/components/Badge";
import Card from "@/components/Card";
import ElementRadar, { type ElementPoint } from "@/components/ElementRadar";
import {
  ELEMENTS,
  MIN_RADAR_ELEMENTS,
  elementEvaluationsByElement,
  elementLabel,
  formatZScore,
  rankLetter,
  rankMeaning,
  rankTone,
  type Judgment,
} from "@/lib/judgment";

export default function ElementEvaluations({
  judgment,
}: {
  judgment: Judgment;
}) {
  const byElement = elementEvaluationsByElement(judgment);

  const rows = ELEMENTS.map((element) => ({
    element,
    label: elementLabel(element),
    evaluation: byElement.get(element) ?? null,
  }));

  const points: ElementPoint[] = rows.map((row) => ({
    element: row.element,
    label: row.label,
    zScore:
      typeof row.evaluation?.zScore === "number" ? row.evaluation.zScore : null,
  }));

  const measuredCount = points.filter((point) => point.zScore !== null).length;

  return (
    <Card title="要素別評価">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        {measuredCount >= MIN_RADAR_ELEMENTS && (
          <div className="flex min-w-0 flex-col items-center gap-2 sm:shrink-0">
            <ElementRadar points={points} />
            <p className="text-subtle text-xs">
              灰色の帯が「年代相応」の範囲です
            </p>
          </div>
        )}

        <ul className="divide-border w-full divide-y">
          {rows.map((row) => (
            <li
              key={row.element}
              className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
            >
              <span
                className={`text-sm ${
                  row.evaluation ? "text-foreground" : "text-subtle"
                }`}
              >
                {row.label}
              </span>
              {row.evaluation ? (
                <span className="flex items-center gap-2">
                  <span className="text-subtle text-xs tabular-nums">
                    {formatZScore(row.evaluation.zScore)}
                  </span>
                  <Badge size="sm" tone={rankTone(row.evaluation.rank)}>
                    {rankLetter(row.evaluation.rank)}{" "}
                    {rankMeaning(row.evaluation.rank)}
                  </Badge>
                </span>
              ) : (
                <span className="text-subtle text-xs">未測定</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
