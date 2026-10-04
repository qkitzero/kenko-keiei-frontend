import Badge from "@/components/Badge";
import DataTable, { type Column } from "@/components/DataTable";
import Missing from "@/components/Missing";
import RankLegend from "@/components/RankLegend";
import SecondaryLink from "@/components/SecondaryLink";
import SectionHeader from "@/components/SectionHeader";
import StateCard from "@/components/StateCard";
import { genderLabel, type Customer } from "@/lib/customer";
import {
  ageRangeLabel,
  evaluatedAgeRange,
  evaluatedAgeRanges,
  formatZScore,
  judgedItems,
  rankLetter,
  rankTone,
  usesFallbackStandards,
  type JudgedItem,
  type Judgment,
} from "@/lib/judgment";
import { formatItemValue, formatMeasurementNumber } from "@/lib/measurement";
import type { MeasurementItem } from "@/lib/measurementItem";
import {
  evaluationUnitLabel,
  isLevelItem,
  isLowerBetter,
  isNormalized,
  levelCountOf,
  levelLabel,
} from "@/lib/measurementItem";

const REPRESENTATIVE_NOTE =
  "記録値は試行と左右をまとめた代表値で、入力した値とは異なることがあります。";

function itemNames(judged: JudgedItem[]): string {
  return judged
    .map(({ item }) => item.name ?? "")
    .filter(Boolean)
    .join("・");
}

function normalizedNote(judged: JudgedItem[]): string {
  const names = itemNames(judged.filter(({ item }) => isNormalized(item)));
  if (!names) return "";
  return `${names}の記録値・同年代の平均・標準偏差は、身長で割った値のため単位がありません。`;
}

function levelNote(judged: JudgedItem[]): string {
  return judged
    .filter(({ item }) => isLevelItem(item) && levelCountOf(item) > 0)
    .map(({ item }) => {
      const count = levelCountOf(item);
      return `${item.name}は段を 1（${levelLabel(item, 1)}）〜 ${count}（${levelLabel(item, count)}）の数値として計算しています。`;
    })
    .join("");
}

function formulaNote(judged: JudgedItem[]): string {
  const lowerBetter = itemNames(
    judged.filter(({ item }) => isLowerBetter(item)),
  );
  const direction = lowerBetter
    ? `${lowerBetter}は低いほど良い項目のため符号を反転しており、z スコアは常に高いほど良い評価です。`
    : "z スコアは高いほど良い評価です。";
  return `z スコア =（記録値 − 同年代の平均）÷ 標準偏差。${direction}`;
}

function ageGroupNote(
  judgment: Judgment,
  judged: JudgedItem[],
  customer: Customer | null,
  age: number | undefined,
): { text: string; uneven: boolean } | null {
  const ranges = evaluatedAgeRanges(judged.map(({ evaluation }) => evaluation));
  if (ranges.length === 0) return null;

  if (ranges.length > 1) {
    const groups = ranges.map((range) => {
      const names = itemNames(
        judged.filter(({ evaluation }) => {
          const evaluated = evaluatedAgeRange(evaluation);
          return evaluated?.from === range.from && evaluated.to === range.to;
        }),
      );
      return `${ageRangeLabel(range)}（${names}）`;
    });
    return {
      text: `項目によって評価に使った年代の基準値が異なります: ${groups.join("、")}。`,
      uneven: true,
    };
  }

  const gender = genderLabel(customer?.gender);
  const standard = [ageRangeLabel(ranges[0]), gender]
    .filter(Boolean)
    .join("・");
  return {
    text: usesFallbackStandards(judgment, age)
      ? `測定時の年齢（${age}歳）に対応する年代の基準値が無いため、最も近い${standard}の基準値で評価しています。`
      : `${standard}の基準値で評価しています。`,
    uneven: false,
  };
}

function evaluationCell(value: number | undefined, item: MeasurementItem) {
  const text = formatItemValue(item, value);
  if (!text) return <Missing />;
  return withUnit(text, item);
}

function numberCell(value: number | undefined, item: MeasurementItem) {
  const text = formatMeasurementNumber(value);
  if (!text) return <Missing />;
  return withUnit(text, item);
}

function withUnit(text: string, item: MeasurementItem) {
  const unit = evaluationUnitLabel(item);
  return (
    <span className="whitespace-nowrap tabular-nums">
      {text}
      {unit && <span className="text-subtle ml-1 text-xs">{unit}</span>}
    </span>
  );
}

const COLUMNS: Column<JudgedItem>[] = [
  {
    header: "項目",
    cell: (judged) => (
      <span className="whitespace-nowrap">{judged.item.name}</span>
    ),
  },
  {
    header: "記録値",
    cell: (judged) => evaluationCell(judged.evaluation.value, judged.item),
    align: "end",
  },
  {
    header: "同年代の平均",
    cell: (judged) => evaluationCell(judged.evaluation.mean, judged.item),
    align: "end",
  },
  {
    header: "標準偏差",
    cell: (judged) =>
      numberCell(judged.evaluation.standardDeviation, judged.item),
    align: "end",
  },
  {
    header: "z スコア",
    cell: (judged) => (
      <span className="tabular-nums">
        {formatZScore(judged.evaluation.zScore)}
      </span>
    ),
    align: "end",
  },
  {
    header: "判定",
    cell: (judged) => (
      <Badge size="sm" tone={rankTone(judged.evaluation.rank)}>
        {rankLetter(judged.evaluation.rank)}
      </Badge>
    ),
    align: "end",
  },
];

export default function ItemEvaluations({
  judgment,
  items,
  customer,
  age,
}: {
  judgment: Judgment;
  items: MeasurementItem[];
  customer: Customer | null;
  age: number | undefined;
}) {
  const judged = judgedItems(judgment, items);
  const dropped = (judgment.itemEvaluations ?? []).length - judged.length;
  const ageGroup = ageGroupNote(judgment, judged, customer, age);

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="項目別評価" count={judged.length} />

      {dropped > 0 && (
        <p className="text-danger text-sm">
          測定項目マスタに無い項目の評価が{dropped}
          件あり、ここには表示できません。
        </p>
      )}

      {ageGroup && (
        <p
          className={`text-sm ${ageGroup.uneven ? "text-warning" : "text-muted"}`}
        >
          {ageGroup.text}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <DataTable
          caption="測定項目ごとの判定"
          columns={COLUMNS}
          rows={judged}
          rowKey={(row) => row.item.measurementItemId ?? ""}
          empty={<StateCard message="表示できる項目別評価がありません。" />}
        />

        {judged.length > 0 && (
          <p className="text-subtle text-xs print:break-before-avoid">
            {formulaNote(judged)}
          </p>
        )}

        <RankLegend
          note={`${REPRESENTATIVE_NOTE}${normalizedNote(judged)}${levelNote(judged)}`}
          action={
            <SecondaryLink size="sm" variant="quiet" href="/judgment-criteria">
              判定の基準を見る
            </SecondaryLink>
          }
        />
      </div>
    </section>
  );
}
