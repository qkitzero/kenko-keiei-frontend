import Card from "@/components/Card";
import Missing from "@/components/Missing";

export type SummaryItem = {
  label: string;
  value: React.ReactNode;
  loading?: boolean;
};

function isEmpty(value: React.ReactNode): boolean {
  return value === null || value === undefined || value === "";
}

export default function DetailSummary({ items }: { items: SummaryItem[] }) {
  return (
    <Card padding="sm">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-subtle text-xs font-medium">{item.label}</dt>
            <dd className="text-foreground mt-0.5 text-sm break-words">
              {item.loading ? (
                <span className="bg-placeholder block h-5 w-24 animate-pulse rounded" />
              ) : isEmpty(item.value) ? (
                <Missing />
              ) : (
                item.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
