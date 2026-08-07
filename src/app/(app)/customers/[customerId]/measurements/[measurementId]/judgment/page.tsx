"use client";

import AdviceForm from "@/components/AdviceForm";
import Badge from "@/components/Badge";
import ElementEvaluations from "@/components/ElementEvaluations";
import ItemEvaluations from "@/components/ItemEvaluations";
import JudgmentSummary from "@/components/JudgmentSummary";
import LoginButton from "@/components/LoginButton";
import MeasurementValues from "@/components/MeasurementValues";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import PageMessage from "@/components/PageMessage";
import PageSkeleton from "@/components/PageSkeleton";
import SecondaryButton from "@/components/SecondaryButton";
import StateCard from "@/components/StateCard";
import { dateLabel } from "@/lib/date";
import { emptyJudgmentMessage, isEmptyJudgment } from "@/lib/judgment";
import { useCustomer } from "@/lib/useCustomer";
import { useJudgment } from "@/lib/useJudgment";
import { useMeasurement } from "@/lib/useMeasurement";
import { useMeasurementItems } from "@/lib/useMeasurementItems";
import { isSameId } from "@/lib/uuid";
import { use } from "react";

export default function JudgmentPage({
  params,
}: {
  params: Promise<{ customerId: string; measurementId: string }>;
}) {
  const { customerId, measurementId } = use(params);
  return (
    <JudgmentDetail
      key={measurementId}
      customerId={customerId}
      measurementId={measurementId}
    />
  );
}

function JudgmentDetail({
  customerId,
  measurementId,
}: {
  customerId: string;
  measurementId: string;
}) {
  const measurement = useMeasurement(measurementId);
  const judgment = useJudgment(measurementId);
  const items = useMeasurementItems();
  const customer = useCustomer(customerId);

  const measurementHref = `/customers/${customerId}/measurements/${measurementId}`;

  if (
    measurement.status === "loading" ||
    judgment.status === "loading" ||
    items.status === "loading" ||
    customer.status === "loading"
  ) {
    return <PageSkeleton width="detail" />;
  }

  if (
    measurement.status === "unauthenticated" ||
    judgment.status === "unauthenticated" ||
    items.status === "unauthenticated" ||
    customer.status === "unauthenticated"
  ) {
    return (
      <PageMessage
        title="サインインの有効期限が切れました"
        message="再度サインインしてください。"
        action={<LoginButton />}
      />
    );
  }

  if (
    measurement.status === "not_found" ||
    (measurement.status === "ok" &&
      !isSameId(measurement.data.customerId, customerId))
  ) {
    return (
      <PageMessage
        title="測定が見つかりません"
        link={{ href: `/customers/${customerId}`, label: "顧客詳細に戻る" }}
      />
    );
  }

  if (measurement.status === "error") {
    return (
      <PageMessage
        title="測定を読み込めませんでした"
        message="時間をおいて再度お試しください。"
        link={{ href: `/customers/${customerId}`, label: "顧客詳細に戻る" }}
      />
    );
  }

  if (items.status === "error") {
    return (
      <PageMessage
        title="測定項目を取得できませんでした"
        message="測定項目を読み込めないため、判定を表示できません。"
        action={<SecondaryButton onClick={items.retry}>再試行</SecondaryButton>}
        link={{ href: measurementHref, label: "測定詳細に戻る" }}
      />
    );
  }

  const isDraft = measurement.data.isDraft === true;
  const customerName =
    customer.status === "ok" ? (customer.data?.name ?? "") : "";
  const age = measurement.data.ageAtMeasurement;
  const judged = judgment.status === "ok" ? judgment.data : null;

  return (
    <PageContainer width="detail">
      <PageHeader
        backHref={measurementHref}
        backLabel="測定詳細"
        title="判定結果"
        meta={isDraft && <Badge tone="subtle">下書き</Badge>}
        description={[
          customerName,
          dateLabel(measurement.data.measuredOn),
          typeof age === "number" ? `測定時 ${age}歳` : "",
        ]
          .filter(Boolean)
          .join(" ・ ")}
      />

      {isDraft && (
        <p className="text-warning text-sm">
          この測定は下書きです。確定するまでの暫定的な判定結果です。
        </p>
      )}

      {!judged ? (
        <StateCard
          message="判定を読み込めませんでした。時間をおいて再度お試しください。読み込めるまでアドバイスの編集はできません。"
          action={
            judgment.status === "error" && (
              <SecondaryButton onClick={judgment.retry}>再試行</SecondaryButton>
            )
          }
        />
      ) : isEmptyJudgment(judged) ? (
        <StateCard
          message={emptyJudgmentMessage(
            measurement.data,
            items.data,
            customer.status === "ok" ? customer.data : null,
          )}
        />
      ) : (
        <>
          <JudgmentSummary judgment={judged} measurement={measurement.data} />
          <ElementEvaluations judgment={judged} />
          <ItemEvaluations judgment={judged} items={items.data} />
        </>
      )}

      <MeasurementValues measurement={measurement.data} items={items.data} />

      {judged && (
        <AdviceForm
          measurementId={measurementId}
          advice={judged.advice ?? ""}
        />
      )}
    </PageContainer>
  );
}
