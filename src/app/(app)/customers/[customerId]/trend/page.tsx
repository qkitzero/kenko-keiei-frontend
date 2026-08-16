"use client";

import Card from "@/components/Card";
import ElementTrend from "@/components/ElementTrend";
import LoginButton from "@/components/LoginButton";
import MeasurementItemGuide from "@/components/MeasurementItemGuide";
import MotorAgeTrend from "@/components/MotorAgeTrend";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import PageMessage from "@/components/PageMessage";
import PageSkeleton from "@/components/PageSkeleton";
import PrintButton from "@/components/PrintButton";
import PrintFrame from "@/components/PrintFrame";
import RankLegend from "@/components/RankLegend";
import SecondaryButton from "@/components/SecondaryButton";
import Select from "@/components/Select";
import StateCard from "@/components/StateCard";
import TrendTable from "@/components/TrendTable";
import { useTenants } from "@/context/TenantsContext";
import { dateInputValue, dateLabel } from "@/lib/date";
import { measurementDataLoss } from "@/lib/measurement";
import { printFileName } from "@/lib/print";
import {
  DEFAULT_TREND_LIMIT,
  judgedItemRows,
  limitTrend,
  prepareTrend,
  recordedRows,
  toTrendLimit,
  type Judgments,
  type TrendLimit,
} from "@/lib/trend";
import { useCustomer } from "@/lib/useCustomer";
import { useJudgments } from "@/lib/useJudgments";
import { useMeasurementItems } from "@/lib/useMeasurementItems";
import { useMeasurements } from "@/lib/useMeasurements";
import { isSameId } from "@/lib/uuid";
import { useSearchParams } from "next/navigation";
import { Suspense, use } from "react";

export default function CustomerTrendPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = use(params);
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CustomerTrend key={customerId} customerId={customerId} />
    </Suspense>
  );
}

const NO_JUDGMENTS: Judgments = new Map();

function trendHref(customerId: string, limit: TrendLimit): string {
  const base = `/customers/${customerId}/trend`;
  return limit === DEFAULT_TREND_LIMIT ? base : `${base}?limit=${limit}`;
}

