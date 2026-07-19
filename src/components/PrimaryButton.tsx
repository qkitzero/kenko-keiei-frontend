const BASE =
  "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active flex items-center justify-center rounded-full px-5 transition-colors disabled:opacity-50";

type PrimaryButtonProps = {
  size?: "md" | "lg";
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
      className={`${BASE} ${size === "lg" ? "h-12" : "h-11"}${className ? ` ${className}` : ""}`}
    >
      {children}
    </button>
  );
}
