const SIZE = {
  sm: "px-2 py-0.5",
  md: "px-3 py-1",
} as const;

const TONE = {
  muted: "text-muted",
  subtle: "text-subtle",
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
      className={`border-border rounded-full border text-xs font-medium ${SIZE[size]} ${TONE[tone]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
