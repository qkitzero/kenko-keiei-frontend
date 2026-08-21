"use client";

import AdviceForm from "@/components/AdviceForm";
import Badge from "@/components/Badge";
import ElementEvaluations from "@/components/ElementEvaluations";
import ItemEvaluations from "@/components/ItemEvaluations";
import JudgmentSummary from "@/components/JudgmentSummary";
import LoginButton from "@/components/LoginButton";
import MeasurementItemGuide from "@/components/MeasurementItemGuide";
import MeasurementValues from "@/components/MeasurementValues";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import PageMessage from "@/components/PageMessage";
import PageSkeleton from "@/components/PageSkeleton";
import PrescribedMenus from "@/components/PrescribedMenus";
import PrescriptionDangerZone from "@/components/PrescriptionDangerZone";
import PrintButton from "@/components/PrintButton";
import PrintFrame from "@/components/PrintFrame";
import SecondaryButton from "@/components/SecondaryButton";
import StateCard from "@/components/StateCard";
import { useTenants } from "@/context/TenantsContext";
import { dateInputValue, dateLabel } from "@/lib/date";
import {
  emptyJudgmentMessage,
  isEmptyJudgment,
  type Judgment,
} from "@/lib/judgment";
import { printFileName } from "@/lib/print";
import type { TrainingMenu } from "@/lib/trainingMenu";
import { useCustomer } from "@/lib/useCustomer";
import { useJudgment } from "@/lib/useJudgment";
import { useMeasurement } from "@/lib/useMeasurement";
import { useMeasurementItems } from "@/lib/useMeasurementItems";
import { usePrescription } from "@/lib/usePrescription";
import type { ResourceState } from "@/lib/useResource";
import { useTrainingMenus } from "@/lib/useTrainingMenus";
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
  const trainingMenus = useTrainingMenus();
  const customer = useCustomer(customerId);
  const { memberships } = useTenants();

  const measurementHref = `/customers/${customerId}/measurements/${measurementId}`;

  if (
    measurement.status === "loading" ||
    judgment.status === "loading" ||
    items.status === "loading" ||
    customer.status === "loading"
  ) {
    return <PageSkeleton width="detail" back />;
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

  if (customer.status === "error") {
    return (
      <PageMessage
        title="顧客を取得できませんでした"
        message="誰の判定結果かを確認できないため、表示できません。"
        action={
          <SecondaryButton onClick={customer.retry}>再試行</SecondaryButton>
        }
        link={{ href: measurementHref, label: "測定詳細に戻る" }}
      />
    );
  }

  const isDraft = measurement.data.isDraft === true;
  const customerName = customer.data?.name ?? "";
  const tenantId = customer.data?.tenantId ?? "";
  const issuer =
    memberships.find(({ tenant }) => isSameId(tenant.tenantId, tenantId))
      ?.tenant.name ?? "";
  const age = measurement.data.ageAtMeasurement;
  const judged = judgment.status === "ok" ? judgment.data : null;
  const measuredOn = dateLabel(measurement.data.measuredOn);
  const printable = judged !== null && Boolean(issuer);

  return (
    <PageContainer width="detail">
      <PrintFrame
        issuer={issuer}
        title="判定結果"
        subject={[customerName, measuredOn].filter(Boolean).join(" ・ ")}
        fileName={printFileName([
          "判定結果",
          customerName,
          dateInputValue(measurement.data.measuredOn),
        ])}
        appendix={
          <MeasurementItemGuide
            measurements={[measurement.data]}
            items={items.data}
          />
        }
      >
        <PageHeader
          backHref={measurementHref}
          backLabel="測定詳細"
          title="判定結果"
          meta={isDraft && <Badge tone="subtle">下書き</Badge>}
          actions={<PrintButton disabled={!printable} />}
          description={[
            customerName,
            measuredOn,
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

        <MeasurementValues measurement={measurement.data} items={items.data} />

        {!judged ? (
          <StateCard
            message="判定を読み込めませんでした。時間をおいて再度お試しください。読み込めるまでアドバイスの編集はできません。"
            action={
              judgment.status === "error" && (
                <SecondaryButton onClick={judgment.retry}>
                  再試行
                </SecondaryButton>
              )
            }
          />
        ) : isEmptyJudgment(judged) ? (
          <StateCard
            message={emptyJudgmentMessage(
              measurement.data,
              items.data,
              customer.data,
            )}
          />
        ) : (
          <>
            <ItemEvaluations judgment={judged} items={items.data} />
            <ElementEvaluations judgment={judged} />
            <JudgmentSummary judgment={judged} measurement={measurement.data} />
          </>
        )}

        {judged && (
          <JudgmentEditors
            measurementId={measurementId}
            judgment={judged}
            trainingMenus={trainingMenus}
          />
        )}
      </PrintFrame>
    </PageContainer>
  );
}

function JudgmentEditors({
  measurementId,
  judgment,
  trainingMenus,
}: {
  measurementId: string;
  judgment: Judgment;
  trainingMenus: ResourceState<TrainingMenu[]>;
}) {
  const prescription = usePrescription(
    measurementId,
    judgment,
    trainingMenus.status === "ok" ? trainingMenus.data : null,
  );

  return (
    <>
      <PrescribedMenus
        judgment={judgment}
        trainingMenus={trainingMenus}
        prescription={prescription}
      />

      <AdviceForm
        measurementId={measurementId}
        advice={judgment.advice ?? ""}
      />

      <PrescriptionDangerZone prescription={prescription} />
    </>
  );
}
