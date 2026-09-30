"use client";

import { useT } from "@/i18n/client";
import { Button } from "@/components/ui/Button";

/**
 * Natijani PDF sifatida saqlash.
 * Brauzerning chop etish oynasida "Save as PDF" ni tanlash kifoya —
 * qo'shimcha kutubxona kerak emas.
 */
export function PrintButton({
  label,
  fullWidth,
}: {
  label?: string;
  fullWidth?: boolean;
}) {
  const t = useT();
  return (
    <Button variant="secondary" fullWidth={fullWidth} onClick={() => window.print()}>
      {label ?? t("PDF yuklab olish", "Download PDF")}
    </Button>
  );
}
