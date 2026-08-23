"use client";

import DataTable, { type Column } from "@/components/DataTable";
import LoginButton from "@/components/LoginButton";
import Missing from "@/components/Missing";
import NoTenantCard from "@/components/NoTenantCard";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import PageSkeleton, {
  SKELETON_SECTION_TABLE,
  SkeletonNote,
  SkeletonTable,
} from "@/components/PageSkeleton";
import PrimaryLink from "@/components/PrimaryLink";
import SecondaryButton from "@/components/SecondaryButton";
import SectionHeader from "@/components/SectionHeader";
import StateCard from "@/components/StateCard";
import StatTile, { STAT_TILE_GRID } from "@/components/StatTile";
import { useTenantScope, useTenants } from "@/context/TenantsContext";
import {
  EMPTY_CUSTOMER_FILTERS,
  customerListHref,
  customerStatusLabel,
  type CustomerStatusFilter,
} from "@/lib/customerList";
import { currentFiscalYear, dateInputLabel } from "@/lib/date";
import {
  SUMMARY_LIST_LIMIT,
  type SummaryMeasurement,
  type TenantSummaryCounts,
} from "@/lib/tenantSummary";
import { useTenantSummary } from "@/lib/useTenantSummary";
import { Suspense, useState } from "react";

const MEASUREMENT_COLUMNS: Column<SummaryMeasurement>[] = [
  {
    header: "測定日",
    cell: (row) => dateInputLabel(row.measuredOn) || <Missing />,
  },
  { header: "氏名", cell: (row) => row.customerName || <Missing /> },
  { header: "組織", cell: (row) => row.organizationName || <Missing /> },
];

function statusHref(tenantId: string, status: CustomerStatusFilter): string {
  return customerListHref(tenantId, { ...EMPTY_CUSTOMER_FILTERS, status });
}

function tileState(value: number | undefined) {
  return value === undefined
    ? ({ status: "loading" } as const)
    : ({ status: "ok", value } as const);
}

function ListNote({ children }: { children: React.ReactNode }) {
  return <p className="text-subtle text-xs">{children}</p>;
}

function scopeNote(counts: TenantSummaryCounts): string {
  const covered = counts.customers - counts.uncovered;
  const parts = [
    `未測定と注意は、組織に所属する有効な顧客${covered}人（全${counts.customers}人）を対象に数えています`,
  ];
  if (counts.uncovered > 0) {
    parts.push(`組織未所属の${counts.uncovered}人は集計対象外です`);
  }
  if (counts.undated > 0) {
    parts.push(
      `測定日が未記録の確定済み測定${counts.undated}件は集計に入りません`,
    );
  }
  return `${parts.join("。")}。`;
}

function measurementTable(
  rows: SummaryMeasurement[],
  caption: string,
  empty: React.ReactNode,
) {
  return (
    <DataTable
      caption={caption}
      columns={MEASUREMENT_COLUMNS}
      rows={rows}
      rowKey={(row) => row.measurementId}
      rowHref={(row) =>
        `/customers/${row.customerId}/measurements/${row.measurementId}`
      }
      empty={empty}
    />
  );
}

