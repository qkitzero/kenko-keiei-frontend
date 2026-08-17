import Card from "@/components/Card";

type DangerZoneProps = {
  title: string;
  description: string;
  error?: string;
  action: React.ReactNode;
};

export default function DangerZone({
  title,
  description,
  error,
  action,
}: DangerZoneProps) {
  return (
    <Card tone="danger" title={title} className="print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-subtle max-w-prose text-sm">{description}</p>
        {action}
      </div>
      {error && <p className="text-danger mt-3 text-sm">{error}</p>}
    </Card>
  );
}