function CustomerTrend({ customerId }: { customerId: string }) {
  const searchParams = useSearchParams();
  const limit = toTrendLimit(searchParams.get("limit"));

  const customer = useCustomer(customerId);
  const measurements = useMeasurements(customerId);
  const items = useMeasurementItems();
  const { memberships } = useTenants();

  const all = measurements.status === "ok" ? measurements.data : [];
  const prepared = prepareTrend(all);
  const judgments = useJudgments(
    prepared.measurements.map((measurement) => measurement.measurementId ?? ""),
  );

  const customerHref = `/customers/${customerId}`;

  if (
    customer.status === "loading" ||
    measurements.status === "loading" ||
    items.status === "loading"
  ) {
    return <PageSkeleton />;
  }

  if (
    customer.status === "unauthenticated" ||
    measurements.status === "unauthenticated" ||
    items.status === "unauthenticated" ||
    judgments.status === "unauthenticated"
  ) {
    return (
      <PageMessage
        title="サインインの有効期限が切れました"
        message="再度サインインしてください。"
        action={<LoginButton />}
      />
    );
  }

  if (customer.status === "error") {
    return (
      <PageMessage
        title="顧客を取得できませんでした"
        message="誰の記録かを確認できないため、表示できません。"
        action={
          <SecondaryButton onClick={customer.retry}>再試行</SecondaryButton>
        }
        link={{ href: customerHref, label: "顧客詳細に戻る" }}
      />
    );
  }

  if (!customer.data) {
    return (
      <PageMessage
        title="顧客が見つかりません"
        link={{ href: "/customers", label: "顧客一覧に戻る" }}
      />
    );
  }

  if (measurements.status === "error") {
    return (
      <PageMessage
        title="測定履歴を読み込めませんでした"
        message="時間をおいて再度お試しください。"
        action={
          <SecondaryButton onClick={measurements.retry}>再試行</SecondaryButton>
        }
        link={{ href: customerHref, label: "顧客詳細に戻る" }}
      />
    );
  }

  if (items.status === "error") {
    return (
      <PageMessage
        title="測定項目を取得できませんでした"
        message="測定項目を読み込めないため、推移を表示できません。"
        action={<SecondaryButton onClick={items.retry}>再試行</SecondaryButton>}
        link={{ href: customerHref, label: "顧客詳細に戻る" }}
      />
    );
  }

  const customerName = customer.data.name ?? "";
  const tenantId = customer.data.tenantId ?? "";
  const issuer =
    memberships.find(({ tenant }) => isSameId(tenant.tenantId, tenantId))
      ?.tenant.name ?? "";

  const shown = limitTrend(prepared.measurements, limit);
  const loadingJudgments = judgments.status === "loading";
  const judged = loadingJudgments ? NO_JUDGMENTS : judgments.judgments;

  const shownIds = new Set(
    shown.map((measurement) => measurement.measurementId ?? ""),
  );
  const failedCount = loadingJudgments
    ? 0
    : judgments.failed.filter((id) => shownIds.has(id)).length;

  const droppedCount = shown.reduce((total, measurement) => {
    const loss = measurementDataLoss(measurement, items.data);
    return total + loss.unknownItemIds.length + loss.droppedValueCount;
  }, 0);

  const printable =
    shown.length > 0 &&
    !loadingJudgments &&
    failedCount === 0 &&
    Boolean(issuer);

  const selectable = prepared.measurements.length > DEFAULT_TREND_LIMIT;
  const countLabel =
    shown.length < prepared.measurements.length
      ? `${prepared.measurements.length}件中 ${shown.length}件`
      : `${shown.length}件`;

  const period = [
    dateLabel(shown[0]?.measuredOn),
    dateLabel(shown.at(-1)?.measuredOn),
  ].filter(Boolean);
  const periodLabel =
    period.length === 2 && period[0] !== period[1]
      ? `${period[0]} 〜 ${period[1]}`
      : (period[0] ?? "");

  const excluded = [
    prepared.draftCount > 0 ? `下書きの測定${prepared.draftCount}件` : "",
    prepared.undatedCount > 0
      ? `測定日が未登録の測定${prepared.undatedCount}件`
      : "",
  ].filter(Boolean);
  const excludedLabel =
    excluded.length > 0 ? `${excluded.join("と")}を除いています` : "";

  const handleLimit = (value: string) => {
    window.history.replaceState(
      null,
      "",
      trendHref(customerId, toTrendLimit(value)),
    );
  };

  return (
    <PageContainer>
      <PrintFrame
        issuer={issuer}
        title="測定の推移"
        subject={[customerName, periodLabel].filter(Boolean).join(" ・ ")}
        fileName={printFileName([
          "測定の推移",
          customerName,
          dateInputValue(shown.at(-1)?.measuredOn),
        ])}
        appendix={
          <MeasurementItemGuide measurements={shown} items={items.data} />
        }
      >
        <PageHeader
          backHref={customerHref}
          backLabel="顧客詳細"
          title="測定の推移"
          actions={<PrintButton disabled={!printable} />}
          description={[
            customerName,
            periodLabel,
            shown.length > 0 ? countLabel : "",
          ]
            .filter(Boolean)
            .join(" ・ ")}
        />

        {prepared.measurements.length === 0 ? (
          <StateCard
            message={
              prepared.draftCount > 0
                ? "確定した測定がまだありません。下書きの測定は推移に含めません。"
                : "まだ測定が記録されていません。"
            }
          />
        ) : (
          <>
            {(selectable || excludedLabel) && (
              <div className="flex flex-wrap items-center gap-3 print:hidden">
                {selectable && (
                  <Select
                    value={String(limit)}
                    onChange={handleLimit}
                    aria-label="表示する測定"
                    className="w-44"
                  >
                    <option value="5">直近5件</option>
                    <option value="0">
                      全{prepared.measurements.length}件
                    </option>
                  </Select>
                )}
                {excludedLabel && (
                  <p
                    className={`text-subtle text-sm ${selectable ? "ml-auto" : ""}`}
                  >
                    {excludedLabel}
                  </p>
                )}
              </div>
            )}

            {selectable && limit === 0 && (
              <p className="text-subtle text-sm print:hidden">
                全{prepared.measurements.length}
                件のまま印刷すると、列が用紙に収まらず全体が縮小されます。紙に渡すなら「直近
                {DEFAULT_TREND_LIMIT}件」を選んでください。
              </p>
            )}

            {excludedLabel && (
              <p className="text-subtle hidden text-xs print:block">
                {excludedLabel}。
              </p>
            )}

            {droppedCount > 0 && (
              <p className="text-warning text-sm">
                測定項目マスタの変更により、表示できない記録が{droppedCount}
                件あります。値は測定詳細で確認できます。
              </p>
            )}

            {loadingJudgments ? (
              <div
                className="bg-placeholder h-64 w-full animate-pulse rounded-lg print:hidden"
                role="status"
                aria-label="判定を読み込んでいます"
              />
            ) : (
              <>
                {failedCount > 0 && (
                  <StateCard
                    message={`表示中の測定のうち${failedCount}件の判定を読み込めませんでした。読み込めた測定だけを表示しています。判定を読み込めるまで印刷できません。`}
                    action={
                      <SecondaryButton onClick={judgments.retry}>
                        再試行
                      </SecondaryButton>
                    }
                  />
                )}

                <MotorAgeTrend measurements={shown} judgments={judged} />

                <ElementTrend measurements={shown} judgments={judged} />

                <Card title="運動機能の項目別" splittable>
                  <div className="flex flex-col gap-4">
                    <TrendTable
                      caption="運動機能の項目別の推移"
                      itemHeader="項目"
                      measurements={shown}
                      rows={judgedItemRows(shown, judged, items.data)}
                      empty="運動機能の記録がありません。"
                    />
                    <RankLegend note="記録値は試行と左右をまとめた代表値で、入力した値とは異なることがあります。基準値が無い項目には判定が付きません。" />
                  </div>
                </Card>
              </>
            )}

            <Card title="体組成・体格・バイタル" splittable>
              <div className="flex flex-col gap-4">
                <TrendTable
                  caption="体組成・体格・バイタルの推移"
                  itemHeader="項目"
                  measurements={shown}
                  rows={recordedRows(shown, items.data)}
                  empty="体組成・体格・バイタルの記録がありません。"
                />
                <p className="text-subtle text-xs">
                  これらの項目には基準値が無いため、判定は付きません。BMI
                  と適正体重は身長・体重からの算出値です。
                </p>
              </div>
            </Card>
          </>
        )}
      </PrintFrame>
    </PageContainer>
  );
}