function TenantWork({
  tenantId,
  fiscalYear,
}: {
  tenantId: string;
  fiscalYear: number;
}) {
  const summary = useTenantSummary(tenantId, fiscalYear);

  if (summary.status === "unauthenticated") {
    return (
      <StateCard
        message="サインインの有効期限が切れました。再度サインインしてください。"
        action={<LoginButton />}
      />
    );
  }

  if (summary.status === "forbidden") {
    return (
      <StateCard message="このテナントの状況を表示する権限がありません。" />
    );
  }

  if (summary.status === "error") {
    return (
      <StateCard
        message="テナントの状況を読み込めませんでした。時間をおいて再度お試しください。"
        action={
          <SecondaryButton onClick={summary.retry}>再試行</SecondaryButton>
        }
      />
    );
  }

  const data = summary.status === "ok" ? summary.summary : null;

  if (data && data.counts.customers === 0) {
    return (
      <StateCard
        message="このテナントに有効な顧客がいません。顧客を登録すると、測定の状況がここに出ます。"
        action={
          <PrimaryLink href="/customers/register">顧客を登録</PrimaryLink>
        }
      />
    );
  }

  const counts = data?.counts;

  return (
    <>
      <div className="flex flex-col gap-3">
        <SectionHeader title="対応が必要" />
        <div className={STAT_TILE_GRID}>
          <StatTile
            label="下書きのまま"
            state={tileState(counts?.drafts)}
            unit="件"
            note="確定するまで判定には反映されません"
          />
          <StatTile
            label={customerStatusLabel("not-measured", fiscalYear)}
            href={statusHref(tenantId, "not-measured")}
            state={tileState(counts?.notMeasured)}
            unit="人"
          />
          <StatTile
            label={customerStatusLabel("attention", fiscalYear)}
            href={statusHref(tenantId, "attention")}
            state={tileState(counts?.attention)}
            unit="人"
            note="要素別評価に D・E がある人"
          />
        </div>
        {counts ? <ListNote>{scopeNote(counts)}</ListNote> : <SkeletonNote />}
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader
          title="下書きの測定"
          count={counts?.drafts}
          actions={
            data &&
            data.counts.drafts > data.drafts.length && (
              <ListNote>
                全{data.counts.drafts}件のうち新しい{data.drafts.length}件
              </ListNote>
            )
          }
        />
        {data ? (
          measurementTable(
            data.drafts,
            "下書きの測定",
            <StateCard message="確定待ちの測定はありません。" />,
          )
        ) : (
          <SkeletonTable height={SKELETON_SECTION_TABLE} />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader
          title="最近の測定"
          actions={<ListNote>確定済みの直近{SUMMARY_LIST_LIMIT}件</ListNote>}
        />
        {data ? (
          measurementTable(
            data.recent,
            "最近の測定",
            <StateCard message="確定した測定がまだありません。" />,
          )
        ) : (
          <SkeletonTable height={SKELETON_SECTION_TABLE} />
        )}
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<PageSkeleton shape="home" />}>
      <Home />
    </Suspense>
  );
}

function Home() {
  const {
    memberships,
    loading: tenantsLoading,
    error: tenantsError,
    refreshTenants,
  } = useTenants();
  const tenantId = useTenantScope();
  const [retrying, setRetrying] = useState(false);
  const fiscalYear = currentFiscalYear();

  if (tenantsLoading) {
    return <PageSkeleton shape="home" />;
  }

  if (tenantsError) {
    const handleRetryTenants = () => {
      if (retrying) return;
      setRetrying(true);
      void refreshTenants().finally(() => setRetrying(false));
    };

    return (
      <PageContainer centered>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          テナント情報を取得できませんでした
        </h1>
        <p className="text-subtle text-sm">
          所属しているテナントを読み込めないため、状況を表示できません。
        </p>
        <SecondaryButton onClick={handleRetryTenants} disabled={retrying}>
          {retrying ? "再試行中..." : "再試行"}
        </SecondaryButton>
      </PageContainer>
    );
  }

  const tenantName =
    memberships.find(({ tenant }) => tenant.tenantId === tenantId)?.tenant
      .name ?? "";

  return (
    <PageContainer>
      <PageHeader
        title="ホーム"
        description={
          tenantName
            ? `${tenantName}の状況です。`
            : "テナントを作るか、既存のテナントに追加してもらうと、顧客や組織を登録できます。"
        }
        actions={
          tenantId && (
            <PrimaryLink href="/customers/register">顧客を登録</PrimaryLink>
          )
        }
      />

      {tenantId && <TenantWork tenantId={tenantId} fiscalYear={fiscalYear} />}

      {memberships.length === 0 && (
        <NoTenantCard
          action={<PrimaryLink href="/tenants">テナントを管理</PrimaryLink>}
        />
      )}
    </PageContainer>
  );
}
