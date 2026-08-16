import Card from "@/components/Card";

type StatTileProps = {
  label: string;
  href?: string;
  state:
    | { status: "loading" }
    | { status: "ok"; value: number | string }
    | { status: "error" };
  unit?: string;
  note?: React.ReactNode;
};

export default function StatTile({
  label,
  href,
  state,
  unit = "件",
  note,
}: StatTileProps) {
  return (
    <Card href={href} padding="md">
      <p className="text-subtle text-xs font-medium">{label}</p>
      {state.status === "loading" ? (
        <div className="bg-placeholder mt-2 h-7 w-12 animate-pulse rounded" />
      ) : state.status === "error" ? (
        <p className="text-subtle mt-2 text-sm">取得できませんでした</p>
      ) : (
        <p className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
          {state.value}
          {unit && (
            <span className="text-subtle ml-1 text-sm font-normal">{unit}</span>
          )}
        </p>
      )}
      {note && <p className="text-muted mt-1 text-xs">{note}</p>}
    </Card>
  );
}
