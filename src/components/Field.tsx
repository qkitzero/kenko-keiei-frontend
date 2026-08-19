"use client";

import { useId } from "react";

export const FIELD_BASE =
  "border-border bg-surface text-foreground placeholder:text-subtle focus:border-primary focus:ring-primary/20 border outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

export const FIELD_SIZE = {
  sm: "h-8 rounded-md px-2 text-xs",
  md: "h-9 rounded-md px-3 text-sm",
} as const;

export type FieldSize = keyof typeof FIELD_SIZE;

export const FIELD_SIZE_MULTILINE = "resize-y rounded-md px-3 py-2 text-sm";

const FIELD_LABEL = "text-muted mb-1 block text-sm font-medium";

export const FIELD_LEGEND = "text-subtle text-xs font-semibold";

export const FIELD_GRID = "mt-3 grid gap-4 sm:grid-cols-2";

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
