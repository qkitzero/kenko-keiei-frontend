"use client";

import DangerZone from "@/components/DangerZone";
import SecondaryButton from "@/components/SecondaryButton";
import type { Prescription } from "@/lib/usePrescription";

export default function PrescriptionDangerZone({
  prescription,
}: {
  prescription: Prescription;
}) {
  if (!prescription.override) return null;

  return (
    <DangerZone
      title="自動処方に戻す"
      description="編集した処方を削除し、判定結果から計算される自動処方に戻します。編集した内容は元に戻せません。"
      error={prescription.revertError}
      action={
        <SecondaryButton
          variant="danger"
          onClick={prescription.revert}
          disabled={prescription.busy}
        >
          {prescription.reverting ? "戻しています..." : "自動処方に戻す"}
        </SecondaryButton>
      }
    />
  );
}
