"use client";

import {
  FIELD_BASE,
  FIELD_SIZE,
  FieldWrapper,
  fieldClassName,
  useFieldId,
  type FieldSize,
} from "@/components/Field";

type TextFieldProps = {
  label?: string;
  size?: FieldSize;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<"input">, "onChange" | "size">;

export default function TextField({
  label,
  size = "md",
  id,
  className,
  onChange,
  ...props
}: TextFieldProps) {
  const fieldId = useFieldId(id);

  return (
    <FieldWrapper label={label} fieldId={fieldId} className={className}>
      <input
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
