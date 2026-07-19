"use client";

const BASE =
  "border-border bg-surface text-foreground focus:border-border-strong focus:ring-foreground/20 border outline-none focus:ring-2";

const SIZE = {
  sm: "rounded-lg px-2 py-1 text-xs",
  md: "rounded-xl px-2 py-2 text-sm",
} as const;

type SelectProps = {
  size?: keyof typeof SIZE;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<"select">, "onChange" | "size">;

export default function Select({
  size = "md",
  className,
  onChange,
  ...props
}: SelectProps) {
  return (
    <select
      {...props}
      onChange={(e) => onChange(e.target.value)}
      className={`${BASE} ${SIZE[size]}${className ? ` ${className}` : ""}`}
    />
  );
}
