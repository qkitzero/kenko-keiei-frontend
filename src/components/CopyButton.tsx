"use client";

import { CONTROL_FOCUS } from "@/components/control";
import { useEffect, useRef, useState } from "react";

type CopyState = "idle" | "copied" | "failed";

const RESULT_MESSAGE: Record<CopyState, string> = {
  idle: "",
  copied: "コピーしました",
  failed: "コピーできませんでした",
};

const ICON_TONE: Record<CopyState, string> = {
  idle: "text-muted",
  copied: "text-success",
  failed: "text-danger",
};

const ICON_PATH: Record<CopyState, string> = {
  idle: "M9 9V5.5A1.5 1.5 0 0 1 10.5 4h8A1.5 1.5 0 0 1 20 5.5v8a1.5 1.5 0 0 1-1.5 1.5H15M5.5 9h8A1.5 1.5 0 0 1 15 10.5v8a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 4 18.5v-8A1.5 1.5 0 0 1 5.5 9Z",
  copied: "M20 6 9 17l-5-5",
  failed:
    "M12 9v4M12 16.5v.5M10.7 4.6 2.9 18.1a1.5 1.5 0 0 0 1.3 2.3h15.6a1.5 1.5 0 0 0 1.3-2.3L13.3 4.6a1.5 1.5 0 0 0-2.6 0Z",
};

const RESET_DELAY = 2000;

type CopyButtonProps = {
  value: string;
  label: string;
};

export default function CopyButton({ value, label }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleCopy = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    void (async () => {
      let next: CopyState;
      try {
        await navigator.clipboard.writeText(value);
        next = "copied";
      } catch {
        next = "failed";
      }
      if (!mountedRef.current) return;
      setState(next);
      timerRef.current = setTimeout(() => setState("idle"), RESET_DELAY);
    })();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={label}
        title={state === "idle" ? label : RESULT_MESSAGE[state]}
        className={`hover:bg-hover flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors ${ICON_TONE[state]} ${CONTROL_FOCUS}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3.5"
          aria-hidden
        >
          <path d={ICON_PATH[state]} />
        </svg>
      </button>
      <span role="status" className="sr-only">
        {RESULT_MESSAGE[state]}
      </span>
    </>
  );
}
