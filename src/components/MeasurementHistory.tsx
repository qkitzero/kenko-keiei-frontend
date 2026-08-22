"use client";

import Badge from "@/components/Badge";
import DataTable, { type Column } from "@/components/DataTable";
import LoginButton from "@/components/LoginButton";
import Missing from "@/components/Missing";
import {
  SKELETON_SECTION_TABLE,
  SkeletonTable,
} from "@/components/PageSkeleton";
import PrimaryLink from "@/components/PrimaryLink";
import RankCounts from "@/components/RankCounts";
import SecondaryButton from "@/components/SecondaryButton";
import SecondaryLink from "@/components/SecondaryLink";
import SectionHeader from "@/components/SectionHeader";
import StateCard from "@/components/StateCard";
import { dateLabel } from "@/lib/date";
import {
  STANDARD_MAX_AGE,
  STANDARD_MIN_AGE,
  usesRoundedStandards,
  type Judgment,
} from "@/lib/judgment";
import type { Measurement } from "@/lib/measurement";
import { elementRankCounts, motorAgeLabel } from "@/lib/measurementHistory";
import { useJudgments, type JudgmentsState } from "@/lib/useJudgments";
import type { ResourceState } from "@/lib/useResource";
import Link from "next/link";
import { useMemo } from "react";

const CELL_LINK =
  "text-primary hover:text-primary-hover focus-visible:outline-primary rounded-sm underline-offset-2 outline-offset-2 transition-colors hover:underline focus-visible:outline-2";

const NO_IDS: string[] = [];

type JudgedState = Exclude<JudgmentsState, { status: "unauthenticated" }>;

function judgedCell(
  judgments: JudgedState,
  measurement: Measurement,
  read: (judgment: Judgment | null) => React.ReactNode,
) {
  if (judgments.status === "loading") {
    return (
      <span className="bg-placeholder inline-block h-4 w-16 animate-pulse rounded align-middle" />
    );
  }

  const measurementId = measurement.measurementId ?? "";
  if (!judgments.judgments.has(measurementId)) return <Missing />;

  const value = read(judgments.judgments.get(measurementId) ?? null);
  return value === null || value === undefined || value === "" ? (
    <Missing />
  ) : (
    value
  );
}

function measurementColumns(
  customerId: string,
  judgments: JudgmentsState,
): Column<Measurement>[] {
  const columns: Column<Measurement>[] = [
    {
      header: "測定日",
      cell: (measurement) => (
        <span className="flex items-center gap-2">
          <Link
            href={`/customers/${customerId}/measurements/${measurement.measurementId}`}
            className={`${CELL_LINK} font-medium`}
          >
            {dateLabel(measurement.measuredOn) || "測定日未登録"}
          </Link>
          {measurement.isDraft && (
            <Badge size="sm" tone="subtle">
              下書き
            </Badge>
          )}
        </span>
      ),
    },
    {
      header: "測定時の年齢",
      cell: (measurement) =>
        typeof measurement.ageAtMeasurement === "number"
          ? `${measurement.ageAtMeasurement}歳`
          : "",
      align: "end",
    },
  ];

  if (judgments.status !== "unauthenticated") {
    columns.push(
      {
        header: "運動器年齢",
        cell: (measurement) =>
          judgedCell(judgments, measurement, (judgment) => {
            const label = motorAgeLabel(judgment, measurement);
            return label ? <span className="tabular-nums">{label}</span> : "";
          }),
        align: "end",
      },
      {
        header: "注意/相応/良い",
        cell: (measurement) =>
          judgedCell(judgments, measurement, (judgment) => {
            const counts = elementRankCounts(judgment);
            return counts ? <RankCounts counts={counts} /> : "";
          }),
        align: "end",
      },
    );
  }

  columns.push({
    header: "判定",
    cell: (measurement) => (
      <Link
        href={`/customers/${customerId}/measurements/${measurement.measurementId}/judgment`}
        className={CELL_LINK}
      >
        判定結果
      </Link>
    ),
    align: "end",
  });

  return columns;
}

export default function MeasurementHistory({
  customerId,
  measurements,
}: {
  customerId: string;
  measurements: ResourceState<Measurement[]>;
}) {
  const measurementIds = useMemo(
    () =>
      measurements.status === "ok"
        ? measurements.data.map(
            (measurement) => measurement.measurementId ?? "",
          )
        : NO_IDS,
    [measurements],
  );
  const judgments = useJudgments(measurementIds);
  const columns = useMemo(
    () => measurementColumns(customerId, judgments),
    [customerId, judgments],
  );

  const recorded = measurements.status === "ok" ? measurements.data : [];
  const failedCount = judgments.status === "ok" ? judgments.failed.length : 0;
  const hasRoundedAge =
    judgments.status === "ok" &&
    recorded.some((measurement) => {
      const judgment = judgments.judgments.get(measurement.measurementId ?? "");
      return (
        typeof judgment?.motorAge === "number" &&
        usesRoundedStandards(measurement.ageAtMeasurement)
      );
    });

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="測定履歴"
        count={
          measurements.status === "ok" ? measurements.data.length : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            {recorded.length > 0 && (
              <SecondaryLink size="sm" href={`/customers/${customerId}/trend`}>
                推移を見る
              </SecondaryLink>
            )}
            <PrimaryLink
              size="sm"
              href={`/customers/${customerId}/measurements/new`}
            >
              測定を記録
            </PrimaryLink>
          </div>
        }
      />

      {measurements.status === "loading" ? (
        <SkeletonTable height={SKELETON_SECTION_TABLE} />
      ) : measurements.status === "unauthenticated" ? (
        <StateCard
          message="サインインの有効期限が切れました。再度サインインしてください。"
          action={<LoginButton />}
        />
      ) : measurements.status === "error" ? (
        <StateCard
          message="測定履歴を読み込めませんでした。時間をおいて再度お試しください。"
          action={
            <SecondaryButton onClick={measurements.retry}>
              再試行
            </SecondaryButton>
          }
        />
      ) : (
        <>
          <DataTable
            caption="測定履歴"
            columns={columns}
            rows={measurements.data}
            rowKey={(measurement) => measurement.measurementId ?? ""}
            empty={<StateCard message="まだ測定が記録されていません。" />}
          />

          {recorded.length > 0 &&
            (judgments.status === "unauthenticated" ? (
              <p className="text-subtle flex flex-wrap items-center gap-2 text-sm">
                サインインの有効期限が切れたため、運動器年齢と要素の内訳を表示できません。
                <LoginButton size="sm" />
              </p>
            ) : (
              <>
                {failedCount > 0 && (
                  <p className="text-subtle flex flex-wrap items-center gap-2 text-sm">
                    {failedCount}
                    件の判定を読み込めませんでした。その測定の運動器年齢と要素の内訳は表示できません。
                    {judgments.status === "ok" && (
                      <SecondaryButton size="sm" onClick={judgments.retry}>
                        再試行
                      </SecondaryButton>
                    )}
                  </p>
                )}
                <p className="text-subtle text-xs">
                  「注意/相応/良い」は判定できた要素（筋力・バランスなど）の内訳です。注意
                  = D・E、相応 = C、良い =
                  A・B。運動器年齢の括弧内は測定時の年齢との差です。
                  {hasRoundedAge &&
                    `測定時の年齢に対応する基準値が無い測定は、最も近い年代（${STANDARD_MIN_AGE}〜${STANDARD_MAX_AGE}歳）の基準値で比べているため、差が大きく出ます。`}
                </p>
              </>
            ))}
        </>
      )}
    </section>
  );
}
