const SIZE = {
  sm: "px-1.5 py-0.5",
  md: "px-2 py-0.5",
} as const;

const TONE = {
  muted: "border-border bg-surface-muted text-muted",
  subtle: "border-border bg-surface-muted text-subtle",
  danger: "border-danger/30 bg-danger/5 text-danger",
} as const;

type BadgeProps = {
  size?: keyof typeof SIZE;
  tone?: keyof typeof TONE;
  className?: string;
  children: React.ReactNode;
};

export default function Badge({
  size = "md",
  tone = "muted",
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border text-xs font-medium whitespace-nowrap ${SIZE[size]} ${TONE[tone]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
