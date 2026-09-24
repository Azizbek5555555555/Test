"use client";

import type { ReactNode } from "react";

/**
 * O'chirish kabi qaytarib bo'lmaydigan amallar uchun tugma.
 * Bosilganda brauzer "Rostdan ham...?" deb so'raydi; "Bekor qilish"
 * bosilsa forma yuborilmaydi.
 */
export function ConfirmSubmitButton({
  message,
  className,
  title,
  children,
}: {
  message: string;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      title={title}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
