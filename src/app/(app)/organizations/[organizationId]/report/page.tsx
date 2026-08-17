"use client";

import Badge from "@/components/Badge";
import Card from "@/components/Card";
import Checkbox from "@/components/Checkbox";
import DataTable, { type Column } from "@/components/DataTable";
import ItemAbbreviations from "@/components/ItemAbbreviations";
import LoginButton from "@/components/LoginButton";
import Missing from "@/components/Missing";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import PageMessage from "@/components/PageMessage";
import PageSkeleton from "@/components/PageSkeleton";
import PrintButton from "@/components/PrintButton";
import PrintFrame from "@/components/PrintFrame";
import RankDistribution, {
  type DistributionGroup,
} from "@/components/RankDistribution";
import RankLegend from "@/components/RankLegend";
import SecondaryButton from "@/components/SecondaryButton";
import StateCard from "@/components/StateCard";
import StatTile from "@/components/StatTile";
import { useTenants } from "@/context/TenantsContext";
import { currentFiscalYear, dateLabel, fiscalYearLabel } from "@/lib/date";
import { ELEMENTS, elementLabel, rankLetter, rankTone } from "@/lib/judgment";
import { shortItemName, type MeasurementItem } from "@/lib/measurementItem";
import type { Organization } from "@/lib/organization";
import {
  attendanceRate,
  distributionScale,
  emptyJudgmentNote,
  fiscalSummaries,
  formatSigned,
  hasEvaluations,
  isActive,
  judgedColumns,
  latestMeasuredOn,
  measuredPeriod,
  prepareJudgments,
  rankOf,
  reportCustomers,
  reportRows,
  summaryOf,
  unknownItemCount,
  type ReportRow,
} from "@/lib/organizationReport";
import { printFileName } from "@/lib/print";
import { useCustomers } from "@/lib/useCustomers";
import { useDetailedMeasurementItems } from "@/lib/useMeasurementItems";
import { useOrganization } from "@/lib/useOrganization";
import { useOrganizationJudgments } from "@/lib/useOrganizationJudgments";
import { isSameId } from "@/lib/uuid";
import { useSearchParams } from "next/navigation";
import { Suspense, use, useState } from "react";

const REPORT_TITLE = "測定結果一覧";

const KPI_GRID = "grid gap-3 sm:grid-cols-2 lg:grid-cols-4";

const NOTE_WIDTH = "max-w-28";

const TIGHT_CELL = "print:px-2";

const RANK_CELL = "whitespace-nowrap print:px-1";

export default function OrganizationReportPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = use(params);
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrganizationReportLoader
        key={organizationId}
        organizationId={organizationId}
      />
    </Suspense>
  );
}

function reportHref(organizationId: string, includeInactive: boolean): string {
  const base = `/organizations/${organizationId}/report`;
  return includeInactive ? `${base}?includeInactive=true` : base;
}

function OrganizationReportLoader({
  organizationId,
}: {
  organizationId: string;
}) {
  const organization = useOrganization(organizationId);

  if (organization.status === "loading") return <PageSkeleton />;

  if (organization.status === "unauthenticated") {
    return (
      <PageMessage
        title="サインインの有効期限が切れました"
        message="再度サインインしてください。"
        action={<LoginButton />}
      />
    );
  }

  if (organization.status === "not_found") {
    return (
      <PageMessage
        title="組織が見つかりません"
        link={{ href: "/organizations", label: "組織一覧に戻る" }}
      />
    );
  }

  if (organization.status === "forbidden") {
    return (
      <PageMessage
        title="この組織を表示する権限がありません"
        message="組織が所属するテナントのメンバーだけが表示できます。"
        link={{ href: "/organizations", label: "組織一覧に戻る" }}
      />
    );
  }

  if (organization.status === "error") {
    return (
      <PageMessage
        title="組織を読み込めませんでした"
        message="時間をおいて再度お試しください。"
        action={
          <SecondaryButton onClick={organization.retry}>再試行</SecondaryButton>
        }
        link={{ href: "/organizations", label: "組織一覧に戻る" }}
      />
    );
  }

  if (!organization.data) {
    return (
      <PageMessage
        title="組織が見つかりません"
        link={{ href: "/organizations", label: "組織一覧に戻る" }}
      />
    );
  }

  return <OrganizationReport organization={organization.data} />;
}

