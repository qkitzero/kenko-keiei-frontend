import {
  CONTROL_BASE,
  CONTROL_FOCUS,
  CONTROL_HEIGHT,
  CONTROL_PADDING,
  type ControlSize,
} from "@/components/control";

const VARIANT = {
  default: "border-border bg-surface text-foreground hover:bg-hover",
  danger: "border-danger/40 bg-surface text-danger hover:bg-danger/5",
  quiet: "border-transparent text-muted hover:bg-hover",
} as const;

export type SecondaryVariant = keyof typeof VARIANT;

export function secondaryClassName(
  size: ControlSize = "md",
  variant: SecondaryVariant = "default",
  className?: string,
): string {
  return [
    CONTROL_BASE,
    CONTROL_FOCUS,
    "border",
    VARIANT[variant],
    CONTROL_HEIGHT[size],
    CONTROL_PADDING[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type SecondaryButtonProps = {
  size?: ControlSize;
  variant?: SecondaryVariant;
} & React.ComponentProps<"button">;

export default function SecondaryButton({
  size = "md",
  variant = "default",
  type = "button",
  className,
  children,
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={secondaryClassName(size, variant, className)}
    >
      {children}
    </button>
  );
}
