import {
  CONTROL_BASE,
  CONTROL_FOCUS,
  CONTROL_HEIGHT,
  CONTROL_PADDING,
  type ControlSize,
} from "@/components/control";

const TONE =
  "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active";

export type PrimarySize = ControlSize;

export function primaryClassName(
  size: PrimarySize = "md",
  className?: string,
): string {
  return [
    CONTROL_BASE,
    CONTROL_FOCUS,
    TONE,
    CONTROL_HEIGHT[size],
    CONTROL_PADDING[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type PrimaryButtonProps = {
  size?: PrimarySize;
} & React.ComponentProps<"button">;

export default function PrimaryButton({
  size = "md",
  type = "button",
  className,
  children,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={primaryClassName(size, className)}
    >
      {children}
    </button>
  );
}
