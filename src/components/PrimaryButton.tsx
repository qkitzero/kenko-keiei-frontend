const BASE =
  "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active flex items-center justify-center rounded-full px-5 transition-colors disabled:opacity-50";

const HEIGHT = {
  md: "h-11",
  lg: "h-12",
} as const;

export type PrimarySize = keyof typeof HEIGHT;

export function primaryClassName(
  size: PrimarySize = "md",
  className?: string,
): string {
  return `${BASE} ${HEIGHT[size]}${className ? ` ${className}` : ""}`;
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
