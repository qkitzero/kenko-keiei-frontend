type SectionHeaderProps = {
  title: string;
  count?: number;
  actions?: React.ReactNode;
};

export default function SectionHeader({
  title,
  count,
  actions,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 print:break-after-avoid">
      <h2 className="text-foreground text-sm font-semibold">
        {title}
        {count !== undefined && (
          <span className="text-subtle ml-2 font-normal tabular-nums">
            {count}件
          </span>
        )}
      </h2>
      {actions}
    </div>
  );
}
