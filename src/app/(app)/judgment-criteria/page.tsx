"use client";

import Badge from "@/components/Badge";
import Card from "@/components/Card";
import DataTable, { type Column } from "@/components/DataTable";
import LoginButton from "@/components/LoginButton";
import Missing from "@/components/Missing";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import PageMessage from "@/components/PageMessage";
import PageSkeleton from "@/components/PageSkeleton";
import SecondaryButton from "@/components/SecondaryButton";
import Select from "@/components/Select";
import StateCard from "@/components/StateCard";
import {
  ageRangeLabel,
  elementLabel,
  rankTone,
  type AgeRange,
} from "@/lib/judgment";
import {
  STANDARD_GENDERS,
  ageGroupRows,
  edgeAgeGroups,
  itemsByElement,
  judgedAgeRange,
  rankRanges,
  registeredAgeRange,
  standardGenderLabel,
  standardSourceNote,
  standardizedItems,
  unknownStandardItemCount,
  zScoreRangeLabel,
  type AgeGroupRow,
  type ElementItems,
  type JudgmentCriteria,
  type RankRange,
  type StandardGender,
} from "@/lib/judgmentCriteria";
import { formatMeasurementNumber } from "@/lib/measurement";
import {
  evaluationUnitLabel,
  isJudgedItem,
  isLevelItem,
  isLowerBetter,
  isNormalized,
  levelLabel,
  scoreDirectionLabel,
  sideAggregationLabel,
  trialAggregationLabel,
  type MeasurementItem,
} from "@/lib/measurementItem";
import { useJudgmentCriteria } from "@/lib/useJudgmentCriteria";
import { useMeasurementItems } from "@/lib/useMeasurementItems";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const GENDER_PARAMS: Record<string, StandardGender> = {
  male: "STANDARD_GENDER_MALE",
  female: "STANDARD_GENDER_FEMALE",
};

const GENDER_PARAM_BY_GENDER: Record<string, string> = {
  STANDARD_GENDER_MALE: "male",
  STANDARD_GENDER_FEMALE: "female",
};

function names(items: MeasurementItem[]): string {
  return items
    .map((item) => item.name ?? "")
    .filter(Boolean)
    .join("・");
}

const RANK_COLUMNS: Column<RankRange>[] = [
  {
    header: "ランク",
    cell: (range) => (
      <Badge size="sm" tone={rankTone(range.rank)}>
        {range.letter}
      </Badge>
    ),
  },
  { header: "意味", cell: (range) => range.meaning },
  {
    header: "z スコア",
    cell: (range) => (
      <span className="whitespace-nowrap tabular-nums">
        {zScoreRangeLabel(range)}
      </span>
    ),
  },
];

function textCell(text: string) {
  return text ? <span className="whitespace-nowrap">{text}</span> : <Missing />;
}

const REPRESENTATIVE_COLUMNS: Column<MeasurementItem>[] = [
  { header: "項目", cell: (item) => textCell(item.name ?? "") },
  { header: "良い方向", cell: (item) => textCell(scoreDirectionLabel(item)) },
  {
    header: "1. 試行をまとめる",
    cell: (item) => textCell(trialAggregationLabel(item)),
  },
  {
    header: "2. 左右をまとめる",
    cell: (item) => textCell(sideAggregationLabel(item)),
  },
  {
    header: "3. 身長で割る",
    cell: (item) => (isNormalized(item) ? "割る" : "—"),
  },
];

const ELEMENT_COLUMNS: Column<ElementItems>[] = [
  {
    header: "要素",
    cell: (row) => (
      <span className="whitespace-nowrap">{elementLabel(row.element)}</span>
    ),
  },
  {
    header: "項目数",
    cell: (row) => <span className="tabular-nums">{row.items.length}</span>,
    align: "end",
  },
  {
    header: "項目",
    cell: (row) => (row.items.length > 0 ? names(row.items) : <Missing />),
  },
];

function standardValue(value: number | undefined, item: MeasurementItem) {
  const text = formatMeasurementNumber(value);
  if (!text) return <Missing />;
  const unit = evaluationUnitLabel(item);
  return (
    <span className="whitespace-nowrap tabular-nums">
      {text}
      {unit && <span className="text-subtle ml-1 text-xs">{unit}</span>}
    </span>
  );
}

