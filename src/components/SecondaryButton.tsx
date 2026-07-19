const BASE =
  "flex h-11 items-center justify-center rounded-full border px-5 transition-colors disabled:opacity-50";

const VARIANT = {
  default: "border-border text-foreground hover:bg-hover",
  danger: "border-danger/40 text-danger hover:bg-danger/10",
} as const;

type SecondaryButtonProps = {
  variant?: keyof typeof VARIANT;
} & React.ComponentProps<"button">;

export default function SecondaryButton({
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
      className={`${BASE} ${VARIANT[variant]}${className ? ` ${className}` : ""}`}
    >
      {children}
    </button>
  );
}
