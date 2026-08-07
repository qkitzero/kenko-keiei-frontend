const SIZE = {
  sm: "px-1.5 py-0.5",
  md: "px-2 py-0.5",
} as const;

const TONE = {
  muted: "border-border bg-surface-muted text-muted",
  subtle: "border-border bg-surface-muted text-subtle",
  success: "border-success/30 bg-success/5 text-success",
  warning: "border-warning/30 bg-warning/5 text-warning",
  danger: "border-danger/30 bg-danger/5 text-danger",
} as const;

export type BadgeTone = keyof typeof TONE;

type BadgeProps = {
  size?: keyof typeof SIZE;
  tone?: BadgeTone;
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
