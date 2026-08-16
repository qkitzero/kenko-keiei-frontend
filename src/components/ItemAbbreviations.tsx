import {
  isAbbreviated,
  shortItemName,
  type MeasurementItem,
} from "@/lib/measurementItem";

export default function ItemAbbreviations({
  items,
}: {
  items: MeasurementItem[];
}) {
  const pairs = items
    .filter(isAbbreviated)
    .map((item) => `${shortItemName(item)}＝${item.name}`);
  if (pairs.length === 0) return null;

  return (
    <p className="text-subtle text-xs print:break-before-avoid">
      略称：{pairs.join(" ／ ")}
    </p>
  );
}
