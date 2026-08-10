"use client";

import SecondaryButton from "@/components/SecondaryButton";

export default function PrintButton({ disabled }: { disabled?: boolean }) {
  return (
    <SecondaryButton onClick={() => window.print()} disabled={disabled}>
      印刷
    </SecondaryButton>
  );
}
