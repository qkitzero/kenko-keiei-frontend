"use client";

import {
  FIELD_BASE,
  FIELD_SIZE,
  FieldWrapper,
  fieldClassName,
  useFieldId,
} from "@/components/Field";

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
  const fieldId = useFieldId(id);

  return (
    <FieldWrapper label={label} fieldId={fieldId} className={className}>
      <input
        {...props}
        id={fieldId}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClassName(
          `${FIELD_BASE} ${FIELD_SIZE}`,
          label,
          className,
        )}
      />
    </FieldWrapper>
  );
}
