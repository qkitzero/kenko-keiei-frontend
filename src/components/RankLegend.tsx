import { RANK_LEGEND } from "@/lib/judgment";

export default function RankLegend({ note }: { note?: string }) {
  return (
    <div className="text-subtle flex flex-col gap-1 text-xs print:break-before-avoid">
      <p>
        {RANK_LEGEND.map((entry) => `${entry.letter} ${entry.meaning}`).join(
          " ・ ",
        )}
      </p>
      {note && <p>{note}</p>}
    </div>
  );
}
