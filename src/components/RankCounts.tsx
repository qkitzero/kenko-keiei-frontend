import { RANK_GROUPS, type RankGroupCounts } from "@/lib/organizationReport";

export default function RankCounts({
  counts,
  unit = "件",
}: {
  counts: RankGroupCounts;
  unit?: string;
}) {
  return (
    <span className="text-muted text-xs tabular-nums">
      {RANK_GROUPS.map((group, index) => (
        <span key={group.key}>
          {index > 0 && (
            <span aria-hidden className="text-subtle mx-1">
              /
            </span>
          )}
          <span className="sr-only">{group.label} </span>
          {counts[index]}
          <span className="sr-only">{unit}</span>
        </span>
      ))}
    </span>
  );
}
