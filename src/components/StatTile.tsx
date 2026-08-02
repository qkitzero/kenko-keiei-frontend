import Card from "@/components/Card";

type StatTileProps = {
  label: string;
  href: string;
  state:
    | { status: "loading" }
    | { status: "ok"; value: number }
    | { status: "error" };
  unit?: string;
};

export default function StatTile({
  label,
  href,
  state,
  unit = "件",
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
          <span className="text-subtle ml-1 text-sm font-normal">{unit}</span>
        </p>
      )}
    </Card>
  );
}
