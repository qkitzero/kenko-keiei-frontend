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
} as const;

type SecondaryButtonProps = {
  size?: ControlSize;
  variant?: keyof typeof VARIANT;
} & React.ComponentProps<"button">;

export default function SecondaryButton({
  size = "md",
  variant = "default",
  type = "button",
  className,
  children,
  ...props
}: SecondaryButtonProps) {
  const classes = [
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

  return (
    <button {...props} type={type} className={classes}>
      {children}
    </button>
  );
}
