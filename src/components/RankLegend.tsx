import { RANK_LEGEND } from "@/lib/judgment";

export default function RankLegend({
  note,
  action,
}: {
  note?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-subtle flex flex-col gap-1 text-xs print:break-before-avoid">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p>
          {RANK_LEGEND.map((entry) => `${entry.letter} ${entry.meaning}`).join(
            " ・ ",
          )}
        </p>
        {action && <div className="print:hidden">{action}</div>}
      </div>
      {note && <p>{note}</p>}
    </div>
  );
}