function ageGroupColumns(item: MeasurementItem): Column<AgeGroupRow>[] {
  const level = isLevelItem(item);
  return [
    {
      header: "年代",
      cell: (row) => (
        <span className="whitespace-nowrap tabular-nums">
          {ageRangeLabel(row.range)}
        </span>
      ),
    },
    {
      header: "平均",
      cell: (row) => standardValue(row.mean, item),
      align: "end",
    },
    ...(level
      ? [
          {
            header: "平均の段",
            cell: (row: AgeGroupRow) => textCell(levelLabel(item, row.mean)),
          },
        ]
      : []),
    {
      header: "標準偏差",
      cell: (row) => standardValue(row.standardDeviation, item),
      align: "end",
    },
  ];
}

export default function JudgmentCriteriaPage() {
  return (
    <Suspense fallback={<PageSkeleton width="detail" />}>
      <JudgmentCriteriaDetail />
    </Suspense>
  );
}

function JudgmentCriteriaDetail() {
  const items = useMeasurementItems();
  const criteria = useJudgmentCriteria();

  if (items.status === "loading" || criteria.status === "loading") {
    return <PageSkeleton width="detail" />;
  }

  if (
    items.status === "unauthenticated" ||
    criteria.status === "unauthenticated"
  ) {
    return (
      <PageMessage
        title="サインインの有効期限が切れました"
        message="再度サインインしてください。"
        action={<LoginButton />}
      />
    );
  }

  const failed = [items, criteria].flatMap((state) =>
    state.status === "error" ? [state.retry] : [],
  );

  return (
    <PageContainer width="detail">
      <PageHeader
        title="判定基準"
        description="判定（A〜E）・要素別評価・運動器年齢を、どの基準とどの計算で出しているかをまとめています。すべてのテナントで共通です。"
      />

      {items.status === "ok" && criteria.status === "ok" ? (
        <JudgmentCriteriaSections items={items.data} criteria={criteria.data} />
      ) : (
        <StateCard
          message="判定基準を読み込めませんでした。時間をおいて再度お試しください。"
          action={
            <SecondaryButton onClick={() => failed.forEach((retry) => retry())}>
              再試行
            </SecondaryButton>
          }
        />
      )}
    </PageContainer>
  );
}

