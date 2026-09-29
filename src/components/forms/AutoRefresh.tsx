"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Sahifani har `seconds` soniyada yangilaydi (ko'pi bilan `times` marta) */
export function AutoRefresh({ seconds = 3, times = 60 }: { seconds?: number; times?: number }) {
  const router = useRouter();

  useEffect(() => {
    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      if (count > times) {
        clearInterval(timer);
        return;
      }
      router.refresh();
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds, times]);

  return null;
}
