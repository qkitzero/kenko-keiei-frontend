"use client";

import {
  FIELD_BASE,
  FIELD_SIZE,
  FieldWrapper,
  fieldClassName,
  useFieldId,
} from "@/components/Field";

const SIZE = {
  sm: "rounded-lg px-2 py-1 text-xs",
  md: FIELD_SIZE,
} as const;

type SelectProps = {
  label?: string;
  size?: keyof typeof SIZE;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<"select">, "onChange" | "size">;

export default function Select({
  label,
  size = "md",
  id,
  className,
  onChange,
  ...props
}: SelectProps) {
  const fieldId = useFieldId(id);

  return (
    <FieldWrapper label={label} fieldId={fieldId} className={className}>
      <select
        {...props}
        id={fieldId}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClassName(
          `${FIELD_BASE} ${SIZE[size]}`,
          label,
          className,
        )}
      />
    </FieldWrapper>
  );
}
