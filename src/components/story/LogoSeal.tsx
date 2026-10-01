import Image from "next/image";
import { cn } from "@/lib/format";

/** Natija varaqalaridagi muhr: oltin halqa, ichida fil suyagi rangli doira va brend logosi */
export function LogoSeal({ size, className }: { size: number; className?: string }) {
  const img = Math.round(size * 0.68);
  return (
    <span className={cn("logo-seal", className)} style={{ width: size, height: size }} aria-hidden>
      <Image
        src={size > 72 ? "/brand/lx-mark-256.png" : "/brand/lx-mark-128.png"}
        alt=""
        width={img}
        height={img}
        loading="lazy"
        fetchPriority="low"
      />
    </span>
  );
}
