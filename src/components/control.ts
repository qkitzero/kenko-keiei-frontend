export const CONTROL_HEIGHT = {
  sm: "h-8",
  md: "h-9",
  lg: "h-10",
} as const;

export type ControlSize = keyof typeof CONTROL_HEIGHT;

export const CONTROL_PADDING = {
  sm: "px-2.5",
  md: "px-3.5",
  lg: "px-4",
} as const;

export const CONTROL_BASE =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const CONTROL_FOCUS =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-surface";
