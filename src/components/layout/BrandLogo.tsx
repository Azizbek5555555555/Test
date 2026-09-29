import Image from "next/image";
import { cn } from "@/lib/format";

/**
 * Brend belgisi (logo). Sayt qorong'i — shuning uchun qora fonli rasmiy logodan
 * tayyorlangan shaffof variant ishlatiladi (public/brand/logo-mark-dark-*.png).
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
      src={size > 96 ? "/brand/logo-mark-dark-256.png" : "/brand/logo-mark-dark-128.png"}
      alt=""
      width={size}
      height={size}
      priority={size <= 48}
      className={cn("shrink-0", className)}
      aria-hidden
    />
  );
}

/** "LevelX English" yozuvi — Figma: Cormorant Garamond SemiBold */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-semibold tracking-normal text-fg", className)}>
      LevelX <span className="text-brand-400">English</span>
    </span>
  );
}
