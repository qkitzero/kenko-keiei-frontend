import Link from "next/link";

type PageHeaderProps = {
  title: string;
  description?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
};

export default function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  meta,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-1">
      {backHref && (
        <Link
          href={backHref}
          className="text-subtle hover:text-foreground mb-1 w-fit text-xs transition-colors print:hidden"
        >
          ← {backLabel ?? "戻る"}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="text-foreground truncate text-xl font-semibold tracking-tight">
            {title}
          </h1>
          {meta}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2 print:hidden">
            {actions}
          </div>
        )}
      </div>
      {description && <p className="text-muted text-sm">{description}</p>}
    </header>
  );
}
