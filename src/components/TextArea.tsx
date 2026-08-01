"use client";

import {
  FIELD_BASE,
  FIELD_SIZE,
  FieldWrapper,
  fieldClassName,
  useFieldId,
} from "@/components/Field";

type TextAreaProps = {
  label?: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<"textarea">, "onChange">;

export default function TextArea({
  label,
  id,
  className,
  rows = 3,
  onChange,
  ...props
}: TextAreaProps) {
  const fieldId = useFieldId(id);

  return (
    <FieldWrapper label={label} fieldId={fieldId} className={className}>
      <textarea
        {...props}
        id={fieldId}
        rows={rows}
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
