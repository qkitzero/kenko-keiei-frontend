"use client";

import { useFieldId } from "@/components/Field";

const BOX = "accent-primary size-4 cursor-pointer disabled:cursor-not-allowed";

const LABEL = "text-muted flex items-center gap-2 text-sm";

type CheckboxProps = {
  label?: string;
  onChange: (checked: boolean) => void;
} & Omit<React.ComponentProps<"input">, "onChange" | "type">;

export default function Checkbox({
  label,
  id,
  className,
  onChange,
  ...props
}: CheckboxProps) {
  const fieldId = useFieldId(id);

  const box = (
    <input
      {...props}
      type="checkbox"
      id={fieldId}
      onChange={(e) => onChange(e.target.checked)}
      className={label ? BOX : `${BOX}${className ? ` ${className}` : ""}`}
    />
  );

  if (!label) return box;

  return (
    <label
      htmlFor={fieldId}
      className={`${LABEL}${className ? ` ${className}` : ""}`}
    >
      {box}
      {label}
    </label>
  );
}