function JudgmentCriteriaSections({
  items,
  criteria,
}: {
  items: MeasurementItem[];
  criteria: JudgmentCriteria;
}) {
  const judged = items.filter(isJudgedItem);
  const unjudged = items.filter((item) => !isJudgedItem(item));
  const lowerBetter = judged.filter(isLowerBetter);
  const normalized = judged.filter(isNormalized);
  const levels = judged.filter(isLevelItem);
  const registered = registeredAgeRange(criteria);
  const judgedAges = judgedAgeRange(criteria);
  const edges = edgeAgeGroups(criteria);
  const sourced = items.filter((item) => standardSourceNote(item.code));
  const unknownCount = unknownStandardItemCount(criteria, items);

  return (
    <>
      <Card title="ランク">
        <div className="flex flex-col gap-3">
          <DataTable
            caption="ランクと z スコアの範囲"
            columns={RANK_COLUMNS}
            rows={rankRanges(criteria)}
            rowKey={(range) => range.rank}
            empty={<StateCard message="ランクの基準が登録されていません。" />}
          />
          <p className="text-subtle text-xs">
            z
            スコアが境界の値ちょうどのときは上のランクになります。判定結果の画面は
            z
            スコアを小数第1位に丸めて表示していますが、ランクは小数第2位までの値で決まるため、境界付近では表示とランクが食い違って見えることがあります。
          </p>
        </div>
      </Card>

      <Card title="代表値の決め方">
        <div className="flex flex-col gap-3">
          <p className="text-muted text-sm">
            判定に使う値（記録値）は、入力した値を次の順にまとめた代表値です。まとめ方は項目ごとに決まっていて、
            <strong className="font-medium">
              試行のまとめ方と左右のまとめ方は別の規則
            </strong>
            です。
          </p>
          <ol className="text-muted list-decimal pl-5 text-sm">
            <li>左・右などの側ごとに、試行をまとめる</li>
            <li>側ごとの値を、左右でまとめる</li>
            <li>
              身長で割る項目は、まとめた値を身長（記録した値の平均）で割る
            </li>
          </ol>
          <DataTable
            caption="項目ごとの代表値のまとめ方"
            columns={REPRESENTATIVE_COLUMNS}
            rows={judged}
            rowKey={(item) => item.measurementItemId ?? ""}
            empty={<StateCard message="判定の対象になる項目がありません。" />}
          />
          <p className="text-subtle text-xs">
            「良い方」「悪い方」は項目の良い方向で決まります。低いほど良い項目では、小さい値が良い方です。平均は小数第2位に丸めます。記録が無い試行・側は数えません（3回のうち2回だけ記録したら2回の平均です）。
          </p>
        </div>
      </Card>

      <Card title="z スコア">
        <div className="flex flex-col gap-3">
          <p className="text-foreground text-sm font-medium">
            z スコア =（代表値 − 同年代の平均）÷ 標準偏差
          </p>
          <p className="text-muted text-sm">
            同年代の平均と標準偏差は、測定時の年齢を含む年代・性別の基準値（下の「年代別基準値」）です。
            {lowerBetter.length > 0 &&
              `低いほど良い項目（${names(lowerBetter)}）は符号を反転しているため、`}
            z
            スコアは常に高いほど良い評価です。小数第2位に丸め、上のランク表に当てはめて項目のランクを決めます。
          </p>
        </div>
      </Card>

      <Card title="要素と項目の対応">
        <div className="flex flex-col gap-3">
          <DataTable
            caption="要素ごとの項目"
            columns={ELEMENT_COLUMNS}
            rows={itemsByElement(items)}
            rowKey={(row) => row.element}
          />
          <p className="text-subtle text-xs">
            要素の z スコアは、その測定で判定できた項目の z
            スコアの単純平均（小数第2位に丸め）で、ランク表に当てはめて要素のランクを決めます。測っていない項目は平均に入りません。項目数が少ない要素は、1つの項目の測定誤差でランクが動きやすくなります。
          </p>
        </div>
      </Card>

      <Card title="運動器年齢">
        <ul className="text-muted flex list-disc flex-col gap-1 pl-5 text-sm">
          <li>
            年齢を1歳ずつ変えながら、その年齢の基準値で判定できた各項目の z
            スコアを求め、
            <strong className="font-medium">
              絶対値の合計が最も小さくなる年齢
            </strong>
            を運動器年齢とします。合計が同じなら、測定時の年齢に近い方をとります。
          </li>
          <li>
            各年齢の基準値は、年代ごとの平均・標準偏差を年代の中央の年齢に置き、その間を直線でつないで求めます。基準値が登録されている年代の外側では、平均を端の2つの年代の傾きで延長し、標準偏差は端の年代の値を使います。
          </li>
          <li>要素別評価からではなく、項目の代表値から直接求めます。</li>
        </ul>
      </Card>

      <AgeGroupStandards criteria={criteria} items={items} />

      {unknownCount > 0 && (
        <p className="text-danger text-sm">
          測定項目マスタに無い項目の基準値が{unknownCount}
          項目ぶんあり、ここには表示できません。
        </p>
      )}

      <Card title="判定できない条件">
        <ul className="text-muted flex list-disc flex-col gap-1 pl-5 text-sm">
          <li>
            顧客の性別が男性・女性以外か、登録されていない（基準値は男女別にしかありません）
          </li>
          {judgedAges && registered && (
            <li>
              測定時の年齢が{ageRangeLabel(judgedAges)}の外にある（基準値は
              {ageRangeLabel(registered)}の年代に登録されています）
            </li>
          )}
          <li>
            判定の対象になる項目を測っていない
            {unjudged.length > 0 &&
              `（${names(unjudged)}は記録のみで判定しません）`}
          </li>
          {normalized.length > 0 && (
            <li>
              {names(normalized)}
              は身長で割って判定するため、身長を記録していない測定では判定しません
            </li>
          )}
          <li>
            測定不可にした項目と、値を1つも記録していない項目は判定しません
          </li>
        </ul>
      </Card>

      <Card title="注記">
        <ul className="text-muted flex list-disc flex-col gap-1 pl-5 text-sm">
          <li>
            判定は保存されず、表示するたびに現在の基準で計算し直しています。
            <strong className="font-medium">
              基準を見直すと、過去の測定の判定も変わります。
            </strong>
          </li>
          {edges && (
            <li>
              <FallbackNote
                youngest={edges.youngest}
                oldest={edges.oldest}
                criteria={criteria}
              />
            </li>
          )}
          {levels.length > 0 && (
            <li>
              {names(levels)}
              は段階で記録する項目ですが、段を等間隔の数値（1, 2, 3,
              …）とみなして平均・標準偏差・z
              スコアを計算しています。実際の段の難しさは等間隔ではないため、z
              スコアは目安です。
            </li>
          )}
          {sourced.map((item) => (
            <li key={item.measurementItemId}>
              {item.name}の基準値: {standardSourceNote(item.code)}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function FallbackNote({
  youngest,
  oldest,
  criteria,
}: {
  youngest: AgeRange;
  oldest: AgeRange;
  criteria: JudgmentCriteria;
}) {
  const younger = criteria.ageGroupFallback?.maxYoungerYears ?? 0;
  const older = criteria.ageGroupFallback?.maxOlderYears ?? 0;

  return (
    <>
      登録されている年代の外側の年齢は、下へ{younger}歳・上へ{older}
      歳まで、最も近い年代の基準値で評価します（{youngest.from}
      歳未満は{ageRangeLabel(youngest)}、{oldest.to}歳より上は
      {ageRangeLabel(oldest)}
      の基準値）。{oldest.to}
      歳より上の人は自分より若い年代と比べることになるため、ランクが低く出やすくなります。
    </>
  );
}

function AgeGroupStandards({
  criteria,
  items,
}: {
  criteria: JudgmentCriteria;
  items: MeasurementItem[];
}) {
  const searchParams = useSearchParams();
  const candidates = standardizedItems(criteria, items);

  const selected =
    candidates.find((item) => item.code === searchParams.get("item")) ??
    candidates[0];
  const gender =
    GENDER_PARAMS[searchParams.get("gender") ?? ""] ?? STANDARD_GENDERS[0];

  const write = (item: MeasurementItem | undefined, next: StandardGender) => {
    const params = new URLSearchParams();
    if (item?.code) params.set("item", item.code);
    params.set("gender", GENDER_PARAM_BY_GENDER[next]);
    window.history.replaceState(null, "", `/judgment-criteria?${params}`);
  };

  const rows = selected ? ageGroupRows(criteria, selected, gender) : [];
  const sourceNote = standardSourceNote(selected?.code);

  return (
    <Card title="年代別基準値" splittable>
      {candidates.length === 0 || !selected ? (
        <StateCard message="年代別の基準値が登録されていません。" />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3 print:hidden">
            <Select
              label="項目"
              size="sm"
              value={selected.code ?? ""}
              onChange={(code) =>
                write(
                  candidates.find((item) => item.code === code),
                  gender,
                )
              }
            >
              {candidates.map((item) => (
                <option key={item.measurementItemId} value={item.code}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Select
              label="性別"
              size="sm"
              value={GENDER_PARAM_BY_GENDER[gender]}
              onChange={(value) =>
                write(selected, GENDER_PARAMS[value] ?? STANDARD_GENDERS[0])
              }
            >
              {STANDARD_GENDERS.map((option) => (
                <option key={option} value={GENDER_PARAM_BY_GENDER[option]}>
                  {standardGenderLabel(option)}
                </option>
              ))}
            </Select>
          </div>

          <p className="text-foreground text-sm font-medium">
            {selected.name}・{standardGenderLabel(gender)}
          </p>

          {sourceNote && (
            <p className="text-warning text-sm">
              公的な統計そのものではない値です。{sourceNote}
            </p>
          )}

          <DataTable
            caption={`${selected.name}・${standardGenderLabel(gender)}の年代別基準値`}
            columns={ageGroupColumns(selected)}
            rows={rows}
            rowKey={(row) => `${row.range.from}-${row.range.to}`}
            empty={
              <StateCard
                message={`${selected.name}の${standardGenderLabel(gender)}の基準値は登録されていません。`}
              />
            }
          />
        </div>
      )}
    </Card>
  );
}
