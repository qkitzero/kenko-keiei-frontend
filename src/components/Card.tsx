import Link from "next/link";

const PADDING = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
} as const;

const TONE = {
  default: "border-border",
  danger: "border-danger/30",
} as const;

type CardProps = {
  as?: "section" | "div";
  href?: string;
  title?: string;
  actions?: React.ReactNode;
  padding?: keyof typeof PADDING;
  tone?: keyof typeof TONE;
  dashed?: boolean;
  splittable?: boolean;
  className?: string;
  children: React.ReactNode;
};

export default function Card({
  as: Tag = "section",
  href,
  title,
  actions,
  padding = "md",
  tone = "default",
  dashed = false,
  splittable = false,
  className,
  children,
}: CardProps) {
  const classes = [
    "bg-surface rounded-lg border",
    !splittable && "print:break-inside-avoid",
    TONE[tone],
    PADDING[padding],
    dashed && "border-dashed",
    href && "hover:bg-hover transition-colors",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  if (!title && !actions) {
    return <Tag className={classes}>{children}</Tag>;
  }

  return (
    <Tag className={classes}>
      <div className="flex flex-wrap items-center justify-between gap-3 print:break-after-avoid">
        {title && (
          <h2 className="text-foreground text-sm font-semibold">{title}</h2>
        )}
        {actions}
      </div>
      <div className="mt-4">{children}</div>
    </Tag>
  );
}
