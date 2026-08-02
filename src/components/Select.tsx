"use client";

import {
  FIELD_BASE,
  FIELD_SIZE,
  FieldWrapper,
  fieldClassName,
  useFieldId,
  type FieldSize,
} from "@/components/Field";

type SelectProps = {
  label?: string;
  size?: FieldSize;
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
          `${FIELD_BASE} ${FIELD_SIZE[size]}`,
          label,
          className,
        )}
      />
    </FieldWrapper>
  );
}
