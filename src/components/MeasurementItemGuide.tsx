import {
  bodyComposition,
  measurementDisplayEntries,
  type Measurement,
} from "@/lib/measurement";
import {
  DERIVED_GUIDE,
  itemDescription,
  type GuideEntry,
} from "@/lib/measurementGuide";
import { categoryLabel, type MeasurementItem } from "@/lib/measurementItem";

function GuideList({ entries }: { entries: GuideEntry[] }) {
  return (
    <dl className="divide-border divide-y">
      {entries.map((entry) => (
        <div
          key={entry.name}
          className="flex gap-3 py-1 first:pt-0 last:pb-0 print:break-inside-avoid"
        >
          <dt className="text-foreground w-36 shrink-0 text-xs font-medium">
            {entry.name}
          </dt>
          <dd className="text-muted text-xs">{entry.description}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function MeasurementItemGuide({
  measurements,
  items,
}: {
  measurements: Measurement[];
  items: MeasurementItem[];
}) {
  const recorded = new Set<string>();
  for (const measurement of measurements) {
    for (const { item } of measurementDisplayEntries(measurement, items)) {
      if (item.measurementItemId) recorded.add(item.measurementItemId);
    }
  }

  const groups: { category: string; entries: GuideEntry[] }[] = [];
  const byCategory = new Map<string, GuideEntry[]>();

  for (const item of items) {
    if (!item.measurementItemId || !recorded.has(item.measurementItemId)) {
      continue;
    }

    const name = item.name ?? "";
    const description = itemDescription(item.code);
    if (!name || !description) continue;

    const category = item.category ?? "";
    const listed = byCategory.get(category);
    if (listed) {
      listed.push({ name, description });
      continue;
    }
    const created = [{ name, description }];
    byCategory.set(category, created);
    groups.push({ category, entries: created });
  }

  const derived = measurements.some((measurement) =>
    bodyComposition(measurement, items),
  )
    ? DERIVED_GUIDE
    : [];

  if (groups.length === 0 && derived.length === 0) return null;

  return (
    <section className="hidden print:block print:break-before-page">
      <h2 className="text-foreground text-xl font-semibold tracking-tight">
        測定項目の解説
      </h2>
      <p className="text-muted mt-1 text-xs">
        この用紙に出ている項目が何を見ているかの説明です。判定（A〜E）と同年代の平均は運動機能の項目にだけ付きます。
      </p>

      <div className="mt-4 flex flex-col gap-4">
        {groups.map((group) => (
          <section key={group.category}>
            <h3 className="text-foreground text-sm font-semibold print:break-after-avoid">
              {categoryLabel(group.category)}
            </h3>
            <div className="mt-1">
              <GuideList entries={group.entries} />
            </div>
          </section>
        ))}

        {derived.length > 0 && (
          <section>
            <h3 className="text-foreground text-sm font-semibold print:break-after-avoid">
              算出値
            </h3>
            <div className="mt-1">
              <GuideList entries={derived} />
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
