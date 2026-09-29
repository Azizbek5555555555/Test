import type { ReactNode } from "react";

/** Figma: sahifa boshidagi hero — eyebrow chiziq bilan, katta Cormorant sarlavha, tavsif */
export function PageHero({
  eyebrow,
  title,
  children,
  aside,
  className = "pb-14 sm:pb-16",
  bare,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
  /** Fon gradientisiz (sahifaning o'z foni ko'rinadi) */
  bare?: boolean;
}) {
  return (
    <section className={bare ? undefined : "bg-gradient-to-b from-[#16213a] to-ink-950"}>
      <div className={`container-page flex flex-col gap-8 pt-14 sm:pt-20 md:flex-row md:items-end md:justify-between ${className}`}>
        <div className="max-w-2xl animate-fade-up">
          <p className="eyebrow">
            <span className="h-px w-6 bg-brand-400" aria-hidden />
            {eyebrow}
          </p>
          <h1 className="display-title mt-4 text-[40px] sm:text-[56px]">{title}</h1>
          {children ? (
            <div className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">{children}</div>
          ) : null}
        </div>
        {aside}
      </div>
    </section>
  );
}
