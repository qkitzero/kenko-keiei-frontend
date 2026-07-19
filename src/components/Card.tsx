import Link from "next/link";

const PADDING = {
  sm: "p-5",
  md: "p-6",
  lg: "p-8",
} as const;

type CardProps = {
  as?: "section" | "div";
  href?: string;
  padding?: keyof typeof PADDING;
  dashed?: boolean;
  className?: string;
  children: React.ReactNode;
};

export default function Card({
  as: Tag = "section",
  href,
  padding = "md",
  dashed = false,
  className,
  children,
}: CardProps) {
  const classes = [
    "border-border bg-surface rounded-2xl border",
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

  return <Tag className={classes}>{children}</Tag>;
}