function nameCell(row: ReportRow) {
  const customer = row.customer;
  return (
    <span className="flex flex-col">
      <span className="flex items-center gap-2 whitespace-nowrap">
        {customer.name}
        {customer.isActive === false && (
          <Badge size="sm" tone="subtle">
            無効
          </Badge>
        )}
      </span>
      {customer.nameKana && (
        <span className="text-subtle text-xs font-normal whitespace-nowrap">
          {customer.nameKana}
        </span>
      )}
    </span>
  );
}

function measuredCell(row: ReportRow) {
  if (!row.judgment) return <span className="text-subtle">未測定</span>;

  const note = hasEvaluations(row.judgment)
    ? ""
    : emptyJudgmentNote(row.customer, row.judgment);

  return (
    <span className="flex flex-col items-end">
      <span className="whitespace-nowrap tabular-nums">
        {dateLabel(row.judgment.measuredOn)}
      </span>
      {note && (
        <span className={`text-subtle text-xs ${NOTE_WIDTH}`}>{note}</span>
      )}
    </span>
  );
}

function rankCell(row: ReportRow, item: MeasurementItem) {
  const rank = row.judgment ? rankOf(row.judgment, item) : null;
  if (!rank) return <Missing />;

  return (
    <Badge size="sm" tone={rankTone(rank)}>
      {rankLetter(rank)}
    </Badge>
  );
}

function reportColumns(items: MeasurementItem[]): Column<ReportRow>[] {
  return [
    { header: "氏名", cell: nameCell, className: TIGHT_CELL },
    {
      header: "測定日",
      cell: measuredCell,
      align: "end",
      className: TIGHT_CELL,
    },
    ...items.map((item) => ({
      key: item.measurementItemId,
      header: shortItemName(item),
      cell: (row: ReportRow) => rankCell(row, item),
      align: "end" as const,
      className: RANK_CELL,
    })),
  ];
}

