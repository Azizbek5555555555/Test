"use client";

import { Button } from "@/components/ui/Button";

/**
 * Natijani PDF sifatida saqlash.
 * Brauzerning chop etish oynasida "Save as PDF" ni tanlash kifoya —
 * qo'shimcha kutubxona kerak emas.
 */
export function PrintButton({
  label = "PDF yuklab olish",
  fullWidth,
}: {
  label?: string;
  fullWidth?: boolean;
}) {
  return (
    <Button variant="secondary" fullWidth={fullWidth} onClick={() => window.print()}>
      {label}
    </Button>
  );
}
