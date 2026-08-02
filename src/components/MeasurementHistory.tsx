"use client";

import Badge from "@/components/Badge";
import Card from "@/components/Card";
import LoginButton from "@/components/LoginButton";
import PrimaryLink from "@/components/PrimaryLink";
import SecondaryButton from "@/components/SecondaryButton";
import { dateLabel } from "@/lib/date";
import { useMeasurements } from "@/lib/useMeasurements";

export default function MeasurementHistory({
  customerId,
}: {
  customerId: string;
}) {
  const measurements = useMeasurements(customerId);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-foreground text-sm font-medium">測定履歴</h2>
        <PrimaryLink href={`/customers/${customerId}/measurements/new`}>
          測定を記録
        </PrimaryLink>
      </div>

      {measurements.status === "loading" ? (
        <div className="bg-placeholder h-20 w-full animate-pulse rounded-2xl" />
      ) : measurements.status === "unauthenticated" ? (
        <Card as="div" padding="lg" dashed className="text-center">
          <p className="text-muted text-sm">
            サインインの有効期限が切れました。再度サインインしてください。
          </p>
          <div className="mt-4 flex justify-center">
            <div className="w-40">
              <LoginButton />
            </div>
          </div>
        </Card>
      ) : measurements.status === "error" ? (
        <Card as="div" padding="lg" dashed className="text-center">
          <p className="text-muted text-sm">
            測定履歴を読み込めませんでした。時間をおいて再度お試しください。
          </p>
          <div className="mt-4 flex justify-center">
            <SecondaryButton onClick={measurements.retry}>
              再試行
            </SecondaryButton>
          </div>
        </Card>
      ) : measurements.data.length === 0 ? (
        <Card as="div" padding="lg" dashed className="text-center">
          <p className="text-muted text-sm">まだ測定が記録されていません。</p>
        </Card>
      ) : (
        measurements.data.map((measurement) => (
          <Card
            key={measurement.measurementId}
            href={`/customers/${customerId}/measurements/${measurement.measurementId}`}
            padding="sm"
            className="flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="text-foreground flex items-center gap-2 font-medium">
                <span className="truncate">
                  {dateLabel(measurement.measuredOn) || "測定日未登録"}
                </span>
                {measurement.isDraft && (
                  <Badge size="sm" tone="subtle" className="shrink-0">
                    下書き
                  </Badge>
                )}
              </p>
              <p className="text-subtle mt-0.5 truncate text-xs">
                {measurement.entries?.length ?? 0}項目
              </p>
            </div>
            <div className="text-muted shrink-0 text-right text-xs">
              <p>測定時 {measurement.ageAtMeasurement ?? 0}歳</p>
            </div>
          </Card>
        ))
      )}
    </section>
  );
}
