import Image from "next/image";
import { cn } from "@/lib/format";

/**
 * Brend belgisi — rasmiy "LX" ikonkasi (shaffof fon, public/brand/lx-mark-*.png).
 */
export function BrandMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={size > 96 ? "/brand/lx-mark-256.png" : "/brand/lx-mark-128.png"}
      alt=""
      width={size}
      height={size}
      priority={size <= 48}
      className={cn("shrink-0", className)}
      aria-hidden
    />
  );
}

/** "levelxenglish" yozuvi — rasmiy logodagidek: Poppins, "x" harfi firuza rangda */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("brand-wordmark", className)}>
      level<span>x</span>english
    </span>
  );
}
