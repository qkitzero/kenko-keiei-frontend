import Badge from "@/components/Badge";
import Card from "@/components/Card";
import {
  bodyComposition,
  measurementDataLoss,
  measurementDisplayEntries,
  type Measurement,
  type MeasurementDisplayEntry,
} from "@/lib/measurement";
import {
  CATEGORY_MOTOR_FUNCTION,
  categoryLabel,
  unitLabel,
  type MeasurementItem,
} from "@/lib/measurementItem";

type DerivedRow = { label: string; text: string };

function ValueRow({
  label,
  children,
  note,
}: {
  label: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0 print:break-inside-avoid print:py-1">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-muted text-sm">{label}</dt>
        <dd className="text-foreground text-right text-sm tabular-nums">
          {children}
        </dd>
      </div>
      {note && <p className="text-subtle text-xs">{note}</p>}
    </div>
  );
}

type EntryGroup = { category: string; entries: MeasurementDisplayEntry[] };

function groupEntriesByCategory(
  displayed: MeasurementDisplayEntry[],
): EntryGroup[] {
  const groups: EntryGroup[] = [];
  const byCategory = new Map<string, MeasurementDisplayEntry[]>();

  for (const entry of displayed) {
    const category = entry.item.category ?? "";
    const listed = byCategory.get(category);
    if (listed) {
      listed.push(entry);
      continue;
    }
    const created = [entry];
    byCategory.set(category, created);
    groups.push({ category, entries: created });
  }

  return groups;
}

function EntryRows({ entries }: { entries: MeasurementDisplayEntry[] }) {
  return (
    <dl className="divide-border mt-1 divide-y">
      {entries.map((entry) => (
        <ValueRow
          key={entry.item.measurementItemId}
          label={entry.item.name ?? ""}
          note={entry.note}
        >
          {entryValue(entry)}
        </ValueRow>
      ))}
    </dl>
  );
}

function entryValue(displayed: MeasurementDisplayEntry) {
  if (displayed.unmeasurable) {
    return (
      <Badge size="sm" tone="subtle">
        測定不可
      </Badge>
    );
  }

  if (!displayed.text) {
    return <span className="text-subtle text-xs">記録なし</span>;
  }

  const unit = unitLabel(displayed.item.unit);
  return (
    <>
      {displayed.text}
      {unit && <span className="text-subtle ml-1 text-xs">{unit}</span>}
    </>
  );
}

export default function MeasurementValues({
  measurement,
  items,
}: {
  measurement: Measurement;
  items: MeasurementItem[];
}) {
  const displayed = measurementDisplayEntries(measurement, items);
  const dataLoss = measurementDataLoss(measurement, items);
  const composition = bodyComposition(measurement, items);

  const derived: DerivedRow[] = composition
    ? [
        { label: "BMI", text: `${composition.bmi}（${composition.category}）` },
        { label: "適正体重", text: `${composition.idealWeight} kg` },
      ]
    : [];

  const groups = groupEntriesByCategory(displayed);
  const motor = groups.find(
    (group) => group.category === CATEGORY_MOTOR_FUNCTION,
  );
  const others = groups.filter(
    (group) => group.category !== CATEGORY_MOTOR_FUNCTION,
  );

  const notices =
    dataLoss.unknownItemIds.length > 0 ||
    dataLoss.droppedValueCount > 0 ||
    displayed.length === 0;

  return (
    <>
      {(notices || others.length > 0 || derived.length > 0) && (
        <Card title="測定結果" splittable>
          <div className="flex flex-col gap-5">
            {dataLoss.unknownItemIds.length > 0 && (
              <p className="text-danger text-sm">
                この測定には測定項目マスタに無い項目が
                {dataLoss.unknownItemIds.length}
                件含まれており、ここには表示できません。
              </p>
            )}

            {dataLoss.droppedValueCount > 0 && (
              <p className="text-danger text-sm">
                測定項目の試行回数・左右の設定が変わったため、表示できない値が
                {dataLoss.droppedValueCount}
                件あります。
              </p>
            )}

            {displayed.length === 0 && (
              <p className="text-subtle text-sm">
                この測定には表示できる記録がありません。
              </p>
            )}

            {others.map((group) => (
              <section key={group.category}>
                <h3 className="text-subtle text-xs font-medium print:break-after-avoid">
                  {categoryLabel(group.category)}
                </h3>
                <EntryRows entries={group.entries} />
              </section>
            ))}

            {derived.length > 0 && (
              <section>
                <h3 className="text-subtle text-xs font-medium print:break-after-avoid">
                  算出値
                </h3>
                <dl className="divide-border mt-1 divide-y">
                  {derived.map((row) => (
                    <ValueRow key={row.label} label={row.label}>
                      {row.text}
                    </ValueRow>
                  ))}
                </dl>
                <p className="text-subtle mt-2 text-xs">
                  身長・体重から算出した値で、測定した値ではありません。
                </p>
              </section>
            )}
          </div>
        </Card>
      )}

      {motor && (
        <Card title="運動機能の記録" splittable>
          <EntryRows entries={motor.entries} />
        </Card>
      )}
    </>
  );
}
