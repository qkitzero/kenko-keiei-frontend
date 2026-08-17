import Badge from "@/components/Badge";
import DataTable, { type Column } from "@/components/DataTable";
import RankLegend from "@/components/RankLegend";
import SectionHeader from "@/components/SectionHeader";
import StateCard from "@/components/StateCard";
import {
  formatZScore,
  judgedItems,
  rankLetter,
  rankTone,
  type JudgedItem,
  type Judgment,
} from "@/lib/judgment";
import { formatMeasurementNumber } from "@/lib/measurement";
import type { MeasurementItem } from "@/lib/measurementItem";
import { levelLabel, unitLabel } from "@/lib/measurementItem";

function evaluationCell(text: string, item: MeasurementItem) {
  if (!text) return "";
  const unit = unitLabel(item.unit);
  return (
    <span className="tabular-nums">
      {text}
      {unit && <span className="text-subtle ml-1 text-xs">{unit}</span>}
    </span>
  );
}

function valueCell(value: number | undefined, item: MeasurementItem) {
  return evaluationCell(
    levelLabel(item, value) || formatMeasurementNumber(value),
    item,
  );
}

function meanCell(value: number | undefined, item: MeasurementItem) {
  return evaluationCell(formatMeasurementNumber(value), item);
}

const COLUMNS: Column<JudgedItem>[] = [
  {
    header: "項目",
    cell: (judged) => judged.item.name,
  },
  {
    header: "記録値",
    cell: (judged) => valueCell(judged.evaluation.value, judged.item),
    align: "end",
  },
  {
    header: "同年代の平均",
    cell: (judged) => meanCell(judged.evaluation.mean, judged.item),
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
}: {
  judgment: Judgment;
  items: MeasurementItem[];
}) {
  const judged = judgedItems(judgment, items);
  const dropped = (judgment.itemEvaluations ?? []).length - judged.length;

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="項目別評価" count={judged.length} />

      {dropped > 0 && (
        <p className="text-danger text-sm">
          測定項目マスタに無い項目の評価が{dropped}
          件あり、ここには表示できません。
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

        <RankLegend note="記録値は試行と左右をまとめた代表値で、入力した値とは異なることがあります。" />
      </div>
    </section>
  );
}
