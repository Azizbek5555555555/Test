/* eslint-disable @next/next/no-img-element */
import { cn, initials } from "@/lib/format";

const SIZES = {
  sm: "w-8 h-8 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-24 h-24 text-2xl",
};

export function Avatar({
  name,
  src,
  size = "md",
  className,
  ring,
}: {
  name: string | null | undefined;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
}) {
  const base = cn(
    "inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden",
    "font-bold select-none",
    SIZES[size],
    ring && "ring-[1.5px] ring-gold-400 ring-offset-2 ring-offset-[var(--bg)]",
    className,
  );

  if (src) {
    // Tashqi avatar manzillari uchun oddiy <img> — next/image domen sozlamasi talab qilmaydi
    return (
      <img
        src={src}
        alt={name ?? "Foydalanuvchi"}
        className={cn(base, "object-cover")}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span
      className={cn(base, "bg-brand-400 text-on-accent font-display font-semibold")}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
