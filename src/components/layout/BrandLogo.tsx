import Image from "next/image";
import { cn } from "@/lib/format";

/**
 * Brend belgisi (logo). Logo to'q ko'k va rose-gold rangda — qorong'i fonda
 * ham ko'rinishi uchun har doim och rangli plitka ichida turadi
 * (brend qo'llanmasi: "full-color logo on light backgrounds").
 */
export function BrandMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-grid place-items-center shrink-0 rounded-xl bg-[#faf7f6] ring-1 ring-black/5 shadow-sm",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src={size > 64 ? "/brand/logo-mark-256.png" : "/brand/logo-mark-128.png"}
        alt=""
        width={Math.round(size * 0.8)}
        height={Math.round(size * 0.8)}
        priority={size <= 48}
      />
    </span>
  );
}

/** "LevelX English" yozuvi */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-bold tracking-tight", className)}>
      LevelX{" "}
      <span className="text-brand-500 dark:text-brand-400">English</span>
    </span>
  );
}
