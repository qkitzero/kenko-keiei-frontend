"use client";

import Card from "@/components/Card";
import LoginButton from "@/components/LoginButton";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import PageMessage from "@/components/PageMessage";
import PageSkeleton from "@/components/PageSkeleton";
import SecondaryButton from "@/components/SecondaryButton";
import StateCard from "@/components/StateCard";
import { elementLabel } from "@/lib/judgment";
import { itemElements } from "@/lib/judgmentCriteria";
import { itemDescription } from "@/lib/measurementGuide";
import {
  categoryLabel,
  groupByCategory,
  isJudgedItem,
  judgingLabel,
  recordingLabel,
  type MeasurementItem,
} from "@/lib/measurementItem";
import { useMeasurementItems } from "@/lib/useMeasurementItems";

function judgmentLabel(item: MeasurementItem): string {
  if (!isJudgedItem(item)) return "記録のみ";
  return [
    "判定の対象",
    itemElements(item).map(elementLabel).join("・"),
    judgingLabel(item),
  ]
    .filter(Boolean)
    .join(" ・ ");
}

function ItemRow({ item }: { item: MeasurementItem }) {
  const recording = recordingLabel(item);
  const judgment = judgmentLabel(item);
  const description = itemDescription(item.code);

  return (
    <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:gap-4">
      <div className="sm:w-52 sm:shrink-0">
        <p className="text-foreground text-sm font-medium">{item.name}</p>
        {recording && <p className="text-subtle text-xs">{recording}</p>}
        <p className="text-subtle text-xs">{judgment}</p>
      </div>
      {description ? (
        <p className="text-muted text-sm">{description}</p>
      ) : (
        <p className="text-subtle text-sm">解説は未登録です。</p>
      )}
    </div>
  );
}

export default function MeasurementItemsPage() {
  const items = useMeasurementItems();

  if (items.status === "loading") {
    return <PageSkeleton width="detail" />;
  }

  if (items.status === "unauthenticated") {
    return (
      <PageMessage
        title="サインインの有効期限が切れました"
        message="再度サインインしてください。"
        action={<LoginButton />}
      />
    );
  }

  const groups = items.status === "ok" ? groupByCategory(items.data) : [];

  return (
    <PageContainer width="detail">
      <PageHeader
        title="測定項目"
        description="測定で記録する項目と、その内容です。すべてのテナントで共通です。"
      />

      {items.status === "error" ? (
        <StateCard
          message="測定項目を読み込めませんでした。時間をおいて再度お試しください。"
          action={
            <SecondaryButton onClick={items.retry}>再試行</SecondaryButton>
          }
        />
      ) : groups.length === 0 ? (
        <StateCard message="測定項目が登録されていません。" />
      ) : (
        groups.map((group) => (
          <Card key={group.category} title={categoryLabel(group.category)}>
            <div className="divide-border divide-y">
              {group.items.map((item) => (
                <ItemRow key={item.measurementItemId} item={item} />
              ))}
            </div>
          </Card>
        ))
      )}
    </PageContainer>
  );
}
