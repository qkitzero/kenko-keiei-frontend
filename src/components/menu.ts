import { CONTROL_FOCUS } from "@/components/control";

export const MENU_TRIGGER = `border-border text-foreground hover:bg-hover inline-flex h-8 cursor-pointer items-center rounded-md border px-2.5 text-sm font-medium transition-colors ${CONTROL_FOCUS}`;

export const MENU_PANEL =
  "border-border bg-surface absolute right-0 z-20 mt-1.5 rounded-lg border p-1 shadow-lg";

export const MENU_ITEM =
  "hover:bg-hover flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors";
