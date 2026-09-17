"use client";

import { Button } from "@/components/ui/Button";

/**
 * Natijani PDF sifatida saqlash.
 * Brauzerning chop etish oynasida "Save as PDF" ni tanlash kifoya —
 * qo'shimcha kutubxona kerak emas.
 */
export function PrintButton({
  label = "📄 PDF sifatida saqlash",
}: {
  label?: string;
}) {
  return (
    <Button variant="secondary" onClick={() => window.print()}>
      {label}
    </Button>
  );
}
