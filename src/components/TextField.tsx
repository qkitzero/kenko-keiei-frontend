"use client";

const BASE =
  "border-border bg-surface text-foreground focus:border-border-strong focus:ring-foreground/20 rounded-xl border px-3 py-2 outline-none focus:ring-2";

type TextFieldProps = {
  label?: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<"input">, "onChange">;

export default function TextField({
  label,
  id,
  className,
  onChange,
  ...props
}: TextFieldProps) {
  const input = (
    <input
      {...props}
      id={id}
      onChange={(e) => onChange(e.target.value)}
      className={
        label ? `${BASE} w-full` : className ? `${BASE} ${className}` : BASE
      }
    />
  );

  if (!label) return input;

  return (
    <div className={className}>
      <label htmlFor={id} className="text-muted mb-1 block text-sm font-medium">
        {label}
      </label>
      {input}
    </div>
  );
}