function OrganizationReport({ organization }: { organization: Organization }) {
  const searchParams = useSearchParams();
  const includeInactive = searchParams.get("includeInactive") === "true";

  const organizationId = organization.organizationId ?? "";
  const tenantId = organization.tenantId ?? "";
  const organizationHref = `/organizations/${organizationId}`;

  const {
    memberships,
    loading: tenantsLoading,
    error: tenantsError,
    refreshTenants,
  } = useTenants();
  const [retryingTenants, setRetryingTenants] = useState(false);

  const customers = useCustomers(tenantId, true);
  const judgments = useOrganizationJudgments(organizationId, true);
  const items = useDetailedMeasurementItems();

  const issuer =
    tenantsLoading || tenantsError
      ? ""
      : (memberships.find(({ tenant }) => isSameId(tenant.tenantId, tenantId))
          ?.tenant.name ?? "");

  const resources = [customers, judgments, items];
  const loading =
    tenantsLoading || resources.some((state) => state.status === "loading");

  const retries = resources.flatMap((state) =>
    state.status === "error" || state.status === "unauthenticated"
      ? [state.retry]
      : [],
  );

  const permissionFailure =
    customers.status === "forbidden"
      ? "このテナントの顧客を表示する権限がありません。"
      : judgments.status === "forbidden" || judgments.status === "not_found"
        ? "この組織の測定結果を表示できません。組織が削除されたか、この組織のテナントに所属していない可能性があります。"
        : "";

  const failed =
    Boolean(permissionFailure) ||
    resources.some(
      (state) => state.status !== "ok" && state.status !== "loading",
    );

  const scoped = reportCustomers(
    customers.status === "ok" ? customers.data : [],
    organizationId,
  );
  const inactiveCount = scoped.filter((customer) => !isActive(customer)).length;
  const targetCustomers = includeInactive ? scoped : scoped.filter(isActive);

  const prepared = prepareJudgments(
    judgments.status === "ok" ? judgments.data : [],
    targetCustomers,
  );
  const rows = reportRows(targetCustomers, prepared.judgments);
  const columns = judgedColumns(
    prepared.judgments,
    items.status === "ok" ? items.data : [],
  );

  const droppedCount = unknownItemCount(
    prepared.judgments,
    items.status === "ok" ? items.data : [],
  );

  const summaries = fiscalSummaries(prepared.judgments);
  const thisFiscalYear = currentFiscalYear();
  const thisYearLabel = fiscalYearLabel(thisFiscalYear);
  const previousYearLabel = fiscalYearLabel(thisFiscalYear - 1);
  const current = summaryOf(summaries, thisFiscalYear);
  const previous = summaryOf(summaries, thisFiscalYear - 1);

  const targetCount = targetCustomers.length;
  const measuredCount = current?.measuredCount ?? 0;
  const rate = attendanceRate(measuredCount, targetCount);
  const motorAgeDifference = current?.motorAgeDifference ?? null;
  const previousMotorAgeDifference = previous?.motorAgeDifference ?? null;

  const period = measuredPeriod(prepared.judgments);
  const description = [
    organization.name ?? "",
    loading || failed ? "" : `対象の従業員${targetCount}人`,
    period,
  ]
    .filter(Boolean)
    .join(" ・ ");

  const excluded = [
    prepared.draftCount > 0 ? `下書きの測定${prepared.draftCount}件` : "",
    prepared.undatedCount > 0
      ? `測定日が未登録の測定${prepared.undatedCount}件`
      : "",
  ].filter(Boolean);
  const excludedLabel =
    excluded.length > 0 ? `${excluded.join("と")}を除いています` : "";

  const distributionGroups: DistributionGroup[] = ELEMENTS.map((element) => ({
    key: element,
    label: elementLabel(element),
    bars: summaries.flatMap((summary) => {
      const counts = summary.distributions.find(
        (distribution) => distribution.element === element,
      )?.counts;
      if (!counts || counts.every((count) => count === 0)) return [];
      return [
        {
          key: String(summary.fiscalYear),
          label: fiscalYearLabel(summary.fiscalYear),
          counts,
        },
      ];
    }),
  })).filter((group) => group.bars.length > 0);

  const printable = !loading && !failed && Boolean(issuer) && rows.length > 0;

  if (resources.every((state) => state.status === "unauthenticated")) {
    return (
      <PageMessage
        title="サインインの有効期限が切れました"
        message="再度サインインしてください。"
        action={<LoginButton />}
      />
    );
  }

  const handleIncludeInactive = (checked: boolean) => {
    window.history.replaceState(null, "", reportHref(organizationId, checked));
  };

  const retry = () => retries.forEach((reload) => reload());

  const handleRetryTenants = () => {
    if (retryingTenants) return;
    setRetryingTenants(true);
    void refreshTenants().finally(() => setRetryingTenants(false));
  };

  return (
    <PageContainer>
      <PrintFrame
        issuer={issuer}
        title={REPORT_TITLE}
        subject={description}
        fileName={printFileName([
          REPORT_TITLE,
          organization.name ?? "",
          latestMeasuredOn(prepared.judgments),
        ])}
      >
        <PageHeader
          backHref={organizationHref}
          backLabel="組織詳細"
          title={REPORT_TITLE}
          actions={<PrintButton disabled={!printable} />}
          description={description}
        />

        {loading ? (
          <div
            className="bg-placeholder h-96 w-full animate-pulse rounded-lg print:hidden"
            role="status"
            aria-label="測定結果を読み込んでいます"
          />
        ) : failed ? (
          <StateCard
            message={
              permissionFailure ||
              "測定結果を読み込めませんでした。時間をおいて再度お試しください。"
            }
            action={
              permissionFailure || retries.length === 0 ? undefined : (
                <SecondaryButton onClick={retry}>再試行</SecondaryButton>
              )
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
              <Checkbox
                label="無効な顧客も表示する"
                checked={includeInactive}
                onChange={handleIncludeInactive}
              />
              {excludedLabel && (
                <p className="text-subtle text-sm">{excludedLabel}</p>
              )}
            </div>

            {excludedLabel && (
              <p className="text-subtle hidden text-xs print:block">
                {excludedLabel}。
              </p>
            )}

            {tenantsError ? (
              <p className="text-warning flex flex-wrap items-center gap-2 text-sm print:hidden">
                発行元のテナント名を取得できませんでした。取得できるまで印刷できません。
                <SecondaryButton
                  size="sm"
                  onClick={handleRetryTenants}
                  disabled={retryingTenants}
                >
                  {retryingTenants ? "再取得中..." : "テナント名を再取得"}
                </SecondaryButton>
              </p>
            ) : (
              !issuer && (
                <p className="text-warning text-sm print:hidden">
                  あなたはこの組織のテナントに所属していないため、発行元を明記できません。印刷はできません。
                </p>
              )
            )}

            {droppedCount > 0 && (
              <p className="text-warning text-sm">
                測定項目マスタの変更により、表に出せない判定が{droppedCount}
                件あります。値は各顧客の判定ページで確認できます。
              </p>
            )}

            <div className={KPI_GRID}>
              <StatTile
                label="対象の従業員"
                state={{ status: "ok", value: targetCount }}
                unit="人"
                note={
                  inactiveCount > 0
                    ? includeInactive
                      ? `無効な顧客${inactiveCount}人を含む`
                      : `無効な顧客${inactiveCount}人を除く`
                    : undefined
                }
              />
              <StatTile
                label={`${thisYearLabel} 測定済み`}
                state={{ status: "ok", value: measuredCount }}
                unit="人"
                note={[
                  rate === null ? "" : `受診率 ${rate}%`,
                  previous
                    ? `${previousYearLabel} ${previous.measuredCount}人`
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ・ ")}
              />
              <StatTile
                label="運動器年齢と実年齢の差"
                state={{
                  status: "ok",
                  value:
                    motorAgeDifference === null
                      ? "—"
                      : formatSigned(motorAgeDifference, 1),
                }}
                unit={motorAgeDifference === null ? "" : "歳"}
                note={
                  current === null
                    ? `${thisYearLabel}の測定がありません`
                    : [
                        motorAgeDifference === null
                          ? current.motorAgeOutsideStandardCount > 0
                            ? "同年代の基準値がある測定がありません"
                            : "運動器年齢を算出できた人がいません"
                          : `同年代の基準値がある${current.motorAgeCount}人の平均`,
                        previousMotorAgeDifference === null
                          ? ""
                          : `${previousYearLabel} ${formatSigned(previousMotorAgeDifference, 1)}歳`,
                      ]
                        .filter(Boolean)
                        .join(" ・ ")
                }
              />
              <StatTile
                label="注意が必要な人"
                state={{
                  status: "ok",
                  value: current ? current.attentionCount : "—",
                }}
                unit={current ? "人" : ""}
                note={
                  current
                    ? [
                        current.judgedCount === current.measuredCount
                          ? "1つ以上の要素が D・E"
                          : `判定が出た${current.judgedCount}人のうち1つ以上の要素が D・E`,
                        previous
                          ? `${previousYearLabel} ${previous.attentionCount}人`
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ・ ")
                    : `${thisYearLabel}の測定がありません`
                }
              />
            </div>

            <Card title="要素別の分布と推移" splittable>
              {distributionGroups.length === 0 ? (
                <p className="text-muted text-sm">
                  判定された要素がまだありません。
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  <RankDistribution
                    groups={distributionGroups}
                    scale={distributionScale(summaries)}
                  />
                  <p className="text-subtle text-xs print:break-before-avoid">
                    帯の長さは人数、中央の縦線が「年代相応」の中心です。右に伸びているほど会社全体として良い状態を表します。右の数字は凡例と同じ順（注意
                    / 年代相応 /
                    良い）の人数です。1年度に複数回測った人は、その年度で判定が出た最新の測定で数えています。
                  </p>
                </div>
              )}
            </Card>

            <Card title="従業員ごとの記録" splittable>
              <div className="flex flex-col gap-4">
                <DataTable
                  caption="従業員ごとの測定結果"
                  columns={reportColumns(columns)}
                  rows={rows}
                  rowKey={(row) => row.key}
                  empty={
                    <StateCard
                      message={
                        scoped.length === 0
                          ? "この組織に所属する顧客がいません。"
                          : "この組織に有効な顧客がいません。無効な顧客は上のチェックボックスで表示できます。"
                      }
                    />
                  }
                />
                {rows.length > 0 && (
                  <>
                    <RankLegend note="1行が1回の測定です。この組織で判定された項目だけを列にしています。" />
                    <ItemAbbreviations items={columns} />
                  </>
                )}
              </div>
            </Card>
          </>
        )}
      </PrintFrame>
    </PageContainer>
  );
}
