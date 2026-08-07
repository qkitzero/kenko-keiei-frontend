"use client";

import Badge from "@/components/Badge";
import DataTable, { type Column } from "@/components/DataTable";
import LoginButton from "@/components/LoginButton";
import PrimaryLink from "@/components/PrimaryLink";
import SecondaryButton from "@/components/SecondaryButton";
import SectionHeader from "@/components/SectionHeader";
import StateCard from "@/components/StateCard";
import { dateLabel } from "@/lib/date";
import type { Measurement } from "@/lib/measurement";
import { useMeasurements } from "@/lib/useMeasurements";
import Link from "next/link";
import { useMemo } from "react";

const CELL_LINK =
  "text-primary hover:text-primary-hover focus-visible:outline-primary rounded-sm underline-offset-2 outline-offset-2 transition-colors hover:underline focus-visible:outline-2";

function measurementColumns(customerId: string): Column<Measurement>[] {
  return [
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
      header: "項目数",
      cell: (measurement) => `${measurement.entries?.length ?? 0}項目`,
    },
    {
      header: "測定時の年齢",
      cell: (measurement) =>
        typeof measurement.ageAtMeasurement === "number"
          ? `${measurement.ageAtMeasurement}歳`
          : "",
      align: "end",
    },
    {
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
    },
  ];
}

export default function MeasurementHistory({
  customerId,
}: {
  customerId: string;
}) {
  const measurements = useMeasurements(customerId);
  const columns = useMemo(() => measurementColumns(customerId), [customerId]);

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title="測定履歴"
        count={
          measurements.status === "ok" ? measurements.data.length : undefined
        }
        actions={
          <PrimaryLink
            size="sm"
            href={`/customers/${customerId}/measurements/new`}
          >
            測定を記録
          </PrimaryLink>
        }
      />

      {measurements.status === "loading" ? (
        <div className="bg-placeholder h-32 w-full animate-pulse rounded-lg" />
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
        <DataTable
          caption="測定履歴"
          columns={columns}
          rows={measurements.data}
          rowKey={(measurement) => measurement.measurementId ?? ""}
          empty={<StateCard message="まだ測定が記録されていません。" />}
        />
      )}
    </section>
  );
}
