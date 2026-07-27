"use client";

import { useId } from "react";

export const FIELD_BASE =
  "border-border bg-surface text-foreground focus:border-border-strong focus:ring-foreground/20 border outline-none focus:ring-2";

export const FIELD_SIZE = "rounded-xl px-3 py-2";

const FIELD_LABEL = "text-muted mb-1 block text-sm font-medium";

export function useFieldId(id: string | undefined): string {
  const autoId = useId();
  return id ?? autoId;
}

export function fieldClassName(
  base: string,
  label: string | undefined,
  className: string | undefined,
): string {
  if (label) return `${base} w-full`;
  return className ? `${base} ${className}` : base;
}

type FieldWrapperProps = {
  label?: string;
  fieldId: string;
  className?: string;
  children: React.ReactNode;
};

export function FieldWrapper({
  label,
  fieldId,
  className,
  children,
}: FieldWrapperProps) {
  if (!label) return <>{children}</>;

  return (
    <div className={className}>
      <label htmlFor={fieldId} className={FIELD_LABEL}>
        {label}
      </label>
      {children}
    </div>
  );
}
